import { useRef, useState, useCallback } from 'react';

export function useCamera() {
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const [cameraActive, setCameraActive]   = useState(false);
  const [facingMode, setFacingMode]       = useState('user');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [cameraError, setCameraError]     = useState(null);

  const startCamera = useCallback(async (mode = 'user') => {
    setCameraError(null);
    setShowFileUpload(false);
    setCameraActive(false);

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      streamRef.current = stream;

      // Attach stream to video element FIRST, then update state
      // This prevents the race condition where React re-renders wipe srcObject
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Explicitly call play() — autoPlay alone is not reliable in all browsers
        try { await videoRef.current.play(); } catch (_) {}
      }

      setFacingMode(mode);
      // Set active AFTER srcObject is attached and play() has been called
      setCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(err.message);
      setShowFileUpload(true);
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

  const switchCamera = useCallback(async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    await startCamera(newMode);
  }, [facingMode, startCamera]);

  // Capture a frame scaled to maxWidth, returned as base64 JPEG
  const captureFrame = useCallback((maxWidth = 640) => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || video.readyState < 2) return null;

    const scale  = Math.min(1, maxWidth / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width  = Math.round(video.videoWidth  * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.75);
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
