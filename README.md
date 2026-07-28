# FutureMe - AI Reflection & Future Self Chat
**Brand: THARUN'S**

FutureMe is a premium, AI-powered personal reflection product. A user inputs details about their current life stage, goals, fears, struggles, and one-year vision. The app connects to the **Gemini API** to generate a deeply personal, emotional, and actionable message from their future self, complete with identity metrics, actionable moves, habits, warnings, and mantras. Users can also enter a real-time interactive chat with their FutureMe persona.

---

## 🌟 Key Features

1. **Time Capsule Reflection Form**:
   - Collects Name, Age, Goal/Dream, Current Struggle, One-Year Vision, and Persona Tone.
   - 4 Interactive Tones: **Motivational**, **Brutally Honest**, **Calm Mentor**, **CEO Mode**.
2. **AI Future Self Generation**:
   - Uses Gemini API (`@google/generative-ai`) to generate structured advice.
   - Clean JSON parsing and fallback error handling.
3. **Apple-Style Glassmorphism UI**:
   - Premium dark theme, ambient glowing backdrop, smooth micro-animations, clean typography (`Outfit` & `Inter`).
4. **Result Cards**:
   - Message from Future Self
   - Future Identity
   - Next 3 Moves
   - Daily Habit to Start Today
   - FutureMe Warning
   - Daily Mantra
5. **Actions & Tools**:
   - One-click Copy Result to clipboard.
   - Regenerate reflection.
   - Smooth auto-scroll to Chat.
6. **Interactive AI Chat**:
   - Real-time conversation with Future Self persona using session memory.
   - Animated typing indicator.

---

## 📁 Project Structure

```
futureme/
├── backend/
│   ├── server.js          # Express server & Gemini API routes
│   ├── package.json       # Dependencies & scripts
│   ├── .env               # Environment variables (GEMINI_API_KEY)
│   └── .env.example       # Example env configuration
├── frontend/
│   ├── index.html         # Main HTML markup
│   ├── style.css          # Design system & dark glassmorphism styles
│   └── script.js          # Frontend state, API requests, toast alerts & chat
└── README.md              # Project documentation
```

---

## ⚙️ Installation & Setup

### 1. Navigate to the backend directory
```bash
cd futureme/backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Gemini API Key
Create or update the `.env` file in `futureme/backend/`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=5000
```
> Get your free Gemini API key from [Google AI Studio](https://aistudio.google.com/).

---

## 🚀 Running the App

### Start the Server (Single Command)
Run:
```bash
npm start
```
Or for development with auto-reload:
```bash
npm run dev
```

### Open in Browser
Open your browser and visit:
```
http://localhost:5000
```
*(The Express backend automatically serves the frontend at `http://localhost:5000`)*

Alternatively, you can open `futureme/frontend/index.html` directly in any web browser if the backend is running on port 5000.

---

## 📡 API Routes

### 1. `POST /api/generate-futureme`
Generates the initial reflection & Future Self breakdown.

**Request Body**:
```json
{
  "name": "Tharun",
  "age": "23",
  "goal": "Build a successful AI startup",
  "struggle": "Lack of consistency",
  "oneYearVision": "Running a profitable AI company",
  "tone": "Brutally Honest"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "...",
    "futureIdentity": "...",
    "nextMoves": ["...", "...", "..."],
    "habit": "...",
    "warning": "...",
    "mantra": "..."
  }
}
```

### 2. `POST /api/chat-futureme`
Interactive conversation with FutureMe.

**Request Body**:
```json
{
  "userProfile": {
    "name": "Nitish",
    "age": "23",
    "goal": "Build a successful AI startup",
    "struggle": "Lack of consistency",
    "oneYearVision": "Running a profitable AI company",
    "tone": "Brutally Honest"
  },
  "chatHistory": [
    { "role": "user", "message": "Will I actually make it?" },
    { "role": "futureme", "message": "Only if your daily actions stop negotiating with your dreams." }
  ],
  "question": "What should I focus on this week?"
}
```

**Response**:
```json
{
  "success": true,
  "reply": "..."
}
```

---

## 🔒 Security Note
- The `GEMINI_API_KEY` is kept safe on the backend in `.env` and is **never** exposed to the client-side JavaScript.
