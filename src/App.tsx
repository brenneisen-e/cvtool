import { useState, useEffect, useCallback } from 'react';
import { FileDown, Upload } from 'lucide-react';
import { CVForm } from './components/CVForm';
import { FileUploader } from './components/FileUploader';
import { saveCV, loadCV } from './lib/cvStorage';
import { enhanceDescription } from './lib/api';
import { generateDocx, generatePptx, downloadBlob } from './lib/documentGenerator';
import type { CVData, UploadedFile } from './types';

type View = 'form' | 'templates';

function App() {
  const [view, setView] = useState<View>('form');
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Load CV data from IndexedDB on mount
  useEffect(() => {
    loadCV()
      .then((data) => {
        if (data) setCvData(data);
      })
      .catch((err) => console.error('Failed to load CV:', err))
      .finally(() => setIsLoading(false));
  }, []);

  // Save CV data
  const handleSaveCV = useCallback(async (data: CVData) => {
    setCvData(data);
    try {
      await saveCV(data);
    } catch (err) {
      console.error('Failed to save CV:', err);
    }
  }, []);

  // AI Enhancement
  const handleEnhance = useCallback(async (
    entryId: string,
    type: 'experience' | 'project',
    keywords: string[]
  ): Promise<string> => {
    if (!cvData) return '';

    setIsEnhancing(true);
    setError(null);

    try {
      let entry;
      let request;

      if (type === 'experience') {
        entry = cvData.experience.find((e) => e.id === entryId);
        if (!entry) return '';
        request = {
          type: 'experience' as const,
          description: entry.description,
          keywords,
          position: entry.position,
          company: entry.company,
        };
      } else {
        entry = cvData.projects.find((p) => p.id === entryId);
        if (!entry) return '';
        request = {
          type: 'project' as const,
          description: entry.description,
          keywords,
          role: entry.role,
          industry: entry.industry,
        };
      }

      const result = await enhanceDescription(request, apiKey);
      return result.enhanced;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enhancement fehlgeschlagen');
      return '';
    } finally {
      setIsEnhancing(false);
    }
  }, [cvData, apiKey]);

  // Export to templates
  const handleExport = useCallback(async (format: 'docx' | 'pptx') => {
    if (!cvData) return;

    setIsExporting(true);
    setError(null);

    try {
      const template = uploadedFiles.find(f =>
        format === 'docx' ? f.type === 'template-docx' : f.type === 'template-pptx'
      );

      let blob: Blob;
      let filename: string;

      if (format === 'docx') {
        blob = await generateDocx(cvData, template ? uploadedFiles : undefined);
        filename = `${cvData.personalInfo.name.replace(/\s+/g, '_')}_CV.docx`;
      } else {
        blob = await generatePptx(cvData, template ? uploadedFiles : undefined);
        filename = `${cvData.personalInfo.name.replace(/\s+/g, '_')}_CV.pptx`;
      }

      downloadBlob(blob, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export fehlgeschlagen');
    } finally {
      setIsExporting(false);
    }
  }, [cvData, uploadedFiles]);

  // Handle file uploads
  const handleFilesChange = useCallback((files: UploadedFile[]) => {
    setUploadedFiles(files);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/50">Lade...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="py-6 px-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">CV Optimizer</h1>
              <p className="text-white/50 text-sm">
                Deloitte One-Pager CV Generator
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('form')}
                className={`px-4 py-2 rounded text-sm ${
                  view === 'form'
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-white/10 hover:bg-white/20 text-white/70'
                }`}
              >
                CV Bearbeiten
              </button>
              <button
                onClick={() => setView('templates')}
                className={`px-4 py-2 rounded text-sm ${
                  view === 'templates'
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-white/10 hover:bg-white/20 text-white/70'
                }`}
              >
                Templates
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <div className="bg-white/5 rounded p-4">
            <div className="flex items-center gap-4">
              <label className="text-white/70 text-sm whitespace-nowrap">
                API Key (für KI-Enhancement):
              </label>
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-... (oder Server-Key wird verwendet)"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/40"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/70 text-xs"
                >
                  {showApiKey ? 'Verbergen' : 'Anzeigen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="p-4 bg-red-500/20 border border-red-400/50 rounded text-red-200 text-sm">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-300 hover:text-red-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="py-8 px-4">
        {view === 'form' && (
          <div className="space-y-8">
            <CVForm
              initialData={cvData || undefined}
              onSave={handleSaveCV}
              onEnhance={handleEnhance}
              isEnhancing={isEnhancing}
            />

            {/* Export Buttons */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileDown className="w-5 h-5" />
                  In Deloitte-Vorlagen exportieren
                </h3>
                <p className="text-white/60 text-sm mb-4">
                  Exportiere deinen CV in die Deloitte One-Pager Vorlagen. Lade vorher die Vorlagen hoch, um dein eigenes Layout zu verwenden.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => handleExport('docx')}
                    disabled={isExporting || !cvData}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium"
                  >
                    <FileDown className="w-5 h-5" />
                    {isExporting ? 'Exportiere...' : 'DOCX exportieren'}
                  </button>
                  <button
                    onClick={() => handleExport('pptx')}
                    disabled={isExporting || !cvData}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg font-medium"
                  >
                    <FileDown className="w-5 h-5" />
                    {isExporting ? 'Exportiere...' : 'PPTX exportieren'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'templates' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Deloitte-Vorlagen hochladen
              </h2>
              <p className="text-white/60 text-sm mb-6">
                Lade deine Deloitte CV-Vorlagen hoch (DOCX und PPTX), damit der Export das richtige Layout verwendet.
                Ohne Vorlagen wird ein Standard-Layout generiert.
              </p>
              <FileUploader
                uploadedFiles={uploadedFiles}
                onFilesChange={handleFilesChange}
                onContinue={() => setView('form')}
              />
            </div>

            {uploadedFiles.length > 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-300 mb-2">
                  ✓ Vorlagen geladen
                </h3>
                <ul className="text-white/70 text-sm space-y-1">
                  {uploadedFiles.map((file) => (
                    <li key={file.id}>• {file.name} ({file.type})</li>
                  ))}
                </ul>
                <button
                  onClick={() => setView('form')}
                  className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  Zurück zum CV-Formular
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 px-4">
        <div className="max-w-6xl mx-auto text-center text-white/30 text-xs">
          CV Optimizer - Deloitte One-Pager CV Generator mit KI-Enhancement
        </div>
      </footer>
    </div>
  );
}

export default App;
