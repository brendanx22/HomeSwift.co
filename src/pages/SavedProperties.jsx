import Loading from '../components/Loading';
import { motion } from 'framer-motion';
import { PropertyAPI } from '../lib/propertyAPI';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

export default function SavedProperties() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [savedProperties, setSavedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadSavedProperties();

      // Set up real-time subscription for saved_properties table
      const subscription = supabase
        .channel('saved_properties_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'saved_properties',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('📡 Real-time update received:', payload);
            // Reload saved properties when changes occur
            loadSavedProperties();
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  const loadSavedProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      const { success, savedProperties: savedData } = await PropertyAPI.getSavedProperties(user.id);

      if (success) {
        setSavedProperties(savedData || []);
      } else {
        setError('Failed to load saved properties');
      }
    } catch (error) {
      console.error('Error loading saved properties:', error);
      setError('Failed to load saved properties');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromSaved = async (propertyId) => {
    try {
      const { success, action } = await PropertyAPI.toggleSaveProperty(user.id, propertyId);

      if (success) {
        if (action === 'removed') {
          // Remove from local state
          setSavedProperties(prev => prev.filter(item => item.property_id !== propertyId));
          toast.success('Removed from favorites');
        }
      } else {
        toast.error('Failed to remove from favorites');
      }
    } catch (error) {
      console.error('Error removing from saved:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view your saved properties</p>
          <button
            onClick={() => navigate('/login')}
            className="text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: '#FF6B35' }}
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/chat')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Chat</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Properties</h1>
                <p className="text-gray-600">Properties you've saved for later</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/browse')}
              className="text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              style={{ backgroundColor: '#FF6B35' }}
            >
              Browse More
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠</div>
            <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Saved Properties</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadSavedProperties}
              className="text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              style={{ backgroundColor: '#FF6B35' }}
            >
              Try Again
            </button>
          </div>
        ) : savedProperties.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Saved Properties</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't saved any properties yet. Start browsing and save properties you're interested in for easy access later.
            </p>
            <button
              onClick={() => navigate('/browse')}
              className="text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              style={{ backgroundColor: '#FF6B35' }}
            >
              Start Browsing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProperties.map((savedItem) => {
              const property = savedItem.properties;
              if (!property) return null;

              return (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative h-48">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <div className="text-gray-400 text-4xl">🏠</div>
                      </div>
                    )}

                    {/* Favorite Button */}
                    <button
                      onClick={() => handleRemoveFromSaved(property.id)}
                      className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <Heart className="w-5 h-5 text-red-500 fill-current" />
                    </button>
                  </div>

                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                      {property.title}
                    </h3>

                    <div className="flex items-center text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{property.location}</span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xl font-bold text-[#FF6B35]">
                        ₦{property.price?.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {property.bedrooms || property.rooms} bed • {property.bathrooms} bath
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/properties/${property.id}`)}
                        className="flex-1 text-center py-2 px-4 bg-[#FF6B35] text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
