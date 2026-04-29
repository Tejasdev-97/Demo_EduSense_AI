// Gemini API integration — all AI calls go through here
// ─────────────────────────────────────────────────────
// KEY LOADING ORDER (IMPORTANT):
//   1. Key manually saved by user via Settings page  → localStorage 'userGeminiKey'
//   2. Key from .env.local                           → import.meta.env.VITE_GEMINI_KEY
// ─────────────────────────────────────────────────────

// Model fallback chain — MOST STABLE FIRST
const MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro'
];

const VISION_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// ── In-flight request deduplication cache ──
// Prevents burning quota when same prompt fires multiple times simultaneously
const inFlight = new Map();

function getKey() {
  // PRIORITY 1: User's manually saved key from the Settings page
  const userKey = localStorage.getItem('userGeminiKey');
  if (userKey && userKey.trim()) return userKey.trim();

  // PRIORITY 2: Key from .env.local (VITE_GEMINI_KEY)
  const envKey = import.meta.env.VITE_GEMINI_KEY;
  if (envKey && envKey.trim()) return envKey.trim();

  return '';
}

// Public helper — lets UI components check if a key is available
export function hasGeminiKey() { return !!getKey(); }

// ── Exponential backoff sleep ──
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function callGeminiWithBackoff(url, body, maxRetries = 1) {
  let delay = 1000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) return res.json();

      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || `Gemini API error ${res.status}`;

      // On 429 (rate limit) or 503 (overloaded), wait and retry
      if (res.status === 429 || res.status === 503 || msg.includes('RESOURCE_EXHAUSTED')) {
        if (attempt < maxRetries) {
          await sleep(delay);
          delay *= 2;
          continue;
        }
      }
      
      const error = new Error(msg);
      error.status = res.status;
      throw error;
    } catch (e) {
      if (attempt >= maxRetries) throw e;
      await sleep(delay);
      delay *= 2;
    }
  }
}

async function callGeminiModel(model, body) {
  const key = getKey();
  if (!key) {
    throw new Error(
      'No Gemini API key found. Please paste your key in Settings → Gemini API Key. ' +
      'Get a free key at: aistudio.google.com/app/apikey'
    );
  }

  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${key}`;
  const data = await callGeminiWithBackoff(url, body);
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Text-only call with automatic model fallback + deduplication
async function callGemini(prompt, systemInstruction = '') {
  const dedupKey = `${prompt}|${systemInstruction}`;
  if (inFlight.has(dedupKey)) return inFlight.get(dedupKey);

  // For maximum compatibility across v1 and v1beta, we combine system instruction 
  // into the main prompt if it exists. This avoids "Unknown name 'system_instruction'" errors.
  const fullPrompt = systemInstruction 
    ? `INSTRUCTIONS:\n${systemInstruction}\n\nUSER PROMPT:\n${prompt}`
    : prompt;

  const body = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
  };

  const promise = (async () => {
    let lastError;
    for (const model of MODELS) {
      try {
        return await callGeminiModel(model, body);
      } catch (err) {
        lastError = err;
        // If it's a 429 (quota) or 503/500 (server error), try the NEXT model immediately
        const shouldTryNextModel = 
          err.status === 429 || 
          err.status === 503 || 
          err.status === 500 ||
          err.message.includes('RESOURCE_EXHAUSTED') ||
          err.message.includes('overloaded') ||
          err.message.includes('not found');
        
        if (shouldTryNextModel) {
          console.warn(`Model ${model} failed (${err.message}), trying fallback...`);
          continue; 
        }
        // If it's a 400 (Bad Request/Invalid Key), don't bother trying other models
        throw err;
      }
    }
    throw lastError || new Error('All Gemini models are currently busy. Please try again in 10 seconds.');
  })();

  inFlight.set(dedupKey, promise);
  promise.finally(() => inFlight.delete(dedupKey));

  return promise;
}

// Vision (multimodal) call — accepts base64 image
async function callGeminiVision(prompt, imageBase64) {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const body = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: 'image/jpeg', data: base64Data } },
      ],
    }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
  };

  let lastError;
  for (const model of VISION_MODELS) {
    try {
      return await callGeminiModel(model, body);
    } catch (err) {
      lastError = err;
      const shouldTryNextModel = 
        err.status === 429 || 
        err.status === 503 || 
        err.status === 500 ||
        err.message.includes('RESOURCE_EXHAUSTED') ||
        err.message.includes('overloaded') ||
        err.message.includes('not found');
      
      if (shouldTryNextModel) {
        console.warn(`Vision Model ${model} failed (${err.message}), trying fallback...`);
        continue; 
      }
      throw err;
    }
  }
  throw lastError || new Error('All vision models are currently busy. Please try again.');
}

// ── Gap Detection ──
export async function detectGap({ question, studentAnswer, subject, topic, grade, pastAnswers = [], language = 'en', emotionDetected = null, workAnalysis = null }) {
  const system = `You are EduSense AI, an expert education AI specializing in comprehension gap detection for Indian students.
Analyze the student's answer and classify the misunderstanding type.

Gap types:
- conceptual: wrong mental model of the concept
- linguistic: confused by question language/wording
- procedural: knows concept but wrong steps/process
- prior_knowledge: missing foundational prerequisite
- attention: knows it but careless error
- rote: memorized answer without understanding
- none: correct and understood

Spectrum score 0-100:
0=no idea, 25=heard of it, 50=partially gets it, 75=almost there, 100=fully understands

Return ONLY valid JSON with no markdown fences.`;

  const cameraContext = workAnalysis
    ? `\nCamera Work Analysis: ${JSON.stringify(workAnalysis)}\nFacial Expression: ${emotionDetected || 'not available'}`
    : '';

  const prompt = `Subject: ${subject}
Topic: ${topic}
Grade: ${grade}
Language: ${language}
Question: ${question}
Student Answer: ${studentAnswer}
Past Answers: ${JSON.stringify(pastAnswers)}
Emotion: ${emotionDetected || 'unknown'}${cameraContext}

Return JSON:
{
  "gapType": "conceptual|linguistic|procedural|prior_knowledge|attention|rote|none",
  "spectrumScore": 0-100,
  "isRote": true|false,
  "confusedWith": "string or null",
  "explanation": "simple explanation in ${language}",
  "suggestedBridgeType": "visual_story|text|peer|socratic|group",
  "socraticQuestions": ["q1","q2","q3"]
}`;

  try {
    const raw = await callGemini(prompt, system);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('Offline fallback: detectGap', err.message);
    return {
      gapType: 'conceptual',
      spectrumScore: 40,
      isRote: false,
      confusedWith: null,
      explanation: 'You seem to have a conceptual gap. (Offline — check your API key in Settings)',
      suggestedBridgeType: 'visual_story',
      socraticQuestions: ['What do you think is the main idea?', 'Can you give a real-life example?', 'How would you explain this to a friend?']
    };
  }
}

// ── Story Generation ──
export async function generateStory({ concept, subject, gapType, visualLiteracyLevel, language, culturalProfile }) {
  const { state, background, occupation } = culturalProfile || {};

  const culturalRules = {
    'Punjab': 'wheat farming, fields, tractors, mustard flowers',
    'Haryana': 'wheat farming, dairy, green fields',
    'Kerala': 'fishing boats, coconut trees, backwaters, banana leaves',
    'Tamil Nadu': 'Pongal pot, Kolam, temple gopurams, coconut groves',
    'UP': 'village market, chapati making, bullock carts, Ganga ghats',
    'Bihar': 'maize fields, village choupals, Maithili folk art',
    'default': 'village market, autorickshaws, small shops, school courtyard',
  };

  const visual = {
    1: 'single main object per scene, minimal text, very simple',
    2: 'two characters interacting, simple clear action',
    3: 'full scene with labeled elements',
    4: 'infographic with data, annotations, comparisons',
  };

  const system = `You are a creative educational storyteller for Indian students. Create culturally resonant, simple stories that teach through local context.`;

  const prompt = `Create a 4-panel visual comic story to teach "${concept}" (${subject}) to a student.
Gap type: ${gapType}
Visual literacy level: ${visualLiteracyLevel} — ${visual[visualLiteracyLevel] || visual[2]}
Language: ${language}
State: ${state || 'India'}, Background: ${background || 'rural'}, Occupation: ${occupation || 'farming'}
Cultural context: ${culturalRules[state] || culturalRules['default']}

Return ONLY a valid JSON array of 4 panels (no markdown):
[{"panelNumber":1,"sceneDescription":"...","dialogue":"...","conceptConnection":"..."}]`;

  try {
    const raw = await callGemini(prompt, system);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('Offline fallback: generateStory', err.message);
    return [
      { panelNumber: 1, sceneDescription: "A teacher pointing at a blackboard in a village school", dialogue: "Let's learn this concept together!", conceptConnection: "Introduction to the topic" },
      { panelNumber: 2, sceneDescription: "Two students discussing under a mango tree", dialogue: "I think it means we share equally.", conceptConnection: "Peer discussion" },
      { panelNumber: 3, sceneDescription: "Teacher showing a practical example with fruits", dialogue: "See how dividing this apple works?", conceptConnection: "Practical application" },
      { panelNumber: 4, sceneDescription: "Students smiling with thumbs up", dialogue: "Now I understand! Thank you.", conceptConnection: "Concept mastered" }
    ];
  }
}

// ── Socratic Questions ──
export async function getSocraticQuestions({ concept, subject, language }) {
  const prompt = `Generate 3 Socratic follow-up questions that progressively probe deeper understanding of "${concept}" in ${subject}.
Questions should feel like a friendly conversation. Language: ${language}.
Return ONLY JSON: {"questions":["q1","q2","q3"]}`;

  try {
    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned).questions;
  } catch (err) {
    console.warn('Offline fallback: getSocraticQuestions');
    return ["What do you mean by that?", "Can you explain how you arrived at that answer?", "What would happen if we changed one of the variables?"];
  }
}

// ── Adaptive Learning Path ──
export async function generateLearningPath({ subject, grade, gaps, language }) {
  const prompt = `Given these detected learning gaps for a grade ${grade} student in ${subject}: ${JSON.stringify(gaps)}
Rebuild the learning path. Insert micro-lessons for missing prerequisites. Language: ${language}.
Return ONLY JSON array: [{"chapter":"name","type":"normal|micro|bridge","prerequisiteFor":"string or null","estimatedMinutes":number,"description":"short"}]`;

  try {
    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('Offline fallback: generateLearningPath');
    return [
      { chapter: "Fundamentals Review", type: "micro", prerequisiteFor: "Main Concept", estimatedMinutes: 10, description: "Quick review of the basics." },
      { chapter: "Main Concept", type: "normal", prerequisiteFor: null, estimatedMinutes: 20, description: "The core topic you are learning." },
      { chapter: "Real-World Application", type: "bridge", prerequisiteFor: null, estimatedMinutes: 15, description: "Applying what you learned." }
    ];
  }
}

// ── Teacher Daily Action ──
export async function getTeacherDailyAction({ gapEvents, language = 'hi' }) {
  const prompt = `Given these student gap events from the last 48 hours: ${JSON.stringify(gapEvents.slice(0, 20))}
Generate ONE single teacher action for today that helps the most students.
Be specific: exact words to say, exact activity, estimated time. Language: ${language}.
Return ONLY JSON: {"action":"title","script":"exact words/steps","duration":15,"studentsHelped":5,"subject":""}`;

  try {
    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('Offline fallback: getTeacherDailyAction');
    return {
      action: "Group Discussion Activity",
      script: "Ask students to form groups of 3 and discuss the hardest question from yesterday's homework. Walk around and listen. Prompt stuck groups with: 'What do you already know about this?'",
      duration: 15,
      studentsHelped: 10,
      subject: "General"
    };
  }
}

// ── Peer Teaching Card ──
export async function generatePeerCard({ concept, gapType, language }) {
  const prompt = `Generate a peer teaching script for a student to help their peer understand "${concept}".
Peer's gap type: ${gapType}. Language: ${language}.
Return ONLY JSON: {"openingQuestion":"","expectedAnswer":"","ifWrong":"","relatedExample":"","encouragement":""}`;

  try {
    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('Offline fallback: generatePeerCard');
    return {
      openingQuestion: "How would you explain this in your own words?",
      expectedAnswer: "A simple explanation showing they grasp the core idea.",
      ifWrong: "If they struggle, ask them to think of a similar real-life example.",
      relatedExample: "Think about sharing a pizza equally among friends.",
      encouragement: "Great job! You're getting the hang of it. Keep going!"
    };
  }
}

// ── Baat Cheet Analysis ──
export async function analyzeBaatCheet({ messages, concept, language }) {
  const transcript = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  const prompt = `Analyze this student conversation about "${concept}":

${transcript}

Check for: rote phrases, genuine understanding, confusion signals. Language used: ${language}.
Return ONLY JSON: {"comprehensionLevel":"low|medium|high","roteDetected":false,"genuineUnderstanding":true,"confusionSignals":[],"recommendations":[""],"spectrumScore":0}`;

  try {
    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('Offline fallback: analyzeBaatCheet');
    return {
      comprehensionLevel: "medium",
      roteDetected: false,
      genuineUnderstanding: true,
      confusionSignals: [],
      recommendations: ["Keep practicing with more examples."],
      spectrumScore: 60
    };
  }
}

// ── Generic Chat (SAHAYAK) ──
export async function chatWithSahayak({ messages, language, outputFormat = 'plain', userProfile }) {
  const formatInstructions = {
    plain: '',
    bullets: 'Format your response as clear bullet points.',
    mindmap: 'Format as a nested mind map using indented bullet points.',
    flashcards: 'Format as Q&A flashcard pairs: Q: ... A: ...',
    story: 'Explain through a short relatable story.',
    quiz: 'Create a 5-question multiple choice quiz on this topic.',
  };

  const system = `You are SAHAYAK, EduSense AI's friendly learning companion for Indian students.
Be warm, encouraging, and simple. Use local examples. 
User Role: ${userProfile?.role || 'student'}.
Grade level: ${userProfile?.grade || 'general'}.
Language: ${language}. ${formatInstructions[outputFormat] || ''}
Keep responses concise and engaging. Never be condescending.`;

  const lastMessage = messages[messages.length - 1]?.content || '';
  // Only keep last 6 messages to reduce token usage
  const history = messages.slice(-6).map(m => `${m.role === 'user' ? 'Student' : 'SAHAYAK'}: ${m.content}`).join('\n');
  const prompt = `Conversation so far:\n${history}\n\nStudent's latest message: ${lastMessage}`;

  return await callGemini(prompt, system);
}

// ── Rote Re-check Questions ──
export async function getRoteReformulations({ concept, originalQuestion, language }) {
  const prompt = `The student answered: "${originalQuestion}" about "${concept}" correctly but may be rote memorizing.
Generate 3 reformulation questions testing the same concept differently.
Language: ${language}. Make questions feel fresh and applied.
Return ONLY JSON: {"questions":["q1","q2","q3"]}`;

  try {
    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned).questions;
  } catch (err) {
    console.warn('Offline fallback: getRoteReformulations');
    return ["Can you explain this without the textbook definition?", "How would you teach this to a 5-year-old?", "Give a real-life example of this concept."];
  }
}

// ── Badge Story Narration ──
export async function generateBadgeNarration({ badgeName, studentName, achievement }) {
  const prompt = `Generate an inspiring 2-3 sentence story narration for a student badge.
Badge: "${badgeName}" | Student: "${studentName}" | Achievement: "${achievement}"
Make it feel like an epic adventure milestone. Reference Indian knowledge traditions. Keep it joyful.`;

  try {
    return await callGemini(prompt);
  } catch (err) {
    console.warn('Offline fallback: generateBadgeNarration');
    return `Like the great scholars of Nalanda and Takshashila, ${studentName || 'you'} have proven true dedication! This ${badgeName} badge marks a real milestone on your Gyaan Yatra. Keep going — the path of knowledge is infinite!`;
  }
}

// ── Teacher Gurushakti ──
export async function teacherLearnConcept({ question, subject, language = 'hi' }) {
  const system = `You are an expert teacher educator. Explain concepts clearly to teachers so they can teach better.`;
  const prompt = `Teacher asks: "${question}" (Subject: ${subject})
Provide:
1. Simple explanation (language: ${language})
2. A classroom-friendly example
3. A 5-minute activity script

Format clearly with section headers.`;

  try {
    return await callGemini(prompt, system);
  } catch (err) {
    console.warn('Offline fallback: teacherLearnConcept');
    return `## Offline Teaching Guide\n\n**Simple Explanation**: This is a core concept that requires practical examples to understand.\n\n**Classroom Example**: Use everyday objects like fruits or coins to demonstrate the concept.\n\n**5-Minute Activity**: Have students pair up and explain the concept to each other in 3 sentences. Walk around and listen — this reveals gaps instantly.`;
  }
}

// ── DRISHTI CAM: Analyse Student Written Work ──
export async function analyseStudentWork({ imageBase64, subject, topic, question, grade, language }) {
  const prompt = `Analyze this photo of student's handwritten work.
Subject: ${subject}, Topic: ${topic}, Question: ${question}, Grade: ${grade}, Language: ${language}

Return ONLY valid JSON (no markdown):
{
  "whatStudentWrote": "description",
  "gapType": "conceptual|linguistic|procedural|prior_knowledge|attention|rote|none",
  "gapLocation": "where in their work",
  "spectrumScore": 0,
  "keyObservation": "most important observation",
  "suggestedApproach": "how to bridge the gap",
  "confidence": "high|medium|low"
}`;

  try {
    const raw = await callGeminiVision(prompt, imageBase64);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('Offline fallback: analyseStudentWork');
    return {
      whatStudentWrote: "Offline mode: Unable to analyze image.",
      gapType: "none",
      gapLocation: "N/A",
      spectrumScore: 50,
      keyObservation: "Image analysis requires a valid Gemini API key. Please check Settings.",
      suggestedApproach: "Review the student's work manually until API is connected.",
      confidence: "low"
    };
  }
}

// ── DRISHTI CAM: Read Question from Image ──
export async function readQuestionImage({ imageBase64, subject, grade, language }) {
  const prompt = `Read the question visible in this image.
Subject: ${subject}, Grade: ${grade}, Language: ${language}

Return ONLY valid JSON (no markdown):
{
  "questionText": "the question",
  "keyTerms": ["term1"],
  "prerequisiteKnowledge": ["prereq1"],
  "difficulty": "easy|medium|hard",
  "topic": "topic",
  "subject": "subject"
}`;

  try {
    const raw = await callGeminiVision(prompt, imageBase64);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('Offline fallback: readQuestionImage');
    return {
      questionText: "Offline Mode: Cannot read image. Please check your API key in Settings.",
      keyTerms: ["api key required"],
      prerequisiteKnowledge: ["valid Gemini API key"],
      difficulty: "medium",
      topic: "Unknown",
      subject: "Unknown"
    };
  }
}

export { callGemini };
