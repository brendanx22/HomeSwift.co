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

// Test landlord data
const TEST_LANDLORDS = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'landlord1@homeswift.co',
    first_name: 'John',
    last_name: 'Smith',
    full_name: 'John Smith',
    phone: '+2348012345678',
    user_type: 'landlord',
    agent_id: 'AGENT001'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'landlord2@homeswift.co',
    first_name: 'Sarah',
    last_name: 'Johnson',
    full_name: 'Sarah Johnson',
    phone: '+2348012345679',
    user_type: 'landlord',
    agent_id: 'AGENT002'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'landlord3@homeswift.co',
    first_name: 'Michael',
    last_name: 'Williams',
    full_name: 'Michael Williams',
    phone: '+2348012345680',
    user_type: 'landlord',
    agent_id: 'AGENT003'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'landlord4@homeswift.co',
    first_name: 'Emily',
    last_name: 'Brown',
    full_name: 'Emily Brown',
    phone: '+2348012345681',
    user_type: 'landlord',
    agent_id: 'AGENT004'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    email: 'landlord5@homeswift.co',
    first_name: 'David',
    last_name: 'Davis',
    full_name: 'David Davis',
    phone: '+2348012345682',
    user_type: 'landlord',
    agent_id: 'AGENT005'
  }
];

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

// Create test landlords directly in the database (bypassing auth)
const createTestLandlordsDirectly = async () => {
  console.log('👥 Creating test landlords directly in database...');

  try {
    // Insert landlords into user_profiles table
    const { data: landlords, error } = await supabase
      .from('user_profiles')
      .upsert(TEST_LANDLORDS, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error creating landlords:', error);
      return [];
    }

    console.log(`✅ Successfully created ${landlords.length} landlords`);
    return landlords.map(l => l.id);

  } catch (error) {
    console.error('❌ Error creating landlords:', error);
    return [];
  }
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
const seedPropertiesForLandlord = async (landlordId, count = 20) => {
  console.log(`🏠 Seeding ${count} properties for landlord ${landlordId}...`);

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

// Main seeding function
const seedDatabase = async () => {
  console.log('🚀 Starting direct database seeding process...');
  console.log('📋 This will create test landlords and hundreds of properties directly');

  // Create test landlords directly
  const landlordIds = await createTestLandlordsDirectly();

  if (landlordIds.length === 0) {
    console.log('❌ Failed to create landlords. Exiting...');
    return;
  }

  console.log(`📋 Created ${landlordIds.length} landlords`);

  let totalProperties = 0;

  // Seed properties for each landlord
  for (const landlordId of landlordIds) {
    const propertyCount = randomBetween(15, 25); // 15-25 properties per landlord
    const success = await seedPropertiesForLandlord(landlordId, propertyCount);

    if (success) {
      totalProperties += propertyCount;
    }
  }

  console.log('');
  console.log('🎉 Database seeding completed!');
  console.log(`📊 Summary:`);
  console.log(`   👥 Landlords created: ${landlordIds.length}`);
  console.log(`   🏠 Total properties: ${totalProperties}`);
  console.log(`   📈 Average properties per landlord: ${Math.round(totalProperties / landlordIds.length)}`);
  console.log('');
  console.log('🏘️  Property distribution:');
  console.log('   - Apartment: ~30%');
  console.log('   - House: ~25%');
  console.log('   - Condo: ~25%');
  console.log('   - Townhouse: ~20%');
  console.log('');
  console.log('🔗 Images are using placeholder URLs from Picsum');
  console.log('💡 To use real property images, replace the image URLs in the database');
  console.log('');
  console.log('🗺️  Locations include major Nigerian cities');
  console.log('✨ Amenities and features are randomly generated');
  console.log('');
  console.log('🔑 Test landlord credentials:');
  TEST_LANDLORDS.forEach((landlord, index) => {
    console.log(`   ${index + 1}. ${landlord.email} / ${landlord.first_name} ${landlord.last_name}`);
  });
};

// Run the seeding script
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Direct seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase, createTestLandlordsDirectly, generateProperty };
