/**
 * DOCX Generator Service
 * Uses docx.js to create formatted cover letter documents
 * 
 * NOTE: The docx library must be loaded via script tag in popup.html
 * before this service is used. It exposes the global 'docx' object.
 */

/**
 * Generate a formatted cover letter DOCX
 * @param {Object} options - Cover letter options
 * @returns {Promise<Blob>} DOCX file as Blob
 */
export async function generateCoverLetterDOCX(options) {
    // Check if docx library is available (loaded via script tag)
    if (typeof window.docx === 'undefined') {
        throw new Error('DOCX library not loaded. Please reload the extension.');
    }

    const {
        applicantName = '',
        applicantEmail = '',
        applicantPhone = '',
        applicantAddress = '',
        companyName = '',
        hiringManagerName = 'Hiring Manager',
        jobTitle = '',
        coverLetterBody = '',
        includeDate = true
    } = options;

    // Get constructors from global docx object
    const { Document, Paragraph, TextRun, AlignmentType, Packer } = window.docx;

    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const children = [];

    // Applicant header
    if (applicantName) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: applicantName,
                        bold: true,
                        size: 28
                    })
                ],
                alignment: AlignmentType.LEFT
            })
        );
    }

    // Contact info
    const contactParts = [applicantEmail, applicantPhone, applicantAddress].filter(Boolean);
    if (contactParts.length > 0) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: contactParts.join(' | '),
                        size: 22,
                        color: '666666'
                    })
                ],
                spacing: { after: 200 }
            })
        );
    }

    // Date
    if (includeDate) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: today,
                        size: 22
                    })
                ],
                spacing: { before: 300, after: 200 }
            })
        );
    }

    // Company/recipient
    if (companyName) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: companyName,
                        size: 22
                    })
                ]
            })
        );
    }

    // Greeting
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `Dear ${hiringManagerName},`,
                    size: 22
                })
            ],
            spacing: { before: 300, after: 200 }
        })
    );

    // Body paragraphs
    const paragraphs = coverLetterBody.split('\n\n').filter(p => p.trim());
    paragraphs.forEach(para => {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: para.trim(),
                        size: 22
                    })
                ],
                spacing: { after: 200 },
                alignment: AlignmentType.JUSTIFIED
            })
        );
    });

    // Closing
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Sincerely,',
                    size: 22
                })
            ],
            spacing: { before: 300 }
        })
    );

    // Signature
    if (applicantName) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: applicantName,
                        size: 22
                    })
                ],
                spacing: { before: 400 }
            })
        );
    }

    // Create document
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 1440,    // 1 inch
                        right: 1440,
                        bottom: 1440,
                        left: 1440
                    }
                }
            },
            children
        }]
    });

    // Generate blob
    const blob = await Packer.toBlob(doc);
    return blob;
}

/**
 * Download cover letter as DOCX file
 * @param {Blob} blob - DOCX blob
 * @param {string} filename - Output filename
 */
export function downloadDOCX(blob, filename = 'Cover_Letter.docx') {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate and download cover letter
 * @param {Object} options - Cover letter options
 * @param {string} filename - Output filename
 */
export async function generateAndDownload(options, filename) {
    const blob = await generateCoverLetterDOCX(options);
    downloadDOCX(blob, filename);
    return blob;
}

export default {
    generateCoverLetterDOCX,
    downloadDOCX,
    generateAndDownload
};
