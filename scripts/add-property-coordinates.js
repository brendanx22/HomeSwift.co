import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env file manually
function loadEnvFile() {
    try {
        const envPath = join(__dirname, '..', '.env');
        const envFile = readFileSync(envPath, 'utf8');
        const envVars = {};

        envFile.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                envVars[key.trim()] = valueParts.join('=').trim();
            }
        });

        return envVars;
    } catch (error) {
        console.error('❌ Error reading .env file:', error.message);
        return {};
    }
}

const env = loadEnvFile();
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Nigerian city coordinates (major cities)
const NIGERIAN_CITY_COORDINATES = {
    // Lagos State
    'Lagos': { lat: 6.5244, lng: 3.3792 },
    'Ikeja': { lat: 6.5954, lng: 3.3364 },
    'Lekki': { lat: 6.4488, lng: 3.4739 },
    'Victoria Island': { lat: 6.4281, lng: 3.4219 },
    'Ikoyi': { lat: 6.4541, lng: 3.4316 },
    'Surulere': { lat: 6.4969, lng: 3.3582 },
    'Yaba': { lat: 6.5158, lng: 3.3711 },
    'Ajah': { lat: 6.4678, lng: 3.5638 },
    'Epe': { lat: 6.5833, lng: 3.9833 },

    // Abuja
    'Abuja': { lat: 9.0765, lng: 7.3986 },
    'Gwarinpa': { lat: 9.1108, lng: 7.4125 },
    'Maitama': { lat: 9.0820, lng: 7.4969 },
    'Wuse': { lat: 9.0579, lng: 7.4892 },
    'Asokoro': { lat: 9.0308, lng: 7.5347 },

    // Port Harcourt
    'Port Harcourt': { lat: 4.8156, lng: 7.0498 },

    // Kano
    'Kano': { lat: 12.0022, lng: 8.5919 },

    // Ibadan
    'Ibadan': { lat: 7.3775, lng: 3.9470 },

    // Benin City
    'Benin City': { lat: 6.3350, lng: 5.6037 },
    'Benin': { lat: 6.3350, lng: 5.6037 },

    // Kaduna
    'Kaduna': { lat: 10.5105, lng: 7.4165 },

    // Enugu
    'Enugu': { lat: 6.4403, lng: 7.4919 },

    // Jos
    'Jos': { lat: 9.9286, lng: 8.8919 },

    // Calabar
    'Calabar': { lat: 4.9758, lng: 8.3417 },

    // Warri
    'Warri': { lat: 5.5167, lng: 5.7500 },

    // Owerri
    'Owerri': { lat: 5.4840, lng: 7.0351 },

    // Uyo
    'Uyo': { lat: 5.0378, lng: 7.9085 },

    // Ilorin
    'Ilorin': { lat: 8.4966, lng: 4.5426 },

    // Akure
    'Akure': { lat: 7.2571, lng: 5.2058 },

    // Abeokuta
    'Abeokuta': { lat: 7.1475, lng: 3.3619 },
};

// Function to extract city name from location string
function extractCityName(location) {
    if (!location) return null;

    // Location format is usually "City, State, Country" or variations
    const parts = location.split(',').map(s => s.trim());

    // Try to match against known cities
    for (const part of parts) {
        const normalized = part.toLowerCase();

        // Check for exact matches (case insensitive)
        for (const city in NIGERIAN_CITY_COORDINATES) {
            if (city.toLowerCase() === normalized) {
                return city;
            }
        }

        // Check for partial matches (e.g., "Lekki Phase 1" matches "Lekki")
        for (const city in NIGERIAN_CITY_COORDINATES) {
            if (normalized.includes(city.toLowerCase()) || city.toLowerCase().includes(normalized)) {
                return city;
            }
        }
    }

    return null;
}

async function addCoordinatesToProperties() {
    console.log('🗺️  Starting property coordinates migration...\n');

    try {
        // Fetch all properties
        const { data: properties, error } = await supabase
            .from('properties')
            .select('id, title, location, latitude, longitude');

        if (error) {
            console.error('❌ Error fetching properties:', error);
            return;
        }

        console.log(`📊 Found ${properties.length} total properties\n`);

        // Filter properties without coordinates
        const propertiesWithoutCoords = properties.filter(p => !p.latitude || !p.longitude);

        console.log(`📍 ${propertiesWithoutCoords.length} properties need coordinates\n`);

        if (propertiesWithoutCoords.length === 0) {
            console.log('✅ All properties already have coordinates!');
            return;
        }

        let updated = 0;
        let skipped = 0;

        for (const property of propertiesWithoutCoords) {
            const cityName = extractCityName(property.location);

            if (cityName && NIGERIAN_CITY_COORDINATES[cityName]) {
                const coords = NIGERIAN_CITY_COORDINATES[cityName];

                // Add small random offset so properties in same city don't overlap
                const lat = coords.lat + (Math.random() - 0.5) * 0.02;
                const lng = coords.lng + (Math.random() - 0.5) * 0.02;

                const { error: updateError } = await supabase
                    .from('properties')
                    .update({
                        latitude: lat,
                        longitude: lng
                    })
                    .eq('id', property.id);

                if (updateError) {
                    console.error(`❌ Error updating property ${property.id}:`, updateError);
                } else {
                    console.log(`✅ Updated "${property.title}" (${property.location}) -> ${cityName}`);
                    updated++;
                }
            } else {
                console.log(`⚠️  Skipped "${property.title}" - couldn't match location: "${property.location}"`);
                skipped++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`📊 Summary:`);
        console.log(`   ✅ Updated: ${updated}`);
        console.log(`   ⚠️  Skipped: ${skipped}`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Script error:', error);
    }
}

// Run the migration
addCoordinatesToProperties()
    .then(() => {
        console.log('\n✨ Migration complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
