import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { Pill } from '@/components/ui/pill';
import { BRAND, FONTS } from '@/constants/brand';
import type { FoodItem } from '@/constants/mock-data';
import { formatTime } from '@/constants/time';
import { useProfile } from '@/lib/profile-context';

function Skeleton({ width, height = 14 }: { width: number | string; height?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={{ width: width as any, height, borderRadius: 6, backgroundColor: BRAND.border, opacity }}
    />
  );
}

function AnimatedDropdown({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  const height = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(height, { toValue: visible ? 1 : 0, duration: 200, useNativeDriver: false }),
      Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 200, useNativeDriver: false }),
    ]).start();
  }, [visible, height, opacity]);

  return (
    <Animated.View style={{ maxHeight: height.interpolate({ inputRange: [0, 1], outputRange: [0, 500] }), opacity, overflow: 'hidden' }}>
      {children}
    </Animated.View>
  );
}

export function FoodCard({ item }: { item: FoodItem }) {
  const [expanded, setExpanded] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [allergensExpanded, setAllergensExpanded] = useState(false);
  const hasMore = item.problemIngredients.length > 0;
  const isLoading = !!item.loading;
  const profile = useProfile();
  const flagged = item.allergens.filter((a) => profile.allergens.includes(a));
  const unflagged = item.allergens.filter((a) => !profile.allergens.includes(a));

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
            {isLoading ? (
              <Skeleton width={50} height={12} />
            ) : (
              <Text style={styles.calText}>{item.calories} cal</Text>
            )}
          </View>
        </View>
      ) : null}

      <View style={styles.body}>
        {item.error ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={18} color={BRAND.terra} />
            <Text style={styles.errorText}>{item.error}</Text>
          </View>
        ) : isLoading ? (
          <View style={{ gap: 14 }}>
            <Skeleton width="70%" height={22} />
            <Skeleton width="90%" height={12} />
            <Skeleton width="60%" height={12} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <Skeleton width={70} height={24} />
              <Skeleton width={55} height={24} />
            </View>
          </View>
        ) : (
          <>
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

        {/* Allergens — flagged shown, dropdown for rest */}
        <Pressable onPress={() => setAllergensExpanded((v) => !v)} hitSlop={8}>
          {flagged.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>FLAGGED ALLERGENS</Text>
                <View style={styles.dropdownHint}>
                  <Text style={styles.expandTextSmall}>{allergensExpanded ? 'Hide' : 'All'} ({item.allergens.length})</Text>
                  <MaterialCommunityIcons name={allergensExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={BRAND.primaryDark} />
                </View>
              </View>
              <View style={styles.pillRow}>
                {flagged.map((a) => (
                  <Pill key={a} label={a.replace('-', ' ')} variant="danger" />
                ))}
              </View>
            </View>
          ) : item.allergens.length > 0 ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.expandText}>Allergens ({item.allergens.length})</Text>
              <MaterialCommunityIcons name={allergensExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={BRAND.primaryDark} />
            </View>
          ) : (
            <Text style={styles.safeLabel}>No allergens detected</Text>
          )}
        </Pressable>

        <AnimatedDropdown visible={allergensExpanded && item.allergens.length > 0}>
          <View style={[styles.pillRow, { marginTop: 6 }]}>
            {unflagged.map((a) => (
              <Pill key={a} label={a.replace('-', ' ')} variant="neutral" />
            ))}
            {unflagged.length === 0 ? <Text style={styles.dimText}>No additional allergens</Text> : null}
          </View>
        </AnimatedDropdown>

        {/* Ingredients — diet violations highlighted inline */}
        {hasMore ? (
          <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={8}>
            {item.dietViolations && item.dietViolations.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>DIET</Text>
                  <View style={styles.dropdownHint}>
                    <Text style={styles.expandTextSmall}>Ingredients ({item.problemIngredients.length})</Text>
                    <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={BRAND.primaryDark} />
                  </View>
                </View>
                <View style={styles.pillRow}>
                  {item.dietViolations.map((v) => (
                    <Pill key={v} label={v} variant="warning" />
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.sectionHeader}>
                <Text style={styles.expandText}>Ingredients ({item.problemIngredients.length})</Text>
                <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={BRAND.primaryDark} />
              </View>
            )}
          </Pressable>
        ) : null}

        <AnimatedDropdown visible={expanded && hasMore}>
          <View style={styles.ingredientList}>
            {item.problemIngredients.map((ing) => {
              const isDietIssue = item.dietViolations?.some((v) => v.toLowerCase().includes(ing.toLowerCase()));
              return (
                <View key={ing} style={styles.ingredientRow}>
                  <View style={[styles.ingredientBullet, isDietIssue && { backgroundColor: BRAND.terra }]} />
                  <Text style={[styles.ingredientText, isDietIssue && { color: BRAND.terra }]}>{ing}</Text>
                </View>
              );
            })}
          </View>
        </AnimatedDropdown>

        {item.alternative ? (
          <View style={styles.altSection}>
            <MaterialCommunityIcons name="swap-horizontal" size={16} color={BRAND.green} />
            <Text style={styles.altText}>{item.alternative}</Text>
          </View>
        ) : null}
          </>
        )}
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(217,119,87,0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(217,119,87,0.3)',
  },
  errorText: {
    flex: 1,
    fontFamily: FONTS.sansMedium,
    fontSize: 14,
    color: BRAND.terra,
  },
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  expandTextSmall: {
    fontFamily: FONTS.sansMedium,
    fontSize: 11,
    color: BRAND.green,
    letterSpacing: 0.2,
  },
  dimText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: BRAND.textSubtle,
  },
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
  altSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(31,61,43,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(31,61,43,0.15)',
  },
  altText: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.green,
  },
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
  friendAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.border,
  },
  friendAlertName: {
    fontFamily: FONTS.sansSemi,
    fontSize: 13,
    color: BRAND.ink,
  },
});
