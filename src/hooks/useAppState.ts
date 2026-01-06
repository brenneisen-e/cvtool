import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UploadedFile, InterviewState, CVData, AppState } from '../types';
import { analyzeDocuments, generateCV } from '../lib/api';
import { saveFile, getAllFiles, saveState, getState, clearAll } from '../lib/storage';

interface UseAppStateReturn {
  state: AppState;
  apiKey: string;
  showApiKey: boolean;
  useMockApi: boolean;
  stepsCompleted: Record<1 | 2 | 3, boolean>;
  setApiKey: (key: string) => void;
  setShowApiKey: (show: boolean) => void;
  handleFilesChange: (files: UploadedFile[]) => Promise<void>;
  handleContinueToInterview: () => void;
  handleStartInterview: () => Promise<void>;
  handleInterviewUpdate: (interviewState: InterviewState) => void;
  handleInterviewComplete: () => void;
  handleGenerateCV: () => Promise<void>;
  handleStepClick: (step: 1 | 2 | 3) => void;
  handleReset: () => Promise<void>;
  handleBack: () => void;
}

export function useAppState(): UseAppStateReturn {
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

  // useMockApi indicates whether user has their own key (false = server key will be used)
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

  const handleFilesChange = useCallback(async (files: UploadedFile[]) => {
    setState((prev) => ({ ...prev, uploadedFiles: files }));
    for (const file of files) {
      await saveFile(file);
    }
  }, []);

  const handleContinueToInterview = useCallback(() => {
    setState((prev) => ({ ...prev, currentStep: 2 }));
  }, []);

  const handleStartInterview = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Always use real API (server has API key configured)
      const result = await analyzeDocuments(state.uploadedFiles, apiKey);
      const questions = result.questions;

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
  }, [state.uploadedFiles, apiKey]);

  const handleInterviewUpdate = useCallback((interviewState: InterviewState) => {
    setState((prev) => ({ ...prev, interviewState }));
  }, []);

  const handleGenerateCV = useCallback(async () => {
    if (!state.interviewState) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Always use real API (server has API key configured)
      const result = await generateCV(state.interviewState, state.uploadedFiles, apiKey);
      const cvData = result.cvData;

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
  }, [state.interviewState, state.uploadedFiles, apiKey]);

  const handleInterviewComplete = useCallback(() => {
    setState((prev) => ({ ...prev, currentStep: 3 }));
    // Note: handleGenerateCV will be called separately
  }, []);

  const stepsCompleted = useMemo(() => ({
    1: state.uploadedFiles.filter((f) =>
      ['template-docx', 'template-pptx', 'example-cv-docx', 'example-cv-pptx', 'my-cv'].includes(f.type)
    ).length >= 5,
    2: state.interviewState?.isComplete || false,
    3: state.generatedCV !== null,
  }), [state.uploadedFiles, state.interviewState?.isComplete, state.generatedCV]);

  const handleStepClick = useCallback((step: 1 | 2 | 3) => {
    const canNavigate =
      step === 1 ||
      (step === 2 && stepsCompleted[1]) ||
      (step === 3 && stepsCompleted[2]);

    if (canNavigate) {
      setState((prev) => ({ ...prev, currentStep: step }));
    }
  }, [stepsCompleted]);

  const handleReset = useCallback(async () => {
    await clearAll();
    setState({
      currentStep: 1,
      uploadedFiles: [],
      interviewState: null,
      generatedCV: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const handleBack = useCallback(() => {
    setState((prev) => ({ ...prev, currentStep: 2 }));
  }, []);

  return {
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
  };
}
