import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import { API } from '../api';

const PropertyCard = ({ property, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    
    try {
      setIsDeleting(true);
      const result = await API.deleteProperty(property.id);
      if (result.success) {
        toast.success('Property deleted successfully');
        onDelete(property.id);
      } else {
        throw new Error(result.error || 'Failed to delete property');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete property');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="h-48 bg-gray-100 relative">
        {property.images?.[0]?.url ? (
          <img 
            src={property.images[0].url} 
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400">No Image</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{property.title}</h3>
        <p className="text-gray-600 text-sm mb-2">
          {property.location?.city}, {property.location?.state}
        </p>
        <p className="font-bold text-lg mb-3">
          ${property.price?.toLocaleString()}
          <span className="text-sm font-normal text-gray-500"> / month</span>
        </p>
        <div className="flex items-center space-x-2">
          <Link 
            to={`/properties/${property.id}`}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            to={`/properties/${property.id}/edit`}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const LandlordProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await API.getMyProperties();
      
      if (error) throw new Error(error);
      
      setProperties(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties. Please try again.');
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = (deletedId) => {
    setProperties(prev => prev.filter(p => p.id !== deletedId));
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="default" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Properties</h1>
        <Link
          to="/properties/new"
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Property</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">You haven't listed any properties yet.</p>
          <Link
            to="/properties/new"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>List Your First Property</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard 
              key={property.id} 
              property={property} 
              onDelete={handleDeleteProperty}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LandlordProperties;
