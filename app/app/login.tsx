import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AllerlensLogo } from '@/components/brand/logo';
import { BRAND, FONTS } from '@/constants/brand';
import { ApiError, apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { setToken } = useAuth();

  const signIn = async () => {
    setError(null);
    if (!email.includes('@')) { setError('Please enter a valid email.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setSubmitting(true);
    try {
      const res = await apiFetch<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(res.token);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <AllerlensLogo size="md" />
          </View>

          <View style={styles.eyebrowRow}>
            <View style={styles.rule} />
            <Text style={styles.eyebrow}>A pocket allergen investigator</Text>
          </View>
          <Text style={styles.title}>
            Welcome <Text style={styles.titleItalic}>back.</Text>
          </Text>
          <Text style={styles.lede}>
            Pick up where you left off — your profile, your flags, and your
            daily macros.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={BRAND.textSubtle}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={BRAND.textSubtle}
              secureTextEntry
              style={styles.input}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.primary,
              (pressed || submitting) && { opacity: 0.9 },
            ]}
            onPress={signIn}
            disabled={submitting}
          >
            <Text style={styles.primaryText}>{submitting ? 'Signing in…' : 'Sign in'}</Text>
          </Pressable>

          <Pressable style={styles.forgot} hitSlop={8}>
            <Text style={styles.forgotText}>Forgot your password?</Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerMuted}>New here? </Text>
            <Pressable hitSlop={8} onPress={() => router.push('/register')}>
              <Text style={styles.footerLink}>Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.cream },
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 48,
    gap: 14,
  },
  brand: {
    alignItems: 'flex-start',
    paddingBottom: 26,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rule: { width: 24, height: 1, backgroundColor: BRAND.terra },
  eyebrow: {
    fontFamily: FONTS.sansMedium,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: BRAND.muted,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 52,
    lineHeight: 54,
    letterSpacing: -1.6,
    color: BRAND.ink,
  },
  titleItalic: {
    fontFamily: FONTS.serifItalic,
    color: BRAND.green,
  },
  lede: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.muted,
    marginBottom: 14,
    maxWidth: 360,
  },
  fieldGroup: { gap: 6 },
  label: {
    fontFamily: FONTS.sansSemi,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: BRAND.muted,
  },
  input: {
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: BRAND.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: FONTS.sans,
    fontSize: 16,
    color: BRAND.ink,
    backgroundColor: '#ffffff',
  },
  error: {
    color: BRAND.terra,
    fontFamily: FONTS.sansMedium,
    fontSize: 13,
  },
  primary: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: BRAND.ink,
  },
  primaryText: {
    color: BRAND.cream,
    fontFamily: FONTS.sansSemi,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  forgot: { alignSelf: 'center', marginTop: 8 },
  forgotText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 13,
    color: BRAND.green,
  },
  footer: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerMuted: {
    fontFamily: FONTS.sans,
    color: BRAND.muted,
    fontSize: 14,
  },
  footerLink: {
    fontFamily: FONTS.sansSemi,
    color: BRAND.ink,
    fontSize: 14,
  },
});
