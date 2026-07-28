// ==========================================================================
// FutureMe Frontend Application Engine
// Brand: THARUN'S
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  let userProfile = null;
  let latestData = null;
  let chatHistory = [];
  let isLoading = false;
  let loadingInterval = null;
  let selectedTone = 'Motivational';
  let soundEnabled = true;
  let typewriterTimeout = null;

  // Web Audio Synthesizer for UI Micro-Interactions
  const audioCtx = typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined'
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null;

  function playUiSound(type = 'click') {
    if (!soundEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'chip') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch (e) {
      // Ignore audio initialization edge cases
    }
  }

  // DOM Elements - Navigation & Sound
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIconOn = document.getElementById('soundIconOn');
  const soundIconOff = document.getElementById('soundIconOff');

  // DOM Elements - Form & Inputs
  const formSection = document.getElementById('formSection');
  const reflectionForm = document.getElementById('reflectionForm');
  const nameInput = document.getElementById('name');
  const ageInput = document.getElementById('age');
  const goalInput = document.getElementById('goal');
  const struggleInput = document.getElementById('struggle');
  const oneYearVisionInput = document.getElementById('oneYearVision');
  const toneSelector = document.getElementById('toneSelector');
  const submitBtn = document.getElementById('submitBtn');

  // DOM Elements - Loading State
  const loadingState = document.getElementById('loadingState');
  const loadingPercent = document.getElementById('loadingPercent');
  const loadingTitle = document.getElementById('loadingTitle');
  const progressFill = document.getElementById('progressFill');

  // DOM Elements - Result Dashboard
  const resultSection = document.getElementById('resultSection');
  const futureMessage = document.getElementById('futureMessage');
  const futureMantra = document.getElementById('futureMantra');
  const futureIdentity = document.getElementById('futureIdentity');
  const futureHabit = document.getElementById('futureHabit');
  const nextMovesGrid = document.getElementById('nextMovesGrid');
  const futureWarning = document.getElementById('futureWarning');
  const copyMantraBtn = document.getElementById('copyMantraBtn');

  // DOM Elements - Action Bar
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const regenerateBtn = document.getElementById('regenerateBtn');
  const scrollToChatBtn = document.getElementById('scrollToChatBtn');

  // DOM Elements - Chat Section
  const chatSection = document.getElementById('chatSection');
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const typingIndicator = document.getElementById('typingIndicator');
  const chatHeaderName = document.getElementById('chatHeaderName');
  const chatToneBadge = document.getElementById('chatToneBadge');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  // --------------------------------------------------------------------------
  // 1. Sound Toggle Handler
  // --------------------------------------------------------------------------
  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      soundIconOn.classList.remove('hidden');
      soundIconOff.classList.add('hidden');
      showToast('UI Audio FX Enabled', 'success');
      playUiSound('click');
    } else {
      soundIconOn.classList.add('hidden');
      soundIconOff.classList.remove('hidden');
      showToast('UI Audio FX Muted', 'info');
    }
  });

  // --------------------------------------------------------------------------
  // 2. Tone Selector Switcher
  // --------------------------------------------------------------------------
  toneSelector.addEventListener('click', (e) => {
    const card = e.target.closest('.tone-card');
    if (!card) return;

    playUiSound('click');
    document.querySelectorAll('.tone-card').forEach(btn => btn.classList.remove('active'));
    card.classList.add('active');
    selectedTone = card.dataset.tone;
  });

  // --------------------------------------------------------------------------
  // 3. Form Submission & Generation Protocol
  // --------------------------------------------------------------------------
  reflectionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isLoading) return;

    playUiSound('click');

    const name = nameInput.value.trim();
    const age = ageInput.value.trim();
    const goal = goalInput.value.trim();
    const struggle = struggleInput.value.trim();
    const oneYearVision = oneYearVisionInput.value.trim();

    if (!name || !goal || !struggle || !oneYearVision) {
      showToast('Please fill in all required fields marked with *', 'error');
      return;
    }

    userProfile = { name, age, goal, struggle, oneYearVision, tone: selectedTone };

    setLoadingUI(true);

    try {
      const response = await fetch('/api/generate-futureme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userProfile)
      });

      const rawText = await response.text();
      let result = {};
      try {
        result = JSON.parse(rawText);
      } catch (pErr) {
        console.error('Non-JSON server response:', rawText);
        throw new Error('FutureMe could not respond right now. Try again.');
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate FutureMe protocol.');
      }

      latestData = result.data;
      renderResult(latestData, userProfile);
      playUiSound('success');
      showToast(`Protocol Transmitted! Welcome to your future, ${name}.`, 'success');

    } catch (err) {
      console.error('Error generating FutureMe:', err);
      showToast(err.message || 'FutureMe could not respond right now. Try again.', 'error');
      setLoadingUI(false, true);
    }
  });

  function setLoadingUI(active, restoreForm = false) {
    isLoading = active;

    if (loadingInterval) {
      clearInterval(loadingInterval);
      loadingInterval = null;
    }

    if (active) {
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').textContent = 'Connecting Timeline Node...';

      formSection.classList.add('hidden');
      resultSection.classList.add('hidden');
      loadingState.classList.remove('hidden');

      let currentPct = 0;
      const loadingPhrases = [
        'Synthesizing FutureMe Persona...',
        'Mapping 1-year leverage milestones...',
        'Extracting daily core mantra...',
        'Establishing timeline node synchronization...'
      ];

      loadingInterval = setInterval(() => {
        if (!isLoading) {
          clearInterval(loadingInterval);
          return;
        }
        currentPct += Math.floor(Math.random() * 12) + 8;
        if (currentPct > 96) currentPct = 96;

        loadingPercent.textContent = `${currentPct}%`;
        progressFill.style.width = `${currentPct}%`;

        const phraseIdx = Math.floor((currentPct / 100) * loadingPhrases.length);
        if (loadingPhrases[phraseIdx]) {
          loadingTitle.textContent = loadingPhrases[phraseIdx];
        }
      }, 250);

    } else {
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text').textContent = 'Generate My FutureMe Protocol';
      loadingState.classList.add('hidden');

      if (restoreForm) {
        formSection.classList.remove('hidden');
      }
    }
  }

  // --------------------------------------------------------------------------
  // 4. Render Result Data & Typewriter Effect
  // --------------------------------------------------------------------------
  function renderResult(data, profile) {
    setLoadingUI(false);

    // Populate static fields
    futureMantra.textContent = `"${data.mantra}"`;
    futureIdentity.textContent = data.futureIdentity;
    futureHabit.textContent = data.habit;
    futureWarning.textContent = data.warning;

    // Render Typewriter Message from Future Self
    typewriterEffect(futureMessage, `"${data.message}"`);

    // Render Next Moves Step Tiles
    nextMovesGrid.innerHTML = '';
    if (Array.isArray(data.nextMoves)) {
      data.nextMoves.forEach((move, idx) => {
        const stepCard = document.createElement('div');
        stepCard.classList.add('move-step-card');
        stepCard.innerHTML = `
          <span class="step-num">STEP 0${idx + 1}</span>
          <p class="move-text">${escapeHtml(move)}</p>
        `;
        nextMovesGrid.appendChild(stepCard);
      });
    }

    // Initialize Chat Persona
    chatHeaderName.textContent = `Future ${profile.name}`;
    chatToneBadge.textContent = profile.tone;
    chatHistory = []; // Reset history for fresh session

    chatMessages.innerHTML = '';
    appendChatMessage('futureme', `Greetings ${profile.name}! Your 1-year future persona is online. We hit our primary objective: "${profile.goal}". Ask me anything about how we got here.`);

    // Reveal Result Dashboard
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function typewriterEffect(element, text, speed = 18) {
    if (typewriterTimeout) clearTimeout(typewriterTimeout);
    element.textContent = '';
    let i = 0;

    function typeChar() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        typewriterTimeout = setTimeout(typeChar, speed);
      }
    }
    typeChar();
  }

  // Copy Mantra Button
  copyMantraBtn.addEventListener('click', () => {
    if (!latestData) return;
    playUiSound('click');
    navigator.clipboard.writeText(latestData.mantra)
      .then(() => showToast('Mantra copied to clipboard!', 'success'))
      .catch(() => showToast('Failed to copy mantra.', 'error'));
  });

  // --------------------------------------------------------------------------
  // 5. Action Bar (Copy Report, Download File, Regenerate, Scroll to Chat)
  // --------------------------------------------------------------------------
  copyBtn.addEventListener('click', () => {
    if (!latestData || !userProfile) return;
    playUiSound('click');

    const formattedText = `================================================
✨ THARUN'S FUTUREME EXECUTIVE PROTOCOL REPORT ✨
User: ${userProfile.name} | Tone: ${userProfile.tone}
================================================

👑 FUTURE IDENTITY:
${latestData.futureIdentity}

💌 TRANSMISSION FROM YOUR 1-YEAR FUTURE SELF:
"${latestData.message}"

🚀 NEXT 3 STRATEGIC MOVES:
${latestData.nextMoves.map((m, i) => `0${i + 1}. ${m}`).join('\n')}

⚡ DAILY HABIT TO START TODAY:
${latestData.habit}

⚠️ CRITICAL FUTUREME WARNING:
${latestData.warning}

🔥 DAILY CORE MANTRA:
"${latestData.mantra}"

================================================
Generated via FutureMe AI Protocol • Powered by Gemini AI
================================================`;

    navigator.clipboard.writeText(formattedText)
      .then(() => showToast('Full protocol report copied to clipboard!', 'success'))
      .catch(() => showToast('Failed to copy. Please copy manually.', 'error'));
  });

  downloadBtn.addEventListener('click', () => {
    if (!latestData || !userProfile) return;
    playUiSound('click');

    const content = `================================================
THARUN'S FUTUREME EXECUTIVE PROTOCOL REPORT
User: ${userProfile.name}
Tone: ${userProfile.tone}
================================================

FUTURE IDENTITY:
${latestData.futureIdentity}

TRANSMISSION FROM YOUR 1-YEAR FUTURE SELF:
"${latestData.message}"

NEXT 3 STRATEGIC MOVES:
${latestData.nextMoves.map((m, i) => `0${i + 1}. ${m}`).join('\n')}

DAILY HABIT TO START TODAY:
${latestData.habit}

CRITICAL FUTUREME WARNING:
${latestData.warning}

DAILY CORE MANTRA:
"${latestData.mantra}"

================================================
FutureMe Protocol • Powered by Gemini AI
================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FutureMe_Protocol_${userProfile.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Downloaded FutureMe Protocol Report!', 'success');
  });

  regenerateBtn.addEventListener('click', () => {
    playUiSound('click');
    if (reflectionForm) {
      reflectionForm.dispatchEvent(new Event('submit'));
    }
  });

  scrollToChatBtn.addEventListener('click', () => {
    playUiSound('click');
    chatSection.scrollIntoView({ behavior: 'smooth' });
    chatInput.focus();
  });

  // --------------------------------------------------------------------------
  // 6. Interactive Chat & Quick Prompt Chips
  // --------------------------------------------------------------------------
  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playUiSound('chip');
      chatInput.value = btn.dataset.prompt;
      chatForm.dispatchEvent(new Event('submit'));
    });
  });

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = chatInput.value.trim();
    if (!question || isLoading) return;

    playUiSound('click');
    appendChatMessage('user', question);
    chatHistory.push({ role: 'user', message: question });
    chatInput.value = '';

    showTypingIndicator(true);

    try {
      const response = await fetch('/api/chat-futureme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          chatHistory,
          question
        })
      });

      const rawText = await response.text();
      let data = {};
      try {
        data = JSON.parse(rawText);
      } catch (pErr) {
        console.error('Non-JSON chat response:', rawText);
        throw new Error('FutureMe could not respond right now. Try again.');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'FutureMe could not answer right now.');
      }

      showTypingIndicator(false);
      playUiSound('success');
      appendChatMessage('futureme', data.reply);
      chatHistory.push({ role: 'futureme', message: data.reply });

    } catch (err) {
      console.error('Chat error:', err);
      showTypingIndicator(false);
      showToast(err.message || 'FutureMe could not respond right now. Try again.', 'error');
    }
  });

  function appendChatMessage(sender, messageText) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('chat-msg', sender);

    const senderName = sender === 'user' ? 'You' : `Future ${userProfile ? userProfile.name : 'Self'}`;

    const formattedParagraphs = messageText
      .split('\n\n')
      .map(p => `<p>${escapeHtml(p.trim())}</p>`)
      .join('');

    msgDiv.innerHTML = `
      <span class="msg-sender">${senderName}</span>
      <div class="msg-bubble">
        ${formattedParagraphs}
      </div>
    `;

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTypingIndicator(show) {
    if (show) {
      typingIndicator.classList.remove('hidden');
      chatSendBtn.disabled = true;
      chatInput.disabled = true;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
      typingIndicator.classList.add('hidden');
      chatSendBtn.disabled = false;
      chatInput.disabled = false;
      chatInput.focus();
    }
  }

  // Toast Notification Engine
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
