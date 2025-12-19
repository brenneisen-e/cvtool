import mammoth from 'mammoth';
import type { ExtractedDocument, DocumentSection } from '../types';

export async function parseDocument(file: File): Promise<ExtractedDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'docx':
      return parseDocx(file);
    case 'pptx':
      return parsePptx(file);
    case 'pdf':
      return parsePdf(file);
    case 'txt':
      return parseTxt(file);
    default:
      // Try to extract text from any file
      return parseGeneric(file);
  }
}

async function parseDocx(file: File): Promise<ExtractedDocument> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });

    const sections = extractSectionsFromHtml(htmlResult.value);

    return {
      text: result.value,
      structure: {
        sections,
      },
      metadata: {
        format: 'docx',
        fileName: file.name,
        warnings: result.messages.map((m) => m.message).join('; '),
      },
    };
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error(`Fehler beim Parsen der DOCX-Datei: ${error}`);
  }
}

async function parsePptx(file: File): Promise<ExtractedDocument> {
  // PPTX is a zip file with XML content
  // We'll use JSZip to extract text from slides
  const arrayBuffer = await file.arrayBuffer();

  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(arrayBuffer);

    const textParts: string[] = [];
    const sections: DocumentSection[] = [];

    // Get all slide files
    const slideFiles = Object.keys(zip.files)
      .filter((name) => name.match(/ppt\/slides\/slide\d+\.xml/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
        const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
        return numA - numB;
      });

    for (const slideFile of slideFiles) {
      const content = await zip.file(slideFile)?.async('text');
      if (content) {
        const text = extractTextFromXml(content);
        if (text.trim()) {
          textParts.push(text);
          sections.push({
            title: `Folie ${slideFiles.indexOf(slideFile) + 1}`,
            content: text,
            type: 'paragraph',
          });
        }
      }
    }

    return {
      text: textParts.join('\n\n'),
      structure: { sections },
      metadata: {
        format: 'pptx',
        fileName: file.name,
        slideCount: String(slideFiles.length),
      },
    };
  } catch (error) {
    console.error('Error parsing PPTX:', error);
    throw new Error(`Fehler beim Parsen der PPTX-Datei: ${error}`);
  }
}

async function parsePdf(file: File): Promise<ExtractedDocument> {
  // For PDF parsing, we'll need to use a different approach
  // Since we can't use pdf.js directly in the browser easily,
  // we'll send it to the API for processing
  return {
    text: `[PDF-Datei: ${file.name} - Wird vom Server verarbeitet]`,
    structure: { sections: [] },
    metadata: {
      format: 'pdf',
      fileName: file.name,
      requiresServerProcessing: 'true',
    },
  };
}

async function parseTxt(file: File): Promise<ExtractedDocument> {
  const text = await file.text();

  const sections: DocumentSection[] = text
    .split(/\n{2,}/)
    .filter((s) => s.trim())
    .map((content) => ({
      content: content.trim(),
      type: 'paragraph' as const,
    }));

  return {
    text,
    structure: { sections },
    metadata: {
      format: 'txt',
      fileName: file.name,
    },
  };
}

async function parseGeneric(file: File): Promise<ExtractedDocument> {
  try {
    const text = await file.text();
    return {
      text,
      structure: {
        sections: [{ content: text, type: 'paragraph' }],
      },
      metadata: {
        format: 'generic',
        fileName: file.name,
      },
    };
  } catch {
    return {
      text: `[Datei: ${file.name} - Format nicht direkt lesbar]`,
      structure: { sections: [] },
      metadata: {
        format: 'unknown',
        fileName: file.name,
      },
    };
  }
}

function extractSectionsFromHtml(html: string): DocumentSection[] {
  const sections: DocumentSection[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const elements = doc.body.children;

  for (const element of elements) {
    const tagName = element.tagName.toLowerCase();
    let type: DocumentSection['type'] = 'paragraph';
    let level: number | undefined;

    if (tagName.match(/^h[1-6]$/)) {
      type = 'header';
      level = parseInt(tagName[1]);
    } else if (tagName === 'ul' || tagName === 'ol') {
      type = 'list';
    } else if (tagName === 'table') {
      type = 'table';
    }

    const content = element.textContent?.trim() || '';
    if (content) {
      sections.push({
        title: type === 'header' ? content : undefined,
        content,
        type,
        level,
      });
    }
  }

  return sections;
}

function extractTextFromXml(xml: string): string {
  // Extract text from PowerPoint XML
  const textMatches = xml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
  return textMatches
    .map((match) => match.replace(/<\/?a:t>/g, ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractStructuredCV(text: string): Partial<import('../types').CVData> {
  // Basic extraction of CV sections using common patterns
  const sections: Record<string, string> = {};

  const sectionPatterns = [
    { key: 'summary', patterns: ['profil', 'zusammenfassung', 'über mich', 'summary', 'profile'] },
    { key: 'experience', patterns: ['berufserfahrung', 'erfahrung', 'experience', 'karriere'] },
    { key: 'education', patterns: ['ausbildung', 'bildung', 'studium', 'education'] },
    { key: 'skills', patterns: ['kenntnisse', 'fähigkeiten', 'skills', 'kompetenzen'] },
    { key: 'certifications', patterns: ['zertifikate', 'zertifizierungen', 'certifications'] },
    { key: 'languages', patterns: ['sprachen', 'languages'] },
    { key: 'projects', patterns: ['projekte', 'projects', 'projekterfahrung'] },
  ];

  const lines = text.split('\n');
  let currentSection = 'header';

  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();

    for (const { key, patterns } of sectionPatterns) {
      if (patterns.some((p) => lowerLine.includes(p) && lowerLine.length < 50)) {
        currentSection = key;
        break;
      }
    }

    if (!sections[currentSection]) {
      sections[currentSection] = '';
    }
    sections[currentSection] += line + '\n';
  }

  return {
    summary: sections.summary?.trim() || '',
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    languages: [],
    projects: [],
  };
}
