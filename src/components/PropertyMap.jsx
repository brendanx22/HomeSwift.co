import React, { useState, useCallback, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl/mapbox';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import { trackEvent } from '../lib/posthog';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox Token
const MAPBOX_TOKEN = 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbTFrOXo0bW4wNHVqMmtzNHRqN2VlcWJnIn0.r7l1-TSHXWKQ2NNFUwFCfA';

const PropertyMap = ({
    properties = [],
    property = null,
    center = [6.5244, 3.3792], // Default to Lagos [lat, lng]
    zoom = 11,
    selectionMode = false,
    onLocationSelect,
    selectedLocation,
    height = "h-[calc(100vh-180px)]"
}) => {
    const navigate = useNavigate();
    const [popupInfo, setPopupInfo] = useState(null);
    const [viewState, setViewState] = useState({
        latitude: center[0],
        longitude: center[1],
        zoom: zoom
    });

    // Normalize properties input
    const displayProperties = useMemo(() => {
        if (property) return [property];
        return properties;
    }, [property, properties]);

    // Update view state when center or property changes
    React.useEffect(() => {
        let newCenter = null;

        if (selectedLocation) {
            newCenter = { latitude: selectedLocation.lat, longitude: selectedLocation.lng };
        } else if (property && property.latitude && property.longitude) {
            newCenter = { latitude: property.latitude, longitude: property.longitude };
        } else if (displayProperties.length > 0 && displayProperties[0].latitude) {
            newCenter = { latitude: displayProperties[0].latitude, longitude: displayProperties[0].longitude };
        } else if (center) {
            newCenter = { latitude: center[0], longitude: center[1] };
        }

        if (newCenter) {
            setViewState(prev => ({
                ...prev,
                ...newCenter,
                zoom: zoom // Reset zoom on center change if desired, or keep prev.zoom
            }));
        }
    }, [center, property, selectedLocation, displayProperties, zoom]);


    const onMapClick = useCallback((event) => {
        if (selectionMode && onLocationSelect) {
            const { lng, lat } = event.lngLat;
            onLocationSelect({ lat, lng });
        }
    }, [selectionMode, onLocationSelect]);

    const markers = useMemo(() => displayProperties.map((prop) => {
        const hasCoords = prop.latitude && prop.longitude;
        // Use random offset if no coords (for demo data only) - ideally we filter these out
        // But for consistency with previous implementation:
        const lat = hasCoords ? prop.latitude : (center[0] + (Math.random() - 0.5) * 0.02);
        const lng = hasCoords ? prop.longitude : (center[1] + (Math.random() - 0.5) * 0.02);

        return (
            <Marker
                key={prop.id}
                longitude={lng}
                latitude={lat}
                anchor="bottom"
                onClick={e => {
                    // If we let the click propagate, it might trigger the map click handler
                    e.originalEvent.stopPropagation();
                    setPopupInfo(prop);
                    trackEvent('map_marker_clicked', {
                        property_id: prop.id,
                        location: prop.location
                    });
                }}
            >
                <div className="cursor-pointer transform hover:scale-110 transition-transform">
                    {/* Custom Marker Pin */}
                    <div className="bg-[#FF6B35] text-white p-1.5 rounded-full shadow-lg border-2 border-white">
                        <MapPin className="w-5 h-5" />
                    </div>
                    {/* Price Tag (optional, maybe too cluttered for many markers) */}
                    {/* <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-gray-900 text-xs font-bold px-2 py-1 rounded shadow-md whitespace-nowrap">
                        ₦{prop.price?.toLocaleString()}
                    </div> */}
                </div>
            </Marker>
        );
    }), [displayProperties, center]);

    return (
        <div className={`${height} w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 relative`}>
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={MAPBOX_TOKEN}
                projection="globe" // Enable 3D Globe
                onClick={onMapClick}
                fog={{
                    "range": [0.5, 10],
                    "color": "#ffffff",
                    "horizon-blend": 0.05,
                    "high-color": "#245cdf",
                    "space-color": "#000000",
                    "star-intensity": 0.15
                }}
                terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
            >
                <NavigationControl position="top-right" />
                <FullscreenControl position="top-right" />
                <ScaleControl />

                {/* Selection Marker */}
                {selectionMode && selectedLocation && (
                    <Marker
                        longitude={selectedLocation.lng}
                        latitude={selectedLocation.lat}
                        anchor="bottom"
                        draggable
                        onDragEnd={evt => {
                            if (onLocationSelect) {
                                onLocationSelect({ lat: evt.lngLat.lat, lng: evt.lngLat.lng });
                            }
                        }}
                    >
                        <div className="cursor-pointer">
                            <MapPin className="w-8 h-8 text-blue-600 fill-blue-600 drop-shadow-lg" />
                        </div>
                    </Marker>
                )}

                {/* Property Markers */}
                {!selectionMode && markers}

                {/* Popup */}
                {popupInfo && (
                    <Popup
                        anchor="top"
                        longitude={popupInfo.longitude || (center[1] + (Math.random() - 0.5) * 0.02)} // Fallback logic same as marker
                        latitude={popupInfo.latitude || (center[0] + (Math.random() - 0.5) * 0.02)}
                        onClose={() => setPopupInfo(null)}
                        maxWidth="300px"
                        className="rounded-xl"
                    >
                        <div
                            className="cursor-pointer p-1"
                            onClick={() => {
                                trackEvent('property_card_clicked', {
                                    property_id: popupInfo.id,
                                    source: 'map_popup'
                                });
                                navigate(`/properties/${popupInfo.id}`, { state: { property: popupInfo } });
                            }}
                        >
                            <div className="relative h-32 w-full mb-2 rounded-lg overflow-hidden">
                                <img
                                    src={popupInfo.images?.[0] || '/placeholder-house.jpg'}
                                    alt={popupInfo.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                                    ₦{popupInfo.price?.toLocaleString()}
                                </div>
                            </div>
                            <h3 className="font-bold text-gray-900 truncate text-sm">{popupInfo.title}</h3>
                            <div className="flex items-center text-xs text-gray-600 mt-1">
                                {popupInfo.rating ? (
                                    <>
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                                        <span>{popupInfo.rating} ({popupInfo.reviews_count || 0})</span>
                                        <span className="mx-1">•</span>
                                    </>
                                ) : null}
                                <span>{popupInfo.property_type}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 truncate">{popupInfo.location}</p>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
};

export default PropertyMap;
