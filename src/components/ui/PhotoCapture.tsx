'use client';

import React, { useState, useRef } from 'react';
import { Camera, AlertTriangle, CheckCircle2, Trash2, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface PhotoCaptureData {
  file: File | null;
  previewUrl: string | null;
  dataUrl?: string | null;
  fileUrl?: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: string | null;
  isGpsMissing: boolean;
}

export interface PhotoCaptureProps {
  label?: string;
  labelHi?: string;
  labelEn?: string;
  required?: boolean;
  onPhotoCaptured?: (data: PhotoCaptureData) => void;
  onCapture?: (data: PhotoCaptureData) => void;
  error?: string;
  initialPreviewUrl?: string;
  initialImageUrl?: string;
  capturedUrl?: string;
  className?: string;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  label,
  labelHi,
  labelEn,
  required = false,
  onPhotoCaptured,
  onCapture,
  error,
  initialPreviewUrl,
  initialImageUrl,
  capturedUrl,
  className = '',
}) => {
  const { lang, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialUrl = capturedUrl || initialPreviewUrl || initialImageUrl || null;
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [gpsData, setGpsData] = useState<{
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    timestamp: string | null;
    isGpsMissing: boolean;
  }>({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
    isGpsMissing: false,
  });
  const [loadingGps, setLoadingGps] = useState<boolean>(false);

  const resolvedLabel =
    lang === 'hi'
      ? labelHi || (label ? t(label) : '') || labelEn
      : labelEn || (label ? t(label) : '') || labelHi;

  const requestGpsLocation = (): Promise<{
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    timestamp: string;
    isGpsMissing: boolean;
  }> => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve({
          latitude: null,
          longitude: null,
          accuracy: null,
          timestamp: new Date().toISOString(),
          isGpsMissing: true,
        });
        return;
      }

      setLoadingGps(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLoadingGps(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toISOString(),
            isGpsMissing: false,
          });
        },
        (err) => {
          console.warn('Geolocation capture failed or denied:', err.message);
          setLoadingGps(false);
          resolve({
            latitude: null,
            longitude: null,
            accuracy: null,
            timestamp: new Date().toISOString(),
            isGpsMissing: true,
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const location = await requestGpsLocation();
    setGpsData(location);

    let uploadedServerUrl = objectUrl;
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (location.latitude) formData.append('latitude', String(location.latitude));
      if (location.longitude) formData.append('longitude', String(location.longitude));
      if (location.accuracy) formData.append('accuracy', String(location.accuracy));
      formData.append('isGpsMissing', String(location.isGpsMissing));

      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') || localStorage.getItem('token') : null;
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.url) {
        uploadedServerUrl = json.url;
      }
    } catch (uploadErr) {
      console.warn('Direct upload warning, falling back to local preview:', uploadErr);
    }

    const captureData: PhotoCaptureData = {
      file,
      previewUrl: objectUrl,
      dataUrl: uploadedServerUrl,
      fileUrl: uploadedServerUrl,
      ...location,
    };

    if (onPhotoCaptured) onPhotoCaptured(captureData);
    if (onCapture) onCapture(captureData);
  };

  const handleClearPhoto = () => {
    setPreview(null);
    setGpsData({
      latitude: null,
      longitude: null,
      accuracy: null,
      timestamp: null,
      isGpsMissing: false,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    const emptyData: PhotoCaptureData = {
      file: null,
      previewUrl: null,
      dataUrl: null,
      latitude: null,
      longitude: null,
      accuracy: null,
      timestamp: null,
      isGpsMissing: true,
    };
    if (onPhotoCaptured) onPhotoCaptured(emptyData);
    if (onCapture) onCapture(emptyData);
  };

  return (
    <div className={`w-full ${className}`}>
      {resolvedLabel && (
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          {resolvedLabel} {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {!preview ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`w-full min-h-[52px] p-4 border border-dashed rounded flex flex-col items-center justify-center gap-1.5 bg-page hover:bg-brand-subtle transition-colors cursor-pointer ${
            error ? 'border-danger bg-danger-bg/20' : 'border-border hover:border-brand'
          }`}
        >
          <div className="w-9 h-9 rounded bg-brand-subtle text-brand flex items-center justify-center">
            <Camera className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div className="text-center">
            <span className="text-xs font-medium text-text-primary block">
              {lang === 'hi' ? 'कैमरे से फोटो खींचें (GPS सहित)' : 'Take Photo with Camera (GPS Tagged)'}
            </span>
          </div>
        </button>
      ) : (
        <div className="border border-border rounded p-3 bg-surface overflow-hidden">
          <div className="relative rounded overflow-hidden bg-black max-h-56 flex items-center justify-center">
            <img
              src={preview}
              alt="Captured"
              className="w-full h-full object-contain max-h-52"
            />
            <button
              type="button"
              onClick={handleClearPhoto}
              className="absolute top-2 right-2 p-1.5 bg-danger text-white rounded cursor-pointer"
              title="Remove Photo"
            >
              <Trash2 className="w-4 h-4 stroke-[1.75]" />
            </button>
          </div>

          <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between gap-2 text-xs">
            {loadingGps ? (
              <div className="flex items-center gap-1.5 text-brand">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{lang === 'hi' ? 'GPS स्थान लिया जा रहा है...' : 'Capturing GPS...'}</span>
              </div>
            ) : gpsData.latitude && gpsData.longitude ? (
              <div className="flex items-center gap-1.5 text-success">
                <CheckCircle2 className="w-4 h-4 stroke-[1.75]" />
                <span className="tabular-nums">
                  {gpsData.latitude.toFixed(4)}°, {gpsData.longitude.toFixed(4)}°
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-warning">
                <AlertTriangle className="w-4 h-4 stroke-[1.75]" />
                <span>{lang === 'hi' ? 'GPS अनुपलब्ध' : 'GPS Missing'}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-brand hover:text-brand-hover hover:underline cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3 stroke-[1.75]" />
              <span>{lang === 'hi' ? 'पुनः फोटो लें' : 'Retake'}</span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-danger font-medium leading-tight">
          {error}
        </p>
      )}
    </div>
  );
};

export default PhotoCapture;
