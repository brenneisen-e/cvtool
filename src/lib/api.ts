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
  files: UploadedFile[]
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
    },
    body: JSON.stringify({ documents: documentsData }),
  });

  if (!response.ok) {
    throw new Error(`Analyse fehlgeschlagen: ${response.statusText}`);
  }

  return response.json();
}

export async function generateCV(
  interviewState: InterviewState,
  files: UploadedFile[]
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
    },
    body: JSON.stringify({
      documents: documentsData,
      answers,
      additionalInfo: interviewState.additionalInfo,
    }),
  });

  if (!response.ok) {
    throw new Error(`CV-Generierung fehlgeschlagen: ${response.statusText}`);
  }

  return response.json();
}

// Mock functions for development without API
export function generateMockQuestions(files: UploadedFile[]): InterviewQuestion[] {
  const hasExampleCV = files.some((f) => f.type === 'example-cv');
  const myCV = files.find((f) => f.type === 'my-cv');
  const myContent = myCV?.content?.toLowerCase() || '';

  const questions: InterviewQuestion[] = [];

  // Gap questions
  questions.push({
    id: 'gap-1',
    question:
      'Gibt es Zeiträume in Ihrem Lebenslauf, in denen Sie nicht berufstätig waren? Falls ja, was haben Sie in dieser Zeit gemacht?',
    category: 'gaps',
    answered: false,
  });

  // Project questions
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

  // Skills questions
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

  // Achievement questions
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

  // Soft skills questions
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

  // General questions
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
  // Extract name from my-cv if possible
  const myCV = files.find((f) => f.type === 'my-cv');
  const content = myCV?.content || '';

  // Try to extract name (simple heuristic)
  const firstLine = content.split('\n')[0]?.trim() || '';
  const name = firstLine.length > 3 && firstLine.length < 50 ? firstLine : 'Max Mustermann';

  // Build CV from interview answers
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
      'Erfahrener Consultant mit fundierten Kenntnissen in Projektmanagement und digitaler Transformation. Nachweisliche Erfolge in der Leitung komplexer Projekte und der Optimierung von Geschäftsprozessen.',
    experience: [
      {
        company: 'Beispiel Consulting GmbH',
        position: 'Senior Consultant',
        startDate: '2021',
        endDate: undefined,
        current: true,
        description:
          answers.projects?.[0]?.answer ||
          'Beratung von Großunternehmen in Fragen der digitalen Transformation und Prozessoptimierung.',
        achievements: [
          answers.achievements?.[0]?.answer ||
            'Erfolgreiche Implementierung eines neuen ERP-Systems mit 30% Effizienzsteigerung',
          'Leitung eines cross-funktionalen Teams mit 8 Mitarbeitern',
        ],
        technologies: ['SAP', 'Power BI', 'Azure'],
      },
      {
        company: 'Vorherige AG',
        position: 'Consultant',
        startDate: '2018',
        endDate: '2021',
        current: false,
        description:
          'Unterstützung bei der Einführung agiler Methoden und digitaler Arbeitsweisen.',
        achievements: [
          'Durchführung von über 20 Workshops zur agilen Transformation',
          'Entwicklung eines internen Schulungsprogramms',
        ],
        technologies: ['Jira', 'Confluence', 'MS Office'],
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
      {
        institution: 'Ludwig-Maximilians-Universität München',
        degree: 'Bachelor of Science',
        field: 'Betriebswirtschaftslehre',
        startDate: '2012',
        endDate: '2015',
        grade: '1.9',
      },
    ],
    skills: [
      {
        category: 'Methoden',
        skills: [
          'Agile/Scrum',
          'Design Thinking',
          'Change Management',
          'Lean Management',
        ],
      },
      {
        category: 'Tools',
        skills: ['SAP', 'Power BI', 'Jira', 'Confluence', 'MS Office 365'],
      },
      {
        category: 'Technologien',
        skills: ['Azure', 'AWS', 'Python', 'SQL'],
      },
    ],
    certifications: [
      'Scrum Master (PSM I)',
      'PRINCE2 Foundation',
      'Azure Fundamentals',
    ],
    languages: [
      { language: 'Deutsch', level: 'Muttersprache' },
      { language: 'Englisch', level: 'Verhandlungssicher (C1)' },
      { language: 'Französisch', level: 'Grundkenntnisse (A2)' },
    ],
    projects: [
      {
        name: 'Digitale Transformation Finanzbranche',
        client: 'Große deutsche Bank',
        role: 'Projektleiter',
        duration: '2022 - 2023',
        description:
          answers.projects?.[1]?.answer ||
          'Leitung der digitalen Transformation im Retail-Banking-Bereich mit Fokus auf Kundenzentrierung und Prozessautomatisierung.',
        technologies: ['Azure', 'Power Platform', 'SAP'],
        achievements: [
          'Reduzierung der Durchlaufzeiten um 40%',
          'Einführung von Self-Service-Portalen für 2 Mio. Kunden',
        ],
      },
      {
        name: 'Agile Transformation',
        client: 'Internationaler Automobilzulieferer',
        role: 'Agile Coach',
        duration: '2021 - 2022',
        description:
          'Begleitung der agilen Transformation von 15 Teams im Entwicklungsbereich.',
        technologies: ['Jira', 'Confluence', 'Miro'],
        achievements: [
          'Time-to-Market Reduktion um 25%',
          'Steigerung der Mitarbeiterzufriedenheit um 15 Punkte',
        ],
      },
    ],
  };
}
