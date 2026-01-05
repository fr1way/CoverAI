/**
 * AI Service
 * Google Gemini API integration for cover letter generation
 */

import SettingsModel from '../models/SettingsModel.js';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Available Gemini models
export const GEMINI_MODELS = [
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', description: 'Fastest, latest experimental' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Most capable, best quality' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and efficient' },
    { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', description: 'Lightweight, fastest' },
    { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', description: 'Stable, reliable' }
];

/**
 * Generate cover letter using Gemini API
 * @param {Object} resume - Parsed resume data
 * @param {Object} job - Job description data
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Generated cover letter text
 */
export async function generateCoverLetter(resume, job, options = {}) {
    const apiKey = await SettingsModel.getApiKey();

    if (!apiKey) {
        throw new Error('Gemini API key not configured. Please add your API key in settings.');
    }

    const settings = await SettingsModel.get();
    const tone = options.tone || settings.coverLetterTone || 'professional';
    const model = options.model || settings.geminiModel || 'gemini-1.5-flash';

    const prompt = buildPrompt(resume, job, tone);
    const apiUrl = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1500,
                topP: 0.9
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errorMessage = error.error?.message || `API error: ${response.status}`;
        throw new Error(errorMessage);
    }

    const data = await response.json();

    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('No response generated. Please try again.');
    }

    return text;
}

/**
 * Build full prompt for Gemini
 * @param {Object} resume - Resume data
 * @param {Object} job - Job data
 * @param {string} tone - Cover letter tone
 * @returns {string}
 */
function buildPrompt(resume, job, tone) {
    const toneDescriptions = {
        professional: 'professional, confident, and polished',
        friendly: 'warm, approachable, and personable while remaining professional',
        formal: 'formal, traditional, and business-appropriate'
    };

    const toneDesc = toneDescriptions[tone] || toneDescriptions.professional;

    // Security: Sanitize inputs to prevent prompt injection
    const sanitizeText = (text) => {
        if (typeof text !== 'string') return '';
        // Remove control characters and normalize whitespace
        return text.replace(/[\x00-\x1F\x7F]/g, '').replace(/\s+/g, ' ').trim();
    };

    const resumeName = sanitizeText(resume.name || 'Not provided');
    const resumeEmail = sanitizeText(resume.email || 'Not provided');
    const resumeSummary = sanitizeText(resume.summary || '');
    const jobTitle = sanitizeText(job.title || 'Not specified');
    const jobCompany = sanitizeText(job.company || 'Not specified');
    const jobLocation = sanitizeText(job.location || '');
    const jobDescription = sanitizeText(job.description || 'No description provided');
    const jobRequirements = sanitizeText(job.requirements || '');

    // Truncate very long fields
    const truncate = (str, max) => str.length > max ? str.substring(0, max) + '...' : str;

    return `You are an expert cover letter writer with years of experience in career coaching and recruitment.

Your task is to write a compelling cover letter that:
1. Is ${toneDesc} in tone
2. Highlights the candidate's most relevant experience and skills for the specific job
3. Shows genuine interest in the company and role
4. Is concise but impactful (3-4 paragraphs maximum)
5. Avoids generic phrases and clichés
6. Does NOT include any made-up experiences, skills, or qualifications that aren't in the resume
7. Uses specific examples from the resume when possible

Format the cover letter as plain text with paragraph breaks. Do not include date, recipient address, or closing signature - just the body of the letter starting with the opening paragraph.

IMPORTANT: Only reference experiences, skills, and qualifications that are explicitly mentioned in the provided resume. Never fabricate or embellish.

=== CANDIDATE RESUME ===
Name: ${resumeName}
Email: ${resumeEmail}

${resumeSummary ? `Summary/Objective:\n${truncate(resumeSummary, 500)}\n` : ''}
${resume.skills?.length > 0 ? `Skills:\n${resume.skills.slice(0, 50).map(s => sanitizeText(s)).join(', ')}\n` : ''}
${resume.rawText ? `Full Resume Content:\n${truncate(sanitizeText(resume.rawText), 10000)}\n` : ''}

=== JOB DETAILS ===
Job Title: ${jobTitle}
Company: ${jobCompany}
${jobLocation ? `Location: ${jobLocation}` : ''}

Job Description:
${truncate(jobDescription, 5000)}

${jobRequirements ? `Requirements:\n${truncate(jobRequirements, 2000)}` : ''}

Please write a compelling cover letter for this position.`;
}

/**
 * Validate API key by making a test request
 * @param {string} apiKey - API key to validate
 * @param {string} model - Model to test with
 * @returns {Promise<boolean>}
 */
export async function validateApiKey(apiKey, model = 'gemini-1.5-flash') {
    try {
        const apiUrl = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Hello'
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 10
                }
            })
        });

        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Get list of available models
 * @returns {Array}
 */
export function getAvailableModels() {
    return GEMINI_MODELS;
}

/**
 * Parse structured resume data using Gemini API
 * @param {string} resumeText - Raw resume text from PDF/DOCX
 * @returns {Promise<Object>} Structured resume data
 */
export async function parseResumeWithAI(resumeText) {
    const apiKey = await SettingsModel.getApiKey();
    if (!apiKey) {
        throw new Error('Gemini API key not configured');
    }

    const settings = await SettingsModel.get();
    const model = settings.geminiModel || 'gemini-1.5-flash';

    const prompt = `You are an expert resume parser. Extract structured data from the following resume text.
    
    Return ONLY a raw JSON object (no markdown formatting, no backticks) with the following structure:
    {
        "name": "Full Name",
        "email": "email@example.com",
        "phone": "formatted phone number",
        "address": "City, State",
        "summary": "Brief professional summary (max 3 sentences)",
        "skills": ["Skill 1", "Skill 2"],
        "experience": [
            {
                "company": "Company Name",
                "title": "Job Title",
                "dates": "Date Range",
                "description": "Brief description"
            }
        ],
        "education": [
            {
                "school": "School Name",
                "degree": "Degree",
                "gradYear": "Year"
            }
        ]
    }

    RESUME TEXT:
    ${resumeText.slice(0, 15000)} // Limit context window just in case
    `;

    const apiUrl = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.1, // Low temperature for factual extraction
                responseMimeType: "application/json" // Force JSON response
            }
        })
    });

    if (!response.ok) {
        throw new Error(`AI Parsing failed: ${response.status}`);
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('No data extracted from resume');
    }

    // Clean up potential markdown code blocks if the model ignores the prompt
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
        return JSON.parse(text);
    } catch (e) {
        console.error('Failed to parse AI response:', text);
        throw new Error('Failed to parse unstructured resume data');
    }
}

export default {
    generateCoverLetter,
    parseResumeWithAI,
    validateApiKey,
    getAvailableModels,
    GEMINI_MODELS
};
