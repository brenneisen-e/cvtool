import type { UploadedFile, InterviewQuestion, CVData, InterviewState } from '../types';

const API_BASE = '/api';

interface AnalyzeResponse {
  questions: InterviewQuestion[];
  cvStructure: Partial<CVData>;
}

interface GenerateResponse {
  cvData: CVData;
}

export async function analyzeDocuments(
  files: UploadedFile[],
  apiKey: string
): Promise<AnalyzeResponse> {
  const documentsData = files.map((f) => ({
    name: f.name,
    type: f.type,
    content: f.content || '',
    extractedData: f.extractedData,
  }));

  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({ documents: documentsData }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Analyse fehlgeschlagen: ${response.statusText}`);
  }

  return response.json();
}

export async function generateCV(
  interviewState: InterviewState,
  files: UploadedFile[],
  apiKey: string
): Promise<GenerateResponse> {
  const documentsData = files.map((f) => ({
    name: f.name,
    type: f.type,
    content: f.content || '',
  }));

  const answers = interviewState.questions
    .filter((q) => q.answered && q.answer !== '[Übersprungen]')
    .map((q) => ({
      question: q.question,
      answer: q.answer,
      category: q.category,
    }));

  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      documents: documentsData,
      answers,
      additionalInfo: interviewState.additionalInfo,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `CV-Generierung fehlgeschlagen: ${response.statusText}`);
  }

  return response.json();
}

// Mock functions for development without API
export function generateMockQuestions(files: UploadedFile[]): InterviewQuestion[] {
  const hasExampleCV = files.some((f) => f.type === 'example-cv');
  const myCV = files.find((f) => f.type === 'my-cv');
  const myContent = myCV?.content?.toLowerCase() || '';

  const questions: InterviewQuestion[] = [];

  questions.push({
    id: 'gap-1',
    question:
      'Gibt es Zeiträume in Ihrem Lebenslauf, in denen Sie nicht berufstätig waren? Falls ja, was haben Sie in dieser Zeit gemacht?',
    category: 'gaps',
    answered: false,
  });

  questions.push({
    id: 'proj-1',
    question:
      'Beschreiben Sie Ihr wichtigstes Projekt der letzten 2 Jahre. Was war Ihre Rolle und was haben Sie konkret erreicht?',
    category: 'projects',
    answered: false,
  });

  questions.push({
    id: 'proj-2',
    question:
      'Bei welchen Projekten haben Sie mit großen Teams zusammengearbeitet? Wie viele Personen waren beteiligt und wie war die Zusammenarbeit organisiert?',
    category: 'projects',
    answered: false,
  });

  if (!myContent.includes('python') && hasExampleCV) {
    questions.push({
      id: 'skill-1',
      question:
        'Im Beispiel-CV werden Programmiersprachen wie Python erwähnt. Haben Sie auch Erfahrung mit Programmierung oder Scripting?',
      category: 'skills',
      answered: false,
    });
  }

  questions.push({
    id: 'skill-2',
    question:
      'Welche Tools und Methoden nutzen Sie bei der Projektarbeit? (z.B. Agile/Scrum, JIRA, Confluence, etc.)',
    category: 'skills',
    answered: false,
  });

  questions.push({
    id: 'achieve-1',
    question:
      'Nennen Sie einen quantifizierbaren Erfolg aus Ihrer Karriere. Beispiel: "Prozessoptimierung mit X% Kosteneinsparung" oder "Umsatzsteigerung um X€".',
    category: 'achievements',
    answered: false,
  });

  questions.push({
    id: 'achieve-2',
    question:
      'Haben Sie Preise, Auszeichnungen oder besondere Anerkennungen in Ihrer Karriere erhalten?',
    category: 'achievements',
    answered: false,
  });

  questions.push({
    id: 'soft-1',
    question:
      'Haben Sie Führungserfahrung? Falls ja, wie viele Mitarbeiter haben Sie geleitet und in welchem Kontext?',
    category: 'softskills',
    answered: false,
  });

  questions.push({
    id: 'soft-2',
    question:
      'Wie würden Sie Ihren Arbeitsstil beschreiben? Was macht Sie zu einem wertvollen Teammitglied?',
    category: 'softskills',
    answered: false,
  });

  questions.push({
    id: 'gen-1',
    question:
      'Was ist Ihre Zielposition? In welche Richtung möchten Sie sich beruflich entwickeln?',
    category: 'general',
    answered: false,
  });

  questions.push({
    id: 'gen-2',
    question:
      'Gibt es weitere wichtige Informationen, die in Ihrem CV erscheinen sollten, aber bisher nicht angesprochen wurden?',
    category: 'general',
    answered: false,
  });

  return questions;
}

export function generateMockCV(
  interviewState: InterviewState,
  files: UploadedFile[]
): CVData {
  const myCV = files.find((f) => f.type === 'my-cv');
  const content = myCV?.content || '';
  const firstLine = content.split('\n')[0]?.trim() || '';
  const name = firstLine.length > 3 && firstLine.length < 50 ? firstLine : 'Max Mustermann';

  const answers = interviewState.questions.reduce(
    (acc, q) => {
      if (q.answer && q.answer !== '[Übersprungen]') {
        acc[q.category] = acc[q.category] || [];
        acc[q.category].push({ question: q.question, answer: q.answer });
      }
      return acc;
    },
    {} as Record<string, { question: string; answer: string }[]>
  );

  return {
    personalInfo: {
      name,
      title: 'Senior Consultant',
      email: 'max.mustermann@example.com',
      phone: '+49 123 456789',
      location: 'Frankfurt am Main',
      linkedin: 'linkedin.com/in/maxmustermann',
    },
    summary:
      answers.general?.[0]?.answer ||
      'Erfahrener Consultant mit fundierten Kenntnissen in Projektmanagement und digitaler Transformation.',
    experience: [
      {
        company: 'Beispiel Consulting GmbH',
        position: 'Senior Consultant',
        startDate: '2021',
        endDate: undefined,
        current: true,
        description:
          answers.projects?.[0]?.answer ||
          'Beratung von Großunternehmen in Fragen der digitalen Transformation.',
        achievements: [
          answers.achievements?.[0]?.answer ||
            'Erfolgreiche Implementierung eines neuen ERP-Systems mit 30% Effizienzsteigerung',
          'Leitung eines cross-funktionalen Teams mit 8 Mitarbeitern',
        ],
        technologies: ['SAP', 'Power BI', 'Azure'],
      },
    ],
    education: [
      {
        institution: 'Technische Universität München',
        degree: 'Master of Science',
        field: 'Wirtschaftsinformatik',
        startDate: '2015',
        endDate: '2018',
        grade: '1.7',
      },
    ],
    skills: [
      { category: 'Methoden', skills: ['Agile/Scrum', 'Design Thinking', 'Change Management'] },
      { category: 'Tools', skills: ['SAP', 'Power BI', 'Jira', 'Confluence'] },
    ],
    certifications: ['Scrum Master (PSM I)', 'PRINCE2 Foundation'],
    languages: [
      { language: 'Deutsch', level: 'Muttersprache' },
      { language: 'Englisch', level: 'Verhandlungssicher (C1)' },
    ],
    projects: [
      {
        name: 'Digitale Transformation',
        client: 'Große deutsche Bank',
        role: 'Projektleiter',
        duration: '2022 - 2023',
        description: answers.projects?.[1]?.answer || 'Leitung der digitalen Transformation.',
        technologies: ['Azure', 'Power Platform'],
        achievements: ['Reduzierung der Durchlaufzeiten um 40%'],
      },
    ],
  };
}
