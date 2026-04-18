import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BRAND, FONTS } from '@/constants/brand';
import type { FridgeScan } from '@/constants/mock-data';
import { formatRelativeTime } from '@/constants/relative-time';

export function FridgeScanCard({
  scan,
  onRescan,
}: {
  scan: FridgeScan;
  onRescan?: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name="fridge-outline"
            size={18}
            color={BRAND.cream}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.eyebrow}>In your fridge</Text>
          <Text style={styles.title}>Last scan</Text>
          <Text style={styles.time}>
            {formatRelativeTime(scan.scannedAt)} · {scan.ingredients.length}{' '}
            ingredient{scan.ingredients.length === 1 ? '' : 's'}
          </Text>
        </View>
        <Pressable
          onPress={onRescan}
          style={({ pressed }) => [styles.rescan, pressed && { opacity: 0.85 }]}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="camera-iris"
            size={14}
            color={BRAND.cream}
          />
          <Text style={styles.rescanText}>Scan</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {scan.ingredients.map((ing) => (
          <View key={ing} style={styles.chip}>
            <Text style={styles.chipText}>{ing}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: BRAND.border,
    backgroundColor: BRAND.card,
    paddingVertical: 16,
    gap: 14,
    shadowColor: BRAND.ink,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BRAND.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  eyebrow: {
    fontFamily: FONTS.sansSemi,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: BRAND.terra,
  },
  title: {
    fontFamily: FONTS.serifItalic,
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: -0.3,
    color: BRAND.ink,
  },
  time: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: BRAND.muted,
    marginTop: 2,
  },
  rescan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: BRAND.ink,
  },
  rescanText: {
    fontFamily: FONTS.sansSemi,
    fontSize: 11,
    letterSpacing: 0.3,
    color: BRAND.cream,
  },
  chips: {
    gap: 6,
    paddingHorizontal: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: BRAND.border,
    backgroundColor: BRAND.cream,
  },
  chipText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 11,
    letterSpacing: 0.3,
    color: BRAND.ink,
  },
});
