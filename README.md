# 🎤 AI Voice Interview Agent

An AI-powered prototype that simulates a technical interview using voice input. The application asks predefined interview questions, converts speech to text using the Web Speech API, evaluates responses based on simple scoring logic, and generates a downloadable interview transcript.

## Features

* 🎙️ Voice-based interview using the Web Speech API
* 📝 Manual answer entry as a fallback
* 📋 Five predefined interview questions
* ⭐ Automatic answer evaluation and scoring
* 📊 Final interview summary
* 📄 Download interview results as `transcript.json`
* ⚠️ Robust Speech-to-Text (STT) error handling

## Technologies Used

* HTML5
* CSS3
* JavaScript (ES6)
* Web Speech API

## Project Structure

```text
AI-Voice-Interview-Agent/
│── index.html
│── style.css
│── script.js
│── README.md
│── transcript.json
```

## How to Run

### Option 1 – VS Code Live Server (Recommended)

1. Open the project in Visual Studio Code.
2. Install the **Live Server** extension.
3. Right-click `index.html`.
4. Select **Open with Live Server**.
5. Open the displayed localhost URL in Google Chrome.
6. Allow microphone access when prompted.

### Option 2 – Python HTTP Server

```bash
python -m http.server 8000
```

Then open:

```
http://localhost:8000
```

## Demo Workflow

1. Launch the application.
2. Allow microphone permission.
3. Answer all five interview questions.
4. Review the evaluation summary.
5. Click **Download Transcript**.
6. Verify that `transcript.json` is downloaded successfully.

## Speech-to-Text Error Handling

The application handles the following scenarios:

* Microphone permission denied
* No speech detected
* No microphone available
* Browser does not support the Web Speech API
* Generic speech recognition errors

## Sample Output

A completed interview session is available in:

```
transcript.json
```

## Demo Video

**Demo Video:** **

## Prototype Limitations

This project is a prototype intended for educational purposes.

Current limitations include:

* Uses browser-based speech recognition.
* Simple rule-based answer evaluation.
* No user authentication.
* No database integration.
* Works best in Google Chrome.

## Future Enhancements

* AI-powered answer evaluation using LLMs.
* Database integration.
* User authentication.
* Dashboard for interview analytics.
* Resume-based dynamic interview questions.

## Author

**Preethi G N**
MCA Student
