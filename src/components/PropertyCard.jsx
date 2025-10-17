import React from 'react';
import { Link } from 'react-router-dom';
import { Bed, Bath, Ruler, Heart } from 'lucide-react';

const PropertyCard = ({ property, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(property.id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={handleClick}>
      <div className="relative">
        <img
          src={property.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"}
          alt={property.title}
          className="w-full h-48 object-cover"
        />
        <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
          <Heart className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{property.title}</h3>
          <span className="text-lg font-bold text-indigo-600">${property.price}/mo</span>
        </div>

        <p className="text-gray-600 text-sm mb-4">{property.address || property.location}</p>

        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Bed className="w-4 h-4 mr-1" />
            <span>{property.bedrooms || "N/A"}</span>
          </div>
          <div className="flex items-center">
            <Bath className="w-4 h-4 mr-1" />
            <span>{property.bathrooms || "N/A"}</span>
          </div>
          <div className="flex items-center">
            <Ruler className="w-4 h-4 mr-1" />
            <span>{property.area || "N/A"} sqft</span>
          </div>
        </div>

        <Link
          to={`/property/${property.id}`}
          className="mt-4 block w-full text-center bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default PropertyCard;
