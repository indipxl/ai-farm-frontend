import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function useBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/batches`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Failed to fetch: ' + errorText);
      }
      const result = await response.json();
      setBatches(result.batches || []);
    } catch (err) {
      console.error('Fetch batches error:', err);
      setError(err.message);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const addBatch = async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/register-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Add batch failed: ' + errorText);
      }
      const newBatch = await response.json();
      fetchBatches();
      return newBatch;
    } catch (err) {
      console.error('Add batch error:', err);
      throw err;
    }
  };

  const updateBatch = async (batchId, formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/batches/${batchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Update failed: ' + errorText);
      }
      const updatedBatch = await response.json();
      fetchBatches();
      return updatedBatch;
    } catch (err) {
      console.error('Update batch error:', err);
      throw err;
    }
  };

  const deleteBatch = async (batchId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/batches/${batchId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Delete failed: ' + errorText);
      }
      fetchBatches();
    } catch (err) {
      console.error('Delete batch error:', err);
      throw err;
    }
  };

  return { batches, loading, error, refetch: fetchBatches, addBatch, updateBatch, deleteBatch };
}
