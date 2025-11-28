import React, { useState, useCallback, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl/maplibre';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import { trackEvent } from '../lib/posthog';
import 'maplibre-gl/dist/maplibre-gl.css';

// 100% FREE MapLibre - No API keys needed!
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
        zoom: property ? zoom : 2.5 // Full globe view by default, zoom in for single property
    });

    // Normalize properties input
    const displayProperties = useMemo(() => {
        if (property) return [property];
        return properties;
    }, [property, properties]);

    const onMapClick = useCallback((event) => {
        if (selectionMode && onLocationSelect) {
            const { lng, lat } = event.lngLat;
            onLocationSelect({ lat, lng });
        }
    }, [selectionMode, onLocationSelect]);

    const markers = useMemo(() => displayProperties.map((prop) => {
        const hasCoords = prop.latitude && prop.longitude;
        const lat = hasCoords ? prop.latitude : (center[0] + (Math.random() - 0.5) * 0.02);
        const lng = hasCoords ? prop.longitude : (center[1] + (Math.random() - 0.5) * 0.02);

        return (
            <Marker
                key={prop.id}
                longitude={lng}
                latitude={lat}
                anchor="bottom"
                onClick={e => {
                    e.originalEvent.stopPropagation();
                    setPopupInfo(prop);
                    trackEvent('map_marker_clicked', {
                        property_id: prop.id,
                        location: prop.location
                    });
                }}
            >
                <div className="cursor-pointer transform hover:scale-110 transition-transform">
                    <div className="bg-[#FF6B35] text-white p-1.5 rounded-full shadow-lg border-2 border-white">
                        <MapPin className="w-5 h-5" />
                    </div>
                </div>
            </Marker>
        );
    }), [displayProperties, center]);

    return (
        <div className={`${height} w-full relative`}>
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{ width: '100%', height: '100%' }}
                mapStyle={{
                    version: 8,
                    sources: {
                        'satellite': {
                            type: 'raster',
                            tiles: [
                                'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                            ],
                            tileSize: 256
                        }
                    },
                    layers: [
                        {
                            id: 'satellite',
                            type: 'raster',
                            source: 'satellite'
                        }
                    ]
                }}
                projection="globe" // 3D globe projection
                onClick={onMapClick}
                minZoom={1}
                maxZoom={18}
            >
                <NavigationControl position="top-right" showCompass={true} showZoom={true} />
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
                        longitude={popupInfo.longitude || (center[1] + (Math.random() - 0.5) * 0.02)}
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
