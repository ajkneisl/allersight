import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { Pill } from '@/components/ui/pill';
import { BRAND, FONTS } from '@/constants/brand';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Restaurant = {
  id: number;
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  certified: boolean;
  allergenScore: number | null;
  analyzed: boolean;
};

type MenuDish = { name: string; allergens: string[] };

type RestaurantDetail = Restaurant & { dishes: MenuDish[] };

export default function MapScreen() {
  const { token } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RestaurantDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [region, setRegion] = useState({
    latitude: 47.6062,
    longitude: -122.3321,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  });

  const load = useCallback(async (lat: number, lng: number) => {
    try {
      const data = await apiFetch<Restaurant[]>(
        `/restaurants/nearby?lat=${lat}&lng=${lng}`,
        {},
        token,
      );
      setRestaurants(data);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = loc.coords;
        setRegion((r) => ({ ...r, latitude, longitude }));
        load(latitude, longitude);
      } else {
        load(region.latitude, region.longitude);
      }
    })();
  }, [load]);

  const openDetail = async (r: Restaurant) => {
    setDetailLoading(true);
    setSelected({ ...r, dishes: [] });
    try {
      const detail = await apiFetch<RestaurantDetail>(`/restaurants/${r.id}`, {}, token);
      setSelected(detail);
    } catch {
      setSelected({ ...r, dishes: [] });
    }
    setDetailLoading(false);
  };

  const analyzeRestaurant = async () => {
    if (!selected) return;
    setAnalyzing(true);
    try {
      await apiFetch<Restaurant>('/restaurants/analyze', {
        method: 'POST',
        body: JSON.stringify({
          placeId: selected.placeId,
          name: selected.name,
          lat: selected.lat,
          lng: selected.lng,
        }),
      }, token);
      // Reload detail
      const detail = await apiFetch<RestaurantDetail>(`/restaurants/${selected.id}`, {}, token);
      setSelected(detail);
      // Update list
      setRestaurants((prev) =>
        prev.map((r) => r.id === detail.id ? { ...r, allergenScore: detail.allergenScore, analyzed: detail.analyzed, certified: detail.certified } : r),
      );
    } catch {}
    setAnalyzing(false);
  };

  const scoreColor = (score: number | null) => {
    if (score == null) return BRAND.muted;
    if (score >= 70) return BRAND.green;
    if (score >= 40) return BRAND.terra;
    return '#c0392b';
  };

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
      >
        {restaurants.map((r) => (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.lat, longitude: r.lng }}
            onPress={() => openDetail(r)}
          >
            <View style={[styles.pin, r.certified && styles.pinCertified, { backgroundColor: r.certified ? BRAND.green : BRAND.terra }]}>
              <MaterialCommunityIcons name={r.certified ? 'check-decagram' : 'silverware-fork-knife'} size={r.certified ? 16 : 12} color={BRAND.cream} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: BRAND.green }]} />
          <Text style={styles.legendText}>Allersight Certified</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: BRAND.terra }]} />
          <Text style={styles.legendText}>Restaurant</Text>
        </View>
      </View>

      {/* Reload */}
      <Pressable
        style={styles.reloadBtn}
        onPress={() => load(region.latitude, region.longitude)}
      >
        <MaterialCommunityIcons name="reload" size={18} color={BRAND.cream} />
        <Text style={styles.reloadText}>Search this area</Text>
      </Pressable>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={BRAND.ink} />
        </View>
      )}

      {/* Detail bottom sheet */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelected(null)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />

            {selected && (
              <ScrollView nestedScrollEnabled bounces showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {/* Header */}
                <View style={styles.detailHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailName}>{selected.name}</Text>
                    {selected.certified && (
                      <View style={styles.certRow}>
                        <MaterialCommunityIcons name="check-decagram" size={16} color={BRAND.green} />
                        <Text style={styles.certText}>Allersight Certified</Text>
                      </View>
                    )}
                  </View>
                  {selected.allergenScore != null && (
                    <View style={[styles.scoreBadge, { borderColor: scoreColor(selected.allergenScore) }]}>
                      <Text style={[styles.scoreNum, { color: scoreColor(selected.allergenScore) }]}>
                        {selected.allergenScore}
                      </Text>
                      <Text style={styles.scoreLabel}>Allersense</Text>
                    </View>
                  )}
                </View>

                {/* Analyze button for un-analyzed restaurants */}
                {!selected.analyzed && (
                  <Pressable
                    onPress={analyzeRestaurant}
                    disabled={analyzing}
                    style={({ pressed }) => [styles.analyzeBtn, (pressed || analyzing) && { opacity: 0.85 }]}
                  >
                    {analyzing ? (
                      <ActivityIndicator size="small" color={BRAND.cream} />
                    ) : (
                      <MaterialCommunityIcons name="magnify" size={18} color={BRAND.cream} />
                    )}
                    <Text style={styles.analyzeBtnText}>
                      {analyzing ? 'Analyzing menu…' : 'Analyze menu with AI'}
                    </Text>
                  </Pressable>
                )}

                {detailLoading ? (
                  <ActivityIndicator style={{ marginTop: 20 }} color={BRAND.ink} />
                ) : selected.analyzed && selected.dishes.length > 0 ? (
                  <View style={styles.dishSection}>
                    <Text style={styles.dishSectionLabel}>MENU ANALYSIS</Text>
                    {selected.dishes.map((dish, i) => (
                      <View key={i} style={styles.dishRow}>
                        <View style={styles.dishInfo}>
                          <Text style={styles.dishName}>{dish.name}</Text>
                          {dish.allergens.length > 0 ? (
                            <View style={styles.pillRow}>
                              {dish.allergens.map((a) => (
                                <Pill key={a} label={a.replace('-', ' ')} variant="danger" />
                              ))}
                            </View>
                          ) : (
                            <Pill label="No allergens" variant="safe" />
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : selected.analyzed ? (
                  <Text style={styles.noData}>Menu data not available.</Text>
                ) : null}
              </ScrollView>
            )}

            <Pressable onPress={() => setSelected(null)} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pin: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  pinCertified: {
    width: 36, height: 36, borderRadius: 18,
  },
  legend: {
    position: 'absolute', top: 60, left: 16,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12,
    padding: 10, gap: 6, shadowColor: '#000', shadowOpacity: 0.1,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: FONTS.sansMedium, fontSize: 11, color: BRAND.ink },
  reloadBtn: {
    position: 'absolute', bottom: 32, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: BRAND.ink, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 999, shadowColor: '#000', shadowOpacity: 0.15,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  reloadText: { fontFamily: FONTS.sansSemi, fontSize: 13, color: BRAND.cream, letterSpacing: 0.3 },
  loadingOverlay: {
    position: 'absolute', top: 60, right: 16,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 8,
  },
  // Bottom sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(21,33,26,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: BRAND.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '75%',
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: BRAND.border,
    alignSelf: 'center', marginBottom: 16,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 16 },
  detailName: { fontFamily: FONTS.serifItalic, fontSize: 26, letterSpacing: -0.4, color: BRAND.ink },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  certText: { fontFamily: FONTS.sansMedium, fontSize: 12, color: BRAND.green },
  scoreBadge: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 14, borderWidth: 1.5,
  },
  scoreNum: { fontFamily: FONTS.sansBold, fontSize: 24, lineHeight: 28 },
  scoreLabel: { fontFamily: FONTS.sansMedium, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: BRAND.muted },
  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 999, backgroundColor: BRAND.ink, marginBottom: 16,
  },
  analyzeBtnText: { fontFamily: FONTS.sansSemi, fontSize: 13, color: BRAND.cream, letterSpacing: 0.3 },
  dishSection: { gap: 8 },
  dishSectionLabel: {
    fontFamily: FONTS.sansSemi, fontSize: 10, letterSpacing: 2,
    textTransform: 'uppercase', color: BRAND.terra, marginBottom: 4,
  },
  dishRow: {
    padding: 12, borderRadius: 14, backgroundColor: BRAND.card,
    borderWidth: 0.5, borderColor: BRAND.border,
  },
  dishInfo: { gap: 6 },
  dishName: { fontFamily: FONTS.sansSemi, fontSize: 14, color: BRAND.ink },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  noData: { fontFamily: FONTS.sans, fontSize: 14, color: BRAND.muted, textAlign: 'center', paddingVertical: 20 },
  doneBtn: {
    marginTop: 12, paddingVertical: 14, borderRadius: 999,
    backgroundColor: BRAND.ink, alignItems: 'center',
  },
  doneBtnText: { fontFamily: FONTS.sansSemi, fontSize: 14, color: BRAND.cream, letterSpacing: 0.3 },
});
