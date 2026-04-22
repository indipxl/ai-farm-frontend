import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { useFarmSettings } from '../useFarmSettings';
import FieldMap from '../components/FieldMap';
import '../farmsense.css';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function FarmLayout() {
  const { settings, loading, updateSettings } = useFarmSettings();
  const [position, setPosition] = useState(null);
  const [orientation, setOrientation] = useState('North');
  const [environmentType, setEnvironmentType] = useState('open_air');
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (settings) {
      setPosition([settings.location_lat || 5.9788, settings.location_lng || 116.0753]);
      setOrientation(settings.orientation || 'North');
      setEnvironmentType(settings.environment_type || 'open_air');
      setFarmName(settings.farm_name || '');
      setFarmLocation(settings.farm_location || '');
    }
  }, [settings]);

  const handleLocationSelect = async (lat, lng) => {
    setPosition([lat, lng]);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      if (data && data.address) {
        const city = data.address.city || data.address.town || data.address.village || data.address.county || "";
        const state = data.address.state || "";
        const country = data.address.country || "";

        let parts = [];
        if (city) parts.push(city);
        if (state && state !== city) parts.push(state);
        if (country) parts.push(country);

        if (parts.length > 0) {
          setFarmLocation(parts.join(', '));
          toast.success('Location auto-detected!');
        }
      }
    } catch (e) {
      console.error("Reverse geocoding failed", e);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await updateSettings({
        ...settings, // Preserve existing blocks and num_blocks
        location_lat: position ? position[0] : 5.9788,
        location_lng: position ? position[1] : 116.0753,
        orientation,
        environment_type: environmentType,
        farm_name: farmName,
        farm_location: farmLocation
      });
      toast.success('Farm location and orientation saved');
    } catch (err) {
      toast.error('Failed to save configuration');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="fs-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><div className="fs-spinner"></div></div>;
  }
  const defaultCenter = [5.9788, 116.0753]; // Default to Kota Kinabalu

  return (
    <>
      <div className="fs-page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="fs-page-title">Farm <em>Layout</em></h1>
          <p className="fs-page-sub">Configure your physical farm layout, location, and orientation.</p>
        </div>
      </div>

      <div className="fs-card">
        <div className="fs-card__body" style={{ padding: '2rem' }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Identity */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <label style={{ fontWeight: 600, color: 'var(--charcoal)' }}>Farm Name</label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="e.g. Ai Farm"
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <label style={{ fontWeight: 600, color: 'var(--charcoal)' }}>Location Descriptor</label>
                <input
                  type="text"
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                  placeholder="e.g. Kota Kinabalu · KK-001"
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#fff' }}
                />
              </div>
            </div>
            {/* Orientation */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <label style={{ fontWeight: 600, color: 'var(--charcoal)' }}>Farm Orientation</label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#fff' }}
                >
                  <option value="North">North-facing</option>
                  <option value="East">East-facing</option>
                  <option value="South">South-facing</option>
                  <option value="West">West-facing</option>
                </select>
              </div>

              {/* Environment Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <label style={{ fontWeight: 600, color: 'var(--charcoal)' }}>Environment Type</label>
                <select
                  value={environmentType}
                  onChange={(e) => setEnvironmentType(e.target.value)}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#fff' }}
                >
                  <option value="open_air">Open Air / Field</option>
                  <option value="greenhouse">Inside Greenhouse</option>
                </select>
              </div>
            </div>

            {/* Map Location */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, color: 'var(--charcoal)' }}>Location (Click on map to drop a pin)</label>
              <div style={{ height: '350px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <MapContainer center={position || defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <LocationMarker position={position} onLocationSelect={handleLocationSelect} />
                </MapContainer>
              </div>
              {position && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Selected Coordinates: {position[0].toFixed(5)}, {position[1].toFixed(5)}
                </span>
              )}
            </div>

            <div className="fs-grid-2">
              <FieldMap batches={[]} editMode={true} />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: 'var(--charcoal)',
                color: '#fff',
                borderRadius: '8px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                marginLeft: 'auto',
                padding: '0.75rem 1.5rem',
                alignSelf: 'flex-end'
              }}
            >
              {submitting ? 'Saving Location & Orientation...' : 'Save Configuration'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
