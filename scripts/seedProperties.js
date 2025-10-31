// scripts/seedProperties.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const properties = [
  {
    title: "Luxury 3-Bedroom Apartment in Victoria Island",
    description: "Modern apartment with stunning views of the Atlantic Ocean. Features include a fully equipped kitchen, spacious living area, and 24/7 security.",
    location: "Victoria Island, Lagos",
    property_type: "apartment",
    bedrooms: 3,
    bathrooms: 2,
    price: 450000,
    size: 150,
    amenities: ["Swimming Pool", "Gym", "24/7 Security", "Parking", "Generator"],
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"
    ],
    is_featured: true,
    status: "available",
    category: "apartment",
    landlord_name: "John Okafor",
    landlord_phone: "+234 803 123 4567",
    landlord_email: "john.okafor@example.com"
  },
  {
    title: "Modern 4-Bedroom House in Lekki Phase 1",
    description: "Beautiful detached house in a serene environment. Perfect for families with children. Close to schools and shopping centers.",
    location: "Lekki Phase 1, Lagos",
    property_type: "house",
    bedrooms: 4,
    bathrooms: 3,
    price: 650000,
    size: 250,
    amenities: ["Garden", "Parking", "Generator", "Security", "Balcony"],
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop"
    ],
    is_featured: false,
    status: "available",
    category: "house",
    landlord_name: "Jane Adeleke",
    landlord_phone: "+234 805 234 5678",
    landlord_email: "jane.adeleke@example.com"
  },
  {
    title: "Cozy Studio Apartment in Maitama",
    description: "Perfect for young professionals. Furnished studio with modern amenities in the heart of Abuja's diplomatic zone.",
    location: "Maitama, Abuja",
    property_type: "studio",
    bedrooms: 1,
    bathrooms: 1,
    price: 250000,
    size: 45,
    amenities: ["Furnished", "WiFi", "Air Conditioning", "Security", "Parking"],
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop"
    ],
    is_featured: true,
    status: "available",
    category: "studio",
    landlord_name: "Michael Bello",
    landlord_phone: "+234 807 345 6789",
    landlord_email: "michael.bello@example.com"
  },
  {
    title: "Spacious 5-Bedroom Duplex in Asaba",
    description: "Luxurious duplex with a private compound. Features include a swimming pool, boys quarters, and ample parking space.",
    location: "GRA, Asaba",
    property_type: "duplex",
    bedrooms: 5,
    bathrooms: 4,
    price: 800000,
    size: 350,
    amenities: ["Swimming Pool", "Boys Quarters", "Parking", "Garden", "Security", "Generator"],
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop"
    ],
    is_featured: false,
    status: "available",
    category: "duplex",
    landlord_name: "Sarah Williams",
    landlord_phone: "+234 809 456 7890",
    landlord_email: "sarah.williams@example.com"
  },
  {
    title: "Beautiful 3-Bedroom Bungalow in Enugu",
    description: "Well-maintained bungalow in a quiet neighborhood. Ideal for retirees or small families. Close to major amenities.",
    location: "GRA, Enugu",
    property_type: "bungalow",
    bedrooms: 3,
    bathrooms: 2,
    price: 400000,
    size: 180,
    amenities: ["Parking", "Garden", "Security", "Generator", "Water Supply"],
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop"
    ],
    is_featured: true,
    status: "available",
    category: "bungalow",
    landlord_name: "David Nwosu",
    landlord_phone: "+234 802 567 8901",
    landlord_email: "david.nwosu@example.com"
  },
  {
    title: "Penthouse Suite in Ikoyi",
    description: "Ultra-luxurious penthouse with panoramic city views. Top-floor apartment with private elevator access and rooftop terrace.",
    location: "Ikoyi, Lagos",
    property_type: "apartment",
    bedrooms: 4,
    bathrooms: 4,
    price: 1200000,
    size: 300,
    amenities: ["Rooftop Terrace", "Private Elevator", "Gym", "Swimming Pool", "Concierge", "Smart Home"],
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600&fit=crop"
    ],
    is_featured: true,
    status: "available",
    category: "apartment",
    landlord_name: "Emma Davis",
    landlord_phone: "+234 804 678 9012",
    landlord_email: "emma.davis@example.com"
  },
  {
    title: "2-Bedroom Apartment in Ikeja",
    description: "Affordable apartment close to the airport and major business districts. Perfect for professionals working in Ikeja.",
    location: "Ikeja GRA, Lagos",
    property_type: "apartment",
    bedrooms: 2,
    bathrooms: 2,
    price: 320000,
    size: 90,
    amenities: ["Parking", "Security", "Generator", "Water Supply"],
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop"
    ],
    is_featured: false,
    status: "available",
    category: "apartment",
    landlord_name: "Grace Obi",
    landlord_phone: "+234 806 789 0123",
    landlord_email: "grace.obi@example.com"
  },
  {
    title: "4-Bedroom Ter