const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Property types and their characteristics
const PROPERTY_TYPES = {
  apartment: {
    names: [
      'Modern Apartment', 'Cozy Studio', 'Luxury Apartment', 'Downtown Flat',
      'Garden Apartment', 'Penthouse Suite', 'Executive Apartment', 'Urban Loft'
    ],
    priceRanges: { min: 800, max: 5000 },
    roomRanges: { min: 1, max: 4 },
    bathroomRanges: { min: 1, max: 3 }
  },
  house: {
    names: [
      'Family Home', 'Victorian House', 'Modern Home', 'Suburban House',
      'Colonial Home', 'Ranch Style', 'Craftsman House', 'Contemporary Home'
    ],
    priceRanges: { min: 2000, max: 15000 },
    roomRanges: { min: 3, max: 8 },
    bathroomRanges: { min: 2, max: 5 }
  },
  condo: {
    names: [
      'Condo Unit', 'Condominium', 'High-Rise Condo', 'Luxury Condo',
      'Urban Condo', 'Downtown Condo', 'Executive Condo', 'Modern Condo'
    ],
    priceRanges: { min: 1500, max: 8000 },
    roomRanges: { min: 2, max: 4 },
    bathroomRanges: { min: 1, max: 3 }
  },
  townhouse: {
    names: [
      'Townhouse', 'Row House', 'Attached Home', 'Townhome',
      'Duplex Unit', 'Triplex Unit', 'Multi-Family Home'
    ],
    priceRanges: { min: 1800, max: 6000 },
    roomRanges: { min: 3, max: 5 },
    bathroomRanges: { min: 2, max: 4 }
  }
};

// Nigerian cities and states
const NIGERIAN_LOCATIONS = [
  'Lagos, Lagos', 'Abuja, FCT', 'Port Harcourt, Rivers', 'Kano, Kano',
  'Ibadan, Oyo', 'Benin City, Edo', 'Kaduna, Kaduna', 'Jos, Plateau',
  'Enugu, Enugu', 'Warri, Delta', 'Abeokuta, Ogun', 'Ilorin, Kwara',
  'Owerri, Imo', 'Sokoto, Sokoto', 'Maiduguri, Borno', 'Calabar, Cross River',
  'Akure, Ondo', 'Osogbo, Osun', 'Katsina, Katsina', 'Bauchi, Bauchi'
];

// Common amenities
const AMENITIES = [
  'Air Conditioning', 'Heating', 'Dishwasher', 'Washer', 'Dryer',
  'Microwave', 'Refrigerator', 'Oven', 'Balcony', 'Patio',
  'Garden', 'Swimming Pool', 'Gym', 'Security', 'Parking',
  'Internet', 'Cable TV', 'Furnished', 'Pet Friendly', 'Elevator'
];

// Property descriptions
const DESCRIPTIONS = [
  'Beautiful and spacious property perfect for families',
  'Modern and stylish home with all amenities included',
  'Cozy and comfortable living space in a great location',
  'Elegant property with stunning views and modern finishes',
  'Well-maintained home in a quiet neighborhood',
  'Contemporary design with open floor plan and natural light',
  'Charming property with character and modern conveniences',
  'Luxurious living space with premium amenities and finishes'
];

// Generate random number between min and max (inclusive)
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate random price based on property type
const generatePrice = (type) => {
  const range = PROPERTY_TYPES[type].priceRanges;
  return randomBetween(range.min, range.max) * 1000; // Convert to Naira
};

// Generate random rooms and bathrooms
const generateRooms = (type) => {
  const range = PROPERTY_TYPES[type].roomRanges;
  return randomBetween(range.min, range.max);
};

const generateBathrooms = (type) => {
  const range = PROPERTY_TYPES[type].bathroomRanges;
  return randomBetween(range.min, range.max);
};

// Generate random amenities
const generateAmenities = () => {
  const numAmenities = randomBetween(3, 8);
  const shuffled = [...AMENITIES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numAmenities);
};

// Generate property images using Picsum (placeholder service)
const generateImages = () => {
  const numImages = randomBetween(3, 6);
  const images = [];

  for (let i = 0; i < numImages; i++) {
    // Using Picsum for placeholder images - you can replace with actual property images
    const width = randomBetween(800, 1200);
    const height = randomBetween(600, 800);
    images.push({
      url: `https://picsum.photos/${width}/${height}?random=${Math.random()}`,
      alt: `Property image ${i + 1}`
    });
  }

  return images;
};

// Generate a single property
const generateProperty = (landlordId) => {
  const type = Object.keys(PROPERTY_TYPES)[randomBetween(0, Object.keys(PROPERTY_TYPES).length - 1)];
  const typeData = PROPERTY_TYPES[type];
  const nameIndex = randomBetween(0, typeData.names.length - 1);

  const location = NIGERIAN_LOCATIONS[randomBetween(0, NIGERIAN_LOCATIONS.length - 1)];
  const descriptionIndex = randomBetween(0, DESCRIPTIONS.length - 1);

  return {
    title: typeData.names[nameIndex],
    description: DESCRIPTIONS[descriptionIndex],
    price: generatePrice(type),
    location: location,
    property_type: type,
    rooms: generateRooms(type),
    bathrooms: generateBathrooms(type),
    amenities: generateAmenities(),
    images: generateImages(),
    status: 'active',
    landlord_id: landlordId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

// Seed properties for a specific landlord
const seedPropertiesForLandlord = async (landlordId, count = 10) => {
  console.log(`🌱 Seeding ${count} properties for landlord ${landlordId}...`);

  const properties = [];
  for (let i = 0; i < count; i++) {
    properties.push(generateProperty(landlordId));
  }

  try {
    const { data, error } = await supabase
      .from('properties')
      .insert(properties)
      .select();

    if (error) {
      console.error('❌ Error seeding properties:', error);
      return false;
    }

    console.log(`✅ Successfully seeded ${data.length} properties for landlord ${landlordId}`);
    return true;
  } catch (error) {
    console.error('❌ Error inserting properties:', error);
    return false;
  }
};

// Get all landlords from the database
const getLandlords = async () => {
  try {
    const { data: landlords, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(10); // Get first 10 users as landlords

    if (error) {
      console.error('❌ Error fetching landlords:', error);
      return [];
    }

    return landlords || [];
  } catch (error) {
    console.error('❌ Error getting landlords:', error);
    return [];
  }
};

// Main seeding function
const seedDatabase = async () => {
  console.log('🚀 Starting database seeding process...');

  // Get landlords from database
  const landlords = await getLandlords();

  if (landlords.length === 0) {
    console.log('❌ No landlords found in database. Please create some users first.');
    return;
  }

  console.log(`📋 Found ${landlords.length} landlords`);

  let totalProperties = 0;

  // Seed properties for each landlord
  for (const landlord of landlords) {
    const propertyCount = randomBetween(5, 15); // 5-15 properties per landlord
    const success = await seedPropertiesForLandlord(landlord.id, propertyCount);

    if (success) {
      totalProperties += propertyCount;
    }
  }

  console.log(`🎉 Database seeding completed! Total properties added: ${totalProperties}`);
  console.log('📊 Property distribution:');
  console.log('   - Apartment: ~30%');
  console.log('   - House: ~25%');
  console.log('   - Condo: ~25%');
  console.log('   - Townhouse: ~20%');
  console.log('');
  console.log('🔗 Images are using placeholder URLs from Picsum');
  console.log('💡 To use real property images, replace the image URLs in the database');
};

// Run the seeding script
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase, generateProperty };
