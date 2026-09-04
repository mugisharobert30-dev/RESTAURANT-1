import type {
  AppNotification,
  AuditLog,
  Category,
  ContactMessage,
  Coupon,
  DeliveryAddress,
  FaqItem,
  Favorite,
  GalleryPhoto,
  InventoryItem,
  MenuItem,
  Order,
  OrderItemLine,
  OrderType,
  PaymentMethod,
  Profile,
  Promotion,
  Reservation,
  RestaurantSettings,
  RestaurantTable,
  Review,
  StockMovement,
} from "./types";

const now = Date.now();
const iso = (offsetMinutes: number) => new Date(now - offsetMinutes * 60_000).toISOString();
const dayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const at = (daysFromToday: number, hour: number, minute = 0) => {
  const d = dayStart();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};
const dateOnly = (daysFromToday: number) => {
  const d = dayStart();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
};

export const SETTINGS: RestaurantSettings = {
  name: "Luwombo Restaurant",
  tagline: "Authentic Flavors. Warm Moments.",
  address: "KG 652 St, Kimihurura",
  district: "Gasabo, Kigali",
  phone: "+250 788 123 456",
  phone_secondary: "+250 722 654 321",
  email: "hello@luwombo.rw",
  whatsapp: "250788123456",
  opening_hours: {
    mon: { open: "07:00", close: "22:30" },
    tue: { open: "07:00", close: "22:30" },
    wed: { open: "07:00", close: "22:30" },
    thu: { open: "07:00", close: "22:30" },
    fri: { open: "07:00", close: "23:30" },
    sat: { open: "08:00", close: "23:30" },
    sun: { open: "08:00", close: "22:00" },
  },
  delivery_fee: 1500,
  delivery_zones: ["Kimihurura", "Kiyovu", "Nyarutarama", "Remera", "City Center", "Kacyiru", "Gacuriro"],
  tax_rate: 0,
  tax_included: true,
  currency: "RWF",
  reservation_slot_minutes: 60,
  max_party_online: 12,
  socials: {
    instagram: "https://instagram.com/luwomborestaurant",
    facebook: "https://facebook.com/luwomborestaurant",
    tiktok: "https://tiktok.com/@luwomborestaurant",
    whatsapp: "https://wa.me/250788123456",
  },
  wifi_password: "murakaza2024",
};

export const CATEGORIES: Category[] = [
  { id: "cat-trad", name: "Traditional Rwandan", slug: "traditional-rwandan", description: "Heritage recipes cooked slowly, served the Rwandan way.", sort_order: 1, active: true },
  { id: "cat-grill", name: "Grilled Specialties", slug: "grilled-specialties", description: "From the charcoal grill, straight to your table.", sort_order: 2, active: true },
  { id: "cat-mains", name: "Main Courses", slug: "main-courses", description: "Hearty plates from around the world.", sort_order: 3, active: true },
  { id: "cat-breakfast", name: "Breakfast", slug: "breakfast", description: "Start your morning the Luwombo way.", sort_order: 4, active: true },
  { id: "cat-veg", name: "Vegetarian", slug: "vegetarian", description: "Garden-fresh, fully meat-free dishes.", sort_order: 5, active: true },
  { id: "cat-snacks", name: "Snacks & Starters", slug: "snacks-starters", description: "Small bites, big flavor.", sort_order: 6, active: true },
  { id: "cat-desserts", name: "Desserts", slug: "desserts", description: "Sweet endings made in-house.", sort_order: 7, active: true },
  { id: "cat-juices", name: "Fresh Juices", slug: "fresh-juices", description: "Pressed daily from Rwandan fruit.", sort_order: 8, active: true },
  { id: "cat-drinks", name: "Soft Drinks", slug: "soft-drinks", description: "Cold drinks and local favorites.", sort_order: 9, active: true },
  { id: "cat-coffee", name: "Coffee & Tea", slug: "coffee-tea", description: "Rwandan arabica and warming brews.", sort_order: 10, active: true },
  { id: "cat-specials", name: "Chef's Specials", slug: "chefs-specials", description: "Limited creations from Chef Emmanuel.", sort_order: 11, active: true },
];

interface ItemSpec extends Partial<MenuItem> {
  cat: string;
  name: string;
  price: number;
  description: string;
}

let itemCounter = 100;
function makeItem(spec: ItemSpec): MenuItem {
  const slug = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  itemCounter += 1;
  const { cat, ...rest } = spec;
  return {
    id: `mi-${itemCounter}`,
    category_id: cat,
    slug,
    ingredients: [],
    allergens: [],
    prep_time_min: 15,
    available: true,
    featured: false,
    popular: false,
    spicy_level: 0,
    is_vegetarian: false,
    is_vegan: false,
    portion_info: "Served with your choice of sides",
    rating_avg: 4.5,
    rating_count: 12,
    times_ordered: 50 + ((itemCounter * 37) % 400),
    customization_groups: [],
    created_at: iso(60 * 24 * 90),
    ...rest,
  };
}

export const MENU_ITEMS: MenuItem[] = [
  makeItem({
    cat: "cat-trad", name: "Chicken Luwombo", price: 9500,
    description: "Our signature dish: free-range chicken slow-steamed in banana leaves with groundnut sauce, carrots and potatoes. Served with rice or matoke.",
    ingredients: ["Free-range chicken", "Groundnut paste", "Banana leaves", "Carrots", "Potatoes", "Onions", "Tomatoes"],
    allergens: ["Peanuts"], prep_time_min: 25, featured: true, popular: true, spicy_level: 1,
    portion_info: "Generous portion, serves one. Serves two on request.",
    calories: 720,
    customization_groups: [{ id: "grp-portion-1", name: "Portion size", type: "single", required: false, options: [{ name: "Regular", price: 0 }, { name: "Large (+40%)", price: 3000 }] }],
    rating_avg: 4.9, rating_count: 214, times_ordered: 1240,
  }),
  makeItem({
    cat: "cat-trad", name: "Beef Luwombo", price: 10500,
    description: "Tender beef stewed in banana leaves with green bananas, dodo greens and a rich tomato base. A Kigali classic done right.",
    ingredients: ["Beef chuck", "Green bananas", "Dodo greens", "Tomatoes", "Onions", "Garlic"],
    allergens: [], prep_time_min: 30, featured: true, popular: true, spicy_level: 1,
    portion_info: "Serves one", calories: 780,
    customization_groups: [{ id: "grp-portion-2", name: "Portion size", type: "single", required: false, options: [{ name: "Regular", price: 0 }, { name: "Extra beef", price: 3500 }] }],
    rating_avg: 4.8, rating_count: 186, times_ordered: 1105,
  }),
  makeItem({
    cat: "cat-trad", name: "Fish Luwombo", price: 11000,
    description: "Whole Nile tilapia steamed in banana leaves with leeks, dill and tomatoes. Light, fragrant and unforgettable.",
    ingredients: ["Nile tilapia", "Leeks", "Dill", "Tomatoes", "Lemon"],
    allergens: ["Fish"], prep_time_min: 28, spicy_level: 0,
    portion_info: "Whole fish, serves one to two", calories: 540,
    rating_avg: 4.7, rating_count: 98, times_ordered: 620,
  }),
  makeItem({
    cat: "cat-trad", name: "Isombe with Smoked Fish", price: 7000,
    description: "Cassava leaves pounded and simmered with groundnut paste and smoked sambaza fish. Deep, earthy comfort food.",
    ingredients: ["Cassava leaves", "Groundnut paste", "Smoked sambaza", "Palm oil"],
    allergens: ["Peanuts", "Fish"], prep_time_min: 20, popular: true,
    portion_info: "Served with rice or ubugali", calories: 610,
    rating_avg: 4.8, rating_count: 143, times_ordered: 870,
  }),
  makeItem({
    cat: "cat-trad", name: "Agatogo with Beef", price: 6500,
    description: "Plantains simmered in a savory tomato-beef stew with peppers. The beloved street-food staple, elevated.",
    ingredients: ["Plantains", "Beef", "Tomatoes", "Bell peppers", "Onions"],
    allergens: [], prep_time_min: 22, spicy_level: 1,
    portion_info: "Hearty bowl, serves one", calories: 660,
    rating_avg: 4.6, rating_count: 121, times_ordered: 745,
  }),
  makeItem({
    cat: "cat-trad", name: "Akabenz Special", price: 8500,
    description: "Crispy fried pork belly marinated overnight in garlic and lemon, finished with our house pili-pili glaze.",
    ingredients: ["Pork belly", "Garlic", "Lemon", "House pili-pili glaze"],
    allergens: [], prep_time_min: 25, popular: true, spicy_level: 2,
    portion_info: "Serves one to share", calories: 830,
    customization_groups: [{ id: "grp-spice-1", name: "Spice level", type: "single", required: false, options: [{ name: "Mild", price: 0 }, { name: "Hot", price: 0 }, { name: "Rwandan fire", price: 0 }] }],
    rating_avg: 4.9, rating_count: 167, times_ordered: 980,
  }),
  makeItem({
    cat: "cat-trad", name: "Matoke & Groundnut Sauce", price: 5500,
    description: "Steamed green bananas draped in creamy groundnut sauce with a side of dodo greens.",
    ingredients: ["Green bananas", "Groundnut paste", "Dodo greens"],
    allergens: ["Peanuts"], is_vegetarian: true, prep_time_min: 18,
    portion_info: "Serves one", calories: 520,
    rating_avg: 4.5, rating_count: 87, times_ordered: 430,
  }),
  makeItem({
    cat: "cat-trad", name: "Inyama n'Ibirayi", price: 7500,
    description: "Slow-braised beef with golden potatoes, rosemary and a splash of Mutzig in the gravy.",
    ingredients: ["Beef", "Potatoes", "Rosemary", "Onions"],
    allergens: [], prep_time_min: 26,
    portion_info: "Serves one", calories: 700,
    rating_avg: 4.6, rating_count: 76, times_ordered: 380,
  }),

  makeItem({
    cat: "cat-grill", name: "Goat Brochettes (x3)", price: 5000,
    description: "Three skewers of marinated goat meat over charcoal, served with grilled onions, chili salt and fries.",
    ingredients: ["Goat meat", "Red onions", "Charcoal marinade"],
    allergens: [], prep_time_min: 20, featured: true, popular: true, spicy_level: 1,
    portion_info: "3 skewers", calories: 480,
    customization_groups: [{ id: "grp-side-1", name: "Side", type: "single", required: false, options: [{ name: "Fries", price: 0 }, { name: "Fried plantain", price: 500 }, { name: "Extra onions", price: 0 }] }],
    rating_avg: 4.9, rating_count: 302, times_ordered: 1520,
  }),
  makeItem({
    cat: "cat-grill", name: "Whole Grilled Tilapia", price: 12000,
    description: "Lake Kivu tilapia butterflied and flame-grilled with garlic-lemon butter and imviringi spice rub.",
    ingredients: ["Tilapia", "Garlic butter", "Lemon", "Imviringi spice"],
    allergens: ["Fish"], prep_time_min: 32, featured: true,
    portion_info: "Whole fish, serves two", calories: 620,
    rating_avg: 4.8, rating_count: 154, times_ordered: 690,
  }),
  makeItem({
    cat: "cat-grill", name: "Mixed Grill Platter", price: 15500,
    description: "A feast from the fire: goat brochettes, chicken wings, beef sausage and pork ribs with two dips and fries.",
    ingredients: ["Goat", "Chicken wings", "Beef sausage", "Pork ribs", "Fries"],
    allergens: [], prep_time_min: 35, popular: true,
    portion_info: "Serves two to three", calories: 1250,
    rating_avg: 4.8, rating_count: 132, times_ordered: 560,
  }),
  makeItem({
    cat: "cat-grill", name: "Grilled Chicken Quarter", price: 8000,
    description: "Half chicken marinated in ginger, garlic and lemon, char-grilled and basted with house BBQ sauce.",
    ingredients: ["Chicken", "Ginger", "Garlic", "House BBQ sauce"],
    allergens: [], prep_time_min: 28,
    portion_info: "Quarter bird with sides", calories: 590,
    rating_avg: 4.7, rating_count: 94, times_ordered: 510,
  }),

  makeItem({
    cat: "cat-mains", name: "Signature Luwombo Platter", price: 14000,
    description: "Can't choose? Taste three mini luwombo — chicken, beef and veggie — with all the traditional sides.",
    ingredients: ["Chicken", "Beef", "Cassava leaves", "Matoke", "Rice"],
    allergens: ["Peanuts"], prep_time_min: 35, featured: true,
    portion_info: "Serves one hungry guest or two light eaters", calories: 980,
    rating_avg: 4.9, rating_count: 88, times_ordered: 340,
  }),
  makeItem({
    cat: "cat-mains", name: "Grilled Beef Steak", price: 13000,
    description: "250g local sirloin, seared to your liking, with pepper sauce, grilled vegetables and potato wedges.",
    ingredients: ["Beef sirloin", "Pepper sauce", "Vegetables", "Potatoes"],
    allergens: [], prep_time_min: 25,
    portion_info: "250g steak", calories: 760,
    customization_groups: [{ id: "grp-doneness-1", name: "Doneness", type: "single", required: true, options: [{ name: "Medium rare", price: 0 }, { name: "Medium", price: 0 }, { name: "Well done", price: 0 }] }],
    rating_avg: 4.7, rating_count: 102, times_ordered: 470,
  }),
  makeItem({
    cat: "cat-mains", name: "Chicken Curry with Rice", price: 9000,
    description: "Coconut chicken curry with Rwandan spices, steamed basmati and sambals.",
    ingredients: ["Chicken thigh", "Coconut milk", "Curry spices", "Basmati rice"],
    allergens: [], prep_time_min: 22, spicy_level: 2,
    portion_info: "Serves one", calories: 680,
    rating_avg: 4.6, rating_count: 79, times_ordered: 420,
  }),
  makeItem({
    cat: "cat-mains", name: "Peri Peri Chicken", price: 10000,
    description: "Flame-grilled chicken glazed with fiery peri peri, chips and house coleslaw.",
    ingredients: ["Chicken", "Peri peri", "Chips", "Coleslaw"],
    allergens: [], prep_time_min: 26, spicy_level: 3, popular: true,
    portion_info: "Quarter chicken", calories: 720,
    rating_avg: 4.7, rating_count: 118, times_ordered: 590,
  }),
  makeItem({
    cat: "cat-mains", name: "Pasta Alfredo", price: 8000,
    description: "Fettuccine in silky parmesan cream with grilled chicken or mushrooms.",
    ingredients: ["Fettuccine", "Cream", "Parmesan", "Chicken or mushrooms"],
    allergens: ["Gluten", "Dairy"], is_vegetarian: true, prep_time_min: 18,
    portion_info: "Serves one", calories: 810,
    customization_groups: [{ id: "grp-protein-1", name: "Add protein", type: "single", required: false, options: [{ name: "Grilled chicken", price: 2000 }, { name: "Sautéed mushrooms", price: 1000 }, { name: "Keep it plain", price: 0 }] }],
    rating_avg: 4.5, rating_count: 64, times_ordered: 310,
  }),

  makeItem({
    cat: "cat-breakfast", name: "Rwandan Tea & Mandazi", price: 2500,
    description: "Milky spiced tea with ginger and two pieces of fresh mandazi. How Kigali wakes up.",
    ingredients: ["Black tea", "Fresh milk", "Ginger", "Mandazi"],
    allergens: ["Gluten", "Dairy"], is_vegetarian: true, prep_time_min: 10,
    portion_info: "One pot + two mandazi", calories: 380,
    rating_avg: 4.8, rating_count: 156, times_ordered: 890,
  }),
  makeItem({
    cat: "cat-breakfast", name: "Full English Breakfast", price: 7000,
    description: "Eggs any style, bacon, sausage, beans, roasted tomato and toast.",
    ingredients: ["Eggs", "Bacon", "Sausage", "Beans", "Toast"],
    allergens: ["Eggs", "Gluten"], prep_time_min: 15,
    portion_info: "Hearty plate", calories: 850,
    rating_avg: 4.6, rating_count: 71, times_ordered: 330,
  }),
  makeItem({
    cat: "cat-breakfast", name: "Three-Egg Omelette", price: 4500,
    description: "Fluffy omelette with cheese, peppers and onion, served with toast and fruit.",
    ingredients: ["Eggs", "Cheese", "Peppers", "Onion", "Toast"],
    allergens: ["Eggs", "Dairy", "Gluten"], is_vegetarian: true, prep_time_min: 12,
    portion_info: "Three eggs", calories: 520,
    rating_avg: 4.5, rating_count: 58, times_ordered: 260,
  }),
  makeItem({
    cat: "cat-breakfast", name: "Fruit & Yogurt Bowl", price: 4000,
    description: "Inyange yogurt crowned with banana, passion fruit, mango and toasted oats.",
    ingredients: ["Yogurt", "Banana", "Passion fruit", "Mango", "Oats"],
    allergens: ["Dairy"], is_vegetarian: true, prep_time_min: 8,
    portion_info: "One bowl", calories: 320,
    rating_avg: 4.7, rating_count: 44, times_ordered: 190,
  }),

  makeItem({
    cat: "cat-veg", name: "Vegetable Curry with Rice", price: 7000,
    description: "Seasonal vegetables in aromatic curry sauce with coconut milk and basmati rice.",
    ingredients: ["Seasonal vegetables", "Coconut milk", "Curry spices", "Rice"],
    allergens: [], is_vegan: true, is_vegetarian: true, prep_time_min: 20, spicy_level: 1,
    portion_info: "Serves one", calories: 540,
    rating_avg: 4.6, rating_count: 52, times_ordered: 230,
  }),
  makeItem({
    cat: "cat-veg", name: "Vegan Isombe", price: 6000,
    description: "Classic cassava leaves and groundnut sauce, fully plant-based, with matoke.",
    ingredients: ["Cassava leaves", "Groundnut paste", "Matoke"],
    allergens: ["Peanuts"], is_vegan: true, is_vegetarian: true, prep_time_min: 18,
    portion_info: "Serves one", calories: 480,
    rating_avg: 4.7, rating_count: 39, times_ordered: 170,
  }),
  makeItem({
    cat: "cat-veg", name: "Grilled Veggie Skewers", price: 5500,
    description: "Charcoal-kissed skewers of bell pepper, zucchini, mushroom and red onion over herbed couscous.",
    ingredients: ["Bell peppers", "Zucchini", "Mushrooms", "Red onion", "Couscous"],
    allergens: ["Gluten"], is_vegan: true, is_vegetarian: true, prep_time_min: 20,
    portion_info: "Two skewers", calories: 420,
    rating_avg: 4.5, rating_count: 31, times_ordered: 140,
  }),
  makeItem({
    cat: "cat-veg", name: "Dodo & Plantain Plate", price: 5000,
    description: "Amaranth greens sautéed with garlic and sweet fried plantains, with groundnut sprinkle.",
    ingredients: ["Dodo greens", "Plantain", "Garlic", "Groundnuts"],
    allergens: ["Peanuts"], is_vegan: true, is_vegetarian: true, prep_time_min: 15,
    portion_info: "Serves one", calories: 450,
    rating_avg: 4.4, rating_count: 27, times_ordered: 120,
  }),

  makeItem({
    cat: "cat-snacks", name: "Beef Sambusa (3 pcs)", price: 1800,
    description: "Crisp pastry triangles stuffed with spiced minced beef. Dangerously poppable.",
    ingredients: ["Wheat pastry", "Minced beef", "Onions", "Spices"],
    allergens: ["Gluten"], popular: true, spicy_level: 1, prep_time_min: 10,
    portion_info: "Three pieces", calories: 350,
    rating_avg: 4.8, rating_count: 189, times_ordered: 1120,
  }),
  makeItem({
    cat: "cat-snacks", name: "Chips Mayai", price: 3500,
    description: "Rwanda's legendary chip omelette with kachumbari salsa and a squeeze of lime.",
    ingredients: ["Potato chips", "Eggs", "Tomato", "Onion", "Lime"],
    allergens: ["Eggs"], is_vegetarian: true, prep_time_min: 14,
    portion_info: "One pan-sized portion", calories: 640,
    rating_avg: 4.7, rating_count: 134, times_ordered: 780,
  }),
  makeItem({
    cat: "cat-snacks", name: "Mandazi (4 pcs)", price: 1500,
    description: "Golden cardamom doughnuts, fried fresh every few hours.",
    ingredients: ["Flour", "Cardamom", "Sugar"],
    allergens: ["Gluten"], is_vegetarian: true, prep_time_min: 8,
    portion_info: "Four pieces", calories: 420,
    rating_avg: 4.6, rating_count: 66, times_ordered: 400,
  }),
  makeItem({
    cat: "cat-snacks", name: "Loaded Luwombo Fries", price: 4500,
    description: "Crispy fries loaded with cheese sauce, grilled goat strips and jalapeños.",
    ingredients: ["Potatoes", "Cheese sauce", "Goat strips", "Jalapeños"],
    allergens: ["Dairy"], spicy_level: 1, prep_time_min: 15,
    portion_info: "Sharing bowl", calories: 780,
    rating_avg: 4.7, rating_count: 83, times_ordered: 360,
  }),

  makeItem({
    cat: "cat-desserts", name: "Passion Fruit Cheesecake", price: 4500,
    description: "Creamy baked cheesecake on a biscuit base with Rwandan passion fruit coulis.",
    ingredients: ["Cream cheese", "Passion fruit", "Biscuit base"],
    allergens: ["Dairy", "Gluten", "Eggs"], is_vegetarian: true, featured: true, prep_time_min: 8,
    portion_info: "One slice", calories: 490,
    rating_avg: 4.9, rating_count: 97, times_ordered: 410,
  }),
  makeItem({
    cat: "cat-desserts", name: "Chocolate Lava Cake", price: 5000,
    description: "Warm dark chocolate cake with molten center and vanilla ice cream.",
    ingredients: ["Dark chocolate", "Eggs", "Butter", "Vanilla ice cream"],
    allergens: ["Dairy", "Eggs", "Gluten"], is_vegetarian: true, prep_time_min: 14,
    portion_info: "One ramekin", calories: 560,
    rating_avg: 4.8, rating_count: 88, times_ordered: 370,
  }),
  makeItem({
    cat: "cat-desserts", name: "Banana Fritters with Honey", price: 3500,
    description: "Sweet banana fritters dusted with cinnamon sugar, drizzled with Rwandan honey.",
    ingredients: ["Banana", "Flour", "Cinnamon", "Honey"],
    allergens: ["Gluten"], is_vegetarian: true, prep_time_min: 12,
    portion_info: "Five fritters", calories: 430,
    rating_avg: 4.6, rating_count: 47, times_ordered: 210,
  }),

  makeItem({
    cat: "cat-juices", name: "Passion Fruit Juice", price: 2000,
    description: "Freshly pressed passion fruit, lightly sweetened. Tart, fragrant, perfect.",
    ingredients: ["Passion fruit", "Water", "Sugar"],
    allergens: [], is_vegan: true, is_vegetarian: true, prep_time_min: 5, popular: true,
    portion_info: "500ml", calories: 160,
    rating_avg: 4.9, rating_count: 201, times_ordered: 1310,
  }),
  makeItem({
    cat: "cat-juices", name: "Avocado Smoothie", price: 2500,
    description: "Velvety avocado blended with milk and a touch of honey.",
    ingredients: ["Avocado", "Milk", "Honey"],
    allergens: ["Dairy"], is_vegetarian: true, prep_time_min: 6,
    portion_info: "400ml", calories: 290,
    rating_avg: 4.8, rating_count: 122, times_ordered: 640,
  }),
  makeItem({
    cat: "cat-juices", name: "Pineapple Ginger Cooler", price: 2000,
    description: "Pineapple pressed with fresh root ginger over ice. Zingy refreshment.",
    ingredients: ["Pineapple", "Ginger", "Ice"],
    allergens: [], is_vegan: true, is_vegetarian: true, prep_time_min: 5, spicy_level: 1,
    portion_info: "500ml", calories: 150,
    rating_avg: 4.7, rating_count: 95, times_ordered: 520,
  }),
  makeItem({
    cat: "cat-juices", name: "Tree Tomato Juice (Ibinyombo)", price: 2200,
    description: "The beloved Rwandan tree tomato, blended smooth and lightly sweetened.",
    ingredients: ["Tree tomato", "Water", "Sugar"],
    allergens: [], is_vegan: true, is_vegetarian: true, prep_time_min: 6,
    portion_info: "500ml", calories: 170,
    rating_avg: 4.6, rating_count: 73, times_ordered: 380,
  }),

  makeItem({
    cat: "cat-drinks", name: "Mutzig Beer", price: 2500,
    description: "Ice-cold Rwandan lager, 330ml bottle.",
    ingredients: ["Water", "Barley malt", "Hops"],
    allergens: ["Gluten"], is_vegetarian: true, prep_time_min: 2,
    portion_info: "330ml bottle", calories: 140,
    rating_avg: 4.7, rating_count: 158, times_ordered: 940,
  }),
  makeItem({
    cat: "cat-drinks", name: "Primus Beer", price: 2000,
    description: "The classic Rwandan beer, best shared over brochettes.",
    ingredients: ["Water", "Maize", "Hops"],
    allergens: ["Gluten"], is_vegetarian: true, prep_time_min: 2, popular: true,
    portion_info: "500ml bottle (shared)", calories: 180,
    rating_avg: 4.6, rating_count: 176, times_ordered: 1010,
  }),
  makeItem({
    cat: "cat-drinks", name: "Ikivuguto (Fermented Milk)", price: 1200,
    description: "Traditional fermented milk from Inyange — tangy, thick and refreshing.",
    ingredients: ["Fermented cow milk"],
    allergens: ["Dairy"], is_vegetarian: true, prep_time_min: 2,
    portion_info: "500ml", calories: 210,
    rating_avg: 4.5, rating_count: 61, times_ordered: 280,
  }),
  makeItem({
    cat: "cat-drinks", name: "Sparkling Water", price: 800,
    description: "Chilled Rwandan sparkling water, 500ml.",
    ingredients: ["Carbonated water"],
    allergens: [], is_vegan: true, is_vegetarian: true, prep_time_min: 1,
    portion_info: "500ml bottle", calories: 0,
    rating_avg: 4.4, rating_count: 38, times_ordered: 240,
  }),

  makeItem({
    cat: "cat-coffee", name: "Rwandan Arabica Coffee", price: 2000,
    description: "Single-origin arabica from Nyamasheke hills, brewed pour-over style.",
    ingredients: ["Arabica beans", "Water"],
    allergens: [], is_vegan: true, is_vegetarian: true, prep_time_min: 6, popular: true,
    portion_info: "250ml cup", calories: 5,
    rating_avg: 4.9, rating_count: 143, times_ordered: 830,
  }),
  makeItem({
    cat: "cat-coffee", name: "Cappuccino", price: 2500,
    description: "Double espresso with velvety steamed milk and cocoa dust.",
    ingredients: ["Espresso", "Milk", "Cocoa"],
    allergens: ["Dairy"], is_vegetarian: true, prep_time_min: 5,
    portion_info: "220ml cup", calories: 120,
    rating_avg: 4.7, rating_count: 84, times_ordered: 460,
  }),
  makeItem({
    cat: "cat-coffee", name: "Ginger Tea (Tangawizi)", price: 1500,
    description: "Strong black tea infused with fiery fresh ginger and lemon.",
    ingredients: ["Black tea", "Ginger", "Lemon"],
    allergens: [], is_vegan: true, is_vegetarian: true, prep_time_min: 7, spicy_level: 1,
    portion_info: "400ml pot", calories: 30,
    rating_avg: 4.8, rating_count: 92, times_ordered: 510,
  }),

  makeItem({
    cat: "cat-specials", name: "Royal Luwombo Feast for Two", price: 25000,
    description: "Chef Emmanuel's grand tasting: mini chicken and fish luwombo, brochettes, matoke, isombe, chapati and two juices.",
    ingredients: ["Chicken", "Tilapia", "Goat", "Matoke", "Cassava leaves", "Chapati"],
    allergens: ["Peanuts", "Fish", "Gluten"], prep_time_min: 45, featured: true,
    portion_info: "Serves two", calories: 1850,
    rating_avg: 5.0, rating_count: 42, times_ordered: 150,
  }),
  makeItem({
    cat: "cat-specials", name: "Kigali Sunset Grill", price: 18000,
    description: "Evening-only platter: whole grilled tilapia, akabenz bites, plantain and terrace sundowner juice.",
    ingredients: ["Tilapia", "Pork belly", "Plantain", "Seasonal juice"],
    allergens: ["Fish"], prep_time_min: 40,
    portion_info: "Serves two", calories: 1420,
    rating_avg: 4.8, rating_count: 36, times_ordered: 120,
  }),
];

export const TABLES: RestaurantTable[] = [
  { id: "tbl-1", label: "T1", area: "main_hall", seats: 4, qr_token: "t1-x7k2", active: true },
  { id: "tbl-2", label: "T2", area: "main_hall", seats: 4, qr_token: "t2-p9m4", active: true },
  { id: "tbl-3", label: "T3", area: "main_hall", seats: 6, qr_token: "t3-q2r8", active: true },
  { id: "tbl-4", label: "T4", area: "main_hall", seats: 4, qr_token: "t4-s5n1", active: true },
  { id: "tbl-5", label: "T5", area: "terrace", seats: 2, qr_token: "t5-v8w3", active: true },
  { id: "tbl-6", label: "T6", area: "terrace", seats: 4, qr_token: "t6-y4z6", active: true },
  { id: "tbl-7", label: "T7", area: "terrace", seats: 4, qr_token: "t7-a3b7", active: true },
  { id: "tbl-8", label: "T8", area: "garden", seats: 6, qr_token: "t8-c9d2", active: true },
  { id: "tbl-9", label: "T9", area: "garden", seats: 6, qr_token: "t9-e1f5", active: true },
  { id: "tbl-10", label: "Umurage Room", area: "private", seats: 12, qr_token: "t10-g6h4", active: true },
];

const demoCustomer: Profile = {
  id: "usr-chantal",
  full_name: "Chantal Uwase",
  email: "chantal@example.rw",
  phone: "+250 788 555 101",
  role: "customer",
  active: true,
  created_at: iso(60 * 24 * 200),
};

export const PROFILES: Profile[] = [
  demoCustomer,
  { id: "usr-superadmin", full_name: "Owner Root", email: "root@luwombo.rw", phone: "+250 788 000 000", role: "superadmin", active: true, created_at: iso(60 * 24 * 420) },
  { id: "usr-admin", full_name: "Aline Kayitesi", email: "admin@luwombo.rw", phone: "+250 788 000 001", role: "admin", active: true, created_at: iso(60 * 24 * 400) },
  { id: "usr-manager", full_name: "Jean-Paul Habimana", email: "manager@luwombo.rw", phone: "+250 788 000 002", role: "manager", active: true, created_at: iso(60 * 24 * 380) },
  { id: "usr-chef", full_name: "Emmanuel Nshimiyimana", email: "chef@luwombo.rw", phone: "+250 788 000 003", role: "kitchen", active: true, created_at: iso(60 * 24 * 350) },
  { id: "usr-waiter", full_name: "Sandrine Umutoni", email: "waiter@luwombo.rw", phone: "+250 788 000 004", role: "waiter", active: true, created_at: iso(60 * 24 * 300) },
  { id: "usr-cashier", full_name: "Yves Byiringiro", email: "cashier@luwombo.rw", phone: "+250 788 000 005", role: "cashier", active: true, created_at: iso(60 * 24 * 260) },
  { id: "usr-driver", full_name: "Fabrice Nsengimana", email: "driver@luwombo.rw", phone: "+250 788 000 006", role: "delivery", active: true, created_at: iso(60 * 24 * 220) },
  { id: "usr-jeanb", full_name: "Jean-Baptiste Mugisha", email: "jb.mugisha@example.rw", phone: "+250 788 555 102", role: "customer", active: true, created_at: iso(60 * 24 * 150) },
  { id: "usr-diane", full_name: "Diane Ingabire", email: "diane.i@example.rw", phone: "+250 788 555 103", role: "customer", active: true, created_at: iso(60 * 24 * 120) },
  { id: "usr-patrick", full_name: "Patrick Nkurunziza", email: "patrick.n@example.rw", phone: "+250 788 555 104", role: "customer", active: true, created_at: iso(60 * 24 * 90) },
  { id: "usr-claudine", full_name: "Claudine Mukamana", email: "claudine.m@example.rw", phone: "+250 788 555 105", role: "customer", active: true, created_at: iso(60 * 24 * 60) },
  { id: "usr-eric", full_name: "Eric Ndayisaba", email: "eric.nda@example.rw", phone: "+250 788 555 106", role: "customer", active: true, created_at: iso(60 * 24 * 30) },
];

export const ADDRESSES: DeliveryAddress[] = [
  { id: "adr-1", customer_id: "usr-chantal", label: "Home", address_line: "KG 11 Ave, House 24, near Kimihurura Roundabout", district: "Gasabo, Kigali", phone: "+250 788 555 101", is_default: true },
  { id: "adr-2", customer_id: "usr-chantal", label: "Office", address_line: "UTC Building, 3rd Floor, Union Trade Center", district: "Nyararugenge, Kigali", phone: "+250 788 555 101", is_default: false },
];

export const FAVORITES: Favorite[] = [
  { customer_id: "usr-chantal", menu_item_id: MENU_ITEMS[0].id },
  { customer_id: "usr-chantal", menu_item_id: MENU_ITEMS[8].id },
  { customer_id: "usr-chantal", menu_item_id: MENU_ITEMS.find((m) => m.name === "Passion Fruit Juice")!.id },
];

function buildOrder(
  seq: number,
  opts: {
    customer?: Profile;
    name?: string;
    phone?: string;
    email?: string;
    type: OrderType;
    status: Order["status"];
    payment_status: Order["payment_status"];
    payment_method?: PaymentMethod;
    minutesAgo: number;
    table_label?: string;
    delivery_address?: string;
    items: Array<[string, number]>;
    coupon_code?: string;
    discount?: number;
    special_instructions?: string;
  }
): Order {
  const lines: OrderItemLine[] = opts.items.map(([itemId, qty]) => {
    const mi = MENU_ITEMS.find((m) => m.id === itemId)!;
    return { menu_item_id: mi.id, name: mi.name, quantity: qty, unit_price: mi.price, options: [], special_instructions: undefined };
  });
  const subtotal = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0);
  const delivery_fee = opts.type === "delivery" ? SETTINGS.delivery_fee : 0;
  const discount = opts.discount ?? 0;
  const total = subtotal + delivery_fee - discount;
  const d = new Date(now - opts.minutesAgo * 60_000);
  return {
    id: `ord-${seq}`,
    order_number: `LRW-${String(seq).padStart(3, "0")}`,
    customer_id: opts.customer?.id,
    customer_name: opts.customer?.full_name ?? opts.name ?? "Walk-in guest",
    customer_phone: opts.customer?.phone ?? opts.phone ?? "-",
    customer_email: opts.customer?.email ?? opts.email,
    type: opts.type,
    table_label: opts.table_label,
    status: opts.status,
    payment_status: opts.payment_status,
    payment_method: opts.payment_method,
    items: lines,
    subtotal,
    delivery_fee,
    discount,
    tax: 0,
    total,
    coupon_code: opts.coupon_code,
    delivery_address: opts.delivery_address,
    special_instructions: opts.special_instructions,
    created_at: d.toISOString(),
    updated_at: d.toISOString(),
  };
}

export const ORDERS: Order[] = [
  buildOrder(14, { customer: demoCustomer, type: "delivery", status: "preparing", payment_status: "paid", payment_method: "mtn_momo", minutesAgo: 35, delivery_address: "KG 11 Ave, House 24, Kimihurura", items: [["mi-101", 2], [MENU_ITEMS.find((m) => m.slug === "passion-fruit-juice")!.id, 2]], special_instructions: "Please ring the gate bell twice." }),
  buildOrder(13, { name: "Table T6 guest", phone: "-", type: "dine_in", status: "received", payment_status: "pending", minutesAgo: 12, table_label: "T6", items: [[MENU_ITEMS.find((m) => m.name === "Goat Brochettes (x3)")!.id, 2], [MENU_ITEMS.find((m) => m.name === "Primus Beer")!.id, 2]] }),
  buildOrder(12, { customer: PROFILES[7], type: "takeaway", status: "ready", payment_status: "paid", payment_method: "airtel_money", minutesAgo: 48, items: [[MENU_ITEMS.find((m) => m.name === "Akabenz Special")!.id, 1], [MENU_ITEMS.find((m) => m.name === "Chips Mayai")!.id, 1]] }),
  buildOrder(11, { customer: PROFILES[8], type: "dine_in", status: "completed", payment_status: "paid", payment_method: "card", minutesAgo: 190, table_label: "T2", items: [[MENU_ITEMS.find((m) => m.name === "Royal Luwombo Feast for Two")!.id, 1]] }),
  buildOrder(10, { customer: PROFILES[9], type: "delivery", status: "out_for_delivery", payment_status: "paid", payment_method: "mtn_momo", minutesAgo: 75, delivery_address: "Plot 17, Nyarutarama", items: [[MENU_ITEMS.find((m) => m.name === "Chicken Curry with Rice")!.id, 1], [MENU_ITEMS.find((m) => m.name === "Avocado Smoothie")!.id, 1]] }),
  buildOrder(9, { customer: PROFILES[10], type: "takeaway", status: "completed", payment_status: "paid", payment_method: "cash_on_delivery", minutesAgo: 260, items: [[MENU_ITEMS.find((m) => m.name === "Beef Sambusa (3 pcs)")!.id, 3], [MENU_ITEMS.find((m) => m.name === "Ginger Tea (Tangawizi)")!.id, 2]] }),
  buildOrder(8, { name: "Conference lunch", phone: "+250 788 777 212", email: "events@kgltech.rw", type: "delivery", status: "completed", payment_status: "paid", payment_method: "card", minutesAgo: 320, delivery_address: "Kigali Tech Hub, Remera", items: [[MENU_ITEMS.find((m) => m.name === "Grilled Chicken Quarter")!.id, 6], [MENU_ITEMS.find((m) => m.slug === "sparkling-water")!.id, 6]], discount: 5000, coupon_code: "TEAMLUNCH" }),
  buildOrder(7, { customer: PROFILES[11], type: "dine_in", status: "cancelled", payment_status: "refunded", payment_method: "mtn_momo", minutesAgo: 380, table_label: "T8", items: [[MENU_ITEMS.find((m) => m.name === "Whole Grilled Tilapia")!.id, 1]] }),
  buildOrder(6, { customer: demoCustomer, type: "dine_in", status: "completed", payment_status: "paid", payment_method: "mtn_momo", minutesAgo: 60 * 28, table_label: "T5", items: [[MENU_ITEMS.find((m) => m.name === "Chicken Luwombo")!.id, 1], [MENU_ITEMS.find((m) => m.name === "Rwandan Arabica Coffee")!.id, 1]] }),
  buildOrder(5, { customer: PROFILES[7], type: "takeaway", status: "completed", payment_status: "paid", payment_method: "airtel_money", minutesAgo: 60 * 30, items: [[MENU_ITEMS.find((m) => m.name === "Mixed Grill Platter")!.id, 1]] }),
  buildOrder(4, { customer: PROFILES[8], type: "delivery", status: "completed", payment_status: "paid", payment_method: "mtn_momo", minutesAgo: 60 * 52, delivery_address: "KN 4 Ave, Kiyovu", items: [[MENU_ITEMS.find((m) => m.name === "Isombe with Smoked Fish")!.id, 2]] }),
  buildOrder(3, { customer: PROFILES[9], type: "dine_in", status: "completed", payment_status: "paid", payment_method: "card", minutesAgo: 60 * 54, table_label: "T3", items: [[MENU_ITEMS.find((m) => m.name === "Signature Luwombo Platter")!.id, 1], [MENU_ITEMS.find((m) => m.name === "Mutzig Beer")!.id, 1]] }),
  buildOrder(2, { customer: PROFILES[10], type: "delivery", status: "completed", payment_status: "paid", payment_method: "mtn_momo", minutesAgo: 60 * 76, delivery_address: "KG 549 St, Kacyiru", items: [[MENU_ITEMS.find((m) => m.name === "Agatogo with Beef")!.id, 1], [MENU_ITEMS.find((m) => m.name === "Tree Tomato Juice (Ibinyombo)")!.id, 1]] }),
  buildOrder(1, { customer: PROFILES[11], type: "takeaway", status: "completed", payment_status: "paid", payment_method: "cash_on_delivery", minutesAgo: 60 * 100, items: [[MENU_ITEMS.find((m) => m.name === "Goat Brochettes (x3)")!.id, 4], [MENU_ITEMS.find((m) => m.name === "Primus Beer")!.id, 4]] }),
];

export const RESERVATIONS: Reservation[] = [
  { id: "res-1", reservation_number: "RES-4821", customer_id: "usr-chantal", customer_name: "Chantal Uwase", customer_phone: "+250 788 555 101", customer_email: "chantal@example.rw", date: dateOnly(0), time_slot: "19:00", party_size: 4, area: "terrace", occasion: "Family dinner", special_requests: "High chair for a toddler please.", status: "confirmed", created_at: iso(60 * 26) },
  { id: "res-2", reservation_number: "RES-4822", customer_id: "usr-jeanb", customer_name: "Jean-Baptiste Mugisha", customer_phone: "+250 788 555 102", customer_email: "jb.mugisha@example.rw", date: dateOnly(0), time_slot: "20:00", party_size: 2, area: "garden", occasion: "Date night", status: "confirmed", created_at: iso(60 * 20) },
  { id: "res-3", reservation_number: "RES-4825", customer_id: "usr-diane", customer_name: "Diane Ingabire", customer_phone: "+250 788 555 103", customer_email: "diane.i@example.rw", date: dateOnly(1), time_slot: "13:00", party_size: 6, area: "private", occasion: "Business lunch", special_requests: "Projector available? We can bring ours.", status: "pending", created_at: iso(60 * 8) },
  { id: "res-4", reservation_number: "RES-4827", customer_id: "usr-claudine", customer_name: "Claudine Mukamana", customer_phone: "+250 788 555 105", customer_email: "claudine.m@example.rw", date: dateOnly(2), time_slot: "19:30", party_size: 8, area: "main_hall", occasion: "Birthday", special_requests: "Surprise cake at 21:00!", status: "confirmed", created_at: iso(60 * 5) },
  { id: "res-5", reservation_number: "RES-4790", customer_id: "usr-patrick", customer_name: "Patrick Nkurunziza", customer_phone: "+250 788 555 104", customer_email: "patrick.n@example.rw", date: dateOnly(-3), time_slot: "12:30", party_size: 3, area: "main_hall", status: "completed", created_at: iso(60 * 24 * 6) },
];

export const REVIEWS: Review[] = [
  { id: "rev-1", menu_item_id: MENU_ITEMS[0].id, order_id: "ord-6", customer_name: "Chantal Uwase", rating: 5, food_rating: 5, service_rating: 5, delivery_rating: 4, comment: "The chicken luwombo tastes exactly like my grandmother's from Rubavu. Banana leaves still fragrant, chicken falling off the bone. This is home.", response: "Murakoze cyane Chantal! Grandmother-approved is the highest compliment we have. See you soon!", hidden: false, featured: true, created_at: iso(60 * 27) },
  { id: "rev-2", menu_item_id: MENU_ITEMS.find((m) => m.name === "Goat Brochettes (x3)")!.id, order_id: "ord-1", customer_name: "Eric Ndayisaba", rating: 5, food_rating: 5, service_rating: 4, comment: "Best brochettes in Kimihurura, no debate. Ask for extra chili salt.", hidden: false, featured: true, created_at: iso(60 * 99) },
  { id: "rev-3", menu_item_id: MENU_ITEMS.find((m) => m.name === "Passion Fruit Cheesecake")!.id, customer_name: "Diane Ingabire", rating: 5, food_rating: 5, service_rating: 5, delivery_rating: 5, comment: "Ordered the cheesecake for my sister's graduation lunch. Everyone asked where it was from. Fresh passion fruit makes all the difference.", hidden: false, featured: true, created_at: iso(60 * 50) },
  { id: "rev-4", menu_item_id: MENU_ITEMS.find((m) => m.name === "Whole Grilled Tilapia")!.id, customer_name: "Jean-Baptiste Mugisha", rating: 4, food_rating: 5, service_rating: 4, comment: "Fish was perfectly grilled and huge. Waited a bit longer than expected but the waiter kept us updated. Worth it.", hidden: false, featured: false, created_at: iso(60 * 72) },
  { id: "rev-5", menu_item_id: MENU_ITEMS.find((m) => m.name === "Vegan Isombe")!.id, customer_name: "Alice Mukandayisenga", rating: 5, food_rating: 5, service_rating: 5, comment: "Finally a place where my vegan diet doesn't mean eating sad salad. The vegan isombe is rich and satisfying.", hidden: false, featured: false, created_at: iso(60 * 96) },
  { id: "rev-6", menu_item_id: MENU_ITEMS.find((m) => m.name === "Peri Peri Chicken")!.id, customer_name: "Patrick Nkurunziza", rating: 4, food_rating: 4, service_rating: 4, delivery_rating: 5, comment: "Properly spicy! Delivery arrived hot and before the estimated time.", hidden: false, featured: false, created_at: iso(60 * 120) },
  { id: "rev-7", menu_item_id: MENU_ITEMS.find((m) => m.name === "Royal Luwombo Feast for Two")!.id, order_id: "ord-11", customer_name: "Claudine Mukamana", rating: 5, food_rating: 5, service_rating: 5, comment: "Booked the Umurage Room for our anniversary dinner. The staff surprised us with dessert. Beautiful evening.", response: "Happy anniversary from all of us, Claudine!", hidden: false, featured: true, created_at: iso(60 * 3) },
  { id: "rev-8", menu_item_id: MENU_ITEMS.find((m) => m.name === "Chips Mayai")!.id, customer_name: "Olivier Kaneza", rating: 4, food_rating: 4, service_rating: 5, comment: "Solid chips mayai and quick service during lunch rush. Good kachumbari too.", hidden: false, featured: false, created_at: iso(60 * 144) },
];

export const COUPONS: Coupon[] = [
  { id: "cpn-1", code: "WELCOME10", type: "percentage", value: 10, min_order: 5000, max_uses: 1000, used_count: 342, starts_at: at(-30, 0), ends_at: at(60, 0), active: true },
  { id: "cpn-2", code: "LUNCH2000", type: "fixed", value: 2000, min_order: 10000, max_uses: 500, used_count: 128, starts_at: at(-14, 0), ends_at: at(16, 0), active: true },
  { id: "cpn-3", code: "TEAMLUNCH", type: "fixed", value: 5000, min_order: 30000, max_uses: 200, used_count: 41, starts_at: at(-7, 0), ends_at: at(23, 0), active: true },
  { id: "cpn-4", code: "UMUGANDA15", type: "percentage", value: 15, min_order: 15000, max_uses: 300, used_count: 87, starts_at: at(-60, 0), ends_at: at(-2, 0), active: false },
];

export const PROMOTIONS: Promotion[] = [
  { id: "promo-1", title: "First Order Treat", description: "New here? Get 10% off your first order with code WELCOME10.", badge: "New customers", type: "first_order", active: true, starts_at: at(-30, 0), ends_at: at(60, 0) },
  { id: "promo-2", title: "Terrace Happy Hour", description: "Every Friday 5–7 PM: two Mutzig for the price of one on the terrace.", badge: "Fri 5–7 PM", type: "happy_hour", active: true, starts_at: at(-10, 0), ends_at: at(50, 0) },
  { id: "promo-3", title: "Birthday at Luwombo", description: "Celebrate your birthday with us and dessert is on the house.", badge: "All year", type: "birthday", active: true, starts_at: at(-90, 0), ends_at: at(275, 0) },
];

export const INVENTORY: InventoryItem[] = [
  { id: "inv-1", name: "Banana leaves", unit: "bundle", current_stock: 8, min_stock: 10, supplier: "Kayonza Farmers Coop", cost_per_unit: 500, updated_at: iso(60 * 5) },
  { id: "inv-2", name: "Free-range chicken", unit: "kg", current_stock: 24, min_stock: 12, supplier: "Nyamata Poultry Farm", cost_per_unit: 4200, updated_at: iso(60 * 30) },
  { id: "inv-3", name: "Beef chuck", unit: "kg", current_stock: 31, min_stock: 15, supplier: "Kigali Meat Packers", cost_per_unit: 5800, updated_at: iso(60 * 30) },
  { id: "inv-4", name: "Goat meat", unit: "kg", current_stock: 18, min_stock: 10, supplier: "Nyagatare Livestock", cost_per_unit: 6500, updated_at: iso(60 * 26) },
  { id: "inv-5", name: "Nile tilapia", unit: "kg", current_stock: 14, min_stock: 8, supplier: "Lake Kivu Fisheries", cost_per_unit: 7200, updated_at: iso(60 * 48) },
  { id: "inv-6", name: "Cassava leaves", unit: "basket", current_stock: 6, min_stock: 4, supplier: "Bugesera Greens", cost_per_unit: 1500, updated_at: iso(60 * 20) },
  { id: "inv-7", name: "Groundnut paste", unit: "kg", current_stock: 5, min_stock: 8, supplier: "Muhanga Mills", cost_per_unit: 3900, updated_at: iso(60 * 50) },
  { id: "inv-8", name: "Green bananas (matoke)", unit: "kg", current_stock: 45, min_stock: 20, supplier: "Rulindo Growers", cost_per_unit: 700, updated_at: iso(60 * 12) },
  { id: "inv-9", name: "Passion fruit", unit: "kg", current_stock: 9, min_stock: 12, supplier: "Musanze Orchards", cost_per_unit: 1800, updated_at: iso(60 * 40) },
  { id: "inv-10", name: "Avocado", unit: "kg", current_stock: 22, min_stock: 10, supplier: "Huye Hills Farms", cost_per_unit: 1200, updated_at: iso(60 * 34) },
  { id: "inv-11", name: "Cooking oil", unit: "litre", current_stock: 40, min_stock: 20, supplier: "Kigali Wholesale Ltd", cost_per_unit: 2600, updated_at: iso(60 * 70) },
  { id: "inv-12", name: "Arabica coffee beans", unit: "kg", current_stock: 11, min_stock: 5, supplier: "Nyamasheke Coffee Washing Station", cost_per_unit: 8500, updated_at: iso(60 * 90) },
  { id: "inv-13", name: "Wheat flour", unit: "kg", current_stock: 33, min_stock: 15, supplier: "Minimex Rwanda", cost_per_unit: 1100, updated_at: iso(60 * 80) },
  { id: "inv-14", name: "Fresh milk", unit: "litre", current_stock: 26, min_stock: 15, supplier: "Inyange Industries", cost_per_unit: 900, updated_at: iso(60 * 16) },
];

export const STOCK_MOVEMENTS: StockMovement[] = [
  { id: "mov-1", inventory_item_id: "inv-1", item_name: "Banana leaves", type: "out", quantity: 12, note: "Weekend luwombo service", created_by: "Emmanuel Nshimiyimana", created_at: iso(60 * 6) },
  { id: "mov-2", inventory_item_id: "inv-7", item_name: "Groundnut paste", type: "out", quantity: 6, note: "Isombe prep batch", created_by: "Emmanuel Nshimiyimana", created_at: iso(60 * 50) },
  { id: "mov-3", inventory_item_id: "inv-2", item_name: "Free-range chicken", type: "in", quantity: 30, note: "Weekly delivery", created_by: "Aline Kayitesi", created_at: iso(60 * 30) },
  { id: "mov-4", inventory_item_id: "inv-9", item_name: "Passion fruit", type: "in", quantity: 15, note: "Juice restock", created_by: "Aline Kayitesi", created_at: iso(60 * 40) },
  { id: "mov-5", inventory_item_id: "inv-4", item_name: "Goat meat", type: "adjustment", quantity: -2, note: "Trim loss correction", created_by: "Jean-Paul Habimana", created_at: iso(60 * 26) },
];

export const NOTIFICATIONS: AppNotification[] = [
  { id: "ntf-1", target: "admin", title: "New order LRW-014", body: "Chantal Uwase placed a delivery order of 12,000 RWF.", kind: "order", read: false, link: "/admin/orders", created_at: iso(35) },
  { id: "ntf-2", target: "admin", title: "Low stock alert", body: "Groundnut paste is below minimum (5 kg left). Supplier: Muhanga Mills.", kind: "inventory", read: false, link: "/admin/inventory", created_at: iso(50) },
  { id: "ntf-3", target: "admin", title: "New 5-star review", body: "Claudine M. reviewed Royal Luwombo Feast for Two.", kind: "review", read: false, link: "/admin/reviews", created_at: iso(60 * 3) },
  { id: "ntf-4", target: "admin", title: "Reservation request", body: "Diane Ingabire requested the private room for 6 tomorrow 13:00.", kind: "reservation", read: true, link: "/admin/reservations", created_at: iso(60 * 8) },
  { id: "ntf-5", target: "admin", title: "Table request", body: "Table T6 is asking for the bill.", kind: "table_request", read: false, link: "/admin/orders", created_at: iso(9) },
  { id: "ntf-6", target: "customer", user_id: "usr-chantal", title: "Your order is being prepared", body: "LRW-014 is in the kitchen. Estimated ready in 20 minutes.", kind: "order", read: false, link: "/account/orders", created_at: iso(30) },
  { id: "ntf-7", target: "customer", user_id: "usr-chantal", title: "Reservation confirmed", body: "Your table for 4 tonight at 19:00 (Terrace) is confirmed. RES-4821.", kind: "reservation", read: true, link: "/account/reservations", created_at: iso(60 * 25) },
  { id: "ntf-8", target: "customer", user_id: "usr-chantal", title: "Friday Happy Hour", body: "Two Mutzig for the price of one, every Friday 5–7 PM on the terrace.", kind: "promo", read: false, link: "/menu", created_at: iso(60 * 40) },
];

export const AUDIT_LOGS: AuditLog[] = [
  { id: "log-1", actor: "Aline Kayitesi", action: "Updated price", entity: "MenuItem", entity_id: MENU_ITEMS[0].name, details: "Price changed from 9,000 to 9,500 RWF", created_at: iso(60 * 29) },
  { id: "log-2", actor: "Jean-Paul Habimana", action: "Confirmed reservation", entity: "Reservation", entity_id: "RES-4825", details: "Private room, party of 6", created_at: iso(60 * 7) },
  { id: "log-3", actor: "Yves Byiringiro", action: "Marked paid", entity: "Order", entity_id: "LRW-012", details: "Airtel Money confirmed", created_at: iso(46) },
  { id: "log-4", actor: "Aline Kayitesi", action: "Created coupon", entity: "Coupon", entity_id: "TEAMLUNCH", details: "Fixed 5,000 RWF off orders above 30,000 RWF", created_at: iso(60 * 24 * 7) },
];

export const CONTACT_MESSAGES: ContactMessage[] = [
  { id: "msg-1", name: "Sandrine Mukamana", email: "sandrine.m@example.rw", phone: "+250 788 999 111", subject: "Wedding catering inquiry", message: "Hello, we are planning a wedding of about 150 guests in December. Do you offer traditional luwombo catering? Please send packages and prices.", handled: false, created_at: iso(60 * 10) },
  { id: "msg-2", name: "David Kagabo", email: "david.k@example.rw", phone: "+250 788 999 222", subject: "Lost item", message: "I left a blue jacket on the terrace yesterday evening around 9 PM. Table T7. Thank you!", handled: true, created_at: iso(60 * 30) },
];

export const FAQS: FaqItem[] = [
  { id: "faq-1", question: "What are your opening hours?", answer: "Monday to Thursday 7:00–22:30, Friday 7:00–23:30, Saturday 8:00–23:30 and Sunday 8:00–22:00. The kitchen takes last orders 45 minutes before closing.", visible: true },
  { id: "faq-2", question: "Do you deliver in Kigali?", answer: "Yes! We deliver to Kimihurura, Kiyovu, Nyarutarama, Remera, City Center, Kacyiru and Gacuriro. Delivery is 1,500 RWF and usually takes 30–45 minutes.", visible: true },
  { id: "faq-3", question: "How do I reserve a table?", answer: "Use the Reserve a Table page — pick your date, time and party size. You will get an instant confirmation number. You can also call us at +250 788 123 456.", visible: true },
  { id: "faq-4", question: "Which payments do you accept?", answer: "MTN Mobile Money, Airtel Money, Visa/Mastercard and cash. Online orders pay via mobile money or card; dine-in guests can also pay at the counter.", visible: true },
  { id: "faq-5", question: "Can I cancel or modify my reservation?", answer: "Yes, free of charge up to 2 hours before your reservation time from your account page, or by calling us. For parties larger than 8 we ask for 24 hours notice.", visible: true },
  { id: "faq-6", question: "Do you cater for allergies?", answer: "Every dish lists its ingredients and allergens. Our kitchen handles peanuts, gluten, dairy and fish, so please tell your server or add a note to your order and we will adapt what we safely can.", visible: true },
  { id: "faq-7", question: "How does table QR ordering work?", answer: "Scan the QR code on your table, browse the menu and order without waiting for a server. You can also call a waiter or request your bill from the same page.", visible: true },
  { id: "faq-8", question: "How do I track my order?", answer: "After checkout you get an order number. Open Track My Order or check My Orders in your account — you'll see live status updates from the kitchen to your door.", visible: true },
];

export const GALLERY: GalleryPhoto[] = [
  { id: "ph-1", title: "Chicken Luwombo, unwrapped at the table", group: "food", gradient: ["#B45309", "#78350F"], icon: "soup" },
  { id: "ph-2", title: "Charcoal brochettes at dusk", group: "food", gradient: ["#92400E", "#451A03"], icon: "flame" },
  { id: "ph-3", title: "Fresh passion fruit juice press", group: "food", gradient: ["#CA8A04", "#713F12"], icon: "citrus" },
  { id: "ph-4", title: "The terrace at golden hour", group: "interior", gradient: ["#EA580C", "#7C2D12"], icon: "sun" },
  { id: "ph-5", title: "Main hall, woven ceiling detail", group: "interior", gradient: ["#166534", "#14532D"], icon: "home" },
  { id: "ph-6", title: "Umurage private room", group: "interior", gradient: ["#7C3AED", "#3B0764"], icon: "lamp" },
  { id: "ph-7", title: "Kigali Restaurant Week pop-up", group: "events", gradient: ["#BE185D", "#500724"], icon: "partyPopper" },
  { id: "ph-8", title: "Sunday family buffet", group: "events", gradient: ["#0369A1", "#082F49"], icon: "users" },
  { id: "ph-9", title: "Chef Emmanuel plating the Feast", group: "team", gradient: ["#15803D", "#052E16"], icon: "chefHat" },
  { id: "ph-10", title: "Our waiters in the garden", group: "team", gradient: ["#65A30D", "#1A2E05"], icon: "handHeart" },
];
