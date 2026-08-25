import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Link as LinkIcon,
  Trash2,
  Maximize2,
  X,
  Check,
  RefreshCw,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';

interface PhotoEvidenceUploaderProps {
  id?: string;
  label: string;
  subLabel?: string;
  value: string;
  onChange: (dataUrl: string) => void;
  badge?: string;
  required?: boolean;
}

export const PhotoEvidenceUploader: React.FC<PhotoEvidenceUploaderProps> = ({
  id,
  label,
  subLabel,
  value,
  onChange,
  badge,
  required,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showLiveCameraModal, setShowLiveCameraModal] = useState(false);

  // File input refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream when modal closes
  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowLiveCameraModal(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStartLiveCamera = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback to native camera input
        cameraInputRef.current?.click();
        return;
      }

      setShowLiveCameraModal(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Direct webcam access failed, falling back to native file camera:', err);
      setShowLiveCameraModal(false);
      // Native mobile file capture fallback
      cameraInputRef.current?.click();
    }
  };

  const handleCaptureLiveShot = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        onChange(dataUrl);
      }
    } catch (err: any) {
      setErrorMessage('Failed to capture photo from camera.');
    } finally {
      stopLiveCamera();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const compressedData = await compressImageFile(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.82,
      });
      onChange(compressedData);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to process selected image.');
    } finally {
      setIsProcessing(false);
      // Reset input value so same file can be chosen again if needed
      e.target.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (!urlDraft.trim()) return;
    onChange(urlDraft.trim());
    setShowUrlInput(false);
    setUrlDraft('');
  };

  const handleClear = () => {
    onChange('');
    setErrorMessage(null);
  };

  const hasPhoto = Boolean(value && value.trim().length > 0);

  return (
    <div className="space-y-2" id={id}>
      {/* Hidden inputs for native camera & gallery picker */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Label Header */}
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-extrabold">*</span>}
          {badge && (
            <span className="text-[10px] uppercase font-black px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {badge}
            </span>
          )}
        </label>
        {subLabel && <span className="text-[10px] text-slate-400">{subLabel}</span>}
      </div>

      {/* Main Container */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 transition-all">
        {hasPhoto ? (
          /* Has Photo View */
          <div className="space-y-2.5">
            <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 aspect-video sm:aspect-21/9 max-h-48 flex items-center justify-center">
              <img
                src={value}
                alt={label}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).classList.add('opacity-30');
                  setErrorMessage('Failed to load image preview. You can replace or retake this photo.');
                }}
              />

              {/* Top status tag */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Photo Attached</span>
              </div>

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 sm:transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-900 font-bold text-xs flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
                  title="Enlarge View"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Preview</span>
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
                  title="Remove Photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Remove</span>
                </button>
              </div>
            </div>

            {/* Quick change buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleStartLiveCamera}
                disabled={isProcessing}
                className="flex-1 py-1.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer shadow-2xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Retake Photo</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex-1 py-1.5 px-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Different</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center transition-all cursor-pointer"
                title="Zoom / View Photo"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="py-1.5 px-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center justify-center transition-all cursor-pointer"
                title="Delete Photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Empty / Capture Options View */
          <div className="space-y-3">
            {/* Primary Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {/* Option 1: Native Mobile Camera / Webcam */}
              <button
                type="button"
                onClick={handleStartLiveCamera}
                disabled={isProcessing}
                className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition-all shadow-2xs cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <span>Take Photo (Camera)</span>
                <span className="text-[9px] font-normal text-indigo-100">Live Camera Shot</span>
              </button>

              {/* Option 2: Upload from Device / Gallery */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="p-3 rounded-xl bg-white dark:bg-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-98 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition-all shadow-2xs cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <span>Upload from Gallery</span>
                <span className="text-[9px] font-normal text-slate-400">JPG, PNG, WebP</span>
              </button>
            </div>

            {/* Optional URL Paste toggle */}
            {!showUrlInput ? (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-slate-400" />
                  Fast photo evidence capture
                </span>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(true)}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Paste Image URL instead</span>
                </button>
              </div>
            ) : (
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Paste Image Web URL:</span>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-900 dark:text-slate-100 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Processing Spinner */}
        {isProcessing && (
          <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl flex items-center justify-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs font-bold animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Compressing & optimizing photo...</span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mt-2 p-2 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Live Stream Camera Capture Modal */}
      {showLiveCameraModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-xs">Capture {label}</span>
              </div>
              <button
                type="button"
                onClick={stopLiveCamera}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewport */}
            <div className="relative aspect-4/3 sm:aspect-16/9 bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-8 inset-y-6 border-2 border-white/30 border-dashed rounded-2xl pointer-events-none" />
            </div>

            {/* Shutter Controls */}
            <div className="p-4 bg-slate-900/90 flex items-center justify-around">
              <button
                type="button"
                onClick={() => {
                  stopLiveCamera();
                  cameraInputRef.current?.click();
                }}
                className="text-xs text-slate-400 hover:text-white flex flex-col items-center gap-1"
              >
                <ImageIcon className="w-4 h-4" />
                <span className="text-[10px]">Switch to System Camera</span>
              </button>

              <button
                type="button"
                onClick={handleCaptureLiveShot}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all shadow-xl cursor-pointer"
                title="Capture Photo"
              >
                <div className="w-6 h-6 rounded-full bg-white" />
              </button>

              <button
                type="button"
                onClick={stopLiveCamera}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Zoom Photo Modal */}
      {showPreviewModal && value && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between text-white text-xs">
              <span className="font-bold">{label}</span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-hidden bg-black">
              <img
                src={value}
                alt={label}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="p-3 border-t border-slate-800 flex justify-end gap-2 bg-slate-900 text-xs">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
