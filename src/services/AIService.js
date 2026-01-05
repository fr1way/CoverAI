/**
 * AI Service
 * OpenAI GPT API integration for cover letter generation
 */

import SettingsModel from '../models/SettingsModel.js';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Generate cover letter using OpenAI API
 * @param {Object} resume - Parsed resume data
 * @param {Object} job - Job description data
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Generated cover letter text
 */
export async function generateCoverLetter(resume, job, options = {}) {
    const apiKey = await SettingsModel.getApiKey();

    if (!apiKey) {
        throw new Error('OpenAI API key not configured. Please add your API key in settings.');
    }

    const tone = options.tone || await SettingsModel.getTone();

    const systemPrompt = buildSystemPrompt(tone);
    const userPrompt = buildUserPrompt(resume, job);

    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: options.model || 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1000
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
}

/**
 * Build system prompt based on tone
 * @param {string} tone - Cover letter tone
 * @returns {string}
 */
function buildSystemPrompt(tone) {
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

IMPORTANT: Only reference experiences, skills, and qualifications that are explicitly mentioned in the provided resume. Never fabricate or embellish.`;
}

/**
 * Build user prompt with resume and job data
 * @param {Object} resume - Resume data
 * @param {Object} job - Job data
 * @returns {string}
 */
function buildUserPrompt(resume, job) {
    return `Please write a cover letter for the following job application:

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
 * @returns {Promise<boolean>}
 */
export async function validateApiKey(apiKey) {
    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 5
            })
        });

        return response.ok;
    } catch {
        return false;
    }
}

export default {
    generateCoverLetter,
    validateApiKey
};
