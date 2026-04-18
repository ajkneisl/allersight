import { StyleSheet, Text, View } from 'react-native';

import { BRAND, FONTS } from '@/constants/brand';

type Variant = 'warning' | 'danger' | 'neutral' | 'brand' | 'safe';

const VARIANTS: Record<
  Variant,
  { bg: string; fg: string; border: string }
> = {
  warning: {
    bg: 'rgba(217,119,87,0.12)',
    fg: BRAND.terra,
    border: 'rgba(217,119,87,0.35)',
  },
  danger: {
    bg: 'rgba(217,119,87,0.16)',
    fg: BRAND.terra,
    border: 'rgba(217,119,87,0.4)',
  },
  neutral: {
    bg: 'transparent',
    fg: BRAND.ink,
    border: 'rgba(21,33,26,0.22)',
  },
  brand: {
    bg: BRAND.ink,
    fg: BRAND.cream,
    border: BRAND.ink,
  },
  safe: {
    bg: 'rgba(31,61,43,0.1)',
    fg: BRAND.green,
    border: 'rgba(31,61,43,0.3)',
  },
};

export function Pill({
  label,
  variant = 'neutral',
}: {
  label: string;
  variant?: Variant;
}) {
  const v = VARIANTS[variant];
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: v.bg, borderColor: v.border },
      ]}
    >
      <Text style={[styles.text, { color: v.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  text: {
    fontFamily: FONTS.sansMedium,
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
