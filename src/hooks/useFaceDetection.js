import { useEffect, useRef, useState, useCallback } from 'react';

export const EMOTION_MAP = {
  confused:   { color: '#EF4444', emoji: '😕', label: 'Confused',    gapHint: 'conceptual'      },
  frustrated: { color: '#F97316', emoji: '😤', label: 'Frustrated',  gapHint: 'procedural'      },
  bored:      { color: '#EAB308', emoji: '😑', label: 'Bored',       gapHint: 'attention'       },
  helpless:   { color: '#8B5CF6', emoji: '😞', label: 'Helpless',    gapHint: 'prior_knowledge' },
  focused:    { color: '#22C55E', emoji: '🧐', label: 'Focused',     gapHint: null              },
  confident:  { color: '#10B981', emoji: '😊', label: 'Confident',   gapHint: null              },
  neutral:    { color: '#6B7280', emoji: '😐', label: 'Neutral',     gapHint: null              },
};

function mapToEmotion({ happy, sad, angry, fearful, disgusted, surprised, neutral }) {
  if (fearful > 0.4 || (surprised > 0.5 && sad > 0.2)) return 'helpless';
  if (surprised > 0.5 || fearful > 0.3)                return 'confused';
  if (angry > 0.3 || disgusted > 0.3)                  return 'frustrated';
  if (neutral > 0.8)                                    return 'bored';
  if (happy > 0.5)                                      return 'confident';
  if (happy > 0.3)                                      return 'focused';
  if (sad > 0.4)                                        return 'helpless';
  return 'neutral';
}

export function useFaceDetection(videoRef) {
  const [faceApiLoaded, setFaceApiLoaded]   = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [isDetecting, setIsDetecting]       = useState(false);
  const timerRef   = useRef(null);
  const loadingRef = useRef(false);

  const loadFaceApi = useCallback(async () => {
    if (loadingRef.current || faceApiLoaded) return;
    loadingRef.current = true;
    try {
      if (!document.getElementById('faceapi-script')) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.id = 'faceapi-script';
          s.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';
      await Promise.all([
        window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        window.faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      setFaceApiLoaded(true);
    } catch (err) {
      console.warn('[DrishtiCam] face-api.js load failed — emotion detection unavailable:', err.message);
    } finally {
      loadingRef.current = false;
    }
  }, [faceApiLoaded]);

  const startDetection = useCallback(() => {
    if (!window.faceapi || !videoRef.current || isDetecting) return;
    setIsDetecting(true);

    const detect = async () => {
      if (!videoRef.current) return;
      try {
        const result = await window.faceapi
          .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();
        if (result) {
          const key = mapToEmotion(result.expressions);
          setCurrentEmotion({ key, ...EMOTION_MAP[key], raw: result.expressions });
        }
      } catch (_) {}
      timerRef.current = setTimeout(detect, 3000);
    };
    detect();
  }, [videoRef, isDetecting]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => () => stopDetection(), [stopDetection]);

  return { faceApiLoaded, currentEmotion, isDetecting, loadFaceApi, startDetection, stopDetection };
}
