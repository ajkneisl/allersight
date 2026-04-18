export type Allergen =
  | 'peanuts'
  | 'tree-nuts'
  | 'dairy'
  | 'eggs'
  | 'gluten'
  | 'soy'
  | 'shellfish'
  | 'fish'
  | 'sesame';

export type Diet =
  | 'none'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'keto'
  | 'paleo'
  | 'halal'
  | 'kosher';

export const DIETS: { id: Diet; label: string }[] = [
  { id: 'none', label: 'No preference' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'pescatarian', label: 'Pescatarian' },
  { id: 'keto', label: 'Keto' },
  { id: 'paleo', label: 'Paleo' },
  { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' },
];

export const ALLERGENS: { id: Allergen; label: string }[] = [
  { id: 'peanuts', label: 'Peanuts' },
  { id: 'tree-nuts', label: 'Tree Nuts' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'gluten', label: 'Gluten' },
  { id: 'soy', label: 'Soy' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'fish', label: 'Fish' },
  { id: 'sesame', label: 'Sesame' },
];

export type FoodItem = {
  id: string;
  title: string;
  description: string;
  photo: string;
  calories: number;
  problemIngredients: string[];
  allergens: Allergen[];
  detectedAt: string;
  location: string;
};

export type Friend = {
  id: string;
  name: string;
  avatar: string;
  sharedAllergens: number;
  allergens: Allergen[];
  diet: Diet;
};

export type Recipe = {
  id: string;
  title: string;
  photo: string;
  calories: number;
  timeMinutes: number;
  friendIds: string[];
};

export const MOCK_FRIENDS: Friend[] = [
  {
    id: 'f1',
    name: 'Maya',
    avatar: 'https://i.pravatar.cc/150?img=47',
    sharedAllergens: 2,
    allergens: ['peanuts', 'tree-nuts'],
    diet: 'vegetarian',
  },
  {
    id: 'f2',
    name: 'Jordan',
    avatar: 'https://i.pravatar.cc/150?img=12',
    sharedAllergens: 1,
    allergens: ['gluten'],
    diet: 'pescatarian',
  },
  {
    id: 'f3',
    name: 'Priya',
    avatar: 'https://i.pravatar.cc/150?img=32',
    sharedAllergens: 3,
    allergens: ['dairy', 'eggs', 'sesame'],
    diet: 'vegan',
  },
  {
    id: 'f4',
    name: 'Sam',
    avatar: 'https://i.pravatar.cc/150?img=5',
    sharedAllergens: 0,
    allergens: [],
    diet: 'none',
  },
];

export const MOCK_FEED: FoodItem[] = [
  {
    id: 'p1',
    title: 'Thai Peanut Noodles',
    description:
      'Rice noodles tossed in a creamy peanut-lime sauce with crushed peanuts on top.',
    photo:
      'https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=800&q=80',
    calories: 620,
    problemIngredients: [
      'peanut butter',
      'soy sauce',
      'crushed peanuts',
      'rice noodles',
      'lime juice',
      'brown sugar',
    ],
    allergens: ['peanuts', 'soy', 'gluten'],
    detectedAt: '2026-04-17T18:42:00Z',
    location: 'Thai Orchid · Ravenna',
  },
  {
    id: 'p2',
    title: 'Garden Caesar Salad',
    description:
      'Crisp romaine, shaved parmesan, and house croutons with anchovy dressing.',
    photo:
      'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=800&q=80',
    calories: 410,
    problemIngredients: [
      'parmesan',
      'anchovy',
      'wheat croutons',
      'egg yolk',
      'dijon',
      'worcestershire',
    ],
    allergens: ['dairy', 'eggs', 'fish', 'gluten'],
    detectedAt: '2026-04-17T12:15:00Z',
    location: 'Home · Kitchen',
  },
  {
    id: 'p3',
    title: 'Avocado Toast',
    description:
      'Sourdough toast with smashed avocado, chili flakes, and a soft-boiled egg.',
    photo:
      'https://images.unsplash.com/photo-1603046891744-1f76eb10aec1?w=800&q=80',
    calories: 340,
    problemIngredients: ['sourdough', 'egg', 'chili flakes', 'olive oil'],
    allergens: ['gluten', 'eggs'],
    detectedAt: '2026-04-16T09:10:00Z',
    location: 'Blue Bottle · Capitol Hill',
  },
  {
    id: 'p4',
    title: 'Shrimp Pad See Ew',
    description:
      'Wide rice noodles with gai lan and shrimp in a dark soy-garlic sauce.',
    photo:
      'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&q=80',
    calories: 700,
    problemIngredients: [
      'shrimp',
      'soy sauce',
      'oyster sauce',
      'garlic',
      'rice noodles',
    ],
    allergens: ['shellfish', 'soy', 'gluten'],
    detectedAt: '2026-04-16T19:30:00Z',
    location: 'Bangkok 6 · Ballard',
  },
  {
    id: 'p5',
    title: 'Sesame Tofu Bowl',
    description:
      'Seared tofu over brown rice with tahini drizzle and toasted sesame.',
    photo:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    calories: 480,
    problemIngredients: [
      'tofu',
      'tahini',
      'sesame seeds',
      'brown rice',
      'scallion',
    ],
    allergens: ['soy', 'sesame'],
    detectedAt: '2026-04-15T13:05:00Z',
    location: 'Home · Lunch',
  },
  {
    id: 'p6',
    title: 'Margherita Pizza',
    description: 'Wood-fired pizza with San Marzano tomato, mozzarella, and basil.',
    photo:
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
    calories: 780,
    problemIngredients: ['mozzarella', 'wheat flour', 'olive oil', 'basil'],
    allergens: ['dairy', 'gluten'],
    detectedAt: '2026-04-14T20:05:00Z',
    location: 'Delancey · Ballard',
  },
];

export type FridgeScan = {
  scannedAt: string;
  ingredients: string[];
};

export const MOCK_FRIDGE_SCAN: FridgeScan = {
  scannedAt: '2026-04-17T16:42:00Z',
  ingredients: [
    'eggs',
    'spinach',
    'cherry tomatoes',
    'greek yogurt',
    'lemon',
    'red onion',
    'garlic',
    'parmesan',
    'chicken thighs',
    'brown rice',
    'olive oil',
    'dijon',
  ],
};

export const MOCK_RECIPES: Recipe[] = [
  {
    id: 'r1',
    title: 'Coconut Curry Bowl',
    photo:
      'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80',
    calories: 540,
    timeMinutes: 30,
    friendIds: ['f1', 'f3'],
  },
  {
    id: 'r2',
    title: 'Lemon Herb Salmon',
    photo:
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
    calories: 460,
    timeMinutes: 25,
    friendIds: ['f2'],
  },
  {
    id: 'r3',
    title: 'Chickpea Shakshuka',
    photo:
      'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=800&q=80',
    calories: 380,
    timeMinutes: 35,
    friendIds: ['f1', 'f4'],
  },
  {
    id: 'r4',
    title: 'Sheet-Pan Veggies',
    photo:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    calories: 290,
    timeMinutes: 40,
    friendIds: ['f3'],
  },
  {
    id: 'r5',
    title: 'Ginger Beef Stir-Fry',
    photo:
      'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80',
    calories: 580,
    timeMinutes: 20,
    friendIds: ['f2', 'f4'],
  },
  {
    id: 'r6',
    title: 'Berry Protein Oats',
    photo:
      'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80',
    calories: 420,
    timeMinutes: 10,
    friendIds: ['f1', 'f2', 'f3'],
  },
];
