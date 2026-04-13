import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

const PROC_STEPS = ['Extracting visual features...', 'Checking disease patterns...', 'Cross-referencing pest database...', 'Generating recommendations...', 'Finalising analysis...'];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function useImageAnalysis(batchId) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisError, setAnalysisError] = useState(null);
    const [rawAnalysis, setRawAnalysis] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [currentStep, setCurrentStep] = useState(PROC_STEPS[0]);
    const [imageBase64, setImageBase64] = useState(null);
    const imageBase64Ref = useRef(null);

    const uploadAnalyzeImage = useCallback(async (file) => {
        if (!file) return;

        setIsAnalyzing(true);
        setAnalysisError(null);
        setAnalysisResult(null);
        setRawAnalysis(null);
        let stepIdx = 0;
        const iv = setInterval(() => {
            if (stepIdx < PROC_STEPS.length - 1) {
                setCurrentStep(PROC_STEPS[stepIdx++]);
            }
        }, 1000);

        // Convert to base64 for history storage (Awaited to ensure it's ready)
        const convertToBase64 = (f) => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result;
                setImageBase64(result);
                imageBase64Ref.current = result;
                resolve(result);
            };
            reader.readAsDataURL(f);
        });
        await convertToBase64(file);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/api/image/upload-image-analysis`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Analysis failed');

            const data = await response.json();
            clearInterval(iv);
            
            setRawAnalysis(data);
            setAnalysisResult({
                icon: data.status === 'healthy' ? '✅' : (data.status === 'danger' ? '⚠️' : '🔍'),
                title: data.detection,
                conf: `Confidence: ${data.confidence}%`,
                detail: data.detail,
                sugs: data.suggestions || []
            });
        } catch (error) {
            console.error(error);
            clearInterval(iv);
            setAnalysisResult({
                icon: '❌',
                title: 'Analysis Error',
                conf: '0%',
                detail: 'We encountered an error while processing the image. Please try again with a clearer photo.',
                sugs: ['Check internet connection', 'Try a closer shot', 'Ensure good lighting']
            });
            setAnalysisError(error.message);
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const createImageAnalysis = useCallback(async (analysisData) => {
        if (!analysisData || !batchId) {
            toast.error('Missing data or batch.');
            return false;
        }

        setIsSaving(true);
        setSaveError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/image/create-image-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batch_id: batchId,
                    detection: analysisData.detection,
                    confidence: analysisData.confidence,
                    status: analysisData.status,
                    detail: analysisData.detail,
                    suggestions: analysisData.suggestions,
                    image_base64: imageBase64Ref.current
                })
            });

            if (!response.ok) throw new Error('Failed to save');

            toast.success('AI Observation saved!');
            return true;
        } catch (error) {
            console.error(error);
            setSaveError(error.message);
            toast.error('Save failed.');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [batchId, imageBase64]);

    return {
        uploadAnalyzeImage,
        createImageAnalysis,
        isAnalyzing,
        analysisResult,
        analysisError,
        rawAnalysis,
        currentStep,
        isSaving,
        saveError
    };
}