import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  label: string;
  status: "completed" | "active" | "upcoming";
}

interface ProgressStepsProps {
  steps: Step[];
}

export function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                  step.status === "completed" && "bg-success text-success-foreground",
                  step.status === "active" && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  step.status === "upcoming" && "bg-muted text-muted-foreground"
                )}
              >
                {step.status === "completed" ? (
                  <Check className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center",
                  step.status === "active" && "text-foreground",
                  step.status !== "active" && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-1 mx-2 rounded-full transition-colors",
                  step.status === "completed" && "bg-success",
                  step.status !== "completed" && "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}