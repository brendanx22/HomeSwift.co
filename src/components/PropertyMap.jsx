import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
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
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

// Component to handle map clicks for location selection
const LocationSelector = ({ onSelect }) => {
    useMapEvents({
        click(e) {
            onSelect(e.latlng);
        },
    });
    return null;
};

const PropertyMap = ({
    properties = [],
    property = null,
    center = [6.5244, 3.3792], // Default to Lagos
    zoom = 13,
    selectionMode = false,
    onLocationSelect,
    selectedLocation,
    height = "h-[calc(100vh-180px)]"
}) => {
    const navigate = useNavigate();
    const [activeProperty, setActiveProperty] = useState(null);

    // Normalize properties input
    const displayProperties = property ? [property] : properties;

    // Determine center
    let mapCenter = center;
    if (selectedLocation) {
        mapCenter = [selectedLocation.lat, selectedLocation.lng];
    } else if (property && property.latitude && property.longitude) {
        mapCenter = [property.latitude, property.longitude];
    } else if (displayProperties.length > 0 && displayProperties[0].latitude) {
        // If first property has coords, use it
        mapCenter = [displayProperties[0].latitude, displayProperties[0].longitude];
    }

    return (
        <div className={`${height} w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 relative z-0`}>
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

                {selectionMode && onLocationSelect && (
                    <LocationSelector onSelect={onLocationSelect} />
                )}

                {/* Render Selection Marker */}
                {selectionMode && selectedLocation && (
                    <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
                )}

                {/* Render Property Markers */}
                {!selectionMode && displayProperties.map((prop) => {
                    // Skip if no coordinates and not in demo mode (though we fallback to random for demo)
                    // For this implementation, we'll use 0,0 or skip if missing, 
                    // but for existing data without coords we might want to keep the random offset logic 
                    // OR just show nothing. Let's keep the random offset for now to avoid empty maps 
                    // for existing demo data, but strictly use real coords if available.

                    const hasCoords = prop.latitude && prop.longitude;
                    const lat = hasCoords ? prop.latitude : (mapCenter[0] + (Math.random() - 0.5) * 0.02);
                    const lng = hasCoords ? prop.longitude : (mapCenter[1] + (Math.random() - 0.5) * 0.02);

                    return (
                        <Marker
                            key={prop.id}
                            position={[lat, lng]}
                            eventHandlers={{
                                click: () => {
                                    setActiveProperty(prop);
                                    trackEvent('map_marker_clicked', {
                                        property_id: prop.id,
                                        location: prop.location
                                    });
                                },
                            }}
                        >
                            <Popup className="min-w-[250px]">
                                <div
                                    className="cursor-pointer"
                                    onClick={() => {
                                        trackEvent('property_card_clicked', {
                                            property_id: prop.id,
                                            source: 'map_popup'
                                        });
                                        navigate(`/properties/${prop.id}`, { state: { property: prop } });
                                    }}
                                >
                                    <div className="relative h-32 w-full mb-2 rounded-lg overflow-hidden">
                                        <img
                                            src={prop.images?.[0] || '/placeholder-house.jpg'}
                                            alt={prop.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                                            ₦{prop.price?.toLocaleString()}
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-gray-900 truncate">{prop.title}</h3>
                                    <div className="flex items-center text-sm text-gray-600 mt-1">
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                                        <span>4.8 (12)</span>
                                        <span className="mx-1">•</span>
                                        <span>{prop.property_type}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 truncate">{prop.location}</p>
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
