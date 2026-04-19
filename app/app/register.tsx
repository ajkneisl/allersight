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

import { AllersightLogo } from '@/components/brand/logo';
import { BRAND, FONTS } from '@/constants/brand';
import { ApiError } from '@/lib/api';
import { registerAccount } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { setToken } = useAuth();

  const onSubmit = async () => {
    setError(null);
    if (!email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await registerAccount(email, password).then((res) => setToken(res.token));
      router.replace('/(tabs)');
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError('Could not reach the server. Please try again.');
      }
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
            <AllersightLogo size="md" />
          </View>

          <View style={styles.eyebrowRow}>
            <View style={styles.rule} />
            <Text style={styles.eyebrow}>Create your profile</Text>
          </View>
          <Text style={styles.title}>
            A safer bite, <Text style={styles.titleItalic}>every time.</Text>
          </Text>
          <Text style={styles.lede}>
            Set up your allergen profile and start logging scans in seconds.
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
              editable={!submitting}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={BRAND.textSubtle}
              secureTextEntry
              style={styles.input}
              editable={!submitting}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter password"
              placeholderTextColor={BRAND.textSubtle}
              secureTextEntry
              style={styles.input}
              editable={!submitting}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.primary,
              (pressed || submitting) && { opacity: 0.9 },
            ]}
            onPress={onSubmit}
            disabled={submitting}
          >
            <Text style={styles.primaryText}>
              {submitting ? 'Creating account…' : 'Create account'}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerMuted}>Already have an account? </Text>
            <Pressable hitSlop={8} onPress={() => router.replace('/login')}>
              <Text style={styles.footerLink}>Sign in</Text>
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
    fontSize: 48,
    lineHeight: 50,
    letterSpacing: -1.5,
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
    marginTop: 8,
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
