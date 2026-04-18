import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '@/components/brand/header';
import { BRAND, FONTS } from '@/constants/brand';
import {
  ALLERGENS,
  DIETS,
  type Allergen,
  type Diet,
} from '@/constants/mock-data';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Profile = {
  name: string;
  allergens: string[];
  diet: string;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
};

export default function SettingsScreen() {
  const { token, setToken } = useAuth();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Allergen[]>([]);
  const [diet, setDiet] = useState<Diet>('none');
  const [calories, setCalories] = useState('2000');
  const [protein, setProtein] = useState('140');
  const [carbs, setCarbs] = useState('220');
  const [fat, setFat] = useState('60');
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    apiFetch<Profile>('/profile', {}, token)
      .then((p) => {
        setName(p.name ?? '');
        setSelected(p.allergens as Allergen[]);
        setDiet(p.diet as Diet);
        setCalories(String(p.calorieGoal));
        setProtein(String(p.proteinGoal));
        setCarbs(String(p.carbsGoal));
        setFat(String(p.fatGoal));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const save = useCallback(
    (patch: Record<string, unknown>) => {
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        apiFetch('/profile', { method: 'PUT', body: JSON.stringify(patch) }, token).catch(() => {});
      }, 500);
    },
    [token],
  );

  const toggle = (id: Allergen) => {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      save({ allergens: next });
      return next;
    });
  };

  const pickDiet = (d: Diet) => {
    setDiet(d);
    save({ diet: d });
  };

  const updateMacro = (field: string, setter: (v: string) => void) => (v: string) => {
    setter(v);
    const n = parseInt(v, 10);
    if (!isNaN(n)) save({ [field]: n });
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: BRAND.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={BRAND.ink} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 48 }}>
        <Header
          eyebrow="Dial in your profile"
          title="Settings."
          subtitle="Tell Allerlens what to watch for and what to aim for."
        />

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Profile</Text>
          <Text style={styles.cardTitle}>Your name.</Text>
          <TextInput
            value={name}
            onChangeText={(v) => { setName(v); save({ name: v }); }}
            placeholder="Enter your name"
            placeholderTextColor={BRAND.textSubtle}
            style={styles.input}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Diet</Text>
          <Text style={styles.cardTitle}>How you eat.</Text>
          <Text style={styles.cardHint}>Filters recipes and flags items that don&apos;t fit.</Text>
          <View style={styles.chipRow}>
            {DIETS.map((d) => {
              const active = diet === d.id;
              return (
                <Pressable key={d.id} onPress={() => pickDiet(d.id)} style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
                  <Text style={[styles.chipText, { color: active ? BRAND.cream : BRAND.ink }]}>{d.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Allergens</Text>
          <Text style={styles.cardTitle}>What to flag.</Text>
          <Text style={styles.cardHint}>We&apos;ll flag these in every scan.</Text>
          <View style={styles.chipRow}>
            {ALLERGENS.map((a) => {
              const active = selected.includes(a.id);
              return (
                <Pressable key={a.id} onPress={() => toggle(a.id)} style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
                  <Text style={[styles.chipText, { color: active ? BRAND.cream : BRAND.ink }]}>{a.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Daily intake</Text>
          <Text style={styles.cardTitle}>Calorie goal.</Text>
          <View style={styles.inputRow}>
            <TextInput keyboardType="number-pad" value={calories} onChangeText={updateMacro('calorieGoal', setCalories)} style={styles.input} />
            <Text style={styles.unit}>kcal / day</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Macros</Text>
          <Text style={styles.cardTitle}>The daily split.</Text>
          <MacroRow label="Protein" value={protein} onChange={updateMacro('proteinGoal', setProtein)} />
          <MacroRow label="Carbs" value={carbs} onChange={updateMacro('carbsGoal', setCarbs)} />
          <MacroRow label="Fat" value={fat} onChange={updateMacro('fatGoal', setFat)} />
        </View>

        <Pressable
          onPress={() => { setToken(null); router.replace('/login'); }}
          style={({ pressed }) => [styles.logout, pressed && { opacity: 0.7 }]}
          hitSlop={8}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.macroRow}>
      <Text style={styles.macroLabel}>{label}</Text>
      <TextInput keyboardType="number-pad" value={value} onChangeText={onChange} style={styles.input} />
      <Text style={styles.macroUnit}>g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20, marginTop: 18, padding: 20, gap: 10, borderRadius: 20,
    borderWidth: 0.5, borderColor: BRAND.border, backgroundColor: BRAND.card,
    shadowColor: BRAND.ink, shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  cardEyebrow: { fontFamily: FONTS.sansSemi, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: BRAND.terra },
  cardTitle: { fontFamily: FONTS.serifItalic, fontSize: 26, lineHeight: 28, letterSpacing: -0.4, color: BRAND.ink },
  cardHint: { fontFamily: FONTS.sans, fontSize: 13, lineHeight: 19, color: BRAND.muted },
  chipRow: { marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 0.5, paddingHorizontal: 14, paddingVertical: 7 },
  chipActive: { borderColor: BRAND.ink, backgroundColor: BRAND.ink },
  chipInactive: { borderColor: BRAND.border, backgroundColor: '#ffffff' },
  chipText: { fontFamily: FONTS.sansMedium, fontSize: 13, letterSpacing: 0.2 },
  inputRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    flex: 1, borderRadius: 12, borderWidth: 0.5, borderColor: BRAND.border,
    paddingHorizontal: 14, paddingVertical: 12, fontFamily: FONTS.sans, fontSize: 16, color: BRAND.ink, backgroundColor: '#ffffff',
  },
  unit: { fontFamily: FONTS.sansMedium, fontSize: 13, color: BRAND.muted },
  macroRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 12 },
  macroLabel: { width: 72, fontFamily: FONTS.sansSemi, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: BRAND.muted },
  macroUnit: { width: 14, fontFamily: FONTS.sansMedium, fontSize: 13, color: BRAND.muted },
  logout: { marginTop: 32, alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 18 },
  logoutText: { fontFamily: FONTS.sansMedium, fontSize: 13, letterSpacing: 0.3, color: BRAND.terra },
});
