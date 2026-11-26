'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  Camera,
  File,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Video,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  MapPin,
  Download,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from './Button';
import { Badge } from './Badge';

export interface UploadedFileItem {
  id?: string;
  url: string;
  filename?: string;
  originalName: string;
  size?: number;
  mimeType?: string;
  isLink?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  capturedAt?: string;
  isGpsMissing?: boolean;
}

export interface FileUploadProps {
  label?: string;
  labelHi?: string;
  labelEn?: string;
  helpText?: string;
  required?: boolean;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  allowedTypes?: ('images' | 'documents' | 'excel' | 'zip' | 'video' | 'all')[];
  enableGps?: boolean;
  enableLinkToggle?: boolean;
  initialUrls?: string[] | string;
  entityType?: string;
  entityId?: string;
  onChange?: (urls: string[], files: UploadedFileItem[]) => void;
  onSingleChange?: (url: string, file?: UploadedFileItem) => void;
  className?: string;
}

// In-browser client-side image compression (downsamples high-res mobile photos to max 1600px)
async function compressImage(file: File, maxDim = 1600, quality = 0.85): Promise<File> {
  if (!file.type.startsWith('image/') || file.type.includes('svg')) {
    return file; // Only compress raster images
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width <= maxDim && height <= maxDim) {
          resolve(file); // Already small enough
          return;
        }

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const fileConstructor: any = typeof window !== 'undefined' && (window as any).File ? (window as any).File : File;
            const compressedFile = new fileConstructor([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }) as File;
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  labelHi,
  labelEn,
  helpText,
  required = false,
  multiple = true,
  maxFiles = 10,
  maxSizeMB = 25,
  allowedTypes = ['all'],
  enableGps = false,
  enableLinkToggle = true,
  initialUrls,
  entityType,
  entityId,
  onChange,
  onSingleChange,
  className = '',
}) => {
  const { lang, t } = useLanguage();

  // Normalize initial files
  const initialItems: UploadedFileItem[] = [];
  if (initialUrls) {
    const arr = Array.isArray(initialUrls) ? initialUrls : [initialUrls];
    arr.filter(Boolean).forEach((u) => {
      const isL = u.startsWith('http://') || u.startsWith('https://');
      const fname = u.split('/').pop() || 'file';
      initialItems.push({
        url: u,
        originalName: fname,
        isLink: isL,
      });
    });
  }

  const [files, setFiles] = useState<UploadedFileItem[]>(initialItems);
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [pastedLink, setPastedLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<{
    lat: number | null;
    lng: number | null;
    accuracy: number | null;
    isMissing: boolean;
  }>({
    lat: null,
    lng: null,
    accuracy: null,
    isMissing: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const resolvedLabel =
    lang === 'hi'
      ? labelHi || (label ? t(label) : '') || labelEn
      : labelEn || (label ? t(label) : '') || labelHi;

  const notifyChange = (updatedFiles: UploadedFileItem[]) => {
    setFiles(updatedFiles);
    const urls = updatedFiles.map((f) => f.url);
    if (onChange) onChange(urls, updatedFiles);
    if (onSingleChange && updatedFiles.length > 0) {
      onSingleChange(updatedFiles[0].url, updatedFiles[0]);
    }
  };

  // Capture GPS coordinates when GPS mode is enabled
  const acquireGps = async (): Promise<{
    lat: number | null;
    lng: number | null;
    acc: number | null;
    missing: boolean;
  }> => {
    if (!enableGps || !('geolocation' in navigator)) {
      setGpsStatus({ lat: null, lng: null, accuracy: null, isMissing: true });
      return { lat: null, lng: null, acc: null, missing: true };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const res = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            acc: pos.coords.accuracy,
            missing: false,
          };
          setGpsStatus({ lat: res.lat, lng: res.lng, accuracy: res.acc, isMissing: false });
          resolve(res);
        },
        () => {
          const res = { lat: null, lng: null, acc: null, missing: true };
          setGpsStatus({ lat: null, lng: null, accuracy: null, isMissing: true });
          resolve(res);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  };

  const handleProcessFiles = async (rawFileList: FileList | File[]) => {
    setErrorMsg(null);
    const incoming = Array.from(rawFileList);
    if (incoming.length === 0) return;

    if (files.length + incoming.length > maxFiles) {
      setErrorMsg(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(15);

      // Acquire GPS if requested
      const gps = enableGps ? await acquireGps() : { lat: null, lng: null, acc: null, missing: false };
      setUploadProgress(30);

      // Compress images
      const processedFiles: File[] = [];
      for (const f of incoming) {
        if (f.size > maxSizeMB * 1024 * 1024) {
          throw new Error(`File "${f.name}" exceeds the ${maxSizeMB} MB size limit.`);
        }
        const compressed = await compressImage(f);
        processedFiles.push(compressed);
      }
      setUploadProgress(50);

      // Upload via FormData to /api/upload
      const formData = new FormData();
      processedFiles.forEach((file) => {
        formData.append('files', file);
      });
      if (entityType) formData.append('entityType', entityType);
      if (entityId) formData.append('entityId', entityId);
      if (gps.lat) formData.append('latitude', String(gps.lat));
      if (gps.lng) formData.append('longitude', String(gps.lng));
      if (gps.acc) formData.append('accuracy', String(gps.acc));
      formData.append('isGpsMissing', String(gps.missing));
      formData.append('capturedAt', new Date().toISOString());

      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') || localStorage.getItem('token') : null;
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      setUploadProgress(85);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Upload failed');
      }

      setUploadProgress(100);

      const newUploadedItems: UploadedFileItem[] = (json.files || [
        {
          url: json.url,
          filename: json.filename,
          originalName: json.originalName,
          size: json.size,
          latitude: gps.lat,
          longitude: gps.lng,
          isGpsMissing: gps.missing,
        },
      ]).map((f: any) => ({
        id: f.id,
        url: f.url,
        filename: f.filename,
        originalName: f.originalName || f.filename,
        size: f.size,
        mimeType: f.mimeType,
        latitude: f.latitude || gps.lat,
        longitude: f.longitude || gps.lng,
        isGpsMissing: f.isGpsMissing ?? gps.missing,
        capturedAt: f.capturedAt || new Date().toISOString(),
      }));

      const updated = multiple ? [...files, ...newUploadedItems] : newUploadedItems;
      notifyChange(updated);
    } catch (err: any) {
      console.error('File upload error:', err);
      setErrorMsg(err.message || 'File upload error. Please retry.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleAddLink = () => {
    setErrorMsg(null);
    const trimmed = pastedLink.trim();
    if (!trimmed) return;

    try {
      const parsed = new URL(trimmed);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Must start with http:// or https://');
      }

      const newItem: UploadedFileItem = {
        url: trimmed,
        originalName: trimmed.split('/').pop() || trimmed,
        isLink: true,
      };

      const updated = multiple ? [...files, newItem] : [newItem];
      notifyChange(updated);
      setPastedLink('');
      setIsLinkMode(false);
    } catch {
      setErrorMsg('Please enter a valid website or document URL (e.g. https://...)');
    }
  };

  const handleRemoveFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    notifyChange(updated);
  };

  const getFileIcon = (file: UploadedFileItem) => {
    if (file.isLink) return <LinkIcon className="w-4 h-4 text-brand" />;
    const ext = file.originalName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) {
      return <ImageIcon className="w-4 h-4 text-emerald-500" />;
    }
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    }
    if (['pdf', 'doc', 'docx'].includes(ext || '')) {
      return <FileText className="w-4 h-4 text-rose-500" />;
    }
    if (['zip', 'rar', '7z'].includes(ext || '')) {
      return <FileArchive className="w-4 h-4 text-amber-500" />;
    }
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext || '')) {
      return <Video className="w-4 h-4 text-indigo-500" />;
    }
    return <File className="w-4 h-4 text-text-muted" />;
  };

  const acceptString = allowedTypes.includes('all')
    ? 'image/*,application/pdf,application/zip,application/x-zip-compressed,.xlsx,.xls,.csv,.doc,.docx,video/*'
    : allowedTypes.includes('images')
    ? 'image/*'
    : 'application/pdf,.xlsx,.xls,.csv,application/zip';

  return (
    <div className={`space-y-3 w-full ${className}`}>
      {/* Label and Option Toggles */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-text-secondary uppercase">
          {resolvedLabel} {required && <span className="text-danger">*</span>}
        </label>
        {enableLinkToggle && (
          <button
            type="button"
            onClick={() => setIsLinkMode(!isLinkMode)}
            className="text-xs text-brand hover:underline flex items-center gap-1 cursor-pointer"
          >
            {isLinkMode ? (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Paste Link</span>
              </>
            )}
          </button>
        )}
      </div>

      {helpText && <p className="text-xs text-text-muted -mt-1">{helpText}</p>}

      {/* GPS Status Indicator */}
      {enableGps && (
        <div className="flex items-center gap-2 text-xs">
          <Badge variant={gpsStatus.isMissing ? 'warning' : gpsStatus.lat ? 'success' : 'neutral'}>
            <MapPin className="w-3 h-3 mr-1 inline" />
            {gpsStatus.isMissing
              ? 'GPS Location Missing (Warning)'
              : gpsStatus.lat
              ? `GPS Captured (±${Math.round(gpsStatus.accuracy || 0)}m)`
              : 'GPS Tagging Active'}
          </Badge>
        </div>
      )}

      {/* Paste Link Box */}
      {isLinkMode ? (
        <div className="flex items-center gap-2 p-3 bg-surface border border-border rounded-lg">
          <LinkIcon className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="url"
            value={pastedLink}
            onChange={(e) => setPastedLink(e.target.value)}
            placeholder="https://example.com/document.pdf"
            className="flex-1 bg-transparent text-sm text-text-primary focus:outline-none"
          />
          <Button type="button" size="sm" variant="primary" onClick={handleAddLink}>
            Add
          </Button>
        </div>
      ) : (
        /* Upload Drag-and-Drop Area */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) handleProcessFiles(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-border hover:border-brand rounded-xl p-4 sm:p-6 text-center transition-colors bg-surface/50"
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>

            <div className="text-xs text-text-secondary">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-brand font-semibold hover:underline cursor-pointer"
              >
                Choose files
              </button>{' '}
              or drag & drop here
            </div>

            <p className="text-[11px] text-text-muted">
              Images (JPG, PNG), Documents (PDF, Excel, Word, ZIP) up to {maxSizeMB} MB
            </p>

            {/* Mobile Camera Button */}
            <div className="pt-2 flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Camera className="w-4 h-4" />}
                onClick={() => cameraInputRef.current?.click()}
              >
                {lang === 'hi' ? 'कैमरा से फोटो खींचें' : 'Take Photo (Camera)'}
              </Button>
            </div>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={acceptString}
            onChange={(e) => e.target.files && handleProcessFiles(e.target.files)}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => e.target.files && handleProcessFiles(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-text-muted">
            <span>Uploading & processing...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-brand transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Files Thumbnail / List Preview */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {files.map((file, idx) => {
            const isImg =
              file.url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ||
              file.originalName.match(/\.(jpg|jpeg|png|webp|gif)$/i);

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border text-xs gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isImg ? (
                    <img
                      src={file.url}
                      alt={file.originalName}
                      className="w-8 h-8 rounded object-cover border border-border shrink-0 bg-page"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded flex items-center justify-center bg-page border border-border shrink-0">
                      {getFileIcon(file)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-text-primary hover:text-brand truncate block"
                      title={file.originalName}
                    >
                      {file.originalName}
                    </a>
                    {file.size ? (
                      <span className="text-[10px] text-text-muted">
                        {(file.size / 1024).toFixed(0)} KB
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-text-muted hover:text-brand rounded"
                    title="Preview / Download"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="p-1 text-text-muted hover:text-danger rounded cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
