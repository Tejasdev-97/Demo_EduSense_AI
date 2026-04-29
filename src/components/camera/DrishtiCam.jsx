import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SwitchCamera, Eye, EyeOff, FileImage, BookOpen, Send, Loader2, Upload, Camera, CheckCircle2 } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { useCameraAnalysis } from '../../hooks/useCameraAnalysis';
import CameraPrivacyModal from './CameraPrivacyModal';
import EmotionIndicator from './EmotionIndicator';
import toast from 'react-hot-toast';

export default function DrishtiCam({ subject, topic, question, grade, language, onSubmit }) {
  const [showPrivacy, setShowPrivacy]         = useState(true);
  const [faceScanOn, setFaceScanOn]           = useState(false);
  const [capturedWorkImg, setCapturedWorkImg] = useState(null);
  const [capturedQImg, setCapturedQImg]       = useState(null);
  const [submitting, setSubmitting]           = useState(false);
  const [cameraReady, setCameraReady]         = useState(false); // tracks when video is ACTUALLY visible

  const {
    videoRef, cameraActive, facingMode,
    showFileUpload, cameraError,
    startCamera, stopCamera, switchCamera, captureFrame,
  } = useCamera();

  const {
    faceApiLoaded, currentEmotion,
    isDetecting, loadFaceApi, startDetection, stopDetection,
  } = useFaceDetection(videoRef);

  const {
    workAnalysis, questionContext, analysing,
    analyseWork, analyseQuestion, calculateCombinedGap,
  } = useCameraAnalysis();

  // Cleanup on unmount
  useEffect(() => () => { stopCamera(); stopDetection(); }, [stopCamera, stopDetection]);

  // ── KEY FIX: Watch video element for actual playback ──
  // The black screen happens because React rerenders clear srcObject.
  // We use an event listener on the video element itself to mark when
  // the camera feed is truly visible and playing.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlaying = () => setCameraReady(true);
    const onPause   = () => setCameraReady(false);
    const onEmpty   = () => setCameraReady(false);

    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('emptied', onEmpty);

    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('emptied', onEmpty);
    };
  }, [videoRef]);

  const handleAllow = async () => {
    setShowPrivacy(false);
    setCameraReady(false);
    // Always start with 'user' (front camera) on all devices — most reliable
    await startCamera('user');
    // Don't auto-load heavy face-api models — wait for user to toggle
  };

  const handleToggleFaceScan = () => {
    if (isDetecting) {
      stopDetection();
      setFaceScanOn(false);
    } else if (faceApiLoaded) {
      startDetection();
      setFaceScanOn(true);
    } else {
      toast('Loading emotion detection...', { icon: '⏳' });
      loadFaceApi().then(() => { startDetection(); setFaceScanOn(true); });
    }
  };

  const handleScanWork = async () => {
    if (!cameraReady) { toast.error('Camera not ready yet. Please wait a moment.'); return; }
    const img = captureFrame();
    if (!img) { toast.error('Could not capture frame. Try again.'); return; }
    setCapturedWorkImg(img);
    toast('📸 Work captured! Analysing...', { icon: '🔍' });
    await analyseWork(img, { subject, topic, question, grade, language });
  };

  const handleScanQuestion = async () => {
    if (!cameraReady) { toast.error('Camera not ready yet. Please wait a moment.'); return; }
    const img = captureFrame();
    if (!img) { toast.error('Could not capture frame. Try again.'); return; }
    setCapturedQImg(img);
    toast('📸 Question captured! Reading...', { icon: '🔍' });
    await analyseQuestion(img, { subject, grade, language });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setCapturedWorkImg(base64);
      toast('📎 Photo uploaded! Analysing...', { icon: '🔍' });
      await analyseWork(base64, { subject, topic, question, grade, language });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const combined = calculateCombinedGap(currentEmotion, workAnalysis, questionContext);
    setSubmitting(true);
    try {
      await onSubmit({
        gapType:         combined.gapType,
        spectrumScore:   combined.spectrumScore,
        emotionKey:      currentEmotion?.key || null,
        emotionLabel:    currentEmotion?.label || null,
        workAnalysis:    workAnalysis || null,
        questionContext: questionContext || null,
        capturedWorkImg: capturedWorkImg || null,
        inputModality:   'camera',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (showPrivacy) {
    return (
      <CameraPrivacyModal
        onAllow={handleAllow}
        onSkip={() => onSubmit({ gapType: 'conceptual', spectrumScore: 50, inputModality: 'text' })}
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">

      {/* ── LEFT: Camera Feed ── */}
      <div className="lg:w-[60%] relative rounded-2xl overflow-hidden bg-gray-900 aspect-video flex items-center justify-center">

        {/* The video element is always in the DOM — visibility controlled by opacity */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${cameraReady ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Loading overlay — shown until camera is actually playing */}
        <AnimatePresence>
          {cameraActive && !cameraReady && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10"
            >
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-3" />
              <p className="text-white/70 text-sm font-medium">Starting camera...</p>
              <p className="text-white/40 text-xs mt-1">Allow browser camera permission if prompted</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File upload fallback */}
        {showFileUpload && !cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10 p-6 text-center">
            <Camera size={40} className="text-white/30 mb-3" />
            <p className="text-white/70 text-sm mb-1 font-medium">
              {cameraError ? '📷 Camera unavailable' : 'Camera not started'}
            </p>
            {cameraError && (
              <p className="text-red-400 text-xs mb-4">{cameraError}</p>
            )}
            <label className="btn-primary cursor-pointer flex items-center gap-2 justify-center">
              <Upload size={16} />
              Upload Photo of Work
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        )}

        {/* Overlay controls — only shown when camera is playing */}
        {cameraReady && (
          <>
            {/* Top-right action buttons */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
              <button
                onClick={handleToggleFaceScan}
                title={faceScanOn ? 'Turn off Face Scan' : 'Turn on Face Scan'}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-lg backdrop-blur-sm transition-all ${
                  faceScanOn ? 'bg-green-500 text-white' : 'bg-black/60 text-white hover:bg-black/80'
                }`}
              >
                {faceScanOn ? <Eye size={14} /> : <EyeOff size={14} />}
                Face Scan {faceScanOn ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={handleScanWork}
                disabled={analysing.work}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-black/60 text-white hover:bg-primary shadow-lg backdrop-blur-sm transition-all disabled:opacity-60"
              >
                {analysing.work
                  ? <Loader2 size={14} className="animate-spin" />
                  : workAnalysis ? <CheckCircle2 size={14} className="text-green-400" /> : <FileImage size={14} />
                }
                {analysing.work ? 'Analysing...' : workAnalysis ? 'Work ✓ Scan Again' : 'Scan My Work'}
              </button>

              <button
                onClick={handleScanQuestion}
                disabled={analysing.question}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-black/60 text-white hover:bg-secondary shadow-lg backdrop-blur-sm transition-all disabled:opacity-60"
              >
                {analysing.question
                  ? <Loader2 size={14} className="animate-spin" />
                  : questionContext ? <CheckCircle2 size={14} className="text-green-400" /> : <BookOpen size={14} />
                }
                {analysing.question ? 'Reading...' : questionContext ? 'Question ✓ Rescan' : 'Scan Question'}
              </button>
            </div>

            {/* Top-left: switch camera */}
            <button
              onClick={switchCamera}
              className="absolute top-3 left-3 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm z-20"
              title="Switch camera"
            >
              <SwitchCamera size={16} />
            </button>

            {/* Bottom-left: emotion */}
            <div className="absolute bottom-3 left-3 z-20">
              <EmotionIndicator emotion={currentEmotion} />
            </div>

            {/* Bottom-right: status message */}
            <div className="absolute bottom-3 right-3 z-20">
              {faceScanOn ? (
                <motion.p
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-white/70 text-xs bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg"
                >
                  📡 Reading your expressions...
                </motion.p>
              ) : (
                <p className="text-white/50 text-xs bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
                  📸 Point camera at your work → tap "Scan My Work"
                </p>
              )}
            </div>

            {/* Green "LIVE" indicator */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full z-20">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/80 text-xs font-medium">LIVE</span>
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT: Analysis Panel ── */}
      <div className="lg:w-[40%] flex flex-col gap-3">

        {/* Expression */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">😐 Expression Detected</p>
          {currentEmotion ? (
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: currentEmotion.color }} />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {currentEmotion.emoji} {currentEmotion.label}
                </p>
                {currentEmotion.gapHint && (
                  <p className="text-xs text-gray-500">Signal: possible <strong>{currentEmotion.gapHint}</strong> gap</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              {faceScanOn ? '🔍 Detecting...' : 'Enable Face Scan above to detect your expression'}
            </p>
          )}
        </div>

        {/* Work Analysis */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">📄 Work Analysis</p>
          {analysing.work ? (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Loader2 size={14} className="animate-spin" />
              <span>Gemini AI is reading your work...</span>
            </div>
          ) : workAnalysis ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{workAnalysis.keyObservation}</p>
              </div>
              <p className="text-xs text-gray-500">Gap type: <strong className="capitalize">{workAnalysis.gapType}</strong> · Score: {workAnalysis.spectrumScore}/100</p>
              {workAnalysis.gapLocation && (
                <p className="text-xs text-gray-400">📍 {workAnalysis.gapLocation}</p>
              )}
              {capturedWorkImg && (
                <img src={capturedWorkImg} alt="captured work" className="w-24 h-16 rounded-lg object-cover mt-2 border border-gray-200 dark:border-gray-700" />
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              {cameraReady
                ? '👆 Press "Scan My Work" above to analyse your written work'
                : 'Waiting for camera...'}
            </p>
          )}
        </div>

        {/* Question Context */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">📖 Question Read</p>
          {analysing.question ? (
            <div className="flex items-center gap-2 text-sm text-secondary">
              <Loader2 size={14} className="animate-spin" />
              <span>AI reading your question...</span>
            </div>
          ) : questionContext ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                <p className="text-sm text-gray-900 dark:text-white">{questionContext.questionText}</p>
              </div>
              <p className="text-xs text-gray-500">Difficulty: <strong>{questionContext.difficulty}</strong> · Topic: {questionContext.topic}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              {cameraReady
                ? '👆 Press "Scan Question" to read your question paper'
                : 'Waiting for camera...'}
            </p>
          )}
        </div>

        {/* Combined Gap Signal */}
        {(workAnalysis || currentEmotion) && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-2 border-primary/30 p-4 bg-primary/5"
            >
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">🧠 Gap Signal</p>
              {(() => {
                const combined = calculateCombinedGap(currentEmotion, workAnalysis, questionContext);
                return (
                  <>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                      Detected: <span className="text-primary capitalize">{combined.gapType.replace('_', ' ')}</span>
                    </p>
                    <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${combined.spectrumScore}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Understanding level: {combined.spectrumScore}/100</p>
                  </>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Submit */}
        <button
          id="btn-drishti-submit"
          onClick={handleSubmit}
          disabled={submitting || (!workAnalysis && !currentEmotion)}
          className="btn-primary w-full py-3 text-base disabled:opacity-50 mt-auto"
        >
          {submitting ? (
            <span className="flex items-center gap-2 justify-center">
              <Loader2 size={18} className="animate-spin" /> Submitting Analysis...
            </span>
          ) : (
            <span className="flex items-center gap-2 justify-center">
              <Send size={18} /> Submit Camera Analysis
            </span>
          )}
        </button>
        <p className="text-xs text-center text-gray-400">
          Scan your work or enable Face Scan to submit
        </p>
      </div>
    </div>
  );
}
