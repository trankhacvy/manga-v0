"use client";

import { useEffect, useState } from "react";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TutorialStep {
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  position: "center" | "left" | "right" | "top" | "bottom";
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Manga IDE! 🎨",
    description:
      "An AI-first creative environment for manga and comics. Think of it as 'Cursor for manga' - the canvas is always center-stage, and AI is just one keystroke away. Let's take a quick tour!",
    position: "center",
  },
  {
    title: "Left Sidebar - Project Navigator",
    description:
      "Browse your Pages, Script, and Characters here. This is your project's file explorer. Click on pages to view them, or drag characters onto the canvas.",
    target: "aside:first-of-type",
    position: "right",
  },
  {
    title: "Canvas - Your Main Workspace",
    description:
      "This is where the magic happens! Select panels by clicking, drag to move them, resize with handles. Multi-select with Shift+Click or drag-to-select for batch operations.",
    target: "main",
    position: "center",
  },
  {
    title: "Right Sidebar - Context Panels",
    description:
      "Switch between Layers, Properties, History, and AI Chat. The History panel shows all versions of each panel - you can restore any previous generation!",
    target: "aside:last-of-type",
    position: "left",
  },
  {
    title: "Global Prompt Bar (Cmd+K)",
    description:
      "The heart of the IDE! Type prompts here to generate or edit panels. Use @handles to reference characters (e.g., '@Akira running'). Press Enter to generate, Shift+Enter for new line.",
    target: ".h-24",
    position: "top",
  },
  {
    title: "Character @Handles",
    description:
      "Create characters in the Characters tab. Each gets a unique @handle (like @Akira). Type @ in any prompt to autocomplete and insert character references for perfect consistency.",
    position: "center",
  },
  {
    title: "Quick Actions",
    description:
      "Use the buttons next to the prompt bar for quick operations: Generate, Vary (create variations), Inpaint (regenerate regions), Upscale, and Style-Lock.",
    position: "center",
  },
  {
    title: "Keyboard Shortcuts",
    description:
      "Press '?' anytime to see all shortcuts. Key ones: Cmd+K (focus prompt), Arrow keys (navigate panels), Delete (remove panels), Esc (deselect).",
    position: "center",
  },
  {
    title: "Ready to Create! 🚀",
    description:
      "You're all set! Start by selecting a panel and typing a prompt, or create a new character in the Characters tab. The AI will maintain consistency across all your panels. Have fun!",
    position: "center",
  },
];

export function OnboardingTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true);

  useEffect(() => {
    // Check if user has seen the tutorial
    const seen = localStorage.getItem("manga-ide-tutorial-seen");
    if (!seen) {
      setHasSeenTutorial(false);
      // Show tutorial after a short delay
      setTimeout(() => setIsOpen(true), 500);
    }

    // Listen for custom event to restart tutorial
    const handleRestartTutorial = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };

    window.addEventListener("restart-tutorial", handleRestartTutorial);
    return () =>
      window.removeEventListener("restart-tutorial", handleRestartTutorial);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("manga-ide-tutorial-seen", "true");
    setHasSeenTutorial(true);
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!isOpen) return null;

  const step = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  // Calculate position for the tooltip
  const getTooltipPosition = () => {
    if (step.position === "center" || !step.target) {
      return "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
    }
    // For other positions, we'll use fixed positioning with appropriate classes
    return "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />

      {/* Highlight target element */}
      {step.target && (
        <style jsx global>{`
          ${step.target} {
            position: relative;
            z-index: 51;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5),
              0 0 0 9999px rgba(0, 0, 0, 0.7);
          }
        `}</style>
      )}

      {/* Tutorial Card */}
      <div className={`${getTooltipPosition()} z-52 w-full max-w-md`}>
        <div className="bg-card border-2 border-primary rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary/10 p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Step {currentStep + 1} of {tutorialSteps.length}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Footer */}
          <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between">
            <div className="flex gap-1">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    index === currentStep
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <Button size="sm" onClick={handleNext} className="gap-2">
                {isLastStep ? "Get Started" : "Next"}
                {!isLastStep && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
