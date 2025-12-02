import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import PropertyImageUpload from './PropertyImageUpload';
import PropertyVideoUpload from './PropertyVideoUpload';
import PropertyFeatures from './PropertyFeatures';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../api';

const inputBase = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] transition-colors';

const EditPropertyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [values, setValues] = useState({
    title: '',
    locationCity: '',
    locationState: '',
    locationCountry: '',
    price: '',
    propertyType: 'apartment',
    rooms: 1,
    bathrooms: 1,
    description: '',
    amenities: [],
    images: [],
    videos: []
  });

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const { data, error } = await API.getProperty(id);
        
        if (error) throw new Error(error);
        if (!data) throw new Error('Property not found');

        setValues({
          title: data.title,
          locationCity: data.location?.city || '',
          locationState: data.location?.state || '',
          locationCountry: data.location?.country || '',
          price: data.price || '',
          propertyType: data.propertyType || 'apartment',
          rooms: data.rooms || 1,
          bathrooms: data.bathrooms || 1,
          description: data.description || '',
          amenities: data.amenities || [],
          images: data.images || [],
          videos: data.videos || []
        });
      } catch (error) {
        console.error('Error fetching property:', error);
        toast.error('Failed to load property');
        navigate('/properties');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    } else {
      setLoading(false);
    }
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        title: values.title,
        location: {
          city: values.locationCity,
          state: values.locationState,
          country: values.locationCountry
        },
        price: Number(values.price),
        propertyType: values.propertyType,
        rooms: Number(values.rooms),
        bathrooms: Number(values.bathrooms),
        amenities: values.amenities,
        description: values.description,
        images: values.images,
        videos: values.videos
      };

      let result;
      if (id) {
        result = await API.updateProperty(id, payload);
      } else {
        result = await API.createProperty(payload);
      }

      if (result.success) {
        toast.success(`Property ${id ? 'updated' : 'created'} successfully!`);
        navigate('/properties');
      } else {
        throw new Error(result.error || `Failed to ${id ? 'update' : 'create'} property`);
      }
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error(error.message || 'Failed to save property');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-secondary">
              {id ? 'Edit Property' : 'List New Property'}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">Property Title *</label>
              <input 
                name="title" 
                value={values.title} 
                onChange={handleChange} 
                className={`${inputBase}`} 
                placeholder="e.g., Cozy 2-Bedroom Apartment" 
                required 
              />
            </div>
            <div>
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">Price / Rent *</label>
              <input 
                name="price" 
                type="number" 
                min="0" 
                value={values.price} 
                onChange={handleChange} 
                className={`${inputBase}`} 
                placeholder="e.g., 250000" 
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-[#2C3E50] text-sm font-medium mb-2">Location *</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input 
                name="locationCity" 
                value={values.locationCity} 
                onChange={handleChange} 
                className={`${inputBase}`} 
                placeholder="City" 
                required 
              />
              <input 
                name="locationState" 
                value={values.locationState} 
                onChange={handleChange} 
                className={`${inputBase}`} 
                placeholder="State" 
                required 
              />
              <input 
                name="locationCountry" 
                value={values.locationCountry} 
                onChange={handleChange} 
                className={`${inputBase}`} 
                placeholder="Country" 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">Property Type *</label>
              <select 
                name="propertyType" 
                value={values.propertyType} 
                onChange={handleChange} 
                className={`${inputBase} cursor-pointer`} 
                required
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="hostel">Hostel</option>
              </select>
            </div>
            <div>
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">Rooms *</label>
              <input 
                type="number" 
                min="0" 
                value={values.rooms} 
                onChange={(e) => handleNumberChange('rooms', e.target.value)} 
                className={`${inputBase}`} 
                required
              />
            </div>
            <div>
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">Bathrooms *</label>
              <input 
                type="number" 
                min="0" 
                step="0.5"
                value={values.bathrooms} 
                onChange={(e) => handleNumberChange('bathrooms', e.target.value)} 
                className={`${inputBase}`} 
                required
              />
            </div>
          </div>

          <PropertyFeatures
            selectedAmenities={values.amenities}
            onChange={(amenities) => setValues(prev => ({ ...prev, amenities }))}
          />

          <div>
            <label className="block text-[#2C3E50] text-sm font-medium mb-2">Description</label>
            <textarea 
              name="description" 
              rows={5} 
              value={values.description} 
              onChange={handleChange} 
              className={`${inputBase} resize-none`} 
              placeholder="Describe your property, neighborhood, and any special terms." 
            />
          </div>

          <PropertyImageUpload
            images={values.images}
            onChange={(images) => setValues(prev => ({ ...prev, images }))}
          />

          <div>
            <label className="block text-[#2C3E50] text-sm font-medium mb-2">Property Videos</label>
            <p className="text-sm text-gray-600 mb-3">Upload videos to showcase your property (optional)</p>
            <PropertyVideoUpload
              videos={values.videos}
              onChange={(videos) => setValues(prev => ({ ...prev, videos }))}
              userId={user?.id}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#FF6B35' }}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-lg border-2 border-gray-300 text-[#2C3E50] font-semibold hover:border-[#2C3E50] hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPropertyForm;
