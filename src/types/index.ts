export interface UploadedFile {
  id: string;
  name: string;
  type: 'template-docx' | 'template-pptx' | 'example-cv-docx' | 'example-cv-pptx' | 'my-cv';
  file: File;
  content?: string;
  extractedData?: ExtractedDocument;
}

export interface ExtractedDocument {
  text: string;
  structure?: DocumentStructure;
  metadata?: Record<string, string>;
}

export interface DocumentStructure {
  sections: DocumentSection[];
  styles?: DocumentStyle[];
}

export interface DocumentSection {
  title?: string;
  content: string;
  type: 'header' | 'paragraph' | 'list' | 'table' | 'unknown';
  level?: number;
}

export interface DocumentStyle {
  name: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'gaps' | 'projects' | 'skills' | 'achievements' | 'softskills' | 'general';
  answered: boolean;
  answer?: string;
}

export interface InterviewState {
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  isComplete: boolean;
  additionalInfo: string;
}

export interface CVData {
  personalInfo: {
    name: string;
    title: string; // Level: Senior Consultant, Manager, etc.
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    // Deloitte-spezifische Felder
    nationality?: string;
    offeringPortfolio?: string; // Strategy, Analytics and M&A; Customer & Marketing; Core Industry Operations; Human Capital; Enterprise Performance
    marketOffering?: string;
    talentGroup?: string;
    industry?: string; // Financial Services, Insurance, etc.
  };
  summary: string; // Profil (max. 15 Zeilen)
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillCategory[];
  certifications: string[];
  languages: LanguageEntry[];
  projects: ProjectEntry[];
  // Deloitte DOCX-spezifische Felder
  softwarePackages?: string[]; // Oracle, PeopleSoft, CRM Lösungen, etc.
  softwareTools?: string[]; // MS Access, Java, etc.
  trainings?: TrainingEntry[];
  publications?: string[];
  presentations?: string[];
  memberships?: string[];
}

export interface TrainingEntry {
  name: string;
  date: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  isDeloitte: boolean; // War es bei Deloitte oder woanders?
  description: string;
  achievements: string[];
  keywords: string[]; // Stichworte für KI-Enhancement
  technologies?: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  grade?: string;
}

export interface SkillCategory {
  category: string;
  skills: string[];
}

export interface LanguageEntry {
  language: string;
  level: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  client?: string;
  industry: string; // Insurance, Banking, Asset Management
  role: string;
  startDate: string;
  endDate?: string;
  duration: string;
  description: string;
  technologies: string[];
  achievements: string[];
  keywords: string[]; // Stichworte für KI-Enhancement
}

export interface AppState {
  currentStep: 1 | 2 | 3;
  uploadedFiles: UploadedFile[];
  interviewState: InterviewState | null;
  generatedCV: CVData | null;
  isLoading: boolean;
  error: string | null;
}
