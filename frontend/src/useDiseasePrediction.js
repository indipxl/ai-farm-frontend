import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useDiseasePrediction() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLatestPrediction = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/disease-prediction/latest`);
      if (response.ok) {
        const data = await response.json();
        if (data) setPrediction(data);
      }
    } catch (err) {
      console.error("Failed to fetch latest prediction:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestPrediction();
  }, []);

  const analyzeDiseaseSpread = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/disease-prediction/analyze`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Analysis failed: ' + errorText);
      }
      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      console.error("Disease prediction error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { prediction, loading, error, analyzeDiseaseSpread };
}
