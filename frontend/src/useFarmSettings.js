import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useFarmSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSettings();
    
    // Listen for cross-component updates
    const handleSettingsUpdate = (e) => {
        if (e.detail) setSettings(e.detail);
    };
    window.addEventListener('farmSettingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('farmSettingsUpdated', handleSettingsUpdate);
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/farm-settings`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Failed to fetch settings: ' + errorText);
      }
      const result = await response.json();
      setSettings(result);
      window.dispatchEvent(new CustomEvent('farmSettingsUpdated', { detail: result }));
    } catch (err) {
      console.error('Fetch settings error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/farm-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Update settings failed: ' + errorText);
      }
      await fetchSettings();
      return true;
    } catch (err) {
      console.error('Update settings error:', err);
      throw err;
    }
  };

  return { settings, loading, error, refetch: fetchSettings, updateSettings };
}
