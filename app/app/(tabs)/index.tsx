import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '@/components/brand/header';
import { FoodCard } from '@/components/food/food-card';
import { Pill } from '@/components/ui/pill';
import { BRAND, FONTS } from '@/constants/brand';
import type { Allergen, FoodItem } from '@/constants/mock-data';
import { ALLERGENS } from '@/constants/mock-data';
import { formatDayLabel } from '@/constants/time';
import { apiFetch, API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const ALLERGEN_LABEL = Object.fromEntries(ALLERGENS.map((a) => [a.id, a.label])) as Record<string, string>;

type MealResponse = {
  id: number;
  status: string;
  name: string;
  description: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  restaurant: string | null;
  recipeName: string | null;
  ingredients: string[];
  allergens?: string[];
  dietViolations?: string[];
  alternative?: string | null;
  location: { label?: string } | null;
  imageUrl: string | null;
  createdAt: string;
};

type ApiFriend = {
  id: number;
  userId: number;
  name: string;
  email: string;
  allergens: string[];
  diet: string;
  sharedAllergens: number;
};

type Section = { title: string; data: FoodItem[] };

function mealToFoodItem(m: MealResponse): FoodItem {
  return {
    id: String(m.id),
    title: m.status === 'error' ? 'Not recognized' : (m.name || m.recipeName || m.description.slice(0, 60)),
    description: m.description,
    photo: m.imageUrl ? `${API_BASE_URL}${m.imageUrl}` : '',
    calories: m.calories ?? 0,
    problemIngredients: m.ingredients,
    allergens: (m.allergens ?? []) as Allergen[],
    dietViolations: m.dietViolations ?? [],
    detectedAt: m.createdAt,
    location: m.location?.label ?? m.restaurant ?? '',
    alternative: m.alternative ?? undefined,
    error: m.status === 'error' ? 'Food not detected' : undefined,
    loading: m.status === 'pending',
  };
}

export default function HomeScreen() {
  const { token } = useAuth();
  const [meals, setMeals] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Friend allergen check state
  const [friends, setFriends] = useState<ApiFriend[]>([]);
  const [lastScanAllergens, setLastScanAllergens] = useState<string[]>([]);
  const [friendModalOpen, setFriendModalOpen] = useState(false);
  const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<number>>(new Set());
  const [lastMealId, setLastMealId] = useState<string | null>(null);
  const [pendingScan, setPendingScan] = useState<{ base64: string; mimeType: string; location?: { label?: string; latitude?: number; longitude?: number } } | null>(null);

  const load = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    apiFetch<MealResponse[]>('/meals', {}, token)
      .then((data) => setMeals(data.map(mealToFoodItem)))
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Load friends for allergen check
  useEffect(() => {
    apiFetch<ApiFriend[]>('/friends', {}, token).then(setFriends).catch(() => {});
  }, [token]);

  const scanMeal = async () => {
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPerm.granted) return;

    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 });
    if (result.canceled || !result.assets[0].base64) return;

    setScannedImageUri(result.assets[0].uri);
    setSelectedFriendIds(new Set());

    // Get location
    let location: { label?: string; latitude?: number; longitude?: number } | undefined;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [geo] = await Location.reverseGeocodeAsync(loc.coords).catch(() => []);
        const label = geo ? [geo.name, geo.city].filter(Boolean).join(', ') : undefined;
        location = { label, latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      }
    } catch {}

    setPendingScan({ base64: result.assets[0].base64, mimeType: 'image/jpeg', location });
    setFriendModalOpen(true);
  };

  // Find friends affected by the scanned meal's allergens
  const toggleFriend = (id: number) => {
    setSelectedFriendIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const confirmFriends = async () => {
    setFriendModalOpen(false);
    if (!pendingScan) return;

    setScanning(true);
    try {
      const meal = await apiFetch<MealResponse>('/meals', {
        method: 'POST',
        body: JSON.stringify({
          image: pendingScan.base64,
          mimeType: pendingScan.mimeType,
          location: pendingScan.location,
          friendIds: Array.from(selectedFriendIds),
        }),
      }, token);

      setMeals((prev) => [mealToFoodItem(meal), ...prev]);

      // Poll for AI-enriched data
      for (const delay of [3000, 8000, 15000]) {
        setTimeout(async () => {
          try {
            const updated = await apiFetch<MealResponse[]>('/meals', {}, token);
            setMeals(updated.map(mealToFoodItem));
          } catch {}
        }, delay);
      }
    } catch {}
    setPendingScan(null);
    setScanning(false);
  };

  const sections = useMemo<Section[]>(() => {
    const now = new Date();
    const groups = new Map<string, FoodItem[]>();
    for (const item of meals) {
      const label = formatDayLabel(item.detectedAt, now);
      const existing = groups.get(label) ?? [];
      existing.push(item);
      groups.set(label, existing);
    }
    return Array.from(groups, ([title, data]) => ({ title, data }));
  }, [meals]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <SectionList
        style={{ flex: 1 }}
        sections={sections}
        keyExtractor={(i) => i.id}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={BRAND.ink} />}
        ListHeaderComponent={
          <View>
            <Header
              eyebrow="Today's feed"
              title="Everything on your plate."
              subtitle="Scan your food to get calories, allergens, and check if it's safe for your friends."
            />
            <Pressable
              onPress={scanMeal}
              disabled={scanning}
              style={({ pressed }) => [styles.scanBtn, (pressed || scanning) && { opacity: 0.85 }]}
            >
              {scanning ? (
                <ActivityIndicator size="small" color={BRAND.cream} />
              ) : (
                <MaterialCommunityIcons name="camera" size={20} color={BRAND.cream} />
              )}
              <Text style={styles.scanBtnText}>{scanning ? 'Analyzing…' : 'Scan a meal'}</Text>
            </Pressable>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => <FoodCard item={item} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={BRAND.ink} />
          ) : (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={styles.empty}>No meals scanned yet.</Text>
              <Text style={styles.emptyHint}>Tap "Scan a meal" to get started.</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
      />

      {/* Friend allergen check modal */}
      <Modal visible={friendModalOpen} transparent animationType="slide" onRequestClose={() => setFriendModalOpen(false)}>
        <Pressable style={styles.backdrop} onPress={confirmFriends}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />

            {scannedImageUri && (
              <Image source={{ uri: scannedImageUri }} style={styles.sheetImage} contentFit="cover" />
            )}

            <Text style={styles.sheetTitle}>Who's eating?</Text>
            <Text style={styles.sheetHint}>
              Select friends sharing this meal — we'll check for allergen conflicts once analysis is complete.
            </Text>

            {friends.length > 0 ? (
              <View style={styles.friendSection}>
                {friends.map((f) => {
                  const checked = selectedFriendIds.has(f.userId);
                  return (
                    <Pressable key={f.id} onPress={() => toggleFriend(f.userId)} style={[styles.friendRow, checked && styles.friendRowSelected]}>
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked && <MaterialCommunityIcons name="check" size={14} color={BRAND.cream} />}
                      </View>
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{f.name}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 24, gap: 8 }}>
                <MaterialCommunityIcons name="account-group-outline" size={32} color={BRAND.muted} />
                <Text style={styles.noFriends}>No friends added yet.</Text>
                <Text style={{ fontFamily: FONTS.sans, fontSize: 13, color: BRAND.textSubtle, textAlign: 'center' }}>
                  Add friends to check allergen safety when sharing meals.
                </Text>
              </View>
            )}

            <Pressable onPress={confirmFriends} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scanBtn: {
    marginHorizontal: 20, marginTop: 12, marginBottom: 4,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 999, backgroundColor: BRAND.ink,
    shadowColor: BRAND.ink, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  scanBtnText: { fontFamily: FONTS.sansSemi, fontSize: 15, color: BRAND.cream, letterSpacing: 0.3 },
  sectionHeader: {
    marginTop: 24, marginBottom: 12, marginHorizontal: 20,
    fontFamily: FONTS.serifItalic, fontSize: 24, color: BRAND.ink, letterSpacing: -0.4,
  },
  empty: { fontFamily: FONTS.serifItalic, fontSize: 18, color: BRAND.muted, textAlign: 'center' },
  emptyHint: { fontFamily: FONTS.sans, fontSize: 13, color: BRAND.textSubtle, textAlign: 'center', marginTop: 6 },
  // Modal
  backdrop: { flex: 1, backgroundColor: 'rgba(21,33,26,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: BRAND.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '75%',
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: BRAND.border,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { fontFamily: FONTS.serifItalic, fontSize: 26, color: BRAND.ink, letterSpacing: -0.4 },
  sheetHint: { fontFamily: FONTS.sans, fontSize: 14, lineHeight: 20, color: BRAND.muted, marginTop: 6, marginBottom: 16 },
  sheetImage: { width: '100%', height: 180, borderRadius: 14, marginBottom: 16 },
  friendSection: { gap: 8, marginBottom: 16 },
  friendSectionLabel: {
    fontFamily: FONTS.sansSemi, fontSize: 10, letterSpacing: 2,
    textTransform: 'uppercase', color: BRAND.terra,
  },
  friendRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 14, backgroundColor: BRAND.card,
    borderWidth: 0.5, borderColor: BRAND.border,
  },
  friendRowSelected: {
    borderColor: BRAND.green, backgroundColor: 'rgba(31,61,43,0.04)',
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 7, borderWidth: 1.5,
    borderColor: BRAND.border, alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: BRAND.green, borderColor: BRAND.green,
  },
  friendInfo: { flex: 1, gap: 6 },
  friendName: { fontFamily: FONTS.sansSemi, fontSize: 14, color: BRAND.ink },
  friendPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  noFriends: { fontFamily: FONTS.sans, fontSize: 14, color: BRAND.muted, textAlign: 'center', paddingVertical: 20 },
  doneBtn: {
    marginTop: 8, paddingVertical: 14, borderRadius: 999,
    backgroundColor: BRAND.ink, alignItems: 'center',
  },
  doneBtnText: { fontFamily: FONTS.sansSemi, fontSize: 14, color: BRAND.cream, letterSpacing: 0.3 },
});
