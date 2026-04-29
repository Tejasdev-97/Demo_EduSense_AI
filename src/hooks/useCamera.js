import { useRef, useState, useCallback } from 'react';

export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const startCamera = useCallback(async (mode = 'user') => {
    try {
      setCameraError(null);
      setShowFileUpload(false);

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        // Lower resolution = faster start + no black screen
        video: { facingMode: mode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      streamRef.current = stream;
      setCameraActive(true);
      setFacingMode(mode);

      // FIX: Assign srcObject AFTER state update, using a small tick delay
      // This is the main cause of the black screen — React re-renders can
      // reset the video element before srcObject is applied.
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(() => {});
          };
        }
      });
    } catch (err) {
      setCameraError(err.message);
      setShowFileUpload(true);
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const switchCamera = useCallback(() => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    // Stop first, then restart in new mode
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setTimeout(() => startCamera(newMode), 200);
  }, [facingMode, startCamera]);

  // Captures current frame as base64 JPEG — resizes to 640px wide for faster API upload
  const captureFrame = useCallback((maxWidth = 640) => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return null;

    const scale = Math.min(1, maxWidth / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    // 0.7 quality = ~40% smaller file = faster Gemini upload
    return canvas.toDataURL('image/jpeg', 0.7);
  }, []);

  return {
    videoRef,
    cameraActive,
    facingMode,
    showFileUpload,
    cameraError,
    startCamera,
    stopCamera,
    switchCamera,
    captureFrame,
  };
}
