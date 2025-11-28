import { trackEvent } from '../lib/posthog';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// CesiumJS is 100% FREE - no API token needed for default assets!
// Ion token is optional - only needed for premium Cesium Ion assets
// Default Bing Maps imagery is free

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
    const [selectedProperty, setSelectedProperty] = useState(null);

    // Normalize properties input
    const displayProperties = useMemo(() => {
        if (property) return [property];
        return properties;
    }, [property, properties]);

    // Calculate camera position based on zoom level
    // Zoom 11 ≈ 50km altitude, zoom 14 ≈ 15km altitude
    const getAltitudeFromZoom = (zoomLevel) => {
        return Math.pow(2, 20 - zoomLevel) * 156543.03392 / 2;
    };

    const cameraPosition = useMemo(() => {
        const altitude = getAltitudeFromZoom(property ? 14 : zoom);
        return Cartesian3.fromDegrees(center[1], center[0], altitude);
    }, [center, zoom, property]);

    const handlePropertyClick = useCallback((prop) => {
        setSelectedProperty(prop);
        trackEvent('map_marker_clicked', {
            property_id: prop.id,
            location: prop.location
        });
    }, []);

    const handlePropertyNavigate = useCallback((prop) => {
        trackEvent('property_card_clicked', {
            property_id: prop.id,
            source: 'map_popup'
        });
        navigate(`/properties/${prop.id}`, { state: { property: prop } });
    }, [navigate]);

    return (
        <div className={`${height} w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 relative`}>
            <Viewer
                full
                animation={false}
                baseLayerPicker={true}
                timeline={false}
                geocoder={false}
                homeButton={true}
                navigationHelpButton={false}
                sceneModePicker={true}
                selectionIndicator={false}
                infoBox={false}
                style={{ width: '100%', height: '100%' }}
            >
                {/* Globe with terrain */}
                <Globe
                    enableLighting={true}
                    showGroundAtmosphere={true}
                    atmosphereHueShift={0.0}
                    atmosphereSaturationShift={0.0}
                    atmosphereBrightnessShift={0.0}
                />

                {/* Fly to initial position */}
                <CameraFlyTo
                    destination={cameraPosition}
                    duration={0}
                />

                {/* Property Markers */}
                {!selectionMode && displayProperties.map((prop) => {
                    const hasCoords = prop.latitude && prop.longitude;
                    if (!hasCoords) return null;

                    const position = Cartesian3.fromDegrees(
                        prop.longitude,
                        prop.latitude,
                        0
                    );

                    return (
                        <Entity
                            key={prop.id}
                            position={position}
                            point={{
                                pixelSize: 12,
                                color: Color.fromCssColorString('#FF6B35'),
                                outlineColor: Color.WHITE,
                                outlineWidth: 2,
                                heightReference: 0, // CLAMP_TO_GROUND
                            }}
                            label={selectedProperty?.id === prop.id ? {
                                text: `${prop.title}\n₦${prop.price?.toLocaleString()}`,
                                font: '14px sans-serif',
                                fillColor: Color.WHITE,
                                outlineColor: Color.BLACK,
                                outlineWidth: 2,
                                style: 0, // FILL
                                verticalOrigin: 1, // BOTTOM
                                pixelOffset: new Cartesian2(0, -20),
                                showBackground: true,
                                backgroundColor: Color.fromCssColorString('rgba(0,0,0,0.7)'),
                                backgroundPadding: new Cartesian2(8, 4),
                            } : undefined}
                            onClick={() => handlePropertyClick(prop)}
                            onDoubleClick={() => handlePropertyNavigate(prop)}
                        />
                    );
                })}

                {/* Selection Marker */}
                {selectionMode && selectedLocation && (
                    <Entity
                        position={Cartesian3.fromDegrees(
                            selectedLocation.lng,
                            selectedLocation.lat,
                            0
                        )}
                        point={{
                            pixelSize: 15,
                            color: Color.fromCssColorString('#2563eb'),
                            outlineColor: Color.WHITE,
                            outlineWidth: 3,
                            heightReference: 0,
                        }}
                    />
                )}
            </Viewer>

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
