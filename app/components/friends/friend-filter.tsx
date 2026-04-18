import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BRAND, FONTS } from '@/constants/brand';
import type { Friend } from '@/constants/mock-data';

export function FriendFilter({
  friends,
  selected,
  onToggle,
}: {
  friends: Friend[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.rule} />
        <Text style={styles.label}>Filter by friend</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {friends.map((f) => {
          const active = selected.includes(f.id);
          return (
            <Pressable
              key={f.id}
              onPress={() => onToggle(f.id)}
              style={[
                styles.chip,
                active ? styles.chipActive : styles.chipInactive,
              ]}
            >
              <Image
                source={{ uri: f.avatar }}
                style={styles.avatar}
                contentFit="cover"
              />
              <Text
                style={[
                  styles.name,
                  { color: active ? BRAND.cream : BRAND.ink },
                ]}
              >
                {f.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  rule: { width: 24, height: 1, backgroundColor: BRAND.terra },
  label: {
    fontFamily: FONTS.sansMedium,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: BRAND.muted,
  },
  scroll: { gap: 10, paddingHorizontal: 20 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 0.5,
    paddingLeft: 4,
    paddingRight: 14,
    paddingVertical: 4,
  },
  chipActive: {
    borderColor: BRAND.ink,
    backgroundColor: BRAND.ink,
  },
  chipInactive: {
    borderColor: BRAND.border,
    backgroundColor: '#ffffff',
  },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  name: {
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
