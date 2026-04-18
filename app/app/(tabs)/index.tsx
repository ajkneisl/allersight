import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { BRAND, FONTS } from '@/constants/brand';
import type { FoodItem } from '@/constants/mock-data';
import { formatDayLabel } from '@/constants/time';
import { apiFetch, API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useVisionStatus } from '@/lib/use-vision-status';

type MealResponse = {
  id: number;
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
  location: { label?: string } | null;
  imageUrl: string | null;
  createdAt: string;
};

type Section = { title: string; data: FoodItem[] };

function mealToFoodItem(m: MealResponse): FoodItem {
  return {
    id: String(m.id),
    title: m.name || m.recipeName || m.description.slice(0, 60),
    description: m.description,
    photo: m.imageUrl ? `${API_BASE_URL}${m.imageUrl}` : '',
    calories: m.calories ?? 0,
    problemIngredients: m.ingredients,
    allergens: (m.allergens ?? []) as any,
    detectedAt: m.createdAt,
    location: m.location?.label ?? m.restaurant ?? '',
  };
}

export default function HomeScreen() {
  const { token } = useAuth();
  const { connected: visionConnected, refresh: refreshVision } = useVisionStatus();
  const [meals, setMeals] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mealWs = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load meals via REST
  const load = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    apiFetch<MealResponse[]>('/meals', {}, token)
      .then((data) => setMeals(data.map(mealToFoodItem)))
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [token]);

  // Initial load
  useEffect(() => { load(); }, [load]);

  // When vision is connected: open /ws/meals for live updates, stop polling
  // When disconnected: close ws, start polling
  useEffect(() => {
    if (visionConnected && token) {
      // Stop polling
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

      // Connect meal websocket
      const url = API_BASE_URL.replace(/^http/, 'ws') + `/ws/meals?token=${token}`;
      const ws = new WebSocket(url);
      mealWs.current = ws;

      ws.onmessage = (e) => {
        try {
          const meal: MealResponse = JSON.parse(e.data);
          const item = mealToFoodItem(meal);
          setMeals((prev) => {
            // Update existing or prepend new
            const idx = prev.findIndex((m) => m.id === item.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = item;
              return next;
            }
            return [item, ...prev];
          });
        } catch {}
      };

      ws.onclose = () => { mealWs.current = null; };

      return () => { ws.close(); mealWs.current = null; };
    } else {
      // Vision disconnected — close ws if open, start polling
      if (mealWs.current) { mealWs.current.close(); mealWs.current = null; }
      pollRef.current = setInterval(() => load(), 10_000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [visionConnected, token, load]);

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 });
    if (result.canceled || !result.assets[0].base64) return;

    setUploading(true);
    try {
      await apiFetch('/meals', {
        method: 'POST',
        body: JSON.stringify({
          image: result.assets[0].base64,
          description: 'Manual photo upload',
          mimeType: 'image/jpeg',
        }),
      }, token);
      load(true);
    } catch {}
    setUploading(false);
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
              subtitle="The scans, the verdicts, and the macros logged so far."
            />

            <View style={[styles.banner, visionConnected ? styles.bannerConnected : styles.bannerDisconnected]}>
              <View style={styles.bannerLeft}>
                <View style={[styles.dot, { backgroundColor: visionConnected ? '#34d399' : BRAND.terra }]} />
                <Text style={styles.bannerText}>
                  {visionConnected ? 'Vision connected — live updates' : 'Vision disconnected'}
                </Text>
              </View>
              {visionConnected ? (
                <View style={styles.liveBadge}>
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              ) : (
                <View style={styles.bannerActions}>
                  <Pressable
                    onPress={refreshVision}
                    style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.7 }]}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons name="refresh" size={16} color={BRAND.ink} />
                  </Pressable>
                  <Pressable
                    onPress={takePhoto}
                    disabled={uploading}
                    style={({ pressed }) => [styles.cameraBtn, (pressed || uploading) && { opacity: 0.8 }]}
                  >
                    <MaterialCommunityIcons name="camera" size={16} color={BRAND.cream} />
                    <Text style={styles.cameraBtnText}>{uploading ? 'Uploading…' : 'Snap a meal'}</Text>
                  </Pressable>
                </View>
              )}
            </View>
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
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 20, marginTop: 12, marginBottom: 4,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 0.5,
  },
  bannerConnected: { backgroundColor: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.25)' },
  bannerDisconnected: { backgroundColor: 'rgba(217,119,87,0.08)', borderColor: 'rgba(217,119,87,0.25)' },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  bannerText: { fontFamily: FONTS.sansMedium, fontSize: 13, color: BRAND.ink, letterSpacing: 0.2 },
  bannerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: 'rgba(52,211,153,0.2)',
  },
  liveText: { fontFamily: FONTS.sansSemi, fontSize: 10, letterSpacing: 1.5, color: '#059669' },
  refreshBtn: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 0.5, borderColor: BRAND.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.card,
  },
  cameraBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: BRAND.ink,
  },
  cameraBtnText: { fontFamily: FONTS.sansSemi, fontSize: 12, color: BRAND.cream, letterSpacing: 0.3 },
  sectionHeader: {
    marginTop: 24, marginBottom: 12, marginHorizontal: 20,
    fontFamily: FONTS.serifItalic, fontSize: 24, color: BRAND.ink, letterSpacing: -0.4,
  },
  empty: { fontFamily: FONTS.serifItalic, fontSize: 18, color: BRAND.muted, textAlign: 'center' },
});
