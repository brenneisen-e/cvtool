import { useState, useEffect } from 'react';
import { StepWizard } from './components/StepWizard';
import { FileUploader } from './components/FileUploader';
import { InterviewChat } from './components/InterviewChat';
import { CVPreview } from './components/CVPreview';
import type { UploadedFile, InterviewState, CVData, AppState } from './types';
import {
  analyzeDocuments,
  generateCV,
  generateMockQuestions,
  generateMockCV,
} from './lib/api';
import { saveFile, getAllFiles, saveState, getState, clearAll } from './lib/storage';
import { FileText, RefreshCw } from 'lucide-react';

// Set to true to use mock data instead of API calls
const USE_MOCK_API = true;

function App() {
  const [state, setState] = useState<AppState>({
    currentStep: 1,
    uploadedFiles: [],
    interviewState: null,
    generatedCV: null,
    isLoading: false,
    error: null,
  });

  // Load saved state on mount
  useEffect(() => {
    async function loadState() {
      try {
        const files = await getAllFiles();
        const savedStep = await getState<number>('currentStep');
        const savedInterview = await getState<InterviewState>('interviewState');
        const savedCV = await getState<CVData>('generatedCV');

        setState((prev) => ({
          ...prev,
          uploadedFiles: files,
          currentStep: (savedStep as 1 | 2 | 3) || 1,
          interviewState: savedInterview,
          generatedCV: savedCV,
        }));
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
    loadState();
  }, []);

  // Save state changes
  useEffect(() => {
    if (state.currentStep) {
      saveState('currentStep', state.currentStep);
    }
  }, [state.currentStep]);

  useEffect(() => {
    if (state.interviewState) {
      saveState('interviewState', state.interviewState);
    }
  }, [state.interviewState]);

  useEffect(() => {
    if (state.generatedCV) {
      saveState('generatedCV', state.generatedCV);
    }
  }, [state.generatedCV]);

  const handleFilesChange = async (files: UploadedFile[]) => {
    setState((prev) => ({ ...prev, uploadedFiles: files }));

    // Save each file to IndexedDB
    for (const file of files) {
      await saveFile(file);
    }
  };

  const handleContinueToInterview = () => {
    setState((prev) => ({ ...prev, currentStep: 2 }));
  };

  const handleStartInterview = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      let questions;

      if (USE_MOCK_API) {
        // Use mock questions for development
        await new Promise((resolve) => setTimeout(resolve, 1500));
        questions = generateMockQuestions(state.uploadedFiles);
      } else {
        // Use real API
        const result = await analyzeDocuments(state.uploadedFiles);
        questions = result.questions;
      }

      const interviewState: InterviewState = {
        questions,
        currentQuestionIndex: 0,
        isComplete: false,
        additionalInfo: '',
      };

      setState((prev) => ({
        ...prev,
        interviewState,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Analyse fehlgeschlagen',
      }));
    }
  };

  const handleInterviewUpdate = (interviewState: InterviewState) => {
    setState((prev) => ({ ...prev, interviewState }));
  };

  const handleInterviewComplete = () => {
    setState((prev) => ({ ...prev, currentStep: 3 }));
    handleGenerateCV();
  };

  const handleGenerateCV = async () => {
    if (!state.interviewState) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      let cvData;

      if (USE_MOCK_API) {
        // Use mock CV for development
        await new Promise((resolve) => setTimeout(resolve, 2000));
        cvData = generateMockCV(state.interviewState, state.uploadedFiles);
      } else {
        // Use real API
        const result = await generateCV(state.interviewState, state.uploadedFiles);
        cvData = result.cvData;
      }

      setState((prev) => ({
        ...prev,
        generatedCV: cvData,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'CV-Generierung fehlgeschlagen',
      }));
    }
  };

  const handleStepClick = (step: 1 | 2 | 3) => {
    // Only allow going to completed steps or current step
    const canNavigate =
      step === 1 ||
      (step === 2 && stepsCompleted[1]) ||
      (step === 3 && stepsCompleted[2]);

    if (canNavigate) {
      setState((prev) => ({ ...prev, currentStep: step }));
    }
  };

  const handleReset = async () => {
    await clearAll();
    setState({
      currentStep: 1,
      uploadedFiles: [],
      interviewState: null,
      generatedCV: null,
      isLoading: false,
      error: null,
    });
  };

  const stepsCompleted = {
    1: state.uploadedFiles.filter((f) =>
      ['template-docx', 'example-cv', 'my-cv'].includes(f.type)
    ).length >= 3,
    2: state.interviewState?.isComplete || false,
    3: state.generatedCV !== null,
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">CV Optimizer</h1>
              <p className="text-white/60 text-sm">
                KI-gestützte Lebenslauf-Optimierung
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Neu starten
          </button>
        </div>
      </header>

      {/* Step Wizard */}
      <div className="max-w-6xl mx-auto px-4">
        <StepWizard
          currentStep={state.currentStep}
          onStepClick={handleStepClick}
          stepsCompleted={stepsCompleted}
        />
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="p-4 bg-red-500/20 border border-red-400/50 rounded-lg text-red-200">
            {state.error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="py-8 px-4">
        {state.currentStep === 1 && (
          <FileUploader
            uploadedFiles={state.uploadedFiles}
            onFilesChange={handleFilesChange}
            onContinue={handleContinueToInterview}
          />
        )}

        {state.currentStep === 2 && (
          <InterviewChat
            uploadedFiles={state.uploadedFiles}
            interviewState={state.interviewState}
            onInterviewUpdate={handleInterviewUpdate}
            onComplete={handleInterviewComplete}
            isLoading={state.isLoading}
            onStartInterview={handleStartInterview}
          />
        )}

        {state.currentStep === 3 && (
          <CVPreview
            cvData={state.generatedCV}
            isLoading={state.isLoading}
            onRegenerate={handleGenerateCV}
            onBack={() => setState((prev) => ({ ...prev, currentStep: 2 }))}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-white/40 text-sm">
          <p>
            CV Optimizer - Optimieren Sie Ihren Lebenslauf mit KI-Unterstützung
          </p>
          <p className="mt-1">
            {USE_MOCK_API && (
              <span className="text-yellow-400/60">
                Demo-Modus aktiv - Keine API-Aufrufe
              </span>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
