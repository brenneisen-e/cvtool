import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileText,
  Presentation,
  X,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { UploadedFile } from '../types';
import { parseDocument } from '../lib/documentParser';

interface FileUploaderProps {
  onFilesChange: (files: UploadedFile[]) => void;
  uploadedFiles: UploadedFile[];
  onContinue: () => void;
}

type FileCategory = 'template-docx' | 'template-pptx' | 'example-cv-docx' | 'example-cv-pptx' | 'my-cv';

interface FileCategoryConfig {
  id: FileCategory;
  title: string;
  description: string;
  accept: Record<string, string[]>;
  icon: typeof FileText;
  required: boolean;
}

const categories: FileCategoryConfig[] = [
  {
    id: 'template-docx',
    title: 'DOCX-Vorlage',
    description: 'Word-Vorlage mit Firmen-CI',
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    icon: FileText,
    required: true,
  },
  {
    id: 'template-pptx',
    title: 'PPTX-Vorlage',
    description: 'PowerPoint-Vorlage mit Firmen-CI',
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    },
    icon: Presentation,
    required: true,
  },
  {
    id: 'example-cv-docx',
    title: 'Beispiel-CV (DOCX)',
    description: 'Ausgefüllter CV als Word-Referenz',
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    icon: FileText,
    required: true,
  },
  {
    id: 'example-cv-pptx',
    title: 'Beispiel-CV (PPTX)',
    description: 'Ausgefüllter CV als PowerPoint-Referenz',
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    },
    icon: Presentation,
    required: true,
  },
  {
    id: 'my-cv',
    title: 'Mein CV',
    description: 'Ihr aktueller Lebenslauf',
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    icon: FileText,
    required: true,
  },
];

export function FileUploader({
  onFilesChange,
  uploadedFiles,
  onContinue,
}: FileUploaderProps) {
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileDrop = useCallback(
    async (files: File[], category: FileCategory) => {
      if (files.length === 0) return;

      const file = files[0];
      setProcessingFile(category);
      setError(null);

      try {
        const extractedData = await parseDocument(file);

        const newFile: UploadedFile = {
          id: `${category}-${Date.now()}`,
          name: file.name,
          type: category,
          file,
          content: extractedData.text,
          extractedData,
        };

        // Replace existing file in same category
        const updatedFiles = uploadedFiles.filter((f) => f.type !== category);
        updatedFiles.push(newFile);
        onFilesChange(updatedFiles);
      } catch (err) {
        setError(
          `Fehler beim Verarbeiten von ${file.name}: ${
            err instanceof Error ? err.message : 'Unbekannter Fehler'
          }`
        );
      } finally {
        setProcessingFile(null);
      }
    },
    [uploadedFiles, onFilesChange]
  );

  const removeFile = useCallback(
    (category: FileCategory) => {
      const updatedFiles = uploadedFiles.filter((f) => f.type !== category);
      onFilesChange(updatedFiles);
    },
    [uploadedFiles, onFilesChange]
  );

  const getFileForCategory = (category: FileCategory): UploadedFile | undefined => {
    return uploadedFiles.find((f) => f.type === category);
  };

  const requiredFilesUploaded = categories
    .filter((c) => c.required)
    .every((c) => getFileForCategory(c.id));

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Dokumente hochladen
        </h2>
        <p className="text-white/70">
          Laden Sie Ihre Vorlagen und Ihren aktuellen CV hoch, um zu beginnen.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-200">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {categories.map((category) => (
          <DropZoneCard
            key={category.id}
            category={category}
            file={getFileForCategory(category.id)}
            isProcessing={processingFile === category.id}
            onDrop={(files) => handleFileDrop(files, category.id)}
            onRemove={() => removeFile(category.id)}
          />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onContinue}
          disabled={!requiredFilesUploaded}
          className={`
            px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300
            flex items-center gap-2 shadow-lg
            ${
              requiredFilesUploaded
                ? 'bg-white text-indigo-600 hover:bg-indigo-50 hover:scale-105'
                : 'bg-white/30 text-white/50 cursor-not-allowed'
            }
          `}
        >
          Weiter zum Interview
          <span className="text-xl">→</span>
        </button>
      </div>

      {!requiredFilesUploaded && (
        <p className="text-center text-white/60 text-sm mt-4">
          Bitte laden Sie alle Vorlagen, Beispiel-CVs und Ihren CV hoch.
        </p>
      )}
    </div>
  );
}

interface DropZoneCardProps {
  category: FileCategoryConfig;
  file?: UploadedFile;
  isProcessing: boolean;
  onDrop: (files: File[]) => void;
  onRemove: () => void;
}

function DropZoneCard({
  category,
  file,
  isProcessing,
  onDrop,
  onRemove,
}: DropZoneCardProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: category.accept,
    multiple: false,
    disabled: isProcessing,
  });

  const Icon = category.icon;

  return (
    <div
      {...getRootProps()}
      className={`
        relative p-6 rounded-xl border-2 border-dashed transition-all duration-300
        ${
          isDragActive
            ? 'border-white bg-white/20 scale-[1.02]'
            : file
            ? 'border-green-400/50 bg-green-500/10'
            : 'border-white/30 bg-white/5 hover:bg-white/10 hover:border-white/50'
        }
        ${isProcessing ? 'cursor-wait' : 'cursor-pointer'}
      `}
    >
      <input {...getInputProps()} />

      {file && !isProcessing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-3 right-3 p-1 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      )}

      <div className="flex flex-col items-center text-center">
        <div
          className={`
            w-12 h-12 rounded-full flex items-center justify-center mb-3
            ${file ? 'bg-green-500/20' : 'bg-white/10'}
          `}
        >
          {isProcessing ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : file ? (
            <Check className="w-6 h-6 text-green-400" />
          ) : (
            <Icon className="w-6 h-6 text-white/70" />
          )}
        </div>

        <h3 className="text-white font-semibold flex items-center gap-2">
          {category.title}
          {category.required && (
            <span className="text-xs text-red-400">*</span>
          )}
        </h3>

        {file ? (
          <div className="mt-2">
            <p className="text-green-400 text-sm font-medium truncate max-w-[200px]">
              {file.name}
            </p>
            <p className="text-white/50 text-xs mt-1">
              Klicken zum Ersetzen
            </p>
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-white/60 text-sm">{category.description}</p>
            <p className="text-white/40 text-xs mt-2">
              {isDragActive
                ? 'Datei hier ablegen'
                : 'Klicken oder Datei hierher ziehen'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
