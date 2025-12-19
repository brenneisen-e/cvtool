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

function App() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [state, setState] = useState<AppState>({
    currentStep: 1,
    uploadedFiles: [],
    interviewState: null,
    generatedCV: null,
    isLoading: false,
    error: null,
  });

  const useMockApi = !apiKey.startsWith('sk-ant-');

  // Load saved state on mount
  useEffect(() => {
    async function loadState() {
      try {
        const files = await getAllFiles();
        const savedStep = await getState<number>('currentStep');
        const savedInterview = await getState<InterviewState>('interviewState');
        const savedCV = await getState<CVData>('generatedCV');
        const savedApiKey = localStorage.getItem('anthropic_api_key') || '';

        setApiKey(savedApiKey);
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

  // Save API key
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('anthropic_api_key', apiKey);
    }
  }, [apiKey]);

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

      if (useMockApi) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        questions = generateMockQuestions(state.uploadedFiles);
      } else {
        const result = await analyzeDocuments(state.uploadedFiles, apiKey);
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

      if (useMockApi) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        cvData = generateMockCV(state.interviewState, state.uploadedFiles);
      } else {
        const result = await generateCV(state.interviewState, state.uploadedFiles, apiKey);
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
      <header className="py-6 px-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">CV Optimizer</h1>
              <p className="text-white/50 text-sm">
                KI-gestützte Lebenslauf-Optimierung
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/70 rounded text-sm"
            >
              Neu starten
            </button>
          </div>

          {/* API Key Input */}
          <div className="bg-white/5 rounded p-4">
            <div className="flex items-center gap-4">
              <label className="text-white/70 text-sm whitespace-nowrap">
                Anthropic API Key:
              </label>
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-api03-..."
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
              <span className={`text-xs px-2 py-1 rounded ${useMockApi ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                {useMockApi ? 'Demo-Modus' : 'API aktiv'}
              </span>
            </div>
            {useMockApi && (
              <p className="text-white/40 text-xs mt-2">
                Ohne API-Key werden Demo-Daten verwendet. Holen Sie sich einen Key auf console.anthropic.com
              </p>
            )}
          </div>
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
          <div className="p-4 bg-red-500/20 border border-red-400/50 rounded text-red-200 text-sm">
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
      <footer className="py-6 px-4">
        <div className="max-w-6xl mx-auto text-center text-white/30 text-xs">
          CV Optimizer - Optimieren Sie Ihren Lebenslauf mit KI
        </div>
      </footer>
    </div>
  );
}

export default App;
