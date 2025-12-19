import { useState } from 'react';
import {
  Download,
  FileText,
  Presentation,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Eye,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  Code,
  FolderKanban,
} from 'lucide-react';
import type { CVData } from '../types';
import { generateDocx, generatePptx, downloadBlob } from '../lib/documentGenerator';

interface CVPreviewProps {
  cvData: CVData | null;
  isLoading: boolean;
  onRegenerate: () => void;
  onBack: () => void;
}

export function CVPreview({
  cvData,
  isLoading,
  onRegenerate,
  onBack,
}: CVPreviewProps) {
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingPptx, setDownloadingPptx] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');

  const handleDownloadDocx = async () => {
    if (!cvData) return;
    setDownloadingDocx(true);
    try {
      const blob = await generateDocx(cvData);
      downloadBlob(blob, `${cvData.personalInfo.name.replace(/\s+/g, '_')}_CV.docx`);
    } catch (error) {
      console.error('Error generating DOCX:', error);
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleDownloadPptx = async () => {
    if (!cvData) return;
    setDownloadingPptx(true);
    try {
      const blob = await generatePptx(cvData);
      downloadBlob(blob, `${cvData.personalInfo.name.replace(/\s+/g, '_')}_CV.pptx`);
    } catch (error) {
      console.error('Error generating PPTX:', error);
    } finally {
      setDownloadingPptx(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8">
        <div className="bg-white/10 rounded-xl p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-16 h-16 text-white animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">
            CV wird generiert...
          </h2>
          <p className="text-white/60 text-center max-w-md">
            Die KI erstellt Ihren optimierten Lebenslauf basierend auf Ihren
            Angaben und den Vorlagen.
          </p>
        </div>
      </div>
    );
  }

  if (!cvData) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8">
        <div className="bg-white/10 rounded-xl p-12 flex flex-col items-center justify-center">
          <FileText className="w-16 h-16 text-white/40 mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Kein CV vorhanden
          </h2>
          <p className="text-white/60 text-center max-w-md mb-6">
            Bitte durchlaufen Sie zuerst das Interview, um Ihren CV zu
            generieren.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold transition-colors"
          >
            Zurück zum Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
            CV erfolgreich generiert!
          </h2>
          <p className="text-white/60 mt-1">
            Überprüfen Sie die Vorschau und laden Sie Ihren optimierten CV
            herunter.
          </p>
        </div>
        <button
          onClick={onRegenerate}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Neu generieren
        </button>
      </div>

      {/* Download Buttons */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleDownloadDocx}
          disabled={downloadingDocx}
          className="p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-xl transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            {downloadingDocx ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <FileText className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="text-left">
            <h3 className="text-white font-semibold">DOCX herunterladen</h3>
            <p className="text-white/60 text-sm">Word-Dokument Format</p>
          </div>
          <Download className="w-5 h-5 text-white/60 ml-auto" />
        </button>

        <button
          onClick={handleDownloadPptx}
          disabled={downloadingPptx}
          className="p-4 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/30 rounded-xl transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
            {downloadingPptx ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Presentation className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="text-left">
            <h3 className="text-white font-semibold">PPTX herunterladen</h3>
            <p className="text-white/60 text-sm">PowerPoint Format</p>
          </div>
          <Download className="w-5 h-5 text-white/60 ml-auto" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'preview'
              ? 'bg-white text-indigo-600'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          <Eye className="w-4 h-4" />
          Vorschau
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'raw'
              ? 'bg-white text-indigo-600'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          <Code className="w-4 h-4" />
          Rohdaten
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
        {activeTab === 'preview' ? (
          <CVPreviewContent cvData={cvData} />
        ) : (
          <pre className="p-6 text-sm overflow-auto max-h-[600px] bg-gray-900 text-green-400">
            {JSON.stringify(cvData, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

function CVPreviewContent({ cvData }: { cvData: CVData }) {
  return (
    <div className="p-8 max-h-[600px] overflow-y-auto">
      {/* Header */}
      <div className="text-center border-b pb-6 mb-6">
        <h1 className="text-3xl font-bold text-indigo-600">
          {cvData.personalInfo.name}
        </h1>
        <p className="text-xl text-gray-600 mt-2">
          {cvData.personalInfo.title}
        </p>
        <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
          {cvData.personalInfo.email && (
            <span>{cvData.personalInfo.email}</span>
          )}
          {cvData.personalInfo.phone && (
            <span>• {cvData.personalInfo.phone}</span>
          )}
          {cvData.personalInfo.location && (
            <span>• {cvData.personalInfo.location}</span>
          )}
        </div>
      </div>

      {/* Summary */}
      {cvData.summary && (
        <Section title="Profil" icon={<Briefcase className="w-5 h-5" />}>
          <p className="text-gray-700">{cvData.summary}</p>
        </Section>
      )}

      {/* Experience */}
      {cvData.experience.length > 0 && (
        <Section title="Berufserfahrung" icon={<Briefcase className="w-5 h-5" />}>
          {cvData.experience.map((exp, index) => (
            <div key={index} className="mb-4 last:mb-0">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-800">{exp.position}</h4>
                  <p className="text-indigo-600">{exp.company}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {exp.startDate} - {exp.current ? 'heute' : exp.endDate}
                </span>
              </div>
              <p className="text-gray-600 text-sm mt-2">{exp.description}</p>
              {exp.achievements.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {exp.achievements.map((achievement, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-indigo-500">•</span>
                      {achievement}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Projects */}
      {cvData.projects.length > 0 && (
        <Section title="Projekterfahrung" icon={<FolderKanban className="w-5 h-5" />}>
          {cvData.projects.map((proj, index) => (
            <div key={index} className="mb-4 last:mb-0">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {proj.name}
                    {proj.client && (
                      <span className="text-gray-500 font-normal">
                        {' '}
                        | {proj.client}
                      </span>
                    )}
                  </h4>
                  <p className="text-indigo-600 text-sm">{proj.role}</p>
                </div>
                <span className="text-sm text-gray-500">{proj.duration}</span>
              </div>
              <p className="text-gray-600 text-sm mt-2">{proj.description}</p>
              {proj.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {proj.technologies.map((tech, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Education */}
      {cvData.education.length > 0 && (
        <Section title="Ausbildung" icon={<GraduationCap className="w-5 h-5" />}>
          {cvData.education.map((edu, index) => (
            <div key={index} className="mb-3 last:mb-0">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {edu.degree} - {edu.field}
                  </h4>
                  <p className="text-indigo-600 text-sm">{edu.institution}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {edu.startDate} - {edu.endDate}
                </span>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Skills */}
      {cvData.skills.length > 0 && (
        <Section title="Kenntnisse" icon={<Code className="w-5 h-5" />}>
          <div className="space-y-2">
            {cvData.skills.map((category, index) => (
              <div key={index} className="flex gap-3">
                <span className="font-semibold text-gray-700 min-w-[120px]">
                  {category.category}:
                </span>
                <span className="text-gray-600">
                  {category.skills.join(', ')}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Languages */}
      {cvData.languages.length > 0 && (
        <Section title="Sprachen" icon={<Globe className="w-5 h-5" />}>
          <div className="flex flex-wrap gap-4">
            {cvData.languages.map((lang, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">
                  {lang.language}:
                </span>
                <span className="text-gray-600">{lang.level}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Certifications */}
      {cvData.certifications.length > 0 && (
        <Section title="Zertifikate" icon={<Award className="w-5 h-5" />}>
          <ul className="space-y-1">
            {cvData.certifications.map((cert, index) => (
              <li key={index} className="text-gray-600 flex items-start gap-2">
                <span className="text-indigo-500">•</span>
                {cert}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold text-indigo-600 border-b border-indigo-200 pb-2 mb-4 flex items-center gap-2">
        {icon}
        {title.toUpperCase()}
      </h3>
      {children}
    </div>
  );
}
