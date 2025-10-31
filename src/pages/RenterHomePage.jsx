import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  createRef,
} from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Heart,
  ChevronLeft,
  ChevronRight,
  Filter,
  MessageSquare,
  Bed,
  Bath,
  Home,
  Menu,
  User,
  X,
  Star,
  SlidersHorizontal,
} from "lucide-react";
import { PropertyAPI } from "../lib/propertyAPI";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useMessaging } from "../contexts/MessagingContext";
import { trackListingViewed, trackSearch } from "../lib/posthog";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";
import ProfilePopup from "../components/ProfilePopup";
import NotificationCenter from "../components/NotificationCenter";

// Nigerian cities and locations
const NIGERIAN_LOCATIONS = [
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Ibadan",
  "Kano",
  "Enugu",
  "Warri",
  "Benin City",
  "Kaduna",
  "Asaba",
];

// Categories
const CATEGORIES = [
  { id: "all", label: "All", icon: "🏠" },
  { id: "apartment", label: "Apartments", icon: "🏢" },
  { id: "house", label: "Houses", icon: "🏡" },
  { id: "villa", label: "Villas", icon: "🏘️" },
  { id: "cabin", label: "Cabins", icon: "🌲" },
  { id: "beach", label: "Beach", icon: "🏖️" },
  { id: "countryside", label: "Countryside", icon: "🌄" },
  { id: "luxury", label: "Luxury", icon: "✨" },
  { id: "amazing_views", label: "Amazing Views", icon: "🌅" },
  { id: "trending", label: "Trending", icon: "🔥" },
  { id: "design", label: "Design", icon: "🎨" },
  { id: "islands", label: "Islands", icon: "🏝️" },
];

// Property Card Component
const PropertyCard = ({ property, isSaved, onSave, onNavigate }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const images = property.images || [];

  const nextImage = (e) => {
    e.stopPropagation();
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (images.length > 0) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + images.length) % images.length,
      );
    }
  };

  const handleCardClick = () => {
    onNavigate(`/properties/${property.id}`);
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    onSave(property.id);
  };

  return (
    <div
      className="cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden rounded-xl mb-3">
        {images.length > 0 ? (
          <img
            src={images[currentImageIndex]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Home className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Guest Favorite Badge */}
        {property.is_featured && (
          <div className="absolute top-3 left-3 bg-white rounded-full px-3 py-1.5 shadow-md">
            <span className="text-xs font-semibold">Guest favorite</span>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSaveClick}
          className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform"
        >
          <Heart
            className={`w-6 h-6 drop-shadow-md ${
              isSaved ? "fill-red-500 text-red-500" : "text-white fill-black/50"
            }`}
          />
        </button>

        {/* Image Dots Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentImageIndex ? "bg-white w-2" : "bg-white/60"
                }`}
              />
            ))}
          </div>
        )}

        {/* Navigation Arrows - Show on hover */}
        {isHovered && images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-md hover:bg-white transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-md hover:bg-white transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Property Details */}
      <div>
        <div className="flex justify-between items-start mb-1">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {property.property_type} in {property.location}
            </h3>
          </div>
          <div className="flex items-center ml-2">
            <Star className="w-3 h-3 fill-current text-gray-900" />
            <span className="ml-1 text-sm">
              4.{Math.floor(Math.random() * 10) + 90}
            </span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-1">
          {property.bedrooms} bed{property.bedrooms > 1 ? "s" : ""} ·{" "}
          {property.bathrooms} bath{property.bathrooms > 1 ? "s" : ""}
        </p>

        <p className="text-gray-600 text-sm mb-2">
          Available{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </p>

        <div>
          <span className="font-semibold text-gray-900">
            ₦{property.price?.toLocaleString()}
          </span>
          <span className="text-gray-600 text-sm"> / month</span>
        </div>
      </div>
    </div>
  );
};

const RenterHomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, loadConversations } = useMessaging();

  // State
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [groupedProperties, setGroupedProperties] = useState({});
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [propertyType, setPropertyType] = useState("all");
  const [bedrooms, setBedrooms] = useState("");
  const [savedProperties, setSavedProperties] = useState(new Set());
  const [activeCategory, setActiveCategory] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [userFirstName, setUserFirstName] = useState("");
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [activeSearchSection, setActiveSearchSection] = useState(null);
  const scrollContainerRefs = useRef({});

  // Load properties
  const loadProperties = async () => {
    console.log("🔄 Starting property load...");
    try {
      setLoading(true);

      console.log("📞 Testing direct Supabase query...");

      // Direct Supabase query to test
      const { data, error, count } = await supabase
        .from("properties")
        .select("*", { count: "exact" })
        .limit(10);

      console.log("📊 Direct query result:", {
        hasData: !!data,
        dataLength: data?.length,
        hasError: !!error,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        count: count,
      });

      if (error) {
        console.error("❌ Supabase error:", error);
        toast.error(`Database error: ${error.message}`);
        setProperties([]);
        setFilteredProperties([]);
        setGroupedProperties({});
        return;
      }

      if (data && data.length > 0) {
        console.log("✅ Properties loaded:", data.length);
        console.log("📦 First property:", data[0]);
        setProperties(data);
        setFilteredProperties(data);
        const grouped = groupPropertiesByLocation(data);
        setGroupedProperties(grouped);
        console.log("✅ Properties set successfully:", {
          total: data.length,
          groupedLocations: Object.keys(grouped),
          groupedCount: Object.keys(grouped).length,
        });
      } else {
        console.log("⚠️ No properties found in database");
        toast.info("No properties available at the moment");
        setProperties([]);
        setFilteredProperties([]);
        setGroupedProperties({});
      }
    } catch (error) {
      console.error("❌ Error loading properties:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      toast.error(`Failed to load properties: ${error.message}`);
      setProperties([]);
      setFilteredProperties([]);
      setGroupedProperties({});
    } finally {
      console.log("🏁 Property loading finished");
      setLoading(false);
    }
  };

  // Load user data
  const loadData = async () => {
    if (!user) return;

    try {
      // Load saved properties
      const { data, error } = await supabase
        .from("saved_properties")
        .select("property_id")
        .eq("user_id", user.id);

      if (!error && data) {
        setSavedProperties(new Set(data.map((item) => item.property_id)));
      }

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileError && profileData) {
        if (profileData.avatar_url) {
          setUserAvatar(profileData.avatar_url);
        }

        let firstName = "";
        if (profileData.first_name) {
          firstName = profileData.first_name;
        } else if (profileData.full_name) {
          firstName = profileData.full_name.split(" ")[0];
        } else if (user.user_metadata?.first_name) {
          firstName = user.user_metadata.first_name;
        } else if (user.email) {
          firstName = user.email.split("@")[0];
        }
        setUserFirstName(firstName);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  useEffect(() => {
    console.log("🚀 Component mounted, loading properties...");
    loadProperties();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
      loadConversations();
    }
  }, [user]);

  // Calculate unread messages
  useEffect(() => {
    if (conversations && user) {
      const unread = conversations.filter(
        (conv) =>
          conv.unread_count > 0 && conv.last_message?.sender_id !== user.id,
      ).length;
      setUnreadCount(unread);
    }
  }, [conversations, user]);

  // Group properties by location
  const groupPropertiesByLocation = (propertiesToGroup) => {
    const grouped = {};
    propertiesToGroup.forEach((property) => {
      const locationKey = property.location || "Other Areas";
      if (!grouped[locationKey]) {
        grouped[locationKey] = [];
      }
      grouped[locationKey].push(property);
    });
    return grouped;
  };

  // Filter properties
  const filterProperties = useCallback(() => {
    console.log("🔍 Filtering properties:", {
      totalProperties: properties.length,
      location,
      propertyType,
      activeCategory,
    });

    let filtered = [...properties];

    // Category filter
    if (activeCategory !== "all") {
      filtered = filtered.filter(
        (property) =>
          property.category === activeCategory ||
          property.property_type === activeCategory,
      );
    }

    // Location filter
    if (location) {
      filtered = filtered.filter((p) =>
        p.location?.toLowerCase().includes(location.toLowerCase()),
      );
    }

    // Price range filter
    if (priceRange.min) {
      filtered = filtered.filter((p) => p.price >= parseInt(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter((p) => p.price <= parseInt(priceRange.max));
    }

    // Property type filter
    if (propertyType !== "all") {
      if (propertyType === "luxury") {
        filtered = filtered.filter((p) => p.price >= 500000);
      } else {
        filtered = filtered.filter(
          (p) => p.property_type?.toLowerCase() === propertyType.toLowerCase(),
        );
      }
    }

    // Bedrooms filter
    if (bedrooms) {
      filtered = filtered.filter((p) => p.bedrooms >= parseInt(bedrooms));
    }

    // Category filter
    if (activeCategory !== "all") {
      if (activeCategory === "luxury") {
        filtered = filtered.filter((p) => p.price >= 500000);
      } else {
        filtered = filtered.filter(
          (p) =>
            p.property_type?.toLowerCase() === activeCategory.toLowerCase(),
        );
      }
    }

    console.log("✅ Filtered properties:", {
      filteredCount: filtered.length,
      properties: filtered,
    });

    setFilteredProperties(filtered);
    const grouped = groupPropertiesByLocation(filtered);
    setGroupedProperties(grouped);

    console.log("📍 Grouped properties:", grouped);

    // Track search
    if (trackSearch && location) {
      trackSearch({
        query: location,
        filters: { propertyType, priceRange, bedrooms, activeCategory },
        resultsCount: filtered.length,
      });
    }
  }, [
    properties,
    location,
    priceRange,
    propertyType,
    bedrooms,
    activeCategory,
  ]);

  useEffect(() => {
    filterProperties();
  }, [filterProperties]);

  const getUserInitial = () => {
    if (userFirstName) {
      return userFirstName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const scroll = (locationName, direction) => {
    const container = scrollContainerRefs.current[locationName];
    if (container) {
      const scrollAmount = 400;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const clearFilters = () => {
    setLocation("");
    setPriceRange({ min: "", max: "" });
    setPropertyType("all");
    setBedrooms("");
    setActiveCategory("all");
    setFilteredProperties(properties);
    const grouped = groupPropertiesByLocation(properties);
    setGroupedProperties(grouped);
  };

  const toggleSaveProperty = async (propertyId) => {
    if (!user) {
      toast.error("Please login to save properties");
      navigate("/login");
      return;
    }

    try {
      if (savedProperties.has(propertyId)) {
        const { error } = await supabase
          .from("saved_properties")
          .delete()
          .eq("user_id", user.id)
          .eq("property_id", propertyId);

        if (error) throw error;

        setSavedProperties((prev) => {
          const newSet = new Set(prev);
          newSet.delete(propertyId);
          return newSet;
        });
        toast.success("Property removed from saved");
      } else {
        const { error } = await supabase.from("saved_properties").insert([
          {
            user_id: user.id,
            property_id: propertyId,
          },
        ]);

        if (error) throw error;

        setSavedProperties((prev) => new Set(prev).add(propertyId));
        toast.success("Property saved");
      }
    } catch (error) {
      console.error("Error toggling saved property:", error);
      toast.error("Failed to update saved properties");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-10">
          {/* Top Bar */}
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/images/logo.png"
                alt="HomeSwift"
                className="w-10 h-10 object-cover rounded-lg"
              />
              <span className="hidden sm:block text-xl font-bold text-[#FF6B35]">
                HomeSwift
              </span>
            </Link>

            {/* Desktop - Spacer */}
            <div className="flex-1"></div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {user && (
                <>
                  {/* Messages */}
                  <Link
                    to="/chat"
                    className="relative w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF6B35] text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* Notifications */}
                  <NotificationCenter />
                </>
              )}

              {/* Profile Menu - Avatar Only */}
              {user ? (
                <button
                  onClick={() => setShowProfilePopup(true)}
                  className="w-9 h-9 bg-gradient-to-br from-[#FF6B35] to-[#e85e2f] rounded-full flex items-center justify-center overflow-hidden hover:shadow-md transition-shadow"
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={() => setUserAvatar(null)}
                    />
                  ) : (
                    <span className="text-white text-sm font-bold">
                      {getUserInitial()}
                    </span>
                  )}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 border border-gray-300 rounded-full hover:shadow-md transition-all"
                >
                  <Menu className="w-4 h-4" />
                  <User className="w-8 h-8 p-1.5 bg-gray-500 text-white rounded-full" />
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Search Bar - Below Navbar */}
          <div className="hidden md:block pb-4 pt-4">
            <div className="max-w-3xl mx-auto relative">
              <div className="flex items-center border border-gray-300 rounded-full hover:shadow-md transition-shadow bg-white">
                {/* Where */}
                <button
                  onClick={() => {
                    setActiveSearchSection("location");
                    setShowLocationDropdown(!showLocationDropdown);
                    setShowTypeDropdown(false);
                  }}
                  className={`flex-1 px-6 py-3 rounded-l-full hover:bg-gray-100 transition-colors ${
                    activeSearchSection === "location"
                      ? "shadow-lg bg-white"
                      : ""
                  }`}
                >
                  <div className="text-left">
                    <div className="text-xs font-semibold text-gray-900 mb-1">
                      Where
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {location || "Search destinations"}
                    </div>
                  </div>
                </button>

                <div className="h-8 w-px bg-gray-300"></div>

                {/* Type */}
                <button
                  onClick={() => {
                    setActiveSearchSection("type");
                    setShowTypeDropdown(!showTypeDropdown);
                    setShowLocationDropdown(false);
                  }}
                  className={`flex-1 px-6 py-3 hover:bg-gray-100 transition-colors ${
                    activeSearchSection === "type" ? "shadow-lg bg-white" : ""
                  }`}
                >
                  <div className="text-left">
                    <div className="text-xs font-semibold text-gray-900 mb-1">
                      Type
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {propertyType !== "all"
                        ? propertyType.charAt(0).toUpperCase() +
                          propertyType.slice(1)
                        : "All types"}
                    </div>
                  </div>
                </button>

                <div className="h-8 w-px bg-gray-300"></div>

                {/* Price */}
                <button
                  onClick={() => {
                    setActiveSearchSection("price");
                    setShowLocationDropdown(false);
                    setShowTypeDropdown(false);
                  }}
                  className={`flex-1 px-6 py-3 hover:bg-gray-100 transition-colors ${
                    activeSearchSection === "price" ? "shadow-lg bg-white" : ""
                  }`}
                >
                  <div className="text-left">
                    <div className="text-xs font-semibold text-gray-900 mb-1">
                      Price
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {priceRange.min || priceRange.max
                        ? `₦${priceRange.min || "0"} - ₦${priceRange.max || "∞"}`
                        : "Any price"}
                    </div>
                  </div>
                </button>

                {/* Search Button */}
                <button
                  onClick={() => {
                    setActiveSearchSection(null);
                    setShowLocationDropdown(false);
                    setShowTypeDropdown(false);
                  }}
                  className="p-3 mr-2 bg-[#FF6B35] text-white rounded-full hover:bg-[#e85e2f] transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Location Dropdown */}
              <AnimatePresence>
                {showLocationDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50"
                  >
                    <div className="p-8">
                      <h3 className="font-semibold text-sm mb-6">
                        Search by region
                      </h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {NIGERIAN_LOCATIONS.filter((loc) =>
                          loc.toLowerCase().includes(location.toLowerCase()),
                        ).map((loc) => (
                          <button
                            key={loc}
                            onClick={() => {
                              setLocation(loc);
                              setShowLocationDropdown(false);
                              setActiveSearchSection(null);
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="font-medium text-gray-900 text-sm">
                              {loc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Type Dropdown */}
              <AnimatePresence>
                {showTypeDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 z-50"
                  >
                    <div className="p-8">
                      <h3 className="font-semibold text-sm mb-6">
                        Type of place
                      </h3>
                      <div className="space-y-3">
                        {[
                          { value: "all", label: "All types" },
                          { value: "apartment", label: "Apartment" },
                          { value: "house", label: "House" },
                          { value: "duplex", label: "Duplex" },
                          { value: "studio", label: "Studio" },
                          { value: "bungalow", label: "Bungalow" },
                        ].map((type) => (
                          <button
                            key={type.value}
                            onClick={() => {
                              setPropertyType(type.value);
                              setShowTypeDropdown(false);
                              setActiveSearchSection(null);
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div
                              className={`text-sm ${
                                propertyType === type.value
                                  ? "font-semibold text-gray-900"
                                  : "text-gray-700"
                              }`}
                            >
                              {type.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Price Dropdown - Desktop Only */}
              <AnimatePresence>
                {activeSearchSection === "price" && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-200 z-50"
                  >
                    <div className="p-8">
                      <h3 className="font-semibold text-sm mb-6">
                        Price range
                      </h3>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-xs text-gray-600 mb-2">
                            Minimum
                          </label>
                          <input
                            type="number"
                            placeholder="₦ 0"
                            value={priceRange.min}
                            onChange={(e) =>
                              setPriceRange({
                                ...priceRange,
                                min: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-2">
                            Maximum
                          </label>
                          <input
                            type="number"
                            placeholder="₦ Any"
                            value={priceRange.max}
                            onChange={(e) =>
                              setPriceRange({
                                ...priceRange,
                                max: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setPriceRange({ min: "", max: "" });
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => {
                            setActiveSearchSection(null);
                          }}
                          className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Backdrop for dropdowns */}
              {(showLocationDropdown ||
                showTypeDropdown ||
                activeSearchSection === "price") && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => {
                    setShowLocationDropdown(false);
                    setShowTypeDropdown(false);
                    setActiveSearchSection(null);
                  }}
                />
              )}
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
            <button
              onClick={() => setShowFilters(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-all"
            >
              <Search className="w-5 h-5 text-gray-700" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900">
                  Where to?
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  Anywhere · Any type · Any price
                </div>
              </div>
              <Filter className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Categories */}
          <div className="flex gap-6 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-3 lg:pb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex flex-col items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeCategory === cat.id
                    ? "border-gray-900 opacity-100"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-xs font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Filters Modal - Mobile Only */}
      <AnimatePresence>
        {showFilters && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowFilters(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.3 }}
              className="md:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-white sticky top-0 z-10">
                <h2 className="text-xl font-bold">Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div
                className="p-6 space-y-6 overflow-y-auto"
                style={{ maxHeight: "calc(85vh - 140px)" }}
              >
                {/* Location */}
                <div>
                  <h3 className="text-lg font-bold mb-4">Location</h3>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search locations"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {NIGERIAN_LOCATIONS.slice(0, 8).map((loc) => (
                      <button
                        key={loc}
                        onClick={() => setLocation(loc)}
                        className={`px-4 py-2 text-sm border rounded-lg transition-colors ${
                          location === loc
                            ? "bg-gray-900 text-white border-gray-900"
                            : "border-gray-300 hover:border-gray-900"
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t"></div>

                {/* Price Range */}
                <div>
                  <h3 className="text-lg font-bold mb-4">Price range</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Min price"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, min: e.target.value })
                      }
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    <input
                      type="number"
                      placeholder="Max price"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, max: e.target.value })
                      }
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <div className="border-t"></div>

                {/* Property Type */}
                <div>
                  <h3 className="text-lg font-bold mb-4">Type of place</h3>
                  <div className="space-y-2">
                    {[
                      "all",
                      "apartment",
                      "house",
                      "duplex",
                      "studio",
                      "bungalow",
                    ].map((type) => (
                      <button
                        key={type}
                        onClick={() => setPropertyType(type)}
                        className={`w-full px-4 py-3 text-left border rounded-lg transition-colors ${
                          propertyType === type
                            ? "bg-gray-50 border-gray-900"
                            : "border-gray-300 hover:border-gray-900"
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t"></div>

                {/* Bedrooms */}
                <div>
                  <h3 className="text-lg font-bold mb-4">Bedrooms</h3>
                  <div className="flex gap-2 flex-wrap">
                    {["Any", "1", "2", "3", "4", "5+"].map((num) => (
                      <button
                        key={num}
                        onClick={() =>
                          setBedrooms(num === "Any" ? "" : num.replace("+", ""))
                        }
                        className={`px-6 py-3 border rounded-full font-medium transition-colors ${
                          bedrooms ===
                          (num === "Any" ? "" : num.replace("+", ""))
                            ? "bg-gray-900 text-white border-gray-900"
                            : "border-gray-300 hover:border-gray-900"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 p-6 border-t bg-white">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-6 py-3.5 border border-gray-300 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Clear all
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-6 py-3.5 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
                >
                  Show {filteredProperties.length}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Profile Popup */}
      <ProfilePopup
        isOpen={showProfilePopup}
        onClose={() => setShowProfilePopup(false)}
        position="navbar"
        onAvatarUpdate={(newAvatarUrl) => setUserAvatar(newAvatarUrl)}
      />

      {/* Main Content */}
      <main className="py-6 lg:py-8">
        {/* Properties Sections */}
        {loading ? (
          <div className="px-4 sm:px-6 lg:px-10 max-w-[1760px] mx-auto">
            <div className="animate-pulse mb-4 h-8 bg-gray-200 rounded w-64" />
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex-none w-80 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-xl mb-3" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="-mx-4 sm:-mx-6 lg:-mx-10">
            {/* Section Header */}
            <div className="px-4 sm:px-6 lg:px-10 max-w-[1760px] mx-auto mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                  {location ? `Stays in ${location}` : "All Stays"}
                </h2>
                <p className="text-sm text-gray-600">
                  {filteredProperties.length} properties
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={() => scroll("all", "left")}
                  className="p-2 rounded-full border border-gray-300 hover:shadow-md transition-shadow bg-white"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scroll("all", "right")}
                  className="p-2 rounded-full border border-gray-300 hover:shadow-md transition-shadow bg-white"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Horizontal Scrolling Properties */}
            <div className="px-4 sm:px-6 lg:px-10 max-w-[1760px] mx-auto">
              <div
                ref={(el) => (scrollContainerRefs.current["all"] = el)}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
              >
                {filteredProperties.map((property) => (
                  <div key={property.id} className="flex-none w-80 snap-start">
                    <PropertyCard
                      property={property}
                      isSaved={savedProperties.has(property.id)}
                      onSave={toggleSaveProperty}
                      onNavigate={navigate}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 sm:px-6 lg:px-10 max-w-[1760px] mx-auto text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Home className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No properties found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filters
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-[#FF6B35] text-white rounded-full font-semibold hover:bg-[#e85e2f] transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 mt-12">
        <div className="px-4 sm:px-6 lg:px-10 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <Link to="/help" className="hover:underline">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:underline">
                    Contact us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Hosting</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <Link to="/landlord-dashboard" className="hover:underline">
                    List your property
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">HomeSwift</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <Link to="/about" className="hover:underline">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:underline">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Follow Us</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>Twitter</li>
                <li>Instagram</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-gray-600">
            <p>© 2024 HomeSwift · Made with ❤️ in Nigeria</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RenterHomePage;
