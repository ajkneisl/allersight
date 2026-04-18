import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '@/components/brand/header';
import { Pill } from '@/components/ui/pill';
import { BRAND, FONTS } from '@/constants/brand';
import { ALLERGENS, DIETS } from '@/constants/mock-data';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const ALLERGEN_LABEL = Object.fromEntries(ALLERGENS.map((a) => [a.id, a.label])) as Record<string, string>;
const DIET_LABEL = Object.fromEntries(DIETS.map((d) => [d.id, d.label])) as Record<string, string>;

type ApiFriend = {
  id: number;
  userId: number;
  name: string;
  email: string;
  allergens: string[];
  diet: string;
  sharedAllergens: number;
};

type FriendRequest = {
  id: number;
  fromUserId: number;
  fromEmail: string;
  fromName: string;
  status: string;
  createdAt: string;
};

export default function FriendsScreen() {
  const { token } = useAuth();
  const [friends, setFriends] = useState<ApiFriend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiFetch<ApiFriend[]>('/friends', {}, token),
      apiFetch<FriendRequest[]>('/friends/requests', {}, token),
    ])
      .then(([f, r]) => { setFriends(f); setRequests(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleSendRequest = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setAddError(null);
    setAdding(true);
    try {
      await apiFetch('/friends/request', { method: 'POST', body: JSON.stringify({ email: trimmed }) }, token);
      setEmail('');
      setModalOpen(false);
    } catch (e: any) {
      setAddError(e.message ?? 'Failed to send request');
    } finally {
      setAdding(false);
    }
  };

  const handleAccept = async (id: number) => {
    await apiFetch(`/friends/requests/${id}/accept`, { method: 'POST' }, token).catch(() => {});
    load();
  };

  const handleReject = async (id: number) => {
    await apiFetch(`/friends/requests/${id}/reject`, { method: 'POST' }, token).catch(() => {});
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRemove = async (id: number) => {
    await apiFetch(`/friends/${id}`, { method: 'DELETE' }, token).catch(() => {});
    setFriends((prev) => prev.filter((f) => f.id !== id));
  };

  const renderHeader = () => (
    <View>
      <Header
        eyebrow="The people at your table"
        title="Your crew."
        subtitle="Add friends by email, accept requests, and see their allergens."
      />
      <Pressable
        onPress={() => setModalOpen(true)}
        style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.9 }]}
      >
        <MaterialCommunityIcons name="account-plus" size={16} color={BRAND.cream} />
        <Text style={styles.addBtnText}>Send friend request</Text>
      </Pressable>

      {requests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending requests</Text>
          {requests.map((r) => (
            <View key={r.id} style={styles.reqCard}>
              <View style={styles.reqInfo}>
                <Text style={styles.reqName}>{r.fromName}</Text>
                <Text style={styles.reqEmail}>{r.fromEmail}</Text>
              </View>
              <Pressable onPress={() => handleAccept(r.id)} style={[styles.reqBtn, styles.reqAccept]}>
                <Text style={styles.reqAcceptText}>Accept</Text>
              </Pressable>
              <Pressable onPress={() => handleReject(r.id)} style={[styles.reqBtn, styles.reqReject]}>
                <Text style={styles.reqRejectText}>Decline</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {friends.length > 0 && (
        <Text style={styles.sectionTitle}>Friends</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <FlatList
        style={{ flex: 1 }}
        data={friends}
        keyExtractor={(f) => String(f.id)}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>{item.email}</Text>
              </View>
              <Pill label={item.sharedAllergens > 0 ? 'Watch' : 'Safe'} variant={item.sharedAllergens > 0 ? 'warning' : 'safe'} />
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Diet</Text>
              <Pill label={DIET_LABEL[item.diet] ?? 'No preference'} variant={item.diet === 'none' ? 'neutral' : 'brand'} />
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Allergens</Text>
              {item.allergens.length === 0 ? (
                <Pill label="None" variant="neutral" />
              ) : (
                <View style={styles.pillRow}>
                  {item.allergens.map((a) => (
                    <Pill key={a} label={ALLERGEN_LABEL[a] ?? a} variant="danger" />
                  ))}
                </View>
              )}
            </View>
            <Pressable onPress={() => handleRemove(item.id)} hitSlop={8} style={styles.removeBtn}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={BRAND.ink} />
          ) : (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={styles.emptyText}>No friends added yet.</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
      />

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setModalOpen(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdropInner}>
            <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.sheetEyebrowRow}>
                <View style={styles.sheetRule} />
                <Text style={styles.sheetEyebrow}>Invite</Text>
              </View>
              <Text style={styles.sheetTitle}>
                Add a <Text style={styles.sheetTitleItalic}>friend.</Text>
              </Text>
              <Text style={styles.sheetHint}>
                Enter their email address to send a friend request.
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="friend@example.com"
                placeholderTextColor={BRAND.textSubtle}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoFocus
                onSubmitEditing={handleSendRequest}
                style={styles.input}
              />
              {addError ? <Text style={styles.errorText}>{addError}</Text> : null}
              <View style={styles.actions}>
                <Pressable onPress={() => setModalOpen(false)} style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && { opacity: 0.7 }]}>
                  <Text style={styles.btnGhostText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSendRequest}
                  disabled={!email.trim() || adding}
                  style={({ pressed }) => [styles.btn, styles.btnPrimary, (pressed || !email.trim() || adding) && { opacity: 0.85 }]}
                >
                  <Text style={styles.btnPrimaryText}>{adding ? 'Sending…' : 'Send'}</Text>
                </Pressable>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    marginHorizontal: 20, marginTop: 8, marginBottom: 8, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14,
    borderRadius: 999, backgroundColor: BRAND.ink,
  },
  addBtnText: { color: BRAND.cream, fontFamily: FONTS.sansSemi, fontSize: 13, letterSpacing: 0.3 },
  section: { marginTop: 16, paddingHorizontal: 20, gap: 8 },
  sectionTitle: {
    marginTop: 20, marginBottom: 4, marginHorizontal: 20,
    fontFamily: FONTS.sansSemi, fontSize: 10, letterSpacing: 2,
    textTransform: 'uppercase', color: BRAND.terra,
  },
  reqCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14,
    borderRadius: 14, borderWidth: 0.5, borderColor: BRAND.border, backgroundColor: BRAND.card,
  },
  reqInfo: { flex: 1, gap: 2 },
  reqName: { fontFamily: FONTS.sansSemi, fontSize: 14, color: BRAND.ink },
  reqEmail: { fontFamily: FONTS.sans, fontSize: 12, color: BRAND.muted },
  reqBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  reqAccept: { backgroundColor: BRAND.ink },
  reqAcceptText: { fontFamily: FONTS.sansSemi, fontSize: 11, color: BRAND.cream, letterSpacing: 0.3 },
  reqReject: { borderWidth: 0.5, borderColor: BRAND.border },
  reqRejectText: { fontFamily: FONTS.sansSemi, fontSize: 11, color: BRAND.muted, letterSpacing: 0.3 },
  card: {
    marginHorizontal: 20, marginTop: 12, padding: 16, borderRadius: 18,
    borderWidth: 0.5, borderColor: BRAND.border, backgroundColor: BRAND.card, gap: 14,
    shadowColor: BRAND.ink, shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  info: { flex: 1, gap: 2 },
  name: { fontFamily: FONTS.serifItalic, fontSize: 22, lineHeight: 24, letterSpacing: -0.3, color: BRAND.ink },
  sub: { fontFamily: FONTS.sans, fontSize: 12, color: BRAND.muted, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  metaLabel: { fontFamily: FONTS.sansSemi, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: BRAND.muted, width: 70 },
  pillRow: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  removeBtn: { alignSelf: 'flex-end' },
  removeText: { fontFamily: FONTS.sansMedium, fontSize: 12, color: BRAND.terra, letterSpacing: 0.3 },
  emptyText: { fontFamily: FONTS.serifItalic, fontSize: 18, color: BRAND.muted, textAlign: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(21,33,26,0.55)', justifyContent: 'center', paddingHorizontal: 24 },
  backdropInner: { justifyContent: 'center' },
  sheet: { padding: 24, borderRadius: 22, backgroundColor: BRAND.cream, gap: 12 },
  sheetEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheetRule: { width: 24, height: 1, backgroundColor: BRAND.terra },
  sheetEyebrow: { fontFamily: FONTS.sansMedium, fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase', color: BRAND.muted },
  sheetTitle: { fontFamily: FONTS.serif, fontSize: 34, lineHeight: 36, letterSpacing: -1, color: BRAND.ink },
  sheetTitleItalic: { fontFamily: FONTS.serifItalic, color: BRAND.green },
  sheetHint: { fontFamily: FONTS.sans, fontSize: 14, lineHeight: 20, color: BRAND.muted },
  input: {
    marginTop: 4, borderRadius: 12, borderWidth: 0.5, borderColor: BRAND.border,
    paddingHorizontal: 14, paddingVertical: 12, fontFamily: FONTS.sans, fontSize: 16,
    color: BRAND.ink, backgroundColor: '#ffffff',
  },
  errorText: { fontFamily: FONTS.sansMedium, fontSize: 13, color: BRAND.terra },
  actions: { marginTop: 6, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 },
  btnGhost: { backgroundColor: 'transparent' },
  btnGhostText: { color: BRAND.muted, fontFamily: FONTS.sansSemi, fontSize: 13, letterSpacing: 0.3 },
  btnPrimary: { backgroundColor: BRAND.ink },
  btnPrimaryText: { color: BRAND.cream, fontFamily: FONTS.sansSemi, fontSize: 13, letterSpacing: 0.3 },
});
