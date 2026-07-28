const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static frontend files from ../frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Helper to check API Key configuration
const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === '' || key.includes('replace_with')) {
    return null;
  }
  return key.trim();
};

// Current, live Gemini models (as of July 2026).
// gemini-1.5-* and gemini-1.0-* have been fully shut down by Google and always 404 — do not use them.
const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash-lite'];

/**
 * Call Gemini API with fallback models if primary model hits rate limits or unavailable
 */
async function generateContentWithFallback(ai, prompt) {
  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
      });
      const text = response.text;
      if (text) {
        return text;
      }
    } catch (err) {
      console.warn(`[Gemini API] Model ${modelName} failed or unavailable: ${err.message}. Trying next model...`);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini model attempts failed.');
}

/**
 * Clean markdown JSON wrappers if Gemini includes ```json ... ```
 */
function cleanJsonString(rawText) {
  let cleaned = rawText.trim();
  // Remove markdown code fence blocks if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }
  // If there's still text around JSON, extract the first { ... } block
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  return cleaned;
}/**
 * Generate rich, personalized reflection fallback if Gemini API is unavailable or key is restricted
 */
function generateSmartReflectionFallback({ name, age, goal, struggle, oneYearVision, tone }) {
  const userTone = (tone || 'Motivational').toLowerCase();
  
  let message = '';
  let mantra = '';
  let warning = '';
  let habit = '';
  
  if (userTone.includes('honest') || userTone.includes('brutally')) {
    message = `Listen to me carefully, ${name}. Exactly one year from now, you made it—you achieved "${goal}" and built "${oneYearVision}". But let's cut through the noise: it only happened because you stopped letting "${struggle}" rule your choices. Stop negotiating with yourself every morning. Every time you hesitate or give in to "${struggle}", you delay the future self you claim to want. Stop overthinking, eliminate the excuses, and lock in today.`;
    mantra = `Excuses don't build my future. Action does.`;
    warning = `Beware of letting "${struggle}" hijack your daily discipline when things get hard.`;
    habit = `Block 45 minutes every morning for deep work on ${goal} before touching your phone.`;
  } else if (userTone.includes('ceo')) {
    message = `Executive Memo from 1 Year in the Future to current ${name}: We hit our strategic target of "${oneYearVision}". The primary bottleneck holding you back right now is "${struggle}". To achieve "${goal}", treat your time and energy as non-renewable capital. Eliminate low-leverage distractions, double down on high-impact execution, and measure output weekly. The market rewards execution, not intention.`;
    mantra = `Ruthless prioritization, relentless execution.`;
    warning = `Do not waste executive bandwidth on low-value tasks or prolonged hesitation.`;
    habit = `Conduct a 5-minute daily ROI review: Did today's actions bring us closer to ${goal}?`;
  } else if (userTone.includes('mentor') || userTone.includes('calm')) {
    message = `Hello ${name}. Take a deep breath. Looking back from one year in the future, I want you to know that everything worked out. You achieved "${oneYearVision}" and reached "${goal}". The struggle with "${struggle}" felt overwhelming at times, but it was simply the fire that forged your clarity and wisdom. Be patient with your progress, stay grounded in the present moment, and trust the process. You are far stronger than you realize.`;
    mantra = `Patience in the process, peace in the purpose.`;
    warning = `Don't confuse temporary friction with lack of progress. Stay steady.`;
    habit = `Spend 10 minutes each evening reflecting on small daily wins toward ${goal}.`;
  } else { // Motivational
    message = `Hey ${name}! I am writing to you from 365 days in the future, and I am so proud of you. Look at what we achieved: "${oneYearVision}"! I know right now you are facing "${struggle}", but please remember why you started working toward "${goal}". Every small step you take today is building the life you dreamed of. Keep showing up, keep believing in your vision, and never let doubt win. You've got this!`;
    mantra = `I am growing stronger and closer to my vision every single day.`;
    warning = `Never give up on "${goal}" just because today felt difficult.`;
    habit = `Write down your top priority task for ${goal} every single morning and complete it first.`;
  }

  return {
    message,
    futureIdentity: `The high-impact, fulfilled version of ${name} who mastered ${goal}`,
    nextMoves: [
      `Break down "${goal}" into 3 immediate micro-milestones for this week.`,
      `Design a clear system to bypass "${struggle}" whenever it arises.`,
      `Commit to 60 minutes of uninterrupted focus every day toward "${oneYearVision}".`
    ],
    habit,
    warning,
    mantra
  };
}

/**
 * Generate smart chat reply fallback if Gemini API is unavailable or key is restricted
 */
function generateSmartChatFallback({ userProfile, question }) {
  const profile = userProfile || {};
  const name = profile.name || 'Friend';
  const goal = profile.goal || 'your core dream';
  const struggle = profile.struggle || 'daily friction';
  const tone = (profile.tone || 'Motivational').toLowerCase();

  if (tone.includes('honest')) {
    return `Look ${name}, you asked: "${question}". Here is the truth from your future self: stop looking for shortcuts. You already know what needs to be done to achieve ${goal}. The only thing standing in your way is your struggle with ${struggle}. Take full ownership today, execute without complaining, and watch your reality transform.`;
  } else if (tone.includes('ceo')) {
    return `Regarding "${question}": From an execution standpoint, evaluate this decision against our core objective of ${goal}. If it accelerates our timeline, double down immediately. If it feeds into ${struggle}, eliminate it from your schedule. Prioritize action over deliberation.`;
  } else if (tone.includes('mentor') || tone.includes('calm')) {
    return `I hear you ${name}. When considering "${question}", remember that your journey toward ${goal} is built step-by-step. Don't let anxiety about ${struggle} cloud your judgment. Focus on the next right step today, remain calm, and trust your inner strength.`;
  } else {
    return `Hey ${name}! I love that you're asking about "${question}". Remember, from where I stand 1 year in the future, every question and effort you invest into ${goal} pays off. Don't let ${struggle} get in your head—stay focused on your dream, take action today, and know that I'm cheering for you every step of the way!`;
  }
}

/**
 * POST /api/generate-futureme
 * Generate personalized reflection and future self profile
 */
app.post('/api/generate-futureme', async (req, res) => {
  try {
    const { name, age, goal, struggle, oneYearVision, tone } = req.body || {};

    if (!name || !goal || !struggle || !oneYearVision) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in all required fields (Name, Goal, Struggle, One-Year Vision).'
      });
    }

    const apiKey = getApiKey();
    const selectedTone = tone || 'Motivational';

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are FutureMe, the future successful version of the user. You are not a generic motivational coach. You speak with emotional intelligence, clarity, and deep personal understanding. Your job is to help the user see who they are becoming, what they must change, and what they should do next.

Write as if you are the user's future self speaking directly to their current self.

Tone selected by user: ${selectedTone}

Tone instruction guidelines:
- Motivational: warm, inspiring, supportive, deeply uplifting
- Brutally Honest: direct, sharp, uncompromising, zero excuses
- Calm Mentor: peaceful, wise, grounded, patient, perspective-rich
- CEO Mode: strategic, hyper-focused, execution-heavy, outcome-driven

User details:
Name: ${name}
Age: ${age || 'Not specified'}
Goal: ${goal}
Current struggle: ${struggle}
One-year vision: ${oneYearVision}

Return ONLY valid JSON in this exact structure without markdown backticks or commentary:
{
  "message": "A powerful 120-180 word message from the future self.",
  "futureIdentity": "A concise description of who the user is becoming.",
  "nextMoves": ["Action 1", "Action 2", "Action 3"],
  "habit": "One small daily habit they should start today.",
  "warning": "One mistake their future self warns them about.",
  "mantra": "A short memorable line they can repeat daily."
}

Make it specific to their goal (${goal}) and struggle (${struggle}). Avoid generic motivation. Avoid clichés. Make it emotional but practical.`;

        const rawResponse = await generateContentWithFallback(ai, prompt);
        const cleanedJson = cleanJsonString(rawResponse);
        const parsedData = JSON.parse(cleanedJson);

        const data = {
          message: parsedData.message || `Hey ${name}, I am writing to you from 1 year in the future...`,
          futureIdentity: parsedData.futureIdentity || `The resilient, focused version of ${name}`,
          nextMoves: Array.isArray(parsedData.nextMoves) && parsedData.nextMoves.length > 0
            ? parsedData.nextMoves
            : ['Focus on execution daily', 'Track progress weekly', 'Eliminate distraction'],
          habit: parsedData.habit || 'Spend 20 minutes every morning working on your priority goal.',
          warning: parsedData.warning || 'Do not let short-term friction stop your long-term vision.',
          mantra: parsedData.mantra || 'Consistency over perfection.'
        };

        return res.json({ success: true, data });
      } catch (geminiError) {
        console.warn('[Gemini API Fallback Triggered]:', geminiError.message);
      }
    }

    // Smart Fallback Engine
    const data = generateSmartReflectionFallback({ name, age, goal, struggle, oneYearVision, tone: selectedTone });
    return res.json({ success: true, data });

  } catch (error) {
    console.error('[API /api/generate-futureme Error]:', error.message || error);
    const data = generateSmartReflectionFallback(req.body || {});
    return res.json({ success: true, data });
  }
});

/**
 * POST /api/chat-futureme
 * Interactive follow-up chat with FutureMe persona
 */
app.post('/api/chat-futureme', async (req, res) => {
  try {
    const { userProfile, chatHistory, question } = req.body || {};

    if (!question || question.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Question is required.'
      });
    }

    const apiKey = getApiKey();
    const profile = userProfile || {};

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const name = profile.name || 'Friend';
        const age = profile.age || 'Unknown';
        const goal = profile.goal || 'Achieve my full potential';
        const struggle = profile.struggle || 'Friction and self-doubt';
        const oneYearVision = profile.oneYearVision || 'Achieved my key milestones';
        const tone = profile.tone || 'Motivational';

        let formattedHistory = 'No prior chat history.';
        if (Array.isArray(chatHistory) && chatHistory.length > 0) {
          formattedHistory = chatHistory.slice(-10).map(item => {
            const sender = item.role === 'user' ? `${name} (Current Self)` : 'FutureMe (Future Self)';
            return `${sender}: ${item.message}`;
          }).join('\n');
        }

        const prompt = `You are FutureMe, the future version of ${name} who already achieved their one-year vision. Reply directly to ${name}'s question. Be personal, sharp, honest, and useful. Speak as their own future self.

User profile:
Name: ${name}
Age: ${age}
Goal: ${goal}
Struggle: ${struggle}
One-year vision: ${oneYearVision}
Tone requested: ${tone}

Recent chat history:
${formattedHistory}

Current question from ${name}:
"${question}"

Reply in 2-5 short paragraphs. Give at least one clear action step ${name} should execute today.`;

        const reply = await generateContentWithFallback(ai, prompt);
        return res.json({ success: true, reply: reply.trim() });
      } catch (geminiError) {
        console.warn('[Gemini Chat Fallback Triggered]:', geminiError.message);
      }
    }

    // Smart Chat Fallback Engine
    const reply = generateSmartChatFallback({ userProfile, question });
    return res.json({ success: true, reply });

  } catch (error) {
    console.error('[API /api/chat-futureme Error]:', error);
    const reply = generateSmartChatFallback({ userProfile: req.body?.userProfile, question: req.body?.question });
    return res.json({ success: true, reply });
  }
});

// Global Express error handler to guarantee JSON responses for all errors
app.use((err, req, res, next) => {
  console.error('[Unhandled Express Error]:', err);
  res.status(500).json({
    success: false,
    error: 'FutureMe could not respond right now. Try again.'
  });
});

// Fallback route to serve index.html for single page app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server with automatic port recovery if the configured port is occupied
function startServer(port, maxAttempts = 5) {
  const server = app.listen(port, () => {
    console.log(`===================================================`);
    console.log(`🚀 THARUN'S FutureMe Backend running on port ${port}`);
    console.log(`🔗 Local URL: http://localhost:${port}`);
    console.log(`===================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port < Number(PORT) + maxAttempts) {
      const nextPort = port + 1;
      console.warn(`\n⚠️ Port ${port} is currently in use.`);
      console.log(`🔄 Retrying startup on fallback port ${nextPort}...\n`);
      startServer(nextPort, maxAttempts);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

startServer(Number(PORT));
