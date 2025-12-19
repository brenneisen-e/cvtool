import { useState, useRef, useEffect } from 'react';
import {
  Send,
  SkipForward,
  Loader2,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { InterviewQuestion, InterviewState, UploadedFile } from '../types';

interface InterviewChatProps {
  uploadedFiles: UploadedFile[];
  interviewState: InterviewState | null;
  onInterviewUpdate: (state: InterviewState) => void;
  onComplete: () => void;
  isLoading: boolean;
  onStartInterview: () => void;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

export function InterviewChat({
  uploadedFiles,
  interviewState,
  onInterviewUpdate,
  onComplete,
  isLoading,
  onStartInterview,
}: InterviewChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentQuestion = interviewState?.questions[interviewState.currentQuestionIndex];
  const progress = interviewState
    ? Math.round(
        (interviewState.questions.filter((q) => q.answered).length /
          interviewState.questions.length) *
          100
      )
    : 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Add welcome message on mount
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content:
          'Willkommen beim CV-Interview! Ich werde Ihre hochgeladenen Dokumente analysieren und Ihnen gezielte Fragen stellen, um Ihren Lebenslauf zu optimieren. Klicken Sie auf "Interview starten", um zu beginnen.',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  useEffect(() => {
    // Add current question to chat when interview state changes
    if (currentQuestion && !currentQuestion.answered) {
      const existingQuestionMessage = messages.find(
        (m) => m.id === `question-${currentQuestion.id}`
      );
      if (!existingQuestionMessage) {
        const questionMessage: ChatMessage = {
          id: `question-${currentQuestion.id}`,
          role: 'assistant',
          content: currentQuestion.question,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, questionMessage]);
      }
    }
  }, [currentQuestion?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentQuestion || isTyping) return;

    const userMessage: ChatMessage = {
      id: `answer-${currentQuestion.id}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Update interview state
    const updatedQuestions = interviewState!.questions.map((q) =>
      q.id === currentQuestion.id
        ? { ...q, answered: true, answer: inputValue }
        : q
    );

    const isLastQuestion =
      interviewState!.currentQuestionIndex >=
      interviewState!.questions.length - 1;

    const updatedState: InterviewState = {
      ...interviewState!,
      questions: updatedQuestions,
      currentQuestionIndex: isLastQuestion
        ? interviewState!.currentQuestionIndex
        : interviewState!.currentQuestionIndex + 1,
      isComplete: isLastQuestion,
    };

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsTyping(false);

    if (isLastQuestion) {
      const completionMessage: ChatMessage = {
        id: 'completion',
        role: 'assistant',
        content:
          'Vielen Dank für Ihre Antworten! Ich habe jetzt alle Informationen, die ich brauche, um Ihren optimierten CV zu erstellen. Klicken Sie auf "CV generieren", um fortzufahren.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, completionMessage]);
    } else {
      // Add acknowledgment
      const ackMessage: ChatMessage = {
        id: `ack-${currentQuestion.id}`,
        role: 'assistant',
        content: getAcknowledgment(currentQuestion.category),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, ackMessage]);
    }

    onInterviewUpdate(updatedState);
  };

  const handleSkip = () => {
    if (!currentQuestion || isTyping) return;

    const updatedQuestions = interviewState!.questions.map((q) =>
      q.id === currentQuestion.id
        ? { ...q, answered: true, answer: '[Übersprungen]' }
        : q
    );

    const isLastQuestion =
      interviewState!.currentQuestionIndex >=
      interviewState!.questions.length - 1;

    const updatedState: InterviewState = {
      ...interviewState!,
      questions: updatedQuestions,
      currentQuestionIndex: isLastQuestion
        ? interviewState!.currentQuestionIndex
        : interviewState!.currentQuestionIndex + 1,
      isComplete: isLastQuestion,
    };

    const skipMessage: ChatMessage = {
      id: `skip-${currentQuestion.id}`,
      role: 'user',
      content: '[Frage übersprungen]',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, skipMessage]);

    onInterviewUpdate(updatedState);
  };

  const getCategoryLabel = (
    category: InterviewQuestion['category']
  ): string => {
    const labels: Record<InterviewQuestion['category'], string> = {
      gaps: 'Lücken im Lebenslauf',
      projects: 'Projekterfahrung',
      skills: 'Fähigkeiten',
      achievements: 'Erfolge',
      softskills: 'Soft Skills',
      general: 'Allgemein',
    };
    return labels[category];
  };

  const getAcknowledgment = (
    category: InterviewQuestion['category']
  ): string => {
    const acknowledgments: Record<InterviewQuestion['category'], string[]> = {
      gaps: [
        'Danke für diese Erläuterung! Das hilft bei der Darstellung Ihres Werdegangs.',
        'Verstanden, ich werde das entsprechend berücksichtigen.',
      ],
      projects: [
        'Ausgezeichnet! Solche Projektdetails sind sehr wertvoll für den CV.',
        'Das klingt nach einem interessanten Projekt!',
      ],
      skills: [
        'Gut zu wissen! Ich werde diese Fähigkeiten hervorheben.',
        'Diese Kenntnisse werden Ihren CV bereichern.',
      ],
      achievements: [
        'Beeindruckend! Quantifizierbare Erfolge sind besonders wichtig.',
        'Das ist genau die Art von Erfolg, die Arbeitgeber sehen wollen.',
      ],
      softskills: [
        'Danke! Soft Skills sind in der Consulting-Branche besonders wichtig.',
        'Das ist ein wichtiger Aspekt Ihres Profils.',
      ],
      general: [
        'Danke für diese Information!',
        'Gut, ich habe das notiert.',
      ],
    };
    const options = acknowledgments[category];
    return options[Math.floor(Math.random() * options.length)];
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-[600px]">
      {/* Header */}
      <div className="bg-white/10 rounded-t-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">CV-Interview</h2>
            <p className="text-white/60 text-sm">
              {interviewState
                ? `Frage ${interviewState.currentQuestionIndex + 1} von ${
                    interviewState.questions.length
                  }`
                : 'Bereit zum Starten'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {interviewState && (
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-white/60 text-sm">{progress}%</span>
              </div>
            )}
            {currentQuestion && (
              <span className="px-3 py-1 bg-indigo-500/30 rounded-full text-xs text-indigo-200">
                {getCategoryLabel(currentQuestion.category)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-white/5 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${
                  message.role === 'assistant'
                    ? 'bg-indigo-500'
                    : 'bg-green-500'
                }
              `}
            >
              {message.role === 'assistant' ? (
                <Bot className="w-5 h-5 text-white" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div
              className={`
                max-w-[80%] p-3 rounded-lg
                ${
                  message.role === 'assistant'
                    ? 'bg-white/10 text-white'
                    : 'bg-green-500/20 text-green-100'
                }
              `}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <span className="text-xs text-white/40 mt-1 block">
                {message.timestamp.toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white/10 p-3 rounded-lg">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <span
                  className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white/10 rounded-b-xl p-4">
        {!interviewState ? (
          <button
            onClick={onStartInterview}
            disabled={isLoading}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analysiere Dokumente...
              </>
            ) : (
              <>
                <Bot className="w-5 h-5" />
                Interview starten
              </>
            )}
          </button>
        ) : interviewState.isComplete ? (
          <button
            onClick={onComplete}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            CV generieren
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ihre Antwort eingeben..."
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
              disabled={isTyping}
            />
            <button
              type="button"
              onClick={handleSkip}
              disabled={isTyping}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg transition-colors"
              title="Frage überspringen"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className={`
                px-4 py-3 rounded-lg transition-colors
                ${
                  inputValue.trim() && !isTyping
                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                }
              `}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        )}
      </div>

      {/* Files Info */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg">
        <p className="text-white/40 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Analysierte Dokumente:{' '}
          {uploadedFiles.map((f) => f.name).join(', ')}
        </p>
      </div>
    </div>
  );
}
