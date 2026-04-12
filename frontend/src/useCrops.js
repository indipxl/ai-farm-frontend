
import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const useCrops = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    console.log('Executing fetchCrops...');
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/crops/`);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch: ${response.status} ${errText}`);
      }
      const result = await response.json();
      console.log('Fetched crops result:', result);
      setCrops(result.crops || []);
    } catch (err) {
      console.error('Fetch crops error:', err);
      setError(err.message);
      setCrops([]);
    } finally {
      setLoading(false);
    }
  };

  const createCrop = async (crop) => {
    const response = await fetch(`${API_BASE_URL}/api/crops/create-crops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(crop)
    });
    if (!response.ok) throw new Error('Create failed');
    fetchCrops();
  };

  const updateCrop = async (id, crop) => {
    const response = await fetch(`${API_BASE_URL}/api/crops/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(crop)
    });
    if (!response.ok) throw new Error('Update failed');
    fetchCrops();
  };

  const deleteCrop = async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/crops/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Delete failed');
    fetchCrops();
  };

  return { crops, loading, error, refetch: fetchCrops, createCrop, updateCrop, deleteCrop };
};

