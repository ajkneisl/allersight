import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Pill } from '@/components/ui/pill';
import { BRAND, FONTS } from '@/constants/brand';
import type { FoodItem } from '@/constants/mock-data';
import { formatTime } from '@/constants/time';

export function FoodCard({ item }: { item: FoodItem }) {
  const [expanded, setExpanded] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const hasMore = item.problemIngredients.length > 0;

  return (
    <View style={styles.card}>
      <View style={styles.metaRow}>
        <Text style={styles.time}>{formatTime(item.detectedAt)}</Text>
        <View style={styles.dot} />
        <View style={styles.locationWrap}>
          <MaterialCommunityIcons
            name="map-marker"
            size={14}
            color={BRAND.primaryDark}
          />
          <Text style={styles.location} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
      </View>

      {item.photo ? (
        <View style={styles.photoWrap}>
          <Image
            source={{ uri: item.photo }}
            style={styles.photo}
            contentFit="cover"
          />
          <View style={styles.calBadge}>
            <Text style={styles.calText}>{item.calories} cal</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.body}>
        <Text style={styles.title}>{item.title}</Text>
        {item.description ? (
          <Pressable onPress={() => setDescExpanded((v) => !v)} style={styles.descRow} hitSlop={4}>
            <Text style={styles.descToggle}>
              {descExpanded ? 'Hide' : 'Show'} description
            </Text>
            <MaterialCommunityIcons
              name={descExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={BRAND.muted}
            />
          </Pressable>
        ) : null}
        {descExpanded && item.description ? (
          <Text style={styles.description}>{item.description}</Text>
        ) : null}

        {item.allergens.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>FLAGGED ALLERGENS</Text>
            <View style={styles.pillRow}>
              {item.allergens.map((a) => (
                <Pill key={a} label={a.replace('-', ' ')} variant="danger" />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.safeLabel}>No flagged allergens</Text>
          </View>
        )}

        {hasMore ? (
          <Pressable
            onPress={() => setExpanded((v) => !v)}
            style={styles.expandRow}
            hitSlop={8}
          >
            <Text style={styles.expandText}>
              {expanded ? 'Hide' : 'Show'} ingredients (
              {item.problemIngredients.length})
            </Text>
            <MaterialCommunityIcons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={BRAND.primaryDark}
            />
          </Pressable>
        ) : null}

        {expanded && hasMore ? (
          <View style={styles.ingredientList}>
            {item.problemIngredients.map((ing) => (
              <View key={ing} style={styles.ingredientRow}>
                <View style={styles.ingredientBullet} />
                <Text style={styles.ingredientText}>{ing}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 18,
    borderRadius: 20,
    backgroundColor: BRAND.card,
    borderWidth: 0.5,
    borderColor: BRAND.border,
    overflow: 'hidden',
    shadowColor: BRAND.ink,
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
  },
  time: {
    fontFamily: FONTS.sansSemi,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: BRAND.terra,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: BRAND.textSubtle,
  },
  locationWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    flex: 1,
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
    color: BRAND.muted,
  },
  photoWrap: { position: 'relative' },
  photo: { width: '100%', height: 200 },
  calBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(21,33,26,0.78)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  calText: {
    color: BRAND.cream,
    fontFamily: FONTS.sansSemi,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  body: { padding: 18, gap: 12 },
  title: {
    fontFamily: FONTS.serifItalic,
    fontSize: 26,
    letterSpacing: -0.4,
    color: BRAND.ink,
    lineHeight: 28,
  },
  description: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    lineHeight: 21,
    color: BRAND.muted,
  },
  descRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  descToggle: {
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
    color: BRAND.muted,
    letterSpacing: 0.2,
  },
  section: { gap: 8 },
  sectionLabel: {
    fontFamily: FONTS.sansSemi,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: BRAND.terra,
  },
  safeLabel: {
    fontFamily: FONTS.sansMedium,
    fontSize: 13,
    color: BRAND.green,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: BRAND.border,
  },
  expandText: {
    fontFamily: FONTS.sansSemi,
    fontSize: 12,
    letterSpacing: 0.2,
    color: BRAND.green,
  },
  ingredientList: {
    gap: 6,
    paddingTop: 6,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 6,
  },
  ingredientBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: BRAND.terra,
  },
  ingredientText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: BRAND.ink,
  },
});
