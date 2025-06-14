export const CLOTHING_CATEGORIES = {
  TOPS: {
    name: 'Tops',
    subcategories: [
      { id: 'tshirt_short', name: 'T-Shirt (Short Sleeve)', gender: 'unisex' },
      { id: 'tshirt_long', name: 'T-Shirt (Long Sleeve)', gender: 'unisex' },
      { id: 'tank_top', name: 'Tank Top', gender: 'unisex' },
      { id: 'polo', name: 'Polo Shirt', gender: 'masculine' },
      { id: 'button_down', name: 'Button-Down Shirt', gender: 'unisex' },
      { id: 'dress_shirt', name: 'Dress Shirt', gender: 'masculine' },
      { id: 'blouse', name: 'Blouse', gender: 'feminine' },
      { id: 'crop_top', name: 'Crop Top', gender: 'feminine' },
      { id: 'turtleneck', name: 'Turtleneck', gender: 'unisex' },
      { id: 'sweater', name: 'Sweater', gender: 'unisex' },
      { id: 'cardigan', name: 'Cardigan', gender: 'feminine' },
      { id: 'hoodie', name: 'Hoodie', gender: 'unisex' },
      { id: 'sweatshirt', name: 'Sweatshirt', gender: 'unisex' },
      { id: 'vest', name: 'Vest', gender: 'masculine' },
      { id: 'tube_top', name: 'Tube Top', gender: 'feminine' },
      { id: 'camisole', name: 'Camisole', gender: 'feminine' },
      { id: 'bodysuit', name: 'Bodysuit', gender: 'feminine' },
      { id: 'tunic', name: 'Tunic', gender: 'feminine' }
    ]
  },
  BOTTOMS: {
    name: 'Bottoms',
    subcategories: [
      { id: 'jeans', name: 'Jeans', gender: 'unisex' },
      { id: 'dress_pants', name: 'Dress Pants', gender: 'masculine' },
      { id: 'chinos', name: 'Chinos', gender: 'masculine' },
      { id: 'khakis', name: 'Khakis', gender: 'masculine' },
      { id: 'cargo_pants', name: 'Cargo Pants', gender: 'masculine' },
      { id: 'leggings', name: 'Leggings', gender: 'feminine' },
      { id: 'sweatpants', name: 'Sweatpants/Joggers', gender: 'unisex' },
      { id: 'shorts', name: 'Shorts', gender: 'unisex' },
      { id: 'cargo_shorts', name: 'Cargo Shorts', gender: 'masculine' },
      { id: 'bermuda_shorts', name: 'Bermuda Shorts', gender: 'masculine' },
      { id: 'skirt_mini', name: 'Mini Skirt', gender: 'feminine' },
      { id: 'skirt_midi', name: 'Midi Skirt', gender: 'feminine' },
      { id: 'skirt_maxi', name: 'Maxi Skirt', gender: 'feminine' },
      { id: 'culottes', name: 'Culottes', gender: 'feminine' },
      { id: 'capris', name: 'Capris', gender: 'feminine' }
    ]
  },
  DRESSES: {
    name: 'Dresses & Jumpsuits',
    subcategories: [
      { id: 'dress_mini', name: 'Mini Dress', gender: 'feminine' },
      { id: 'dress_midi', name: 'Midi Dress', gender: 'feminine' },
      { id: 'dress_maxi', name: 'Maxi Dress', gender: 'feminine' },
      { id: 'sundress', name: 'Sundress', gender: 'feminine' },
      { id: 'cocktail_dress', name: 'Cocktail Dress', gender: 'feminine' },
      { id: 'evening_gown', name: 'Evening Gown', gender: 'feminine' },
      { id: 'shirt_dress', name: 'Shirt Dress', gender: 'feminine' },
      { id: 'wrap_dress', name: 'Wrap Dress', gender: 'feminine' },
      { id: 'jumpsuit', name: 'Jumpsuit', gender: 'feminine' },
      { id: 'romper', name: 'Romper', gender: 'feminine' },
      { id: 'overalls', name: 'Overalls', gender: 'unisex' }
    ]
  },
  OUTERWEAR: {
    name: 'Outerwear',
    subcategories: [
      { id: 'blazer', name: 'Blazer', gender: 'unisex' },
      { id: 'sport_coat', name: 'Sport Coat', gender: 'masculine' },
      { id: 'suit_jacket', name: 'Suit Jacket', gender: 'masculine' },
      { id: 'denim_jacket', name: 'Denim Jacket', gender: 'unisex' },
      { id: 'leather_jacket', name: 'Leather Jacket', gender: 'unisex' },
      { id: 'bomber_jacket', name: 'Bomber Jacket', gender: 'unisex' },
      { id: 'parka', name: 'Parka', gender: 'unisex' },
      { id: 'peacoat', name: 'Peacoat', gender: 'masculine' },
      { id: 'trench_coat', name: 'Trench Coat', gender: 'unisex' },
      { id: 'windbreaker', name: 'Windbreaker', gender: 'unisex' },
      { id: 'puffer_jacket', name: 'Puffer Jacket', gender: 'unisex' },
      { id: 'rain_jacket', name: 'Rain Jacket', gender: 'unisex' },
      { id: 'heavy_cardigan', name: 'Heavy Cardigan', gender: 'feminine' },
      { id: 'poncho', name: 'Poncho', gender: 'feminine' },
      { id: 'cape', name: 'Cape', gender: 'feminine' }
    ]
  },
  FORMAL: {
    name: 'Formal Wear',
    subcategories: [
      { id: 'full_suit', name: 'Full Suit', gender: 'masculine' },
      { id: 'tuxedo', name: 'Tuxedo', gender: 'masculine' },
      { id: 'formal_dress', name: 'Formal Dress', gender: 'feminine' },
      { id: 'formal_skirt', name: 'Formal Skirt', gender: 'feminine' },
      { id: 'formal_pants', name: 'Formal Pants', gender: 'masculine' },
      { id: 'formal_vest', name: 'Formal Vest', gender: 'masculine' }
    ]
  },
  ACTIVEWEAR: {
    name: 'Activewear',
    subcategories: [
      { id: 'athletic_tshirt', name: 'Athletic T-Shirt', gender: 'unisex' },
      { id: 'athletic_tank', name: 'Athletic Tank Top', gender: 'unisex' },
      { id: 'sports_bra', name: 'Sports Bra', gender: 'feminine' },
      { id: 'athletic_leggings', name: 'Athletic Leggings', gender: 'feminine' },
      { id: 'running_shorts', name: 'Running Shorts', gender: 'unisex' },
      { id: 'track_pants', name: 'Track Pants', gender: 'unisex' },
      { id: 'track_jacket', name: 'Track Jacket', gender: 'unisex' },
      { id: 'workout_dress', name: 'Workout Dress', gender: 'feminine' },
      { id: 'yoga_pants', name: 'Yoga Pants', gender: 'feminine' }
    ]
  },
  SWIMWEAR: {
    name: 'Swimwear',
    subcategories: [
      { id: 'one_piece', name: 'One-Piece Swimsuit', gender: 'feminine' },
      { id: 'bikini', name: 'Bikini', gender: 'feminine' },
      { id: 'swim_trunks', name: 'Swim Trunks', gender: 'masculine' },
      { id: 'board_shorts', name: 'Board Shorts', gender: 'masculine' },
      { id: 'rash_guard', name: 'Rash Guard', gender: 'unisex' },
      { id: 'cover_up', name: 'Cover-Up', gender: 'feminine' }
    ]
  }
};

// Helper function to get all categories
export const getAllCategories = () => {
  return Object.values(CLOTHING_CATEGORIES).map(category => ({
    name: category.name,
    subcategories: category.subcategories
  }));
};

// Helper function to get categories by gender
export const getCategoriesByGender = (gender) => {
  return Object.values(CLOTHING_CATEGORIES).map(category => ({
    name: category.name,
    subcategories: category.subcategories.filter(sub => 
      sub.gender === gender || sub.gender === 'unisex'
    )
  })).filter(category => category.subcategories.length > 0);
};

// Helper function to get a specific subcategory by ID
export const getSubcategoryById = (id) => {
  for (const category of Object.values(CLOTHING_CATEGORIES)) {
    const subcategory = category.subcategories.find(sub => sub.id === id);
    if (subcategory) return subcategory;
  }
  return null;
}; 