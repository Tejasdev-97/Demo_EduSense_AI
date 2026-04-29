import { useState, useCallback } from 'react';
import { analyseStudentWork, readQuestionImage } from '../lib/gemini';
import toast from 'react-hot-toast';

export function useCameraAnalysis() {
  const [workAnalysis, setWorkAnalysis]       = useState(null);
  const [questionContext, setQuestionContext] = useState(null);
  const [analysing, setAnalysing]             = useState({ work: false, question: false });

  const analyseWork = useCallback(async (imageBase64, meta) => {
    if (!navigator.onLine) {
      toast('📱 Work captured! Will analyse when back online.', { icon: 'ℹ️' });
      return null;
    }
    setAnalysing(p => ({ ...p, work: true }));
    try {
      const result = await analyseStudentWork({ imageBase64, ...meta });
      setWorkAnalysis(result);
      return result;
    } catch (err) {
      toast.error('Work analysis failed: ' + err.message);
      return null;
    } finally {
      setAnalysing(p => ({ ...p, work: false }));
    }
  }, []);

  const analyseQuestion = useCallback(async (imageBase64, meta) => {
    if (!navigator.onLine) {
      toast('📖 Question captured! Will read when back online.', { icon: 'ℹ️' });
      return null;
    }
    setAnalysing(p => ({ ...p, question: true }));
    try {
      const result = await readQuestionImage({ imageBase64, ...meta });
      setQuestionContext(result);
      return result;
    } catch (err) {
      toast.error('Question read failed: ' + err.message);
      return null;
    } finally {
      setAnalysing(p => ({ ...p, question: false }));
    }
  }, []);

  // Weight: work 60%, face 25%, question context 15%
  const calculateCombinedGap = useCallback((faceEmotion, workAnal, _questionCtx) => {
    if (!workAnal && !faceEmotion) return { gapType: 'conceptual', spectrumScore: 50 };

    if (workAnal?.confidence === 'high') {
      return { gapType: workAnal.gapType, spectrumScore: workAnal.spectrumScore };
    }
    if (workAnal?.confidence === 'medium') {
      const faceKey = faceEmotion?.gapHint;
      if (faceKey === workAnal.gapType) {
        return { gapType: workAnal.gapType, spectrumScore: workAnal.spectrumScore };
      }
    }
    if (workAnal) return { gapType: workAnal.gapType, spectrumScore: workAnal.spectrumScore };

    const faceGapMap = {
      helpless:   { gapType: 'prior_knowledge', spectrumScore: 20 },
      confused:   { gapType: 'conceptual',      spectrumScore: 35 },
      frustrated: { gapType: 'procedural',      spectrumScore: 40 },
      bored:      { gapType: 'attention',        spectrumScore: 55 },
      confident:  { gapType: 'none',             spectrumScore: 85 },
      focused:    { gapType: 'none',             spectrumScore: 70 },
    };
    return faceGapMap[faceEmotion?.key] || { gapType: 'conceptual', spectrumScore: 50 };
  }, []);

  return { workAnalysis, questionContext, analysing, analyseWork, analyseQuestion, calculateCombinedGap };
}
