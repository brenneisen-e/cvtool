interface StepWizardProps {
  currentStep: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2 | 3) => void;
  stepsCompleted: { 1: boolean; 2: boolean; 3: boolean };
}

const steps = [
  { number: 1, title: 'Dokumente hochladen' },
  { number: 2, title: 'Interview' },
  { number: 3, title: 'CV generieren' },
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

          return (
            <div key={step.number} className="flex items-center">
              <button
                onClick={() => canClick && onStepClick?.(step.number as 1 | 2 | 3)}
                disabled={!canClick}
                className={`flex flex-col items-center ${canClick ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${isActive && !isCompleted ? 'bg-white text-gray-900' : ''}
                    ${!isActive && !isCompleted ? 'bg-white/20 text-white/60' : ''}
                  `}
                >
                  {isCompleted ? '✓' : step.number}
                </div>
                <span
                  className={`mt-2 text-sm ${isActive ? 'text-white' : 'text-white/60'}`}
                >
                  {step.title}
                </span>
              </button>

              {index < steps.length - 1 && (
                <div
                  className={`w-20 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-white/20'}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
