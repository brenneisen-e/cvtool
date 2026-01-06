import { useEffect } from 'react';
import { StepWizard } from './components/StepWizard';
import { FileUploader } from './components/FileUploader';
import { InterviewChat } from './components/InterviewChat';
import { CVPreview } from './components/CVPreview';
import { useAppState } from './hooks/useAppState';

function App() {
  const {
    state,
    apiKey,
    showApiKey,
    useMockApi,
    stepsCompleted,
    setApiKey,
    setShowApiKey,
    handleFilesChange,
    handleContinueToInterview,
    handleStartInterview,
    handleInterviewUpdate,
    handleInterviewComplete,
    handleGenerateCV,
    handleStepClick,
    handleReset,
    handleBack,
  } = useAppState();

  // Trigger CV generation when completing interview
  useEffect(() => {
    if (state.currentStep === 3 && state.interviewState?.isComplete && !state.generatedCV && !state.isLoading) {
      handleGenerateCV();
    }
  }, [state.currentStep, state.interviewState?.isComplete, state.generatedCV, state.isLoading, handleGenerateCV]);

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

          {/* API Key Input (Optional) */}
          <div className="bg-white/5 rounded p-4">
            <div className="flex items-center gap-4">
              <label className="text-white/70 text-sm whitespace-nowrap">
                API Key (optional):
              </label>
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Server-Key wird verwendet oder sk-ant-..."
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
              <span className={`text-xs px-2 py-1 rounded ${useMockApi ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}`}>
                {useMockApi ? 'Server-Key' : 'Eigener Key'}
              </span>
            </div>
            <p className="text-white/40 text-xs mt-2">
              {useMockApi
                ? 'Der auf dem Server konfigurierte API-Key wird verwendet.'
                : 'Ihr eigener API-Key wird verwendet.'}
            </p>
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
            onBack={handleBack}
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
