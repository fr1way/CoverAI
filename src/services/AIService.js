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
Name: ${resume.name || 'Not provided'}
Email: ${resume.email || 'Not provided'}

${resume.summary ? `Summary/Objective:\n${resume.summary}\n` : ''}
${resume.skills?.length > 0 ? `Skills:\n${resume.skills.join(', ')}\n` : ''}
${resume.rawText ? `Full Resume Content:\n${resume.rawText}\n` : ''}

=== JOB DETAILS ===
Job Title: ${job.title || 'Not specified'}
Company: ${job.company || 'Not specified'}
${job.location ? `Location: ${job.location}` : ''}

Job Description:
${job.description || 'No description provided'}

${job.requirements ? `Requirements:\n${job.requirements}` : ''}

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

export default {
    generateCoverLetter,
    validateApiKey,
    getAvailableModels,
    GEMINI_MODELS
};
