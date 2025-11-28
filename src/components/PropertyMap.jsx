import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl, Layer, Source } from 'react-map-gl/maplibre';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import { trackEvent } from '../lib/posthog';
import 'maplibre-gl/dist/maplibre-gl.css';

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
    const mapRef = useRef(null);
    const [popupInfo, setPopupInfo] = useState(null);
    const [isInteracting, setIsInteracting] = useState(false);
    const [viewState, setViewState] = useState({
        latitude: center[0],
        longitude: center[1],
        zoom: zoom,
        pitch: 0,
        bearing: 0
    });

    // Normalize properties input
    const displayProperties = useMemo(() => {
        if (property) return [property];
        return properties;
    }, [property, properties]);

    // Update view state when center or property changes
    useEffect(() => {
        let newCenter = null;
        let newZoom = zoom;

        if (selectedLocation) {
            newCenter = { latitude: selectedLocation.lat, longitude: selectedLocation.lng };
            newZoom = 15; // Closer zoom for selected location
        } else if (property && property.latitude && property.longitude) {
            newCenter = { latitude: property.latitude, longitude: property.longitude };
            newZoom = 14; // Closer zoom for single property
        } else if (displayProperties.length > 0 && displayProperties[0].latitude) {
            newCenter = { latitude: displayProperties[0].latitude, longitude: displayProperties[0].longitude };
        } else if (center) {
            newCenter = { latitude: center[0], longitude: center[1] };
        }

        if (newCenter && mapRef.current) {
            // Smooth camera transition
            mapRef.current.flyTo({
                center: [newCenter.longitude, newCenter.latitude],
                zoom: newZoom,
                pitch: property ? 45 : 0, // Tilt for single property view
                duration: 2000,
                essential: true
            });
        }
    }, [center, property, selectedLocation, displayProperties, zoom]);

    // Auto-rotation when idle (for globe effect)
    useEffect(() => {
        if (isInteracting || selectionMode || viewState.zoom > 8) return;

        const rotationInterval = setInterval(() => {
            setViewState(prev => ({
                ...prev,
                bearing: (prev.bearing + 0.5) % 360
            }));
        }, 100);

        return () => clearInterval(rotationInterval);
    }, [isInteracting, selectionMode, viewState.zoom]);


    const onMapClick = useCallback((event) => {
        setIsInteracting(true);
        if (selectionMode && onLocationSelect) {
            const { lng, lat } = event.lngLat;
            onLocationSelect({ lat, lng });
        }
        // Resume auto-rotation after 5 seconds
        setTimeout(() => setIsInteracting(false), 5000);
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
                ref={mapRef}
                {...viewState}
                onMove={evt => {
                    setViewState(evt.viewState);
                    setIsInteracting(true);
                    setTimeout(() => setIsInteracting(false), 5000);
                }}
                onMouseDown={() => setIsInteracting(true)}
                onTouchStart={() => setIsInteracting(true)}
                onWheel={() => setIsInteracting(true)}
                style={{ width: '100%', height: '100%' }}
                mapStyle="https://demotiles.maplibre.org/style.json"
                projection="globe" // Enable 3D Globe
                onClick={onMapClick}
                minZoom={1}
                maxZoom={20}
                maxPitch={85}
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
