import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '@/components/brand/header';
import { FriendFilter } from '@/components/friends/friend-filter';
import { RecipeCard } from '@/components/food/recipe-card';
import { BRAND, FONTS } from '@/constants/brand';
import type { Friend, Recipe } from '@/constants/mock-data';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type ApiFriend = {
  id: number;
  userId: number;
  name: string;
  email: string;
  allergens: string[];
  diet: string;
  sharedAllergens: number;
};

type ApiRecipe = {
  id: number;
  title: string;
  photo: string;
  calories: number;
  timeMinutes: number;
  allergens: string[];
  safeForFriends: number[];
};

export default function RecipesScreen() {
  const { token } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [friendMap, setFriendMap] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [apiFriends, apiRecipes] = await Promise.all([
        apiFetch<ApiFriend[]>('/friends', {}, token),
        apiFetch<ApiRecipe[]>('/recipes', {}, token),
      ]);
      const fMap = new Map(apiFriends.map((f) => [f.userId, f.name]));
      setFriendMap(fMap);
      setFriends(apiFriends.map((f): Friend => ({
        id: String(f.userId),
        name: f.name,
        avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(f.email)}`,
        sharedAllergens: f.sharedAllergens,
        allergens: f.allergens as any,
        diet: f.diet as any,
      })));
      setRecipes(apiRecipes.map((r): Recipe => ({
        id: String(r.id),
        title: r.title,
        photo: r.photo,
        calories: r.calories,
        timeMinutes: r.timeMinutes,
        friendIds: r.safeForFriends.map(String),
      })));
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (selectedFriends.length === 0) return recipes;
    return recipes.filter((r) => r.friendIds.some((id) => selectedFriends.includes(id)));
  }, [selectedFriends, recipes]);

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <FlatList
        style={{ flex: 1 }}
        data={filtered}
        keyExtractor={(r) => r.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }}
        ListHeaderComponent={
          <View>
            <Header
              eyebrow="Built from what you have"
              title="Recipes for your crew."
              subtitle="Filter by a friend to see what fits everyone at the table."
            />
            {friends.length > 0 && (
              <FriendFilter friends={friends} selected={selectedFriends} onToggle={toggleFriend} />
            )}
          </View>
        }
        renderItem={({ item }) => <RecipeCard recipe={item} friends={friends} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={BRAND.ink} />
          ) : (
            <Text style={styles.empty}>No recipes yet.</Text>
          )
        }
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  empty: {
    textAlign: 'center',
    padding: 40,
    fontFamily: FONTS.serifItalic,
    fontSize: 18,
    color: BRAND.muted,
  },
});
