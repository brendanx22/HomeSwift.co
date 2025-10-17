import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/landlord/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-secondary">List New Property</h1>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">Property Title *</label>
              <input name="title" value={values.title} onChange={handleChange} className={`${inputBase}`} placeholder="e.g., Cozy 2-Bedroom Apartment" required />
            </div>
            <div>
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">Price / Rent *</label>
              <input name="price" type="number" min="0" value={values.price} onChange={handleChange} className={`${inputBase}`} placeholder="e.g., 250000" required />
            </div>
          </div>

          <div>
            <label className="block text-[#2C3E50] text-sm font-medium mb-2">Location *</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input name="locationCity" value={values.locationCity} onChange={handleChange} className={`${inputBase}`} placeholder="City" required />
              <input name="locationState" value={values.locationState} onChange={handleChange} className={`${inputBase}`} placeholder="State" required />
              <input name="locationCountry" value={values.locationCountry} onChange={handleChange} className={`${inputBase}`} placeholder="Country" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">Property Type *</label>
              <select name="propertyType" value={values.propertyType} onChange={handleChange} className={`${inputBase} cursor-pointer`} required>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="hostel">Hostel</option>
              </select>
            </div>
            <div>
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">Listing Type *</label>
              <select name="listingType" value={values.listingType} onChange={handleChange} className={`${inputBase} cursor-pointer`} required>
                <option value="for-rent">For Rent</option>
                <option value="for-sale">For Sale</option>
              </select>
            </div>
            <div>
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">Rooms *</label>
              <input type="number" min="0" value={values.rooms} onChange={(e) => handleNumberChange('rooms', e.target.value)} className={`${inputBase}`} />
            </div>
            <div>
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">Bathrooms *</label>
              <input type="number" min="0" step="0.5" value={values.bathrooms} onChange={(e) => handleNumberChange('bathrooms', e.target.value)} className={`${inputBase}`} />
            </div>
          </div>

          <PropertyFeatures
            selectedAmenities={values.amenities}
            onChange={(amenities) => setValues((v) => ({ ...v, amenities }))}
            brand={{ accent }}
          />

          <div>
            <label className="block text-[#2C3E50] text-sm font-medium mb-2">Description</label>
            <textarea name="description" rows={5} value={values.description} onChange={handleChange} className={`${inputBase} resize-none`} placeholder="Describe your property, neighborhood, and any special terms." />
          </div>

          <PropertyImageUpload
            images={values.images}
            onChange={(images) => setValues((v) => ({ ...v, images }))}
            brand={{ primary }}
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || imageConverting}
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primary }}
              onMouseOver={(e) => !isSubmitting && !imageConverting && (e.currentTarget.style.backgroundColor = '#e85e2f')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = primary)}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Publishing...
                </>
              ) : imageConverting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Images...
                </>
              ) : (
                'Publish Listing'
              )}
            </button>
            <button
              type="button"
              className="px-6 py-3 rounded-lg border-2 border-gray-300 text-[#2C3E50] font-semibold hover:border-[#2C3E50] hover:bg-gray-50 transition-all"
              onClick={() => {
                toast.info('Draft saved locally');
              }}
            >
              Save as Draft
            </button>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">⚠ {errorMessage}</div>
          )}
          {successMessage && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">✓ {successMessage}</div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ListPropertyForm;


