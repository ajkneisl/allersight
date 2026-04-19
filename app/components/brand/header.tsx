import { StyleSheet, Text, View } from 'react-native';

import { AllersightLogo } from '@/components/brand/logo';
import { BRAND, FONTS } from '@/constants/brand';

export function Header({
  title,
  eyebrow,
  subtitle,
}: {
  title?: string;
  eyebrow?: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <AllersightLogo size="sm" />
        {eyebrow ? (
          <View style={styles.eyebrowRow}>
            <View style={styles.rule} />
            <Text style={styles.eyebrow}>{eyebrow}</Text>
          </View>
        ) : null}
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontSize: 42,
    lineHeight: 50,
    color: BRAND.ink,
    letterSpacing: -1.4,
  },
  subtitle: {
    marginTop: 10,
    fontFamily: FONTS.sans,
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.muted,
    maxWidth: 320,
  },
});
