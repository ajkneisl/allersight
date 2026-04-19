import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Callout, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '@/components/brand/header';
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

export default function RecipesScreen() {
  const { token } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView>(null);

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    try {
      const data = await apiFetch<Restaurant[]>(
        `/restaurants/nearby?lat=${lat}&lng=${lng}`, {}, token,
      );
      setRestaurants(data);
    } catch {}
  }, [token]);

  const analyzeRestaurant = useCallback(async (r: Restaurant) => {
    if (r.analyzed) return;
    try {
      const updated = await apiFetch<Restaurant>('/restaurants/analyze', {
        method: 'POST',
        body: JSON.stringify({ placeId: r.placeId, name: r.name, lat: r.lat, lng: r.lng }),
      }, token);
      setRestaurants((prev) => prev.map((x) => x.placeId === updated.placeId ? updated : x));
    } catch {}
  }, [token]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({});
      const r: Region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
      setRegion(r);
      await fetchNearby(r.latitude, r.longitude);
      setLoading(false);
    })();
  }, [fetchNearby]);

  const markerColor = (r: Restaurant) => {
    if (r.certified) return BRAND.green;
    if (r.allergenScore == null) return BRAND.muted;
    if (r.allergenScore >= 70) return BRAND.green;
    if (r.allergenScore >= 40) return BRAND.terra;
    return '#C0392B';
  };

  const scoreLabel = (r: Restaurant) => {
    if (r.certified) return 'Allersight Certified ✓';
    if (!r.analyzed) return 'Tap to analyze menu';
    return `Allergen Score: ${r.allergenScore ?? '?'}/100`;
  };

  if (loading || !region) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <Header eyebrow="Nearby" title="Safe dining." subtitle="Finding your location…" />
        <ActivityIndicator style={{ marginTop: 40 }} color={BRAND.ink} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Header eyebrow="Nearby" title="Safe dining." subtitle="Restaurants scored by allergen safety." />
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        onRegionChangeComplete={(r) => fetchNearby(r.latitude, r.longitude)}
      >
        {restaurants.map((r) => (
          <Marker
            key={r.placeId}
            coordinate={{ latitude: r.lat, longitude: r.lng }}
            pinColor={markerColor(r)}
            onPress={() => analyzeRestaurant(r)}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{r.name}</Text>
                <Text style={[styles.calloutScore, { color: markerColor(r) }]}>
                  {scoreLabel(r)}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bg },
  map: { flex: 1, borderRadius: 12, margin: 12 },
  callout: { padding: 8, minWidth: 160 },
  calloutTitle: { fontFamily: FONTS.sansSemi, fontSize: 14, color: BRAND.ink },
  calloutScore: { fontFamily: FONTS.sans, fontSize: 12, marginTop: 2 },
});
