import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SwitchCamera, Eye, EyeOff, FileImage, BookOpen, Send, Loader2, Upload } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { useCameraAnalysis } from '../../hooks/useCameraAnalysis';
import CameraPrivacyModal from './CameraPrivacyModal';
import EmotionIndicator from './EmotionIndicator';
import toast from 'react-hot-toast';

export default function DrishtiCam({ subject, topic, question, grade, language, onSubmit }) {
  const [showPrivacy, setShowPrivacy]           = useState(true);
  const [faceScanOn, setFaceScanOn]             = useState(false);
  const [capturedWorkImg, setCapturedWorkImg]   = useState(null);
  const [capturedQImg, setCapturedQImg]         = useState(null);
  const [submitting, setSubmitting]             = useState(false);

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

  const handleAllow = async () => {
    setShowPrivacy(false);
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    await startCamera(isMobile ? 'user' : 'environment');
    await loadFaceApi();
  };

  const handleToggleFaceScan = () => {
    if (isDetecting) {
      stopDetection();
      setFaceScanOn(false);
    } else if (faceApiLoaded) {
      startDetection();
      setFaceScanOn(true);
    } else {
      toast('Loading emotion detection models...', { icon: '⏳' });
      loadFaceApi().then(() => { startDetection(); setFaceScanOn(true); });
    }
  };

  const handleScanWork = async () => {
    const img = captureFrame();
    if (!img) { toast.error('Camera not ready'); return; }
    setCapturedWorkImg(img);
    await analyseWork(img, { subject, topic, question, grade, language });
  };

  const handleScanQuestion = async () => {
    const img = captureFrame();
    if (!img) { toast.error('Camera not ready'); return; }
    setCapturedQImg(img);
    await analyseQuestion(img, { subject, grade, language });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setCapturedWorkImg(base64);
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
    return <CameraPrivacyModal onAllow={handleAllow} onSkip={() => onSubmit({ gapType: 'conceptual', spectrumScore: 50, inputModality: 'text' })} />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      {/* ── LEFT: Camera Feed ── */}
      <div className="lg:w-[60%] relative rounded-2xl overflow-hidden bg-gray-900 aspect-video flex items-center justify-center">
        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Floating action buttons */}
            <div className="absolute top-3 right-3 flex flex-col gap-2">
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
                {analysing.work ? <Loader2 size={14} className="animate-spin" /> : <FileImage size={14} />}
                Scan My Work
              </button>

              <button
                onClick={handleScanQuestion}
                disabled={analysing.question}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-black/60 text-white hover:bg-secondary shadow-lg backdrop-blur-sm transition-all disabled:opacity-60"
              >
                {analysing.question ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
                Scan Question
              </button>
            </div>

            {/* Switch camera button */}
            <button
              onClick={switchCamera}
              className="absolute top-3 left-3 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm"
              title="Switch camera"
            >
              <SwitchCamera size={16} />
            </button>

            {/* Emotion indicator */}
            <div className="absolute bottom-3 left-3">
              <EmotionIndicator emotion={currentEmotion} />
            </div>

            {/* Face scan active label */}
            {faceScanOn && (
              <div className="absolute bottom-3 right-3">
                <motion.p
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-white/70 text-xs bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg"
                >
                  📡 Camera is reading your expressions...
                </motion.p>
              </div>
            )}
          </>
        ) : showFileUpload ? (
          <div className="text-center p-6">
            <p className="text-white/70 text-sm mb-4">
              {cameraError ? '📷 Camera unavailable — upload a photo instead' : 'Camera not started'}
            </p>
            <label className="btn-primary cursor-pointer flex items-center gap-2 justify-center">
              <Upload size={16} />
              Upload Photo of Work
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        ) : (
          <div className="text-center">
            <Loader2 size={32} className="text-white animate-spin mx-auto mb-2" />
            <p className="text-white/70 text-sm">Starting camera...</p>
          </div>
        )}
      </div>

      {/* ── RIGHT: Analysis Panel ── */}
      <div className="lg:w-[40%] flex flex-col gap-3">
        {/* Expression section */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">😐 Expression Detected</p>
          {currentEmotion ? (
            <div className="flex items-center gap-3">
              <span
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: currentEmotion.color }}
              />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {currentEmotion.emoji} {currentEmotion.label}
                </p>
                {currentEmotion.gapHint && (
                  <p className="text-xs text-gray-500">
                    Signal: possible <strong>{currentEmotion.gapHint}</strong> gap
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              {faceScanOn ? 'Detecting...' : 'Enable Face Scan to detect your expression'}
            </p>
          )}
        </div>

        {/* Work analysis section */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">📄 Work Analysis</p>
          {analysing.work ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" />
              Analysing your work...
            </div>
          ) : workAnalysis ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{workAnalysis.keyObservation}</p>
              <p className="text-xs text-gray-500">Gap type: <strong>{workAnalysis.gapType}</strong> · Score: {workAnalysis.spectrumScore}/100</p>
              {workAnalysis.gapLocation && (
                <p className="text-xs text-gray-400">📍 {workAnalysis.gapLocation}</p>
              )}
              {capturedWorkImg && (
                <img src={capturedWorkImg} alt="work" className="w-20 h-14 rounded-lg object-cover mt-1 border border-gray-200" />
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Press "Scan My Work" to analyse your written work</p>
          )}
        </div>

        {/* Question context section */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">📖 Question Read</p>
          {analysing.question ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" />
              Reading your question...
            </div>
          ) : questionContext ? (
            <div className="space-y-1">
              <p className="text-sm text-gray-900 dark:text-white">{questionContext.questionText}</p>
              <p className="text-xs text-gray-500">Difficulty: <strong>{questionContext.difficulty}</strong></p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Press "Scan Question" to read your question paper</p>
          )}
        </div>

        {/* Combined gap signal */}
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
                    <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                      Detected: <span className="text-primary capitalize">{combined.gapType.replace('_', ' ')}</span>
                    </p>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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

        {/* Submit button */}
        <button
          id="btn-drishti-submit"
          onClick={handleSubmit}
          disabled={submitting || (!workAnalysis && !currentEmotion)}
          className="btn-primary w-full py-3 text-base disabled:opacity-50 mt-auto"
        >
          {submitting ? (
            <span className="flex items-center gap-2 justify-center">
              <Loader2 size={18} className="animate-spin" /> Analysing...
            </span>
          ) : (
            <span className="flex items-center gap-2 justify-center">
              <Send size={18} /> Submit Camera Analysis
            </span>
          )}
        </button>
        <p className="text-xs text-center text-gray-400">
          Scan at least your work or enable Face Scan to submit
        </p>
      </div>
    </div>
  );
}
