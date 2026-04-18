import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { BRAND, FONTS } from '@/constants/brand';
import type { Friend, Recipe } from '@/constants/mock-data';

export function RecipeCard({
  recipe,
  friends,
}: {
  recipe: Recipe;
  friends: Friend[];
}) {
  const involved = friends.filter((f) => recipe.friendIds.includes(f.id));

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: recipe.photo }}
        style={styles.photo}
        contentFit="cover"
      />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {recipe.calories} cal · {recipe.timeMinutes}m
          </Text>
          <View style={styles.avatars}>
            {involved.slice(0, 3).map((f, idx) => (
              <Image
                key={f.id}
                source={{ uri: f.avatar }}
                style={[styles.avatar, { marginLeft: idx === 0 ? 0 : -8 }]}
                contentFit="cover"
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: BRAND.card,
    borderWidth: 0.5,
    borderColor: BRAND.border,
    overflow: 'hidden',
    shadowColor: BRAND.ink,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  photo: { width: '100%', height: 128 },
  body: { padding: 14, gap: 10 },
  title: {
    fontFamily: FONTS.serifItalic,
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: -0.3,
    color: BRAND.ink,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 11,
    letterSpacing: 0.2,
    color: BRAND.muted,
  },
  avatars: { flexDirection: 'row' },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: BRAND.card,
  },
});
