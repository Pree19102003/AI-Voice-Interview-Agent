
/* ============================================================
   1. INTERVIEW CONFIGURATION — predefined questions + rubric
   ============================================================ */
const QUESTIONS = [
  {
    question: "Explain REST APIs.",
    keywords: ["http", "stateless", "resource", "endpoint", "request", "response",
               "get", "post", "put", "delete", "json", "url", "client", "server", "crud"],
    minWords: 8
  },
  {
    question: "What is the difference between SQL and NoSQL databases?",
    keywords: ["schema", "relational", "table", "row", "column", "document",
               "structured", "unstructured", "scalability", "join", "flexible", "mongodb", "mysql"],
    minWords: 8
  },
  {
    question: "Describe what happens when you type a URL into a browser and press Enter.",
    keywords: ["dns", "ip", "tcp", "http", "server", "request", "response",
               "render", "browser", "connection", "resolve", "handshake"],
    minWords: 8
  },
  {
    question: "What is object-oriented programming and why is it useful?",
    keywords: ["class", "object", "inheritance", "encapsulation", "polymorphism",
               "abstraction", "reuse", "method", "property", "modular"],
    minWords: 8
  },
  {
    question: "How would you debug a slow-running API endpoint in production?",
    keywords: ["logs", "profiling", "database", "query", "index", "cache",
               "monitoring", "bottleneck", "latency", "load", "metrics", "trace"],
    minWords: 8
  }
];

/* ============================================================
   2. STATE
   ============================================================ */
let currentIndex = 0;
let results = []; // { question, transcript, score, status, keywordsHit }
let recognition = null;
let isRecording = false;
let sttSupported = true;

/* ============================================================
   3. DOM REFS
   ============================================================ */
const els = {
  unsupported: document.getElementById('unsupported'),
  progressText: document.getElementById('progress-text'),
  progressBar: document.getElementById('progress-bar'),
  qnum: document.getElementById('qnum'),
  questionText: document.getElementById('question-text'),
  recordBtn: document.getElementById('record-btn'),
  rerecordBtn: document.getElementById('rerecord-btn'),
  evaluateBtn: document.getElementById('evaluate-btn'),
  statusText: document.getElementById('status-text'),
  errorText: document.getElementById('error-text'),
  transcriptArea: document.getElementById('transcript-area'),
  evalBox: document.getElementById('eval-box'),
  scoreVal: document.getElementById('score-val'),
  feedbackText: document.getElementById('feedback-text'),
  keywordsHit: document.getElementById('keywords-hit'),
  nextBtn: document.getElementById('next-btn'),
  interviewView: document.getElementById('interview-view'),
  summaryView: document.getElementById('summary-view'),
  avgScore: document.getElementById('avg-score'),
  summaryTable: document.querySelector('#summary-table tbody'),
  showJsonBtn: document.getElementById('show-json-btn'),
  downloadJsonBtn: document.getElementById('download-json-btn'),
  restartBtn: document.getElementById('restart-btn'),
  jsonOut: document.getElementById('json-out')
};

/* ============================================================
   4. SPEECH-TO-TEXT SETUP (Web Speech API)
   Handles: STT unavailable, empty recordings, recognition errors
   ============================================================ */
function initRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    sttSupported = false;
    els.unsupported.classList.add('show');
    els.recordBtn.disabled = true;
    els.recordBtn.textContent = '● Mic unavailable — type below';
    return;
  }
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let finalTranscript = '';

  recognition.onstart = () => {
    isRecording = true;
    finalTranscript = els.transcriptArea.value ? els.transcriptArea.value + ' ' : '';
    els.recordBtn.classList.add('live');
    els.recordBtn.textContent = '■ Stop Recording';
    els.statusText.innerHTML = '<span class="live-dot"></span>Listening…';
    els.errorText.textContent = '';
  };

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcriptPiece = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcriptPiece + ' ';
      } else {
        interim += transcriptPiece;
      }
    }
    els.transcriptArea.value = (finalTranscript + interim).trim();
  };

  // STT FAILURE HANDLING
  recognition.onerror = (event) => {
    isRecording = false;
    els.recordBtn.classList.remove('live');
    els.recordBtn.textContent = '● Record Answer';
    els.statusText.textContent = '';
    if (event.error === 'no-speech') {
      els.errorText.textContent = 'No speech detected. Try again, speaking clearly into the mic.';
    } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      els.errorText.textContent = 'Microphone permission denied. Allow mic access, or type your answer manually.';
    } else if (event.error === 'audio-capture') {
      els.errorText.textContent = 'No microphone found. Connect a mic, or type your answer manually.';
    } else {
      els.errorText.textContent = `Speech recognition error: ${event.error}. You can type your answer manually.`;
    }
    finalizeRecordingUI();
  };

  recognition.onend = () => {
    isRecording = false;
    els.recordBtn.classList.remove('live');
    els.recordBtn.textContent = '● Record Answer';
    els.statusText.textContent = '';
    finalizeRecordingUI();
  };
}

function finalizeRecordingUI() {
  // EMPTY RECORDING HANDLING
  const text = els.transcriptArea.value.trim();
  if (text.length === 0) {
    els.errorText.textContent = els.errorText.textContent ||
      'Empty recording — no transcript captured. Please re-record or type an answer.';
    els.evaluateBtn.disabled = true;
  } else {
    els.evaluateBtn.disabled = false;
  }
  els.rerecordBtn.disabled = false;
}

els.recordBtn.addEventListener('click', () => {
  if (!sttSupported) return;
  if (isRecording) {
    recognition.stop();
  } else {
    els.transcriptArea.value = '';
    els.errorText.textContent = '';
    els.evalBox.classList.remove('show');
    els.nextBtn.disabled = true;
    try {
      recognition.start();
    } catch (e) {
      els.errorText.textContent = 'Could not start microphone: ' + e.message;
    }
  }
});

els.rerecordBtn.addEventListener('click', () => {
  els.transcriptArea.value = '';
  els.errorText.textContent = '';
  els.evalBox.classList.remove('show');
  els.evaluateBtn.disabled = true;
  els.nextBtn.disabled = true;
});

// Allow manual edits to re-enable evaluation (also covers STT-unavailable fallback)
els.transcriptArea.addEventListener('input', () => {
  els.evaluateBtn.disabled = els.transcriptArea.value.trim().length === 0;
  els.errorText.textContent = '';
});

/* ============================================================
   5. EVALUATION LOGIC
   Simple, transparent rubric-based scorer:
   - keyword/concept coverage (this prototype's stand-in for
     a real NLU/LLM grader — swap in an API call here later)
   - length / completeness check
   Handles: invalid (too short / gibberish) responses
   ============================================================ */
function evaluateAnswer(transcript, qConfig) {
  const text = transcript.trim();
  const words = text.split(/\s+/).filter(Boolean);

  // INVALID RESPONSE HANDLING
  if (words.length === 0) {
    return { score: 0, status: 'invalid', feedback: 'No answer provided.', hits: [] };
  }
  if (words.length < 3) {
    return { score: 1, status: 'invalid', feedback: 'Answer is too short to evaluate meaningfully.', hits: [] };
  }

  const lower = text.toLowerCase();
  const hits = qConfig.keywords.filter(k => lower.includes(k));
  const coverageRatio = hits.length / qConfig.keywords.length;

  // Score blends keyword coverage (0-8 pts) with a length/completeness bonus (0-2 pts)
  let score = Math.round(coverageRatio * 8);
  if (words.length >= qConfig.minWords) score += 1;
  if (words.length >= qConfig.minWords * 2 && hits.length >= 3) score += 1;
  score = Math.max(0, Math.min(10, score));

  let feedback;
  if (score >= 8) feedback = 'Strong answer — covers the key concepts with good detail.';
  else if (score >= 5) feedback = 'Reasonable answer — touches on some key concepts, but could go deeper.';
  else if (score >= 2) feedback = 'Weak answer — missing most of the core concepts expected here.';
  else feedback = 'Answer does not address the question.';

  return { score, status: 'evaluated', feedback, hits };
}

/* ============================================================
   6. INTERVIEW FLOW
   ============================================================ */
function loadQuestion(i) {
  const q = QUESTIONS[i];
  els.qnum.textContent = `Q0${i + 1}`;
  els.questionText.textContent = q.question;
  els.progressText.textContent = `Question ${i + 1} of ${QUESTIONS.length}`;
  els.progressBar.style.width = `${((i) / QUESTIONS.length) * 100}%`;
  els.transcriptArea.value = '';
  els.errorText.textContent = '';
  els.statusText.textContent = '';
  els.evalBox.classList.remove('show');
  els.evaluateBtn.disabled = true;
  els.rerecordBtn.disabled = true;
  els.nextBtn.disabled = true;
  els.recordBtn.disabled = !sttSupported ? true : false;
}

els.evaluateBtn.addEventListener('click', () => {
  const transcript = els.transcriptArea.value.trim();
  const q = QUESTIONS[currentIndex];
  const result = evaluateAnswer(transcript, q);

  results[currentIndex] = {
    question: q.question,
    transcript: transcript,
    score: result.score,
    status: result.status,
    keywords_hit: result.hits
  };

  els.evalBox.classList.add('show');
  els.scoreVal.textContent = result.score;
  els.scoreVal.className = 'score ' + (result.score >= 7 ? 'good' : result.score >= 4 ? 'mid' : 'bad');
  els.feedbackText.textContent = result.feedback;
  els.keywordsHit.textContent = result.hits.length
    ? `Concepts detected: ${result.hits.join(', ')}`
    : 'No expected concepts detected.';

  els.nextBtn.disabled = false;
  els.evaluateBtn.disabled = true;
  els.recordBtn.disabled = true;
  els.rerecordBtn.disabled = true;
});

els.nextBtn.addEventListener('click', () => {
  currentIndex++;
  if (currentIndex >= QUESTIONS.length) {
    showSummary();
  } else {
    loadQuestion(currentIndex);
  }
});

/* ============================================================
   7. SUMMARY + JSON OUTPUT
   ============================================================ */
function showSummary() {
  els.interviewView.style.display = 'none';
  els.summaryView.classList.add('show');
  els.progressBar.style.width = '100%';

  const total = results.reduce((sum, r) => sum + r.score, 0);
  const avg = (total / results.length).toFixed(1);
  els.avgScore.textContent = `Average Score: ${avg} / 10`;

  els.summaryTable.innerHTML = '';
  results.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i + 1}</td><td>${r.question}</td><td>${r.score}/10</td><td>${r.status}</td>`;
    els.summaryTable.appendChild(tr);
  });

  // Build minimal output format matching the spec, plus full detail array
  const minimalOutput = results.map(r => ({ question: r.question, score: r.score }));
  const fullOutput = {
    interview_summary: minimalOutput,
    average_score: parseFloat(avg),
    detailed_results: results
  };
  els.jsonOut.textContent = JSON.stringify(fullOutput, null, 2);
}

els.showJsonBtn.addEventListener('click', () => {
  els.jsonOut.style.display = els.jsonOut.style.display === 'none' ? 'block' : 'none';
});

els.downloadJsonBtn.addEventListener('click', () => {
  const minimalOutput = results.map(r => ({ question: r.question, score: r.score }));
  const fullOutput = {
    interview_summary: minimalOutput,
    average_score: parseFloat((results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1)),
    detailed_results: results
  };
  const blob = new Blob([JSON.stringify(fullOutput, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transcript.json';
  a.click();
  URL.revokeObjectURL(url);
});

els.restartBtn.addEventListener('click', () => {
  currentIndex = 0;
  results = [];
  els.summaryView.classList.remove('show');
  els.interviewView.style.display = 'block';
  els.jsonOut.style.display = 'none';
  loadQuestion(0);
});

/* ============================================================
   8. INIT
   ============================================================ */
initRecognition();
loadQuestion(0);
