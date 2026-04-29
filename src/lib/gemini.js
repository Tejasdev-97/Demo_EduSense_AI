// Gemini API integration — all AI calls go through here

// Model fallback chain: most stable first
const MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash'];
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function getKey() {
  return localStorage.getItem('userGeminiKey') || import.meta.env.VITE_GEMINI_KEY || '';
}

async function callGeminiModel(model, body) {
  const key = getKey();
  if (!key) throw new Error('No Gemini API key. Please add your key in Settings → API Keys.');

  const res = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `Gemini API error ${res.status}`;
    // Give a friendly message for quota errors
    if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || res.status === 429) {
      throw new Error('API quota exceeded. Please get a new Gemini API key from aistudio.google.com/app/apikey (free, takes 1 minute) and update it in Settings → API Keys.');
    }
    throw new Error(msg);
  }

  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Text-only call with automatic model fallback
async function callGemini(prompt, systemInstruction = '') {
  const body = {
    system_instruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  };

  let lastError;
  for (const model of MODELS) {
    try {
      return await callGeminiModel(model, body);
    } catch (err) {
      const isRetryable =
        err.message.includes('not found') ||
        err.message.includes('high demand') ||
        err.message.includes('RESOURCE_EXHAUSTED') ||
        err.message.includes('overloaded') ||
        err.message.includes('503');
      if (isRetryable) { lastError = err; continue; }
      throw err;
    }
  }
  throw lastError || new Error('All Gemini models are currently unavailable. Please try again.');
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
    generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
  };

  let lastError;
  for (const model of MODELS) {
    try {
      return await callGeminiModel(model, body);
    } catch (err) {
      const isRetryable =
        err.message.includes('not found') ||
        err.message.includes('high demand') ||
        err.message.includes('RESOURCE_EXHAUSTED') ||
        err.message.includes('overloaded') ||
        err.message.includes('503');
      if (isRetryable) { lastError = err; continue; }
      throw err;
    }
  }
  throw lastError || new Error('Vision analysis unavailable. Please try again.');
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

Check for rote learning: exact textbook phrasing without deeper understanding.
Return ONLY valid JSON with no markdown fences.`;

  const cameraContext = workAnalysis
    ? `\nCamera Work Analysis: ${JSON.stringify(workAnalysis)}\nFacial Expression: ${emotionDetected || 'not available'}\nPrioritize work analysis if confidence is high.`
    : '';

  const prompt = `Subject: ${subject}
Topic: ${topic}
Grade: ${grade}
Language: ${language}
Question: ${question}
Student Answer: ${studentAnswer}
Past Answers (context): ${JSON.stringify(pastAnswers)}
Emotion Detected: ${emotionDetected || 'unknown'}${cameraContext}

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
    console.warn('Using offline fallback for detectGap:', err);
    return {
      gapType: 'conceptual',
      spectrumScore: 40,
      isRote: false,
      confusedWith: 'Offline Fallback Model',
      explanation: 'You seem to have a conceptual gap. (Offline Fallback)',
      suggestedBridgeType: 'visual_story',
      socraticQuestions: ['What do you think is the main idea?', 'Can you give a real-life example?']
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
Student's state: ${state || 'India'}
Background: ${background || 'rural'}
Family occupation: ${occupation || 'farming'}
Cultural context cues: ${culturalRules[state] || culturalRules['default']}

Return ONLY a valid JSON array of 4 panels (no markdown):
[
  {
    "panelNumber": 1,
    "sceneDescription": "detailed 50-word image generation prompt showing the concept visually",
    "dialogue": "what character says in ${language} (max 20 words, simple vocabulary)",
    "conceptConnection": "how this panel teaches the concept"
  }
]`;

  try {
    const raw = await callGemini(prompt, system);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('Using offline fallback for generateStory:', err);
    return [
      { panelNumber: 1, sceneDescription: "A teacher pointing at a blackboard in a village school", dialogue: "Let's learn this concept (Offline Mode)", conceptConnection: "Introduction to the topic" },
      { panelNumber: 2, sceneDescription: "Two students discussing under a tree", dialogue: "I think it means we share equally.", conceptConnection: "Peer discussion" },
      { panelNumber: 3, sceneDescription: "Teacher showing a practical example with fruits", dialogue: "See how dividing this apple works?", conceptConnection: "Practical application" },
      { panelNumber: 4, sceneDescription: "Students smiling and nodding", dialogue: "I understand now!", conceptConnection: "Resolution" }
    ];
  }
}

// ── Socratic Questions ──
export async function getSocraticQuestions({ concept, subject, language }) {
  const prompt = `Generate 3 Socratic follow-up questions that progressively probe deeper understanding of "${concept}" in ${subject}.
Questions should feel like a friendly conversation, not a test. Language: ${language}.
Return ONLY JSON: {"questions":["q1","q2","q3"]}`;

  try {
    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned).questions;
  } catch (err) {
    console.warn('Using offline fallback for getSocraticQuestions:', err);
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
    console.warn('Using offline fallback for generateLearningPath:', err);
    return [
      { chapter: "Fundamentals (Offline)", type: "micro", prerequisiteFor: "Main Concept", estimatedMinutes: 10, description: "A quick review of the basics." },
      { chapter: "Main Concept", type: "normal", prerequisiteFor: null, estimatedMinutes: 20, description: "The core topic you are trying to learn." },
      { chapter: "Advanced Application", type: "bridge", prerequisiteFor: null, estimatedMinutes: 15, description: "Applying what you learned." }
    ];
  }
}

// ── Teacher Daily Action ──
export async function getTeacherDailyAction({ gapEvents, language = 'hi' }) {
  const prompt = `Given these student gap events from the last 48 hours: ${JSON.stringify(gapEvents.slice(0, 20))}
Generate ONE single teacher action for today that helps the most students.
Be specific: exact words to say, exact activity, estimated time.
Language: ${language}.
Return ONLY JSON: {"action":"title","script":"exact words/steps","duration":15,"studentsHelped":5,"subject":""}`;

  try {
    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('Using offline fallback for getTeacherDailyAction:', err);
    return {
      action: "Offline Group Activity",
      script: "Ask students to form groups of 3 and discuss the hardest question from yesterday's homework. Walk around and listen to their reasoning.",
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
    console.warn('Using offline fallback for generatePeerCard:', err);
    return {
      openingQuestion: "How would you explain this in your own words?",
      expectedAnswer: "A simple explanation showing they grasp the core idea.",
      ifWrong: "If they struggle, ask them to think about a similar example.",
      relatedExample: "Think about sharing a pizza.",
      encouragement: "Great job! You're getting the hang of it."
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
    console.warn('Using offline fallback for analyzeBaatCheet:', err);
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

// ── Generic Chat ──
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
Be warm, encouraging, and simple. Use local examples. Grade level: ${userProfile?.grade || 'general'}.
Language: ${language}. ${formatInstructions[outputFormat] || ''}
Keep responses concise and engaging. Never be condescending.`;

  const lastMessage = messages[messages.length - 1]?.content || '';
  const history = messages.slice(-10).map(m => `${m.role === 'user' ? 'Student' : 'SAHAYAK'}: ${m.content}`).join('\n');
  const prompt = `Conversation so far:\n${history}\n\nStudent's latest message: ${lastMessage}`;

  try {
    return await callGemini(prompt, system);
  } catch (err) {
    console.warn('Using offline fallback for chatWithSahayak:', err);
    return "I am operating in Offline Mode (or your API key is invalid/missing). I cannot process complex queries right now, but you can continue learning with offline resources!";
  }
}

// ── Rote Re-check Questions ──
export async function getRoteReformulations({ concept, originalQuestion, language }) {
  const prompt = `The student answered this question: "${originalQuestion}" about "${concept}" correctly but may be rote memorizing.
Generate 3 reformulation questions that test the same concept differently.
Language: ${language}. Make questions feel fresh and applied, not repeated.
Return ONLY JSON: {"questions":["q1","q2","q3"]}`;

  try {
    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned).questions;
  } catch (err) {
    console.warn('Using offline fallback for getRoteReformulations:', err);
    return ["Can you explain this without using the textbook definition?", "How would you teach this to a 5-year-old?", "Give an example of this from real life."];
  }
}

// ── Badge Story Narration ──
export async function generateBadgeNarration({ badgeName, studentName, achievement }) {
  const prompt = `Generate an inspiring 2-3 sentence story narration for a student badge.
Badge: "${badgeName}" | Student: "${studentName}" | Achievement: "${achievement}"
Make it feel like an epic adventure milestone. Reference Indian knowledge traditions (IKS). Keep it joyful and motivating.`;
  try {
    return await callGemini(prompt);
  } catch (err) {
    console.warn('Using offline fallback for generateBadgeNarration:', err);
    return "You have achieved a great milestone! Keep up the excellent work and continue your learning journey.";
  }
}

// ── Teacher Gurushakti ──
export async function teacherLearnConcept({ question, subject, language = 'hi' }) {
  const system = `You are an expert teacher educator. Explain concepts clearly to teachers so they can teach better.`;
  const prompt = `Teacher asks: "${question}" (Subject: ${subject})
Provide:
1. Simple explanation (language: ${language})
2. A classroom-friendly example
3. A 5-minute activity script they can use with students

Format clearly with section headers.`;
  try {
    return await callGemini(prompt, system);
  } catch (err) {
    console.warn('Using offline fallback for teacherLearnConcept:', err);
    return "# Offline Teaching Guide\n**Simple Explanation**: This is a core concept that requires practical examples to understand.\n**Classroom Example**: Use everyday objects like fruits or coins to demonstrate.\n**Activity**: Have students pair up and explain it to each other for 5 minutes.";
  }
}

// ── DRISHTI CAM: Analyse Student Written Work ──
export async function analyseStudentWork({ imageBase64, subject, topic, question, grade, language }) {
  const prompt = `You are EduSense AI analyzing a photo of student's handwritten/drawn work.

Subject: ${subject}
Topic: ${topic}
Question asked: ${question}
Student grade: ${grade}
Language: ${language}

Analyze this image of the student's written work. Identify:
1. What has the student written or drawn?
2. Which gap type does it show?
   - conceptual: wrong mental model in diagram or explanation
   - linguistic: right concept, wrong words or terminology
   - procedural: correct formula but wrong steps or sequence
   - prior_knowledge: blank or sparse, cannot start
   - attention: mostly correct with one careless slip
   - rote: memorized phrases without application
   - none: correct and shows understanding
3. Exact location of the gap in their work
4. Spectrum score 0-100

Return ONLY valid JSON (no markdown):
{
  "whatStudentWrote": "description of work",
  "gapType": "conceptual|linguistic|procedural|prior_knowledge|attention|rote|none",
  "gapLocation": "exactly where in their work",
  "spectrumScore": 0,
  "keyObservation": "most important thing noticed",
  "suggestedApproach": "how to bridge this gap",
  "confidence": "high|medium|low"
}`;

  try {
    const raw = await callGeminiVision(prompt, imageBase64);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('Using offline fallback for analyseStudentWork:', err);
    return {
      whatStudentWrote: "Offline mode: Unable to analyze image.",
      gapType: "none",
      gapLocation: "N/A",
      spectrumScore: 50,
      keyObservation: "Image analysis requires an active internet connection and valid Gemini API key.",
      suggestedApproach: "Please review the student's work manually.",
      confidence: "low"
    };
  }
}

// ── DRISHTI CAM: Read Question from Image ──
export async function readQuestionImage({ imageBase64, subject, grade, language }) {
  const prompt = `Read the question or problem visible in this image.

Subject: ${subject}
Grade: ${grade}
Language: ${language}

Extract:
1. The exact question being asked
2. Key terms and concepts involved
3. What prior knowledge is needed
4. Difficulty level (easy/medium/hard)
5. Subject area and specific topic

Return ONLY valid JSON (no markdown):
{
  "questionText": "the question",
  "keyTerms": ["term1", "term2"],
  "prerequisiteKnowledge": ["prereq1"],
  "difficulty": "easy|medium|hard",
  "topic": "specific topic",
  "subject": "subject area"
}`;

  try {
    const raw = await callGeminiVision(prompt, imageBase64);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('Using offline fallback for readQuestionImage:', err);
    return {
      questionText: "Offline Mode: Cannot read image text.",
      keyTerms: ["offline", "fallback"],
      prerequisiteKnowledge: ["internet connection"],
      difficulty: "medium",
      topic: "Unknown",
      subject: "Unknown"
    };
  }
}

export { callGemini };
