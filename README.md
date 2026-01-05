# CoverAI - AI-Powered Cover Letter Generator

A Chrome extension that generates personalized, professional DOCX cover letters using Google Gemini AI. Automatically extracts job descriptions from popular job sites and combines them with your resume to create tailored cover letters.

## Features

- **Resume Parsing**: Upload your resume in PDF or DOCX format (parses immediately on upload)
- **Auto Job Detection**: Automatically extracts job descriptions from LinkedIn, Indeed, Greenhouse, Lever, Workday, and Glassdoor
- **Manual Input**: Paste job descriptions manually when auto-detection doesn't work
- **AI Generation**: Uses Google Gemini AI with model selection (2.0 Flash, 1.5 Pro, 1.5 Flash, etc.)
- **DOCX Export**: Download professionally formatted Word documents
- **Privacy First**: All data stored locally, API key never leaves your device

## Installation

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/CoverAI.git
   cd CoverAI
   ```

2. **Download required libraries**
   
   Create a `lib` folder and download:
   - [PDF.js](https://mozilla.github.io/pdf.js/) - `pdf.min.mjs` and `pdf.worker.min.mjs`
   - [Mammoth.js](https://github.com/mwilliamson/mammoth.js) - `mammoth.browser.min.js`
   - [docx](https://docx.js.org/) - `docx.min.js`

   Or install via npm and copy to lib folder:
   ```bash
   npm install pdfjs-dist mammoth docx
   # Then copy the dist files to the lib folder
   ```

3. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the `CoverAI` folder

4. **Get Gemini API Key**
   - Go to [Google AI Studio](https://aistudio.google.com/apikey)
   - Create a free API key
   - Add it in the extension settings

### Production Installation

Coming soon to the Chrome Web Store!

## Usage

1. **Add your Gemini API Key**
   - Click the CoverAI extension icon
   - Click the settings gear icon
   - Enter your Gemini API key
   - Choose your preferred model
   - Save settings

2. **Upload your Resume**
   - Click the extension icon
   - Click "Upload PDF or DOCX"
   - Your resume is parsed immediately and you'll see confirmation

3. **Get a Job Description**
   - Navigate to a job posting on LinkedIn, Indeed, etc.
   - The extension will automatically detect and capture the job description
   - Or click "Enter Manually" to paste a job description

4. **Generate Cover Letter**
   - Click "Generate Cover Letter"
   - Preview the generated text
   - Click "Download DOCX" to save

## Project Structure

```
CoverAI/
├── manifest.json           # Chrome extension manifest
├── icons/                  # Extension icons
├── lib/                    # Third-party libraries
├── src/
│   ├── models/            # Data models (MVC)
│   │   ├── ResumeModel.js
│   │   ├── JobModel.js
│   │   └── SettingsModel.js
│   ├── views/             # UI components (MVC)
│   │   ├── popup.html
│   │   ├── popup.css
│   │   ├── popup.js
│   │   ├── sidepanel.html
│   │   └── sidepanel.js
│   ├── controllers/       # Business logic (MVC)
│   │   ├── ResumeController.js
│   │   ├── JobController.js
│   │   └── CoverLetterController.js
│   ├── services/          # External integrations
│   │   ├── PDFParserService.js
│   │   ├── DOCXParserService.js
│   │   ├── DOCXGeneratorService.js
│   │   └── AIService.js
│   ├── background/        # Service worker
│   │   └── background.js
│   ├── content/           # Content scripts
│   │   └── contentScript.js
│   └── utils/             # Utilities
│       ├── storage.js
│       └── messageHandler.js
```

## Configuration

### Supported Job Sites

The extension automatically detects job descriptions on:
- LinkedIn Jobs
- Indeed
- Greenhouse
- Lever
- Workday
- Glassdoor

### Cover Letter Tones

Choose from three writing styles:
- **Professional**: Confident and polished
- **Friendly**: Warm and approachable
- **Formal**: Traditional business style

## Privacy

- Your resume is stored locally in Chrome storage
- Your API key never leaves your device
- No data is sent to any servers except OpenAI for generation
- Job history is stored locally for convenience

## Requirements

- Chrome browser (version 88+)
- Gemini API key ([Get one free here](https://aistudio.google.com/apikey))

## License

MIT License - feel free to use and modify!

## Contributing

Contributions welcome! Please open an issue or pull request.
