import { StyleSheet, Text, View } from 'react-native';

import { BRAND, FONTS } from '@/constants/brand';

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, { text: number; ring: number; dotInset: number; borderW: number }> = {
  sm: { text: 22, ring: 16, dotInset: 4, borderW: 1.5 },
  md: { text: 30, ring: 22, dotInset: 5, borderW: 1.5 },
  lg: { text: 44, ring: 32, dotInset: 7, borderW: 2 },
};

export function AllerlensLogo({
  size = 'md',
  color = BRAND.ink,
}: {
  size?: Size;
  color?: string;
  showWordmark?: boolean;
}) {
  const s = SIZES[size];
  return (
    <View style={styles.row}>
      <Text style={[styles.word, { fontSize: s.text, color }]}>aller</Text>
      <View
        style={[
          styles.ring,
          {
            width: s.ring,
            height: s.ring,
            borderRadius: s.ring / 2,
            borderWidth: s.borderW,
          },
        ]}
      >
        <View
          style={[
            styles.dot,
            {
              top: s.dotInset,
              left: s.dotInset,
              right: s.dotInset,
              bottom: s.dotInset,
              borderRadius: s.ring,
            },
          ]}
        />
      </View>
      <Text style={[styles.word, { fontSize: s.text, color }]}>vision</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  word: {
    fontFamily: FONTS.serifItalic,
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  ring: {
    borderColor: BRAND.terra,
    marginHorizontal: 2,
    alignSelf: 'center',
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    backgroundColor: BRAND.terra,
  },
});
