import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { Star, Home } from 'lucide-react';
import { trackEvent } from '../lib/posthog';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to update map center when properties change
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
};

const PropertyMap = ({ properties, center = [6.5244, 3.3792], zoom = 12 }) => {
    const navigate = useNavigate();
    const [activeProperty, setActiveProperty] = useState(null);

    // Default to Lagos coordinates if no center provided
    const mapCenter = center || [6.5244, 3.3792];

    return (
        <div className="h-[calc(100vh-180px)] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 relative z-0">
            <MapContainer
                center={mapCenter}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapUpdater center={mapCenter} />

                {properties.map((property) => {
                    // Skip if no coordinates (in a real app, you'd geocode the address)
                    // For now, we'll generate random offsets from the center if no coords
                    // This is just for demonstration purposes
                    const lat = property.latitude || (mapCenter[0] + (Math.random() - 0.5) * 0.1);
                    const lng = property.longitude || (mapCenter[1] + (Math.random() - 0.5) * 0.1);

                    return (
                        <Marker
                            key={property.id}
                            position={[lat, lng]}
                            eventHandlers={{
                                click: () => {
                                    setActiveProperty(property);
                                    trackEvent('map_marker_clicked', {
                                        property_id: property.id,
                                        location: property.location
                                    });
                                },
                            }}
                        >
                            <Popup className="min-w-[250px]">
                                <div
                                    className="cursor-pointer"
                                    onClick={() => {
                                        trackEvent('property_card_clicked', {
                                            property_id: property.id,
                                            source: 'map_popup'
                                        });
                                        navigate(`/properties/${property.id}`, { state: { property } });
                                    }}
                                >
                                    <div className="relative h-32 w-full mb-2 rounded-lg overflow-hidden">
                                        <img
                                            src={property.images?.[0] || '/placeholder-house.jpg'}
                                            alt={property.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                                            ₦{property.price?.toLocaleString()}
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-gray-900 truncate">{property.title}</h3>
                                    <div className="flex items-center text-sm text-gray-600 mt-1">
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                                        <span>4.8 (12)</span>
                                        <span className="mx-1">•</span>
                                        <span>{property.property_type}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 truncate">{property.location}</p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default PropertyMap;
