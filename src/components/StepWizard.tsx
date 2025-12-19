import { Check, Upload, MessageSquare, FileText } from 'lucide-react';

interface StepWizardProps {
  currentStep: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2 | 3) => void;
  stepsCompleted: { 1: boolean; 2: boolean; 3: boolean };
}

const steps = [
  {
    number: 1,
    title: 'Dokumente hochladen',
    description: 'Vorlagen, Beispiel-CV und Ihr CV',
    icon: Upload,
  },
  {
    number: 2,
    title: 'Interview',
    description: 'KI-gestützte Fragen beantworten',
    icon: MessageSquare,
  },
  {
    number: 3,
    title: 'CV generieren',
    description: 'Optimierten CV herunterladen',
    icon: FileText,
  },
] as const;

export function StepWizard({
  currentStep,
  onStepClick,
  stepsCompleted,
}: StepWizardProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const isActive = currentStep === step.number;
          const isCompleted = stepsCompleted[step.number as 1 | 2 | 3];
          const canClick =
            step.number === 1 ||
            stepsCompleted[(step.number - 1) as 1 | 2 | 3];
          const Icon = step.icon;

          return (
            <div key={step.number} className="flex items-center">
              {/* Step Circle */}
              <button
                onClick={() => canClick && onStepClick?.(step.number as 1 | 2 | 3)}
                disabled={!canClick}
                className={`
                  flex flex-col items-center group transition-all duration-300
                  ${canClick ? 'cursor-pointer' : 'cursor-not-allowed'}
                `}
              >
                <div
                  className={`
                    relative flex items-center justify-center w-14 h-14 rounded-full
                    transition-all duration-300 shadow-lg
                    ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-white text-indigo-600 ring-4 ring-indigo-300'
                        : 'bg-white/30 text-white/70'
                    }
                    ${canClick && !isActive ? 'group-hover:scale-110' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-7 h-7" strokeWidth={3} />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>

                {/* Step Text */}
                <div className="mt-3 text-center">
                  <p
                    className={`
                      text-sm font-semibold transition-colors duration-300
                      ${isActive ? 'text-white' : 'text-white/70'}
                    `}
                  >
                    {step.title}
                  </p>
                  <p
                    className={`
                      text-xs mt-1 max-w-[120px] transition-colors duration-300
                      ${isActive ? 'text-white/90' : 'text-white/50'}
                    `}
                  >
                    {step.description}
                  </p>
                </div>
              </button>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    w-16 md:w-24 h-1 mx-4 rounded-full transition-all duration-500
                    ${
                      stepsCompleted[step.number as 1 | 2 | 3]
                        ? 'bg-green-400'
                        : 'bg-white/30'
                    }
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
