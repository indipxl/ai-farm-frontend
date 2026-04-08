import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function useSensors() {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSensors();
  }, []);

  const fetchSensors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/sensors/`);
      if (!response.ok) {
        throw new Error('Failed to fetch sensors');
      }
      const data = await response.json();
      setSensors(data.sensors || []);
    } catch (err) {
      console.error('Fetch sensors error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { sensors, loading, error };
}
