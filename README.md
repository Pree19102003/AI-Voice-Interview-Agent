# C13 — Basic AI Voice Interview Agent (Prototype)

A minimal, working end-to-end interview prototype: ask a question → record a
spoken answer → transcribe it → evaluate it → move to the next question.
Five predefined questions, fully client-side, no backend or API keys required.

**File:** `index.html` — open it directly in Chrome or Edge to run the demo.

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (single page)                       │
│                                                                       │
│   ┌────────────┐    ┌───────────────┐    ┌────────────────────┐     │
│   │  Question  │───▶│   Microphone   │───▶│  Web Speech API     │     │
│   │  Engine    │    │   Capture      │    │  (SpeechRecognition)│     │
│   │ (5 fixed   │    │  (Record /     │    │  → live transcript  │     │
│   │  questions)│    │   Stop button) │    │                      │     │
│   └────────────┘    └───────────────┘    └──────────┬───────────┘     │
│                                                       │                 │
│                                                       ▼                 │
│                                          ┌────────────────────────┐    │
│                                          │  Editable Transcript   │    │
│                                          │  Box (manual fallback  │    │
│                                          │  + correction)         │    │
│                                          └───────────┬────────────┘    │
│                                                       ▼                 │
│                                          ┌────────────────────────┐    │
│                                          │   Evaluator            │    │
│                                          │  - keyword/concept      │    │
│                                          │    coverage scoring    │    │
│                                          │  - length/completeness │    │
│                                          │    check               │    │
│                                          │  - invalid-answer guard│    │
│                                          └───────────┬────────────┘    │
│                                                       ▼                 │
│                                          ┌────────────────────────┐    │
│                                          │  Result Store (array)  │    │
│                                          │  {question, transcript,│    │
│                                          │   score, status}       │    │
│                                          └───────────┬────────────┘    │
│                                                       ▼                 │
│                              loop until 5/5  ──▶  Summary + JSON Export│
└─────────────────────────────────────────────────────────────────────┘
```

Flow per question (matches the spec exactly):

```
Ask Question → Record Answer → Speech-to-Text → Evaluation → Next Question
```

### Component choices

| Component | Choice | Why |
|---|---|---|
| Question engine | Hardcoded array of 5 Q&A rubrics in JS | Spec calls for *predefined* questions, not dynamic generation |
| Voice capture / STT | Browser `SpeechRecognition` (Web Speech API) | Zero install, zero API key, works offline-ish, good enough for a prototype; this is the natural seam to later swap in Whisper/Deepgram/a server-side STT service |
| Transcript | Editable `<textarea>` bound to STT output | Lets the candidate fix STT mistakes, and acts as the fallback input path when STT is unavailable or fails |
| Evaluator | Keyword/concept-coverage rubric scored 0–10 | Deterministic, explainable, no external dependency; the seam to later swap in an LLM-graded rubric (e.g., call Claude with the transcript + ideal-answer key and ask for a 0–10 score + rationale) |
| Output | `{ "question": ..., "score": ... }` per item, plus a `detailed_results` array and downloadable `transcript.json` | Matches the required output shape, extended with transcripts/status for debugging |

---

## 2. Why this is a *prototype*, not production

Per the constraints, this intentionally avoids:
- Persistent storage / accounts / multi-user sessions
- A real NLU or LLM-based grader (swappable, but not wired up, to keep the
  prototype dependency-free and demonstrable offline)
- Adaptive/dynamic follow-up questioning
- Authentication, analytics, logging infrastructure

It is scoped to: prove the workflow end-to-end, for 5 fixed questions, with
visible handling of the required edge cases.

---

## 3. Edge cases handled

| Case | Handling |
|---|---|
| **Empty recording** | If the transcript is blank after recording stops, the app blocks "Evaluate", shows an inline message ("Empty recording — no transcript captured"), and offers Re-record. |
| **STT failure** (no mic, permission denied, no speech detected, browser doesn't support the API) | `recognition.onerror` is handled explicitly for `no-speech`, `not-allowed`, `service-not-allowed`, `audio-capture`, and a generic fallback message for anything else. If the Web Speech API isn't supported at all, a banner appears and the user can type the answer directly into the transcript box instead — recording is just one path to filling that box. |
| **Invalid responses** (gibberish, too short, off-topic) | The evaluator treats <3 words as "invalid" (score 0–1) with an explicit `status: "invalid"` flag distinct from a normally-scored answer, so these are distinguishable in the output and in the summary table. |
| **Manual correction** | The transcript box is always editable, so STT mis-hearing a technical term doesn't permanently sink the score. |

---

## 4. Output format

Per question, the core required shape:
```json
{ "question": "Explain REST APIs", "score": 7 }
```

Full session export (`transcript.json`, via the "Download" button):
```json
{
  "interview_summary": [
    { "question": "Explain REST APIs.", "score": 7 },
    { "question": "What is the difference between SQL and NoSQL databases?", "score": 6 }
  ],
  "average_score": 6.5,
  "detailed_results": [
    {
      "question": "Explain REST APIs.",
      "transcript": "REST is an architectural style using HTTP methods like GET POST PUT DELETE to access resources identified by a URL ...",
      "score": 7,
      "status": "evaluated",
      "keywords_hit": ["http", "get", "post", "resource", "url"]
    }
  ]
}
```

---

## 5. How to demo it

1. Open `index.html` in Chrome or Edge (Web Speech API support is best there).
2. Allow microphone access when prompted.
3. For each of the 5 questions:
   - Click **● Record Answer**, speak your answer, click **■ Stop Recording**.
   - Review/edit the transcript if needed.
   - Click **Evaluate** to see the score and feedback.
   - Click **Next Question →**.
4. After question 5, the summary view shows all five scores, the average,
   and lets you view/download the JSON output.
5. To test edge cases: click Record then Stop immediately without speaking
   (empty recording), say something unrelated to the question (invalid/low
   score), or deny mic permission when prompted (STT failure path).

For a screen-recorded demo video, narrate exactly this sequence — it walks
through the full required flow plus all three edge cases in under two minutes.

---

## 6. Extension points (not built, but the seams are ready)

- Swap the keyword-coverage evaluator for a call to an LLM grader (send the
  transcript + question + ideal-answer key, ask for a 0–10 score and a
  one-line rationale).
- Swap browser STT for a server-side STT API for better accuracy on
  noisy audio.
- Add adaptive difficulty or follow-up questions based on prior scores.
