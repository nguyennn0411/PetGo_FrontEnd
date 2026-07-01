import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const pickupIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const haversineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const DraggableMarker = ({ position, onMove }) => {
    const markerRef = useRef(null);

    useMapEvents({
        click(e) {
            onMove(e.latlng.lat, e.latlng.lng);
        },
    });

    const eventHandlers = {
        dragend() {
            const marker = markerRef.current;
            if (marker) {
                const latlng = marker.getLatLng();
                onMove(latlng.lat, latlng.lng);
            }
        },
    };

    return (
        <Marker
            draggable
            ref={markerRef}
            position={position}
            icon={defaultIcon}
            eventHandlers={eventHandlers}
        >
            <Popup>
                <div className="text-sm font-semibold">
                    Vị trí: {position[0].toFixed(6)}, {position[1].toFixed(6)}
                </div>
            </Popup>
        </Marker>
    );
};

const PickupMarker = ({ position, label }) => {
    if (!position) return null;
    return (
        <Marker position={position} icon={pickupIcon}>
            <Popup>
                <div className="text-sm font-semibold">{label || 'Điểm đón'}</div>
            </Popup>
        </Marker>
    );
};

const MapBoundsSetter = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, bounds]);
    return null;
};

const LocationPicker = ({
    initialLat = 10.8231,
    initialLng = 106.6297,
    pickupLat,
    pickupLng,
    pickupLabel = 'Điểm đón',
    onLocationChange,
    height = 400,
    searchEnabled = true,
    draggable = true,
    showDistance = true,
}) => {
    const [position, setPosition] = useState([initialLat, initialLng]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [distance, setDistance] = useState(null);
    const [address, setAddress] = useState('');
    const searchTimeout = useRef(null);

    const handleMove = useCallback((lat, lng) => {
        setPosition([lat, lng]);
        onLocationChange?.(lat, lng);

        if (pickupLat != null && pickupLng != null) {
            const dist = haversineDistance(pickupLat, pickupLng, lat, lng);
            setDistance(dist);
        }

        fetchAddress(lat, lng);
    }, [pickupLat, pickupLng, onLocationChange]);

    useEffect(() => {
        if (pickupLat != null && pickupLng != null && position) {
            const dist = haversineDistance(pickupLat, pickupLng, position[0], position[1]);
            setDistance(dist);
        }
    }, [pickupLat, pickupLng, position]);

    const fetchAddress = async (lat, lng) => {
        try {
            const res = await fetch(
                `/geocode/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`
            );
            const data = await res.json();
            if (data.display_name) {
                setAddress(data.display_name);
                setSearchQuery(data.display_name);
            }
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        setPosition([initialLat, initialLng]);
        fetchAddress(initialLat, initialLng);
        if (pickupLat != null && pickupLng != null) {
            setDistance(haversineDistance(pickupLat, pickupLng, initialLat, initialLng));
        }
    }, [initialLat, initialLng, pickupLat, pickupLng]);

    const handleSearch = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await fetch(
                `/geocode/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=vi`
            );
            const data = await res.json();
            setSearchResults(data || []);
        } catch {
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleSearchInput = (value) => {
        setSearchQuery(value);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => handleSearch(value), 600);
    };

    const selectSearchResult = (result) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setPosition([lat, lng]);
        setSearchQuery(result.display_name || '');
        setSearchResults([]);
        onLocationChange?.(lat, lng);
        setAddress(result.display_name || '');
        if (pickupLat != null && pickupLng != null) {
            setDistance(haversineDistance(pickupLat, pickupLng, lat, lng));
        }
    };

    const pickupPosition = pickupLat != null && pickupLng != null ? [pickupLat, pickupLng] : null;
    const bounds = pickupPosition
        ? L.latLngBounds([position, pickupPosition])
        : L.latLngBounds([position]);

    const distanceText = distance != null
        ? distance < 1
            ? `${Math.round(distance * 1000)} m`
            : `${distance.toFixed(1)} km`
        : null;

    return (
        <div className="location-picker" style={{ width: '100%' }}>
            {searchEnabled && (
                <div style={{ position: 'relative', marginBottom: 8 }}>
                    <input
                        type="text"
                        placeholder="Tìm kiếm địa chỉ..."
                        value={searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #ddd',
                            borderRadius: 8,
                            fontSize: 14,
                        }}
                    />
                    {searching && (
                        <span style={{ position: 'absolute', right: 12, top: 12, fontSize: 12, color: '#999' }}>
                            Đang tìm...
                        </span>
                    )}
                    {searchResults.length > 0 && (
                        <ul
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: '#fff',
                                border: '1px solid #ddd',
                                borderRadius: 8,
                                zIndex: 1000,
                                maxHeight: 200,
                                overflowY: 'auto',
                                listStyle: 'none',
                                padding: 0,
                                margin: '4px 0 0',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            }}
                        >
                            {searchResults.map((result, idx) => (
                                <li
                                    key={idx}
                                    onClick={() => selectSearchResult(result)}
                                    style={{
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        borderBottom: idx < searchResults.length - 1 ? '1px solid #f0f0f0' : 'none',
                                        fontSize: 13,
                                        lineHeight: 1.4,
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                                >
                                    {result.display_name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <div style={{ height, borderRadius: 12, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                <MapContainer
                    center={position}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapBoundsSetter bounds={bounds} />
                    {draggable && (
                        <DraggableMarker position={position} onMove={handleMove} />
                    )}
                    {pickupPosition && (
                        <PickupMarker position={pickupPosition} label={pickupLabel} />
                    )}
                </MapContainer>
            </div>

            <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: 13, color: '#555', flexWrap: 'wrap' }}>
                <div>
                    <strong>Tọa độ:</strong> {position[0].toFixed(6)}, {position[1].toFixed(6)}
                </div>
                {showDistance && distanceText && (
                    <div>
                        <strong>Khoảng cách đến điểm đón:</strong>{' '}
                        <span style={{ color: '#f97316', fontWeight: 700 }}>{distanceText}</span>
                    </div>
                )}
                {address && (
                    <div style={{ width: '100%', fontSize: 12, color: '#888' }}>
                        <strong>Địa chỉ:</strong> {address}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocationPicker;
