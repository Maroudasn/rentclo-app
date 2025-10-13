// Image helper utilities for better fallback images

// Unsplash collections for different clothing categories
const IMAGE_COLLECTIONS = {
  // Dresses
  dresses: {
    women: [
      'https://images.unsplash.com/photo-1566479179817-c0c93b067000?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1582142306909-195724d33c04?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&h=800&fit=crop&crop=center'
    ]
  },
  
  // Tops
  tops: {
    women: [
      'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&h=800&fit=crop&crop=center'
    ],
    men: [
      'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=800&fit=crop&crop=center'
    ],
    unisex: [
      'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=800&fit=crop&crop=center'
    ]
  },
  
  // Bottoms
  bottoms: {
    women: [
      'https://images.unsplash.com/photo-1541840031508-326b77c9a17e?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1506629905962-bb91217e9f39?w=600&h=800&fit=crop&crop=center'
    ],
    men: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=800&fit=crop&crop=center'
    ],
    unisex: [
      'https://images.unsplash.com/photo-1541840031508-326b77c9a17e?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=800&fit=crop&crop=center'
    ]
  },
  
  // Formal Wear
  'formal wear': {
    women: [
      'https://images.unsplash.com/photo-1566479179817-c0c93b067000?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1582142306909-195724d33c04?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&h=800&fit=crop&crop=center'
    ],
    men: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&crop=center'
    ],
    unisex: [
      'https://images.unsplash.com/photo-1566479179817-c0c93b067000?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop&crop=center'
    ]
  },
  
  // Casual Wear
  'casual wear': {
    women: [
      'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&h=800&fit=crop&crop=center'
    ],
    men: [
      'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&h=800&fit=crop&crop=center'
    ],
    unisex: [
      'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&h=800&fit=crop&crop=center'
    ]
  },
  
  // Outerwear
  outerwear: {
    women: [
      'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1592492135673-55966d3b541a?w=600&h=800&fit=crop&crop=center'
    ],
    men: [
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=800&fit=crop&crop=center'
    ],
    unisex: [
      'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=600&h=800&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=800&fit=crop&crop=center'
    ]
  },
  
  // Accessories
  accessories: {
    women: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=600&fit=crop&crop=center'
    ],
    men: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&h=600&fit=crop&crop=center'
    ],
    unisex: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=600&fit=crop&crop=center'
    ]
  },
  
  // Shoes
  shoes: {
    women: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&h=600&fit=crop&crop=center'
    ],
    men: [
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=600&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&h=600&fit=crop&crop=center'
    ],
    unisex: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&h=600&fit=crop&crop=center'
    ]
  }
};

// Enhanced fallback system with title-based selection
export const getRelevantFallbackImage = (item) => {
  const { category, gender, title = '', color = '', brand = '' } = item;
  
  // Normalize category name
  const normalizedCategory = category?.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  
  // Normalize gender
  const normalizedGender = gender?.toLowerCase() || 'unisex';
  
  // Get images for this category and gender
  const categoryImages = IMAGE_COLLECTIONS[normalizedCategory];
  if (!categoryImages) {
    return getGenericFallbackImage(normalizedCategory, normalizedGender);
  }
  
  const genderImages = categoryImages[normalizedGender] || categoryImages['unisex'] || categoryImages['women'];
  if (!genderImages || genderImages.length === 0) {
    return getGenericFallbackImage(normalizedCategory, normalizedGender);
  }
  
  // Use title/color/brand to create a consistent but varied selection
  const titleHash = generateSimpleHash(title + color + brand);
  const imageIndex = titleHash % genderImages.length;
  
  return genderImages[imageIndex];
};

// Generate a simple hash from string for consistent image selection
const generateSimpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Generic fallback for unknown categories
const getGenericFallbackImage = (category, gender) => {
  const genericImages = {
    women: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&h=800&fit=crop&crop=center',
    men: 'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=600&h=800&fit=crop&crop=center',
    unisex: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&h=800&fit=crop&crop=center'
  };
  
  return genericImages[gender] || genericImages.unisex;
};

// Get thumbnail version of image (smaller size for lists)
export const getThumbnailImage = (imageUrl) => {
  if (!imageUrl) return null;
  
  // If it's an Unsplash image, get smaller version
  if (imageUrl.includes('unsplash.com')) {
    return imageUrl.replace('w=600&h=800', 'w=300&h=400');
  }
  
  // For uploaded images, return as is (we could implement thumbnail generation later)
  return imageUrl;
};

// Helper to get images for an item with proper fallbacks
export const getItemImages = (item) => {
  // If item has uploaded images, use them
  if (item.images && item.images.length > 0) {
    return item.images.filter(img => img && img.trim() !== '');
  }
  
  // If item has a single image_url (from database)
  if (item.image_url && item.image_url.trim() !== '') {
    return [item.image_url];
  }
  
  // Otherwise, get a relevant fallback
  const fallbackImage = getRelevantFallbackImage(item);
  return [fallbackImage];
};

// Smart image error handling
export const handleImageError = (e, item) => {
  const fallbackImage = getRelevantFallbackImage(item);
  e.target.src = fallbackImage;
};

export default {
  getRelevantFallbackImage,
  getThumbnailImage,
  getItemImages,
  handleImageError
};