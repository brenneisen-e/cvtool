import { useState, useEffect } from 'react';
import { Plus, Trash2, Sparkles, ChevronDown, ChevronUp, Save } from 'lucide-react';
import type { CVData, ExperienceEntry, ProjectEntry } from '../types';

interface CVFormProps {
  initialData?: CVData;
  onSave: (data: CVData) => void;
  onEnhance: (entryId: string, type: 'experience' | 'project', keywords: string[]) => Promise<string>;
  isEnhancing?: boolean;
}

// Default-Daten basierend auf Eike Brenneisens vollständigem CV
const createDefaultCV = (): CVData => ({
  personalInfo: {
    name: 'Eike Brenneisen',
    title: 'Senior Consultant',
    email: '',
    phone: '',
    location: 'Germany, Cologne',
    linkedin: '',
  },
  summary: 'Eike Brenneisen has seven years of professional experience in the financial sector (banking, insurance, asset management, and real estate), including over three years in various roles at Deloitte Consulting. Throughout his career, he has developed extensive expertise in program management for strategic IT transformations, the optimization of sales systems, and the distribution of financial products. Previously, he studied International Management at the University of Cologne, focusing on Corporate Development and Business Model Design. He also gained early professional experience as a banker, specializing in corporate and business clients.',
  experience: [
    // Deloitte Full-time
    {
      id: crypto.randomUUID(),
      company: 'Deloitte Consulting GmbH',
      position: 'Senior Consultant Banking and Capital Markets Transformation',
      startDate: '2023-06',
      endDate: '',
      current: true,
      isDeloitte: true,
      description: 'Core Business Operations - Banking and Capital Markets Transformation',
      achievements: [],
      keywords: ['PMO Lead', 'Gremiensteuerung', 'Stakeholdermanagement', 'C-Level'],
      technologies: [],
    },
    {
      id: crypto.randomUUID(),
      company: 'Deloitte Consulting GmbH',
      position: 'Consultant Banking and Capital Market Transformation',
      startDate: '2022-07',
      endDate: '2023-05',
      current: false,
      isDeloitte: true,
      description: 'Core Business Operations - Banking and Capital Markets Transformation',
      achievements: [],
      keywords: ['Regulatory', 'Gap Analysis', 'Investment Funds'],
      technologies: [],
    },
    // Deloitte Working Student
    {
      id: crypto.randomUUID(),
      company: 'Deloitte Consulting GmbH',
      position: 'Working Student Banking and Capital Market Transformation',
      startDate: '2021-01',
      endDate: '2022-01',
      current: false,
      isDeloitte: true,
      description: 'Work Study - Banking and Capital Markets Transformation',
      achievements: [],
      keywords: ['Performance Management', 'Vergütungslogiken', 'Simulation'],
      technologies: [],
    },
    // HSBC
    {
      id: crypto.randomUUID(),
      company: 'HSBC Trinkaus & Burkhardt GmbH',
      position: 'Inhouse Consulting',
      startDate: '2020-11',
      endDate: '2020-12',
      current: false,
      isDeloitte: false,
      description: 'Work Study - Inhouse Consulting',
      achievements: [],
      keywords: ['Steuerliche Gap Analyse', 'Tax'],
      technologies: [],
    },
    // Monitor Deloitte
    {
      id: crypto.randomUUID(),
      company: 'Monitor Deloitte',
      position: 'Management Consulting',
      startDate: '2019-07',
      endDate: '2020-06',
      current: false,
      isDeloitte: true,
      description: 'Work Study - PMO der Versicherungs Großtransformation bei ERGO. Zuständig für Business Case, Gremienvorbereitung und Kommunikation.',
      achievements: [],
      keywords: ['PMO', 'Business Case', 'Gremienvorbereitung', 'Kommunikation', 'ERGO'],
      technologies: [],
    },
    // Ströer
    {
      id: crypto.randomUUID(),
      company: 'Ströer Dialog Group GmbH',
      position: 'Senior Management Assistant',
      startDate: '2018-10',
      endDate: '2019-03',
      current: false,
      isDeloitte: false,
      description: 'Work Study',
      achievements: [],
      keywords: ['Management', 'Assistant'],
      technologies: [],
    },
    // IMMOFINANZ
    {
      id: crypto.randomUUID(),
      company: 'IMMOFINANZ',
      position: 'Management Assistant',
      startDate: '2018-01',
      endDate: '2018-09',
      current: false,
      isDeloitte: false,
      description: 'Work Study - Real Estate',
      achievements: [],
      keywords: ['Real Estate', 'Management'],
      technologies: [],
    },
    // OLB - Financial Advisor
    {
      id: crypto.randomUUID(),
      company: 'Oldenburgische Landesbank AG',
      position: 'Financial Advisor',
      startDate: '2016-01',
      endDate: '2016-08',
      current: false,
      isDeloitte: false,
      description: 'Full-time Financial Advisor after apprenticeship',
      achievements: [],
      keywords: ['Banking', 'Kundenberatung', 'Firmenkunden'],
      technologies: [],
    },
    // OLB - Apprentice
    {
      id: crypto.randomUUID(),
      company: 'Oldenburgische Landesbank AG',
      position: 'Apprentice (Bankkaufmann)',
      startDate: '2013-08',
      endDate: '2016-01',
      current: false,
      isDeloitte: false,
      description: 'Ausbildung zum Bankkaufmann mit Spezialisierung auf Firmen- und Geschäftskunden',
      achievements: [],
      keywords: ['Ausbildung', 'Banking', 'Firmenkunden'],
      technologies: [],
    },
  ],
  education: [
    {
      institution: 'University of Cologne',
      degree: 'Master of Science',
      field: 'International Management (CEMS)',
      startDate: '2017',
      endDate: '2019',
      grade: '',
    },
  ],
  skills: [
    {
      category: 'Business Skills',
      skills: ['Project Management Office (PMO)', 'IT Implementation', 'Process optimization', 'Large Scale Transformation', 'Agile Project Management'],
    },
    {
      category: 'Technology Skills',
      skills: ['ServiceNow', 'MS Power BI, Automate, Apps', 'MS Dynamics CRM', 'MySQL', 'Adobe Creative Cloud'],
    },
    {
      category: 'Industry Experience',
      skills: ['Banks (incl. apprenticeship)', 'Insurances', 'Real Estate Industry', 'Asset Management'],
    },
  ],
  certifications: [],
  languages: [
    { language: 'German', level: 'Native' },
    { language: 'English', level: 'Fluent' },
    { language: 'Spanish', level: 'Intermediate' },
  ],
  projects: [
    // Aktuelles Projekt: Barmenia Gothaer
    {
      id: crypto.randomUUID(),
      name: 'Vergütungssystem Transformation',
      client: 'Barmenia Gothaer',
      industry: 'Insurance',
      role: 'Teilprojektleiter',
      startDate: '2025-04',
      endDate: '',
      duration: 'Apr 2025 - heute',
      description: 'Teilprojektleiter für Simulation, Kalibrierung, Verhandlung und Vertrag im Rahmen der Vergütungssystem-Transformation.',
      technologies: ['Power BI'],
      achievements: [],
      keywords: ['Simulation', 'Kalibrierung', 'Verhandlung', 'Vertrag', 'Vergütung'],
    },
    // ERGO Sales Operations
    {
      id: crypto.randomUUID(),
      name: 'Sales Operations Prozessoptimierung',
      client: 'ERGO Group AG',
      industry: 'Insurance',
      role: 'Projektleiter',
      startDate: '2024-10',
      endDate: '2025-04',
      duration: 'Okt 2024 - Apr 2025',
      description: 'Projektleiter für Prozessoptimierung im Sales Operations Bereich.',
      technologies: ['ServiceNow', 'Power BI'],
      achievements: [],
      keywords: ['Prozessoptimierung', 'Sales Operations', 'Projektleitung'],
    },
    // ERGO PMO Lead
    {
      id: crypto.randomUUID(),
      name: 'Versicherungs Großtransformation - PMO Lead',
      client: 'ERGO Group AG',
      industry: 'Insurance',
      role: 'PMO Lead',
      startDate: '2023-01',
      endDate: '2024-10',
      duration: 'Jan 2023 - Okt 2024',
      description: 'PMO Lead für ERGO Großtransformationsprojekt mit Fokus auf Gremiensteuerung, Stakeholdermanagement, Programmsteuerung, Kommunikation und Entscheidungsprozesse durch C-Level.',
      technologies: ['ServiceNow', 'Power BI', 'MS Office'],
      achievements: [],
      keywords: ['PMO Lead', 'Gremiensteuerung', 'Stakeholdermanagement', 'C-Level', 'Programmsteuerung'],
    },
    // Luxembourg Investment Fund
    {
      id: crypto.randomUUID(),
      name: 'Regulatorische Gap Analyse',
      client: 'Luxembourg Investment Fund',
      industry: 'Asset Management',
      role: 'Consultant',
      startDate: '2022-07',
      endDate: '2023-01',
      duration: 'Jul 2022 - Jan 2023',
      description: 'Durchführung einer regulatorischen Gap Analyse für einen luxemburgischen Investment Fond mit Erstellung eines Maßnahmenplans.',
      technologies: [],
      achievements: [],
      keywords: ['Regulatory', 'Gap Analyse', 'Investment Funds', 'Compliance'],
    },
    // ERGO Performance Management
    {
      id: crypto.randomUUID(),
      name: 'Performance Management & Vergütungslogiken',
      client: 'ERGO Group AG',
      industry: 'Insurance',
      role: 'Working Student',
      startDate: '2021-01',
      endDate: '2022-01',
      duration: 'Jan 2021 - Jan 2022',
      description: 'Zuständig für das Thema Performance Management. Mitarbeit bei der Simulation und Kalibrierung von Vergütungslogiken.',
      technologies: ['Excel', 'Power BI'],
      achievements: [],
      keywords: ['Performance Management', 'Simulation', 'Kalibrierung', 'Vergütungslogiken'],
    },
    // HSBC Tax Gap Analysis
    {
      id: crypto.randomUUID(),
      name: 'Steuerliche Gap Analyse',
      client: 'HSBC Trinkaus & Burkhardt GmbH',
      industry: 'Banking',
      role: 'Inhouse Consultant',
      startDate: '2020-11',
      endDate: '2020-12',
      duration: 'Nov 2020 - Dez 2020',
      description: 'Durchführung einer steuerlichen Gap Analyse.',
      technologies: [],
      achievements: [],
      keywords: ['Steuerliche Gap Analyse', 'Tax', 'Banking'],
    },
    // Monitor Deloitte ERGO PMO
    {
      id: crypto.randomUUID(),
      name: 'Versicherungs Großtransformation - PMO',
      client: 'ERGO Group AG',
      industry: 'Insurance',
      role: 'PMO Consultant',
      startDate: '2019-07',
      endDate: '2020-06',
      duration: 'Jul 2019 - Jun 2020',
      description: 'PMO der Versicherungs Großtransformation bei ERGO. Zuständig für Business Case Entwicklung, Gremienvorbereitung und Kommunikation.',
      technologies: ['MS Office', 'Power BI'],
      achievements: [],
      keywords: ['PMO', 'Business Case', 'Gremienvorbereitung', 'Kommunikation', 'Transformation'],
    },
  ],
});

export function CVForm({ initialData, onSave, onEnhance, isEnhancing }: CVFormProps) {
  const [cvData, setCvData] = useState<CVData>(initialData || createDefaultCV());
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
    summary: true,
    experience: true,
    projects: true,
    education: false,
    skills: false,
    languages: false,
  });
  const [enhancingId, setEnhancingId] = useState<string | null>(null);

  // Auto-save bei Änderungen
  useEffect(() => {
    const timeout = setTimeout(() => {
      onSave(cvData);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [cvData, onSave]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Experience handlers
  const addExperience = () => {
    const newEntry: ExperienceEntry = {
      id: crypto.randomUUID(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      isDeloitte: false,
      description: '',
      achievements: [],
      keywords: [],
      technologies: [],
    };
    setCvData(prev => ({ ...prev, experience: [...prev.experience, newEntry] }));
  };

  const updateExperience = (id: string, field: keyof ExperienceEntry, value: unknown) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const removeExperience = (id: string) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id),
    }));
  };

  // Project handlers
  const addProject = () => {
    const newProject: ProjectEntry = {
      id: crypto.randomUUID(),
      name: '',
      client: '',
      industry: '',
      role: '',
      startDate: '',
      endDate: '',
      duration: '',
      description: '',
      technologies: [],
      achievements: [],
      keywords: [],
    };
    setCvData(prev => ({ ...prev, projects: [...prev.projects, newProject] }));
  };

  const updateProject = (id: string, field: keyof ProjectEntry, value: unknown) => {
    setCvData(prev => ({
      ...prev,
      projects: prev.projects.map(proj =>
        proj.id === id ? { ...proj, [field]: value } : proj
      ),
    }));
  };

  const removeProject = (id: string) => {
    setCvData(prev => ({
      ...prev,
      projects: prev.projects.filter(proj => proj.id !== id),
    }));
  };

  // AI Enhance handler
  const handleEnhance = async (id: string, type: 'experience' | 'project') => {
    setEnhancingId(id);
    try {
      const entry = type === 'experience'
        ? cvData.experience.find(e => e.id === id)
        : cvData.projects.find(p => p.id === id);

      if (!entry) return;

      const keywords = 'keywords' in entry ? entry.keywords : [];
      const enhanced = await onEnhance(id, type, keywords);

      if (type === 'experience') {
        updateExperience(id, 'description', enhanced);
      } else {
        updateProject(id, 'description', enhanced);
      }
    } finally {
      setEnhancingId(null);
    }
  };

  const SectionHeader = ({ title, section, count }: { title: string; section: string; count?: number }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {count !== undefined && (
          <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded">
            {count} Einträge
          </span>
        )}
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="w-5 h-5 text-white/50" />
      ) : (
        <ChevronDown className="w-5 h-5 text-white/50" />
      )}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Personal Info */}
      <div className="bg-white/5 rounded-xl overflow-hidden">
        <SectionHeader title="Persönliche Daten" section="personal" />
        {expandedSections.personal && (
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-white/70 text-sm mb-1">Name</label>
              <input
                type="text"
                value={cvData.personalInfo.name}
                onChange={(e) => setCvData(prev => ({
                  ...prev,
                  personalInfo: { ...prev.personalInfo, name: e.target.value }
                }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-white/70 text-sm mb-1">Position / Level</label>
              <input
                type="text"
                value={cvData.personalInfo.title}
                onChange={(e) => setCvData(prev => ({
                  ...prev,
                  personalInfo: { ...prev.personalInfo, title: e.target.value }
                }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-white/70 text-sm mb-1">Standort</label>
              <input
                type="text"
                value={cvData.personalInfo.location || ''}
                onChange={(e) => setCvData(prev => ({
                  ...prev,
                  personalInfo: { ...prev.personalInfo, location: e.target.value }
                }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-white/70 text-sm mb-1">E-Mail</label>
              <input
                type="email"
                value={cvData.personalInfo.email || ''}
                onChange={(e) => setCvData(prev => ({
                  ...prev,
                  personalInfo: { ...prev.personalInfo, email: e.target.value }
                }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white/5 rounded-xl overflow-hidden">
        <SectionHeader title="Summary of Professional Experience" section="summary" />
        {expandedSections.summary && (
          <div className="p-6">
            <textarea
              value={cvData.summary}
              onChange={(e) => setCvData(prev => ({ ...prev, summary: e.target.value }))}
              rows={6}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white resize-none"
              placeholder="Zusammenfassung der Berufserfahrung..."
            />
            <p className="text-white/40 text-xs mt-2">
              Max. 15 Zeilen: Gegenwärtige Spezialisierung, spezifische Fähigkeiten, aktueller Industrieschwerpunkt
            </p>
          </div>
        )}
      </div>

      {/* Experience */}
      <div className="bg-white/5 rounded-xl overflow-hidden">
        <SectionHeader title="Berufserfahrung" section="experience" count={cvData.experience.length} />
        {expandedSections.experience && (
          <div className="p-6 space-y-6">
            {cvData.experience.map((exp, index) => (
              <div key={exp.id} className="bg-white/5 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium">Position {index + 1}</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEnhance(exp.id, 'experience')}
                      disabled={isEnhancing || enhancingId === exp.id}
                      className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white text-sm rounded"
                    >
                      <Sparkles className="w-4 h-4" />
                      {enhancingId === exp.id ? 'Optimiere...' : 'KI Enhance'}
                    </button>
                    <button
                      onClick={() => removeExperience(exp.id)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Unternehmen</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Position</label>
                    <input
                      type="text"
                      value={exp.position}
                      onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Von</label>
                    <input
                      type="month"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Bis</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="month"
                        value={exp.endDate || ''}
                        onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                        disabled={exp.current}
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm disabled:opacity-50"
                      />
                      <label className="flex items-center gap-1 text-white/70 text-sm whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                          className="rounded"
                        />
                        Heute
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-white/70 text-sm">
                    <input
                      type="checkbox"
                      checked={exp.isDeloitte}
                      onChange={(e) => updateExperience(exp.id, 'isDeloitte', e.target.checked)}
                      className="rounded"
                    />
                    <span className={exp.isDeloitte ? 'text-green-400' : ''}>
                      Bei Deloitte
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-1">Beschreibung</label>
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-1">
                    Stichworte für KI-Enhancement (kommagetrennt)
                  </label>
                  <input
                    type="text"
                    value={exp.keywords.join(', ')}
                    onChange={(e) => updateExperience(exp.id, 'keywords', e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
                    placeholder="z.B. IT Transformation, Process Optimization, CRM"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                  />
                </div>
              </div>
            ))}

            <button
              onClick={addExperience}
              className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-white/30 hover:border-white/50 rounded-lg text-white/70 hover:text-white transition-colors"
            >
              <Plus className="w-5 h-5" />
              Berufserfahrung hinzufügen
            </button>
          </div>
        )}
      </div>

      {/* Projects (Relevant Experience) */}
      <div className="bg-white/5 rounded-xl overflow-hidden">
        <SectionHeader title="Relevante Projekterfahrung" section="projects" count={cvData.projects.length} />
        {expandedSections.projects && (
          <div className="p-6 space-y-6">
            {cvData.projects.map((proj, index) => (
              <div key={proj.id} className="bg-white/5 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium">Projekt {index + 1}</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEnhance(proj.id, 'project')}
                      disabled={isEnhancing || enhancingId === proj.id}
                      className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white text-sm rounded"
                    >
                      <Sparkles className="w-4 h-4" />
                      {enhancingId === proj.id ? 'Optimiere...' : 'KI Enhance'}
                    </button>
                    <button
                      onClick={() => removeProject(proj.id)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Projektname</label>
                    <input
                      type="text"
                      value={proj.name}
                      onChange={(e) => updateProject(proj.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Kunde</label>
                    <input
                      type="text"
                      value={proj.client || ''}
                      onChange={(e) => updateProject(proj.id, 'client', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Industrie</label>
                    <select
                      value={proj.industry}
                      onChange={(e) => updateProject(proj.id, 'industry', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    >
                      <option value="">Auswählen...</option>
                      <option value="Insurance">Insurance / Versicherung</option>
                      <option value="Banking">Banking / Banken</option>
                      <option value="Asset Management">Asset Management</option>
                      <option value="Real Estate">Real Estate / Immobilien</option>
                      <option value="Other">Andere</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Rolle</label>
                    <input
                      type="text"
                      value={proj.role}
                      onChange={(e) => updateProject(proj.id, 'role', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Von</label>
                    <input
                      type="month"
                      value={proj.startDate}
                      onChange={(e) => updateProject(proj.id, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Bis</label>
                    <input
                      type="month"
                      value={proj.endDate || ''}
                      onChange={(e) => updateProject(proj.id, 'endDate', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-1">Beschreibung</label>
                  <textarea
                    value={proj.description}
                    onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm resize-none"
                    placeholder="Tätigkeit, methodischer Ansatz und erzieltes Ergebnis..."
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-1">Technologien (kommagetrennt)</label>
                  <input
                    type="text"
                    value={proj.technologies.join(', ')}
                    onChange={(e) => updateProject(proj.id, 'technologies', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                    placeholder="z.B. ServiceNow, Power BI, MS Dynamics"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-1">
                    Stichworte für KI-Enhancement (kommagetrennt)
                  </label>
                  <input
                    type="text"
                    value={proj.keywords.join(', ')}
                    onChange={(e) => updateProject(proj.id, 'keywords', e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
                    placeholder="z.B. Digitalisierung, Prozessautomatisierung, Change Management"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                  />
                </div>
              </div>
            ))}

            <button
              onClick={addProject}
              className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-white/30 hover:border-white/50 rounded-lg text-white/70 hover:text-white transition-colors"
            >
              <Plus className="w-5 h-5" />
              Projekt hinzufügen
            </button>
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="bg-white/5 rounded-xl overflow-hidden">
        <SectionHeader title="Key Skills" section="skills" count={cvData.skills.length} />
        {expandedSections.skills && (
          <div className="p-6 space-y-4">
            {cvData.skills.map((skillCat, catIndex) => (
              <div key={catIndex} className="bg-white/5 rounded-lg p-4 space-y-2">
                <input
                  type="text"
                  value={skillCat.category}
                  onChange={(e) => {
                    const newSkills = [...cvData.skills];
                    newSkills[catIndex] = { ...skillCat, category: e.target.value };
                    setCvData(prev => ({ ...prev, skills: newSkills }));
                  }}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white font-medium"
                  placeholder="Kategorie..."
                />
                <input
                  type="text"
                  value={skillCat.skills.join(', ')}
                  onChange={(e) => {
                    const newSkills = [...cvData.skills];
                    newSkills[catIndex] = {
                      ...skillCat,
                      skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    };
                    setCvData(prev => ({ ...prev, skills: newSkills }));
                  }}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                  placeholder="Skills kommagetrennt..."
                />
              </div>
            ))}
            <button
              onClick={() => setCvData(prev => ({
                ...prev,
                skills: [...prev.skills, { category: '', skills: [] }]
              }))}
              className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-white/30 hover:border-white/50 rounded-lg text-white/70 hover:text-white transition-colors"
            >
              <Plus className="w-5 h-5" />
              Skill-Kategorie hinzufügen
            </button>
          </div>
        )}
      </div>

      {/* Languages */}
      <div className="bg-white/5 rounded-xl overflow-hidden">
        <SectionHeader title="Sprachen" section="languages" count={cvData.languages.length} />
        {expandedSections.languages && (
          <div className="p-6 space-y-4">
            {cvData.languages.map((lang, index) => (
              <div key={index} className="flex gap-4">
                <input
                  type="text"
                  value={lang.language}
                  onChange={(e) => {
                    const newLangs = [...cvData.languages];
                    newLangs[index] = { ...lang, language: e.target.value };
                    setCvData(prev => ({ ...prev, languages: newLangs }));
                  }}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                  placeholder="Sprache..."
                />
                <select
                  value={lang.level}
                  onChange={(e) => {
                    const newLangs = [...cvData.languages];
                    newLangs[index] = { ...lang, level: e.target.value };
                    setCvData(prev => ({ ...prev, languages: newLangs }));
                  }}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                >
                  <option value="Native">Native / Muttersprache</option>
                  <option value="Fluent">Fluent / Verhandlungssicher</option>
                  <option value="Advanced">Advanced / Fortgeschritten</option>
                  <option value="Intermediate">Intermediate / Konversationsniveau</option>
                  <option value="Basic">Basic / Grundkenntnisse</option>
                </select>
                <button
                  onClick={() => {
                    setCvData(prev => ({
                      ...prev,
                      languages: prev.languages.filter((_, i) => i !== index)
                    }));
                  }}
                  className="p-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setCvData(prev => ({
                ...prev,
                languages: [...prev.languages, { language: '', level: 'Intermediate' }]
              }))}
              className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-white/30 hover:border-white/50 rounded-lg text-white/70 hover:text-white transition-colors"
            >
              <Plus className="w-5 h-5" />
              Sprache hinzufügen
            </button>
          </div>
        )}
      </div>

      {/* Education */}
      <div className="bg-white/5 rounded-xl overflow-hidden">
        <SectionHeader title="Ausbildung" section="education" count={cvData.education.length} />
        {expandedSections.education && (
          <div className="p-6 space-y-4">
            {cvData.education.map((edu, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-white/70 text-sm mb-1">Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => {
                        const newEdu = [...cvData.education];
                        newEdu[index] = { ...edu, institution: e.target.value };
                        setCvData(prev => ({ ...prev, education: newEdu }));
                      }}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Abschluss</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const newEdu = [...cvData.education];
                        newEdu[index] = { ...edu, degree: e.target.value };
                        setCvData(prev => ({ ...prev, education: newEdu }));
                      }}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Fachrichtung</label>
                    <input
                      type="text"
                      value={edu.field}
                      onChange={(e) => {
                        const newEdu = [...cvData.education];
                        newEdu[index] = { ...edu, field: e.target.value };
                        setCvData(prev => ({ ...prev, education: newEdu }));
                      }}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Von</label>
                    <input
                      type="text"
                      value={edu.startDate}
                      onChange={(e) => {
                        const newEdu = [...cvData.education];
                        newEdu[index] = { ...edu, startDate: e.target.value };
                        setCvData(prev => ({ ...prev, education: newEdu }));
                      }}
                      placeholder="2017"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Bis</label>
                    <input
                      type="text"
                      value={edu.endDate}
                      onChange={(e) => {
                        const newEdu = [...cvData.education];
                        newEdu[index] = { ...edu, endDate: e.target.value };
                        setCvData(prev => ({ ...prev, education: newEdu }));
                      }}
                      placeholder="2019"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setCvData(prev => ({
                ...prev,
                education: [...prev.education, { institution: '', degree: '', field: '', startDate: '', endDate: '' }]
              }))}
              className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-white/30 hover:border-white/50 rounded-lg text-white/70 hover:text-white transition-colors"
            >
              <Plus className="w-5 h-5" />
              Ausbildung hinzufügen
            </button>
          </div>
        )}
      </div>

      {/* Save indicator */}
      <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
        <Save className="w-4 h-4" />
        Automatisch gespeichert
      </div>
    </div>
  );
}
