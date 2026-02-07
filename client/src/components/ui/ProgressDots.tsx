import { motion } from "framer-motion";

interface ProgressDotsProps {
    currentStep: number;
    totalSteps: number;
}

export function ProgressDots({ currentStep, totalSteps }: ProgressDotsProps) {
    return (
        <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isCompleted = stepNumber < currentStep;

                return (
                    <motion.div
                        key={index}
                        initial={false}
                        animate={{
                            scale: isActive ? 1.2 : 1,
                            backgroundColor: isActive || isCompleted ? "#3B82F6" : "#E5E7EB",
                        }}
                        transition={{ duration: 0.2 }}
                        className="w-2.5 h-2.5 rounded-full"
                    />
                );
            })}
        </div>
    );
}
