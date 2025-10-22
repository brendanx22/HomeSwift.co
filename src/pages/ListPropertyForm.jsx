import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import PropertyImageUpload from './PropertyImageUpload';
import PropertyFeatures from './PropertyFeatures';
import { PropertyAPI } from '../lib/propertyAPI';
import { useAuth } from '../contexts/AuthContext';

const inputBase = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] transition-colors';

const ListPropertyForm = ({ onSubmit, submitting = false, errorMessage, successMessage, brand }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [values, setValues] = React.useState({
    title: '',
    locationCity: '',
    locationState: '',
    locationCountry: '',
    price: '',
    propertyType: 'apartment',
    listingType: 'for-rent',
    rooms: 1,
    bathrooms: 1,
    description: '',
    amenities: [],
    images: []
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [imageConverting, setImageConverting] = React.useState(false);

  const primary = brand?.primary || '#FF6B35';
  const accent = brand?.accent || '#2C3E50';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const handleNumberChange = (name, value) => {
    setValues((v) => ({ ...v, [name]: Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!user?.id) {
      toast.error('Please log in to list a property');
      return;
    }

    // Basic validation
    if (!values.title || !values.locationCity || !values.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: values.title,
        location: `${values.locationCity}, ${values.locationState}, ${values.locationCountry}`.trim(),
        price: Number(values.price),
        property_type: values.propertyType,
        listing_type: values.listingType,
        rooms: Number(values.rooms) || 1,
        bathrooms: Number(values.bathrooms) || 1,
        amenities: values.amenities || [],
        description: values.description || '',
        images: values.images && values.images.length > 0
          ? await Promise.all(values.images.map(async (img) => {
              setImageConverting(true);
              console.log('🔄 Processing image:', img.url ? 'blob URL' : 'existing URL');
              // Convert blob URL to data URL for permanent storage
              if (img.url && img.url.startsWith('blob:')) {
                try {
                  const response = await fetch(img.url);
                  const blob = await response.blob();
                  return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                      console.log('✅ Image converted to data URL, length:', reader.result?.length);
                      resolve(reader.result);
                    };
                    reader.onerror = () => {
                      console.error('❌ Failed to convert image to data URL');
                      resolve(null);
                    };
                    reader.readAsDataURL(blob);
                  });
                } catch (error) {
                  console.error('❌ Error converting blob to data URL:', error);
                  return null;
                }
              }
              console.log('✅ Using existing image URL:', img.url || img);
              return img.url || img;
            })).then(urls => {
              setImageConverting(false);
              const filteredUrls = urls.filter(Boolean);
              console.log('📷 Final image URLs count:', filteredUrls.length);
              return filteredUrls;
            })
          : [], // Store actual uploaded images as data URLs
        landlord_id: user?.id,  // Add the current user's ID
      };

      console.log('🔄 Creating property with payload:', payload);
      console.log('👤 Current user ID:', user?.id);
      console.log('🏠 Landlord ID being set:', payload.landlord_id);
      console.log('📷 Images being saved:', payload.images);

      const result = await PropertyAPI.createProperty(payload);

      if (result.success) {
        toast.success('Property listed successfully!');
        // Redirect back to landlord dashboard to see updated listings
        navigate('/landlord/dashboard');
      } else {
        throw new Error(result.error || 'Failed to create property');
      }
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error(error.message || 'Failed to create property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/landlord/dashboard')}
                className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">List New Property</h1>
                <p className="text-sm text-gray-600">Add a new property to your portfolio</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Property Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Property Title *</label>
              <input
                name="title"
                value={values.title}
                onChange={handleChange}
                className={`${inputBase} h-12`}
                placeholder="e.g., Cozy 2-Bedroom Apartment in Victoria Island"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Location *</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  name="locationCity"
                  value={values.locationCity}
                  onChange={handleChange}
                  className={`${inputBase} h-12`}
                  placeholder="City"
                  required
                />
                <input
                  name="locationState"
                  value={values.locationState}
                  onChange={handleChange}
                  className={`${inputBase} h-12`}
                  placeholder="State"
                  required
                />
                <input
                  name="locationCountry"
                  value={values.locationCountry}
                  onChange={handleChange}
                  className={`${inputBase} h-12`}
                  placeholder="Country"
                  required
                />
              </div>
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Property Type *</label>
                <select
                  name="propertyType"
                  value={values.propertyType}
                  onChange={handleChange}
                  className={`${inputBase} h-12 cursor-pointer`}
                  required
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="hostel">Hostel</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Listing Type *</label>
                <select
                  name="listingType"
                  value={values.listingType}
                  onChange={handleChange}
                  className={`${inputBase} h-12 cursor-pointer`}
                  required
                >
                  <option value="for-rent">For Rent</option>
                  <option value="for-sale">For Sale</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Bedrooms *</label>
                <input
                  type="number"
                  min="0"
                  value={values.rooms}
                  onChange={(e) => handleNumberChange('rooms', e.target.value)}
                  className={`${inputBase} h-12`}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Bathrooms *</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={values.bathrooms}
                  onChange={(e) => handleNumberChange('bathrooms', e.target.value)}
                  className={`${inputBase} h-12`}
                />
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Price / Rent *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">₦</span>
                <input
                  name="price"
                  type="number"
                  min="0"
                  value={values.price}
                  onChange={handleChange}
                  className={`${inputBase} h-12 pl-10`}
                  placeholder="e.g., 250000"
                  required
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Features & Amenities</label>
              <PropertyFeatures
                selectedAmenities={values.amenities}
                onChange={(amenities) => setValues((v) => ({ ...v, amenities }))}
                brand={{ accent }}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Description</label>
              <textarea
                name="description"
                rows={5}
                value={values.description}
                onChange={handleChange}
                className={`${inputBase} resize-none`}
                placeholder="Describe your property, neighborhood, and any special terms or conditions..."
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Property Images</label>
              <PropertyImageUpload
                images={values.images}
                onChange={(images) => setValues((v) => ({ ...v, images }))}
                brand={{ primary }}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <motion.button
                type="submit"
                disabled={isSubmitting || imageConverting}
                className="flex-1 bg-[#FF6B35] text-white h-12 rounded-lg font-semibold hover:bg-[#e85e2f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={!isSubmitting && !imageConverting ? { scale: 1.02 } : {}}
                whileTap={!isSubmitting && !imageConverting ? { scale: 0.98 } : {}}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </>
                ) : imageConverting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </>
                ) : (
                  'Publish Listing'
                )}
              </motion.button>

              <motion.button
                type="button"
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors h-12"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  toast.info('Draft saved locally');
                }}
              >
                Save as Draft
              </motion.button>
            </div>

            {/* Error/Success Messages */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
              >
                ⚠ {errorMessage}
              </motion.div>
            )}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600"
              >
                ✓ {successMessage}
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ListPropertyForm;


