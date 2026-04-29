# 🎓 EduSense AI - Bridging Every Learning Gap

**EduSense AI** is a cutting-edge, multilingual education platform designed specifically for the Indian education ecosystem. It goes beyond traditional testing by identifying *why* a student is struggling—whether it's a conceptual misunderstanding, a linguistic barrier, or a procedural error—and provides personalized, culturally resonant learning bridges.

---

## 🌟 Key Features

### 🔍 Precision Gap Detection
* **AI Analysis:** Analyzes student responses to identify specific comprehension gaps (Conceptual, Linguistic, Procedural, Prior Knowledge, or Rote Learning).
* **Spectrum Scoring:** Tracks mastery on a 0-100% spectrum rather than just right/wrong marks.
* **Socratic Interventions:** Uses AI to ask follow-up questions that guide students toward self-correction.

### 🌐 Global Multilingual Interface
* **Real-time Translation:** 100% UI coverage via a dynamic runtime translation system powered by Google Translate API.
* **Language Inclusivity:** Supports English, Hindi, Bengali, Tamil, Telugu, and Marathi to ensure language is never a barrier to learning.

### 🤖 SAHAYAK - Your AI Buddy
* **Personalized Chat:** A friendly AI learning companion that simplifies complex concepts using local examples and stories.
* **Multimodal Intelligence:** Can read handwritten work and diagrams from photos to provide instant feedback.

### 📡 Robust Offline Mode
* **API Fallbacks:** Integrated "Safe Mode" that serves high-quality mock data and pre-defined learning paths if the internet is disconnected or API quotas are exceeded.
* **PWA Ready:** Installable on devices for a native-like experience with local caching for instant load times.

### 📊 Teacher & Student Dashboards
* **Teacher Insights:** Provides educators with daily actionable scripts based on aggregated student gap data.
* **Gamified Learning:** Motivates students with "Gyaan Yatra" coins, streaks, and achievement badges.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **State Management:** Zustand
- **AI Engine:** Google Gemini (Flash 2.0/2.5)
- **Translation:** Google Cloud Translation API
- **Backend/Auth:** Supabase
- **Animations:** Framer Motion
- **Icons:** Lucide React

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Google Cloud API Key (with Gemini and Translation APIs enabled)
- A Supabase Project

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Tejasdev-97/Demo_EduSense_AI.git
   cd Demo_EduSense_AI
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your keys:
   ```env
   VITE_GEMINI_KEY=your_gemini_api_key
   VITE_GOOGLE_TRANSLATE_KEY=your_google_translate_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

---

## 📸 Screenshots

*Check the project in action! The UI features a premium "Glassmorphism" aesthetic with vibrant educational themes.*

---

## 🤝 Contributing
We welcome contributions to make quality education accessible to everyone. Feel free to open an issue or submit a pull request!

---

**Built with ❤️ for the future of Indian education.**
