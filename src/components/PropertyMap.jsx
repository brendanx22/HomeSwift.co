import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Viewer, Cartesian3, Color, ScreenSpaceEventType, defined, Ion } from 'cesium';
import { trackEvent } from '../lib/posthog';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Disable Cesium Ion (we'll use free OSM imagery instead)
Ion.defaultAccessToken = '';

// 100% FREE CesiumJS - No external dependencies!
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
    const viewerRef = useRef(null);
    const containerRef = useRef(null);
    const [selectedProperty, setSelectedProperty] = useState(null);

    // Initialize Cesium Viewer
    useEffect(() => {
        if (!containerRef.current || viewerRef.current) return;

        try {
            const viewer = new Viewer(containerRef.current, {
                // UI controls
                animation: false,
                baseLayerPicker: false, // Disable to avoid Ion dependency
                timeline: false,
                geocoder: false,
                homeButton: true,
                navigationHelpButton: false,
                sceneModePicker: true,
                selectionIndicator: false,
                infoBox: false,
                // Disable features that require external data
                terrainProvider: undefined,
                skyBox: false,
                skyAtmosphere: false,
            });

            // Disable lighting to avoid external data dependencies
            viewer.scene.globe.enableLighting = false;
            viewer.scene.globe.showGroundAtmosphere = true;

            viewerRef.current = viewer;

            // Set initial camera position
            const altitude = Math.pow(2, 20 - (property ? 14 : zoom)) * 156543.03392 / 2;
            viewer.camera.setView({
                destination: Cartesian3.fromDegrees(center[1], center[0], altitude)
            });

        } catch (error) {
            console.error('Error initializing Cesium:', error);
        }

        return () => {
            if (viewerRef.current) {
                try {
                    viewerRef.current.destroy();
                } catch (e) {
                    console.error('Error destroying viewer:', e);
                }
                viewerRef.current = null;
            }
        };
    }, []);

    // Add property markers
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        // Clear existing entities
        viewer.entities.removeAll();

        // Add property markers
        const displayProperties = property ? [property] : properties;

        displayProperties.forEach((prop) => {
            if (!prop.latitude || !prop.longitude) return;

            viewer.entities.add({
                id: prop.id,
                position: Cartesian3.fromDegrees(prop.longitude, prop.latitude),
                point: {
                    pixelSize: 12,
                    color: Color.fromCssColorString('#FF6B35'),
                    outlineColor: Color.WHITE,
                    outlineWidth: 2,
                },
                properties: prop
            });
        });

        // Add selection marker if in selection mode
        if (selectionMode && selectedLocation) {
            viewer.entities.add({
                id: 'selection-marker',
                position: Cartesian3.fromDegrees(selectedLocation.lng, selectedLocation.lat),
                point: {
                    pixelSize: 15,
                    color: Color.fromCssColorString('#2563eb'),
                    outlineColor: Color.WHITE,
                    outlineWidth: 3,
                },
            });
        }

        // Handle entity clicks
        const handler = viewer.screenSpaceEventHandler;
        handler.setInputAction((click) => {
            const pickedObject = viewer.scene.pick(click.position);

            if (defined(pickedObject) && pickedObject.id && pickedObject.id.properties) {
                const entityProps = pickedObject.id.properties;
                const prop = {
                    id: pickedObject.id.id,
                    title: entityProps.title?._value || '',
                    location: entityProps.location?._value || '',
                    price: entityProps.price?._value || 0,
                    images: entityProps.images?._value || [],
                    property_type: entityProps.property_type?._value || ''
                };

                setSelectedProperty(prop);
                trackEvent('map_marker_clicked', {
                    property_id: prop.id,
                    location: prop.location
                });
            }
        }, ScreenSpaceEventType.LEFT_CLICK);

    }, [properties, property, selectedLocation, selectionMode]);

    const handlePropertyNavigate = (prop) => {
        trackEvent('property_card_clicked', {
            property_id: prop.id,
            source: 'map_popup'
        });
        navigate(`/properties/${prop.id}`, { state: { property: prop } });
    };

    return (
        <div className={`${height} w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 relative`}>
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

            {/* Property Info Popup Overlay */}
            {selectedProperty && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl p-4 max-w-sm z-50">
                    <button
                        onClick={() => setSelectedProperty(null)}
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                    <div
                        className="cursor-pointer"
                        onClick={() => handlePropertyNavigate(selectedProperty)}
                    >
                        <div className="relative h-32 w-full mb-2 rounded-lg overflow-hidden">
                            <img
                                src={selectedProperty.images?.[0] || '/placeholder-house.jpg'}
                                alt={selectedProperty.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                                ₦{selectedProperty.price?.toLocaleString()}
                            </div>
                        </div>
                        <h3 className="font-bold text-gray-900 truncate text-sm">
                            {selectedProperty.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                            {selectedProperty.location}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                            {selectedProperty.property_type}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyMap;
