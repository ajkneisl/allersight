import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '@/components/brand/header';
import { BRAND, FONTS } from '@/constants/brand';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Notification = {
  id: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

const ICON_MAP: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  meal_scanned: 'food',
  friend_request: 'account-plus',
  friend_accepted: 'account-check',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    apiFetch<Notification[]>('/notifications', {}, token)
      .then(setItems)
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: number) => {
    await apiFetch(`/notifications/${id}/read`, { method: 'POST' }, token).catch(() => {});
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <FlatList
        style={{ flex: 1 }}
        data={items}
        keyExtractor={(n) => String(n.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={BRAND.ink} />}
        ListHeaderComponent={
          <Header
            eyebrow="Stay in the loop"
            title="Notifications."
            subtitle="Friend requests, new scans from your crew, and more."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => !item.read && markRead(item.id)}
            style={[styles.card, !item.read && styles.cardUnread]}
          >
            <View style={[styles.iconWrap, !item.read && styles.iconUnread]}>
              <MaterialCommunityIcons
                name={ICON_MAP[item.type] ?? 'bell'}
                size={18}
                color={!item.read ? BRAND.cream : BRAND.muted}
              />
            </View>
            <View style={styles.body}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.bodyText} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>
            {!item.read && <View style={styles.dot} />}
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={BRAND.ink} />
          ) : (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={styles.emptyText}>No notifications yet.</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20, marginTop: 8, padding: 14, borderRadius: 16,
    borderWidth: 0.5, borderColor: BRAND.border, backgroundColor: BRAND.card,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  cardUnread: {
    borderColor: 'rgba(217,119,87,0.3)',
    backgroundColor: 'rgba(217,119,87,0.04)',
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: BRAND.border, alignItems: 'center', justifyContent: 'center',
  },
  iconUnread: { backgroundColor: BRAND.ink },
  body: { flex: 1, gap: 3 },
  title: { fontFamily: FONTS.sansSemi, fontSize: 14, color: BRAND.ink },
  bodyText: { fontFamily: FONTS.sans, fontSize: 13, lineHeight: 18, color: BRAND.muted },
  time: { fontFamily: FONTS.sansMedium, fontSize: 11, color: BRAND.textSubtle, marginTop: 2 },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND.terra,
    marginTop: 4,
  },
  emptyText: { fontFamily: FONTS.serifItalic, fontSize: 18, color: BRAND.muted, textAlign: 'center' },
});
