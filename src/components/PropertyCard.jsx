import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bed, Bath, Ruler, Heart, GitCompare, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PropertyCard = ({ property, onSave, isSaved, onCompare, inComparison = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleSaveClick = (e) => {
    e.stopPropagation();
    if (onSave) {
      onSave(property.id);
    }
  };

  const handleCompareClick = (e) => {
    e.stopPropagation();
    if (onCompare) {
      onCompare(property.id);
    }
  };

  const handleCardClick = () => {
    if (isAuthenticated) {
      // Track property view
      navigate(`/properties/${property.id}`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={handleCardClick}>
      <div className="relative">
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <div className="text-gray-400 text-4xl">🏠</div>
          </div>
        )}

        {/* Property Type Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            property.listing_type === 'for-rent'
              ? 'bg-blue-500 text-white'
              : 'bg-green-500 text-white'
          }`}>
            {property.listing_type === 'for-rent' ? 'For Rent' : 'For Sale'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex space-x-2">
          <button
            onClick={handleSaveClick}
            className={`p-2 rounded-full shadow-md hover:shadow-lg transition-shadow ${
              isSaved ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>

          {!inComparison && (
            <button
              onClick={handleCompareClick}
              className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow text-gray-600 hover:bg-gray-50"
            >
              <GitCompare className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {property.title || 'Untitled Property'}
          </h3>
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="text-sm">{property.location || 'Location not specified'}</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xl font-bold text-[#FF6B35]">
            ₦{property.price?.toLocaleString() || '0'}
          </div>
          {property.listing_type === 'for-rent' && (
            <div className="text-sm text-gray-600">per month</div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Bed className="w-4 h-4 mr-1" />
              <span>{property.bedrooms || property.rooms || 0}</span>
            </div>
            <div className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              <span>{property.bathrooms || 0}</span>
            </div>
            {property.area && (
              <div className="flex items-center">
                <Ruler className="w-4 h-4 mr-1" />
                <span>{property.area} sq ft</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="flex-1 bg-[#FF6B35] text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
