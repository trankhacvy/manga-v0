"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useRealtimeStream } from "@trigger.dev/react-hooks";
import {
  progressStream,
  ProgressStreamSchema,
  type ProgressStreamData,
} from "@/trigger/streams";

interface GenerationProgress {
  status: "queued" | "generating" | "complete" | "failed";
  progress: number;
  currentStep: string;
  stage: string;
  message: string;
}

export default function ProgressPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [streamConfig, setStreamConfig] = useState<{
    runId: string;
    accessToken: string;
    estimatedTime?: number;
  } | null>(null);
  const [progress, setProgress] = useState<GenerationProgress>({
    status: "queued",
    progress: 0,
    currentStep: "Initializing...",
    stage: "analyzing",
    message: "Starting manga generation...",
  });
  const [useFallback, setUseFallback] = useState(false);

  // Load stream config from sessionStorage
  useEffect(() => {
    if (!projectId) return;

    const stored = sessionStorage.getItem(`manga-generation-${projectId}`);
    if (stored) {
      try {
        const config = JSON.parse(stored);
        setStreamConfig(config);
      } catch (err) {
        console.error("Failed to parse stream config:", err);
        setUseFallback(true);
      }
    } else {
      // No stream config, use fallback polling
      setUseFallback(true);
    }
  }, [projectId]);

  // Use real-time stream (only when we have valid config)
  const { parts: streamParts, error: streamError } = useRealtimeStream(
    progressStream,
    streamConfig?.runId || "",
    {
      accessToken: streamConfig?.accessToken || "",
      timeoutInSeconds: 600, // 10 minutes
      enabled: !!streamConfig && !useFallback,
    }
  );

  // Process stream updates
  useEffect(() => {
    if (!streamParts || streamParts.length === 0) return;

    // Get the latest update (stream sends JSON strings)
    const latestUpdate = streamParts[streamParts.length - 1];

    try {
      // Parse the JSON string
      const parsed = JSON.parse(latestUpdate);

      // Validate with Zod schema
      const validationResult = ProgressStreamSchema.safeParse(parsed);

      if (!validationResult.success) {
        console.error("Invalid stream data:", validationResult.error);
        return;
      }

      const update: ProgressStreamData = validationResult.data;

      setProgress((prev) => ({
        ...prev,
        status: update.stage === "complete" ? "complete" : "generating",
        progress: update.progress,
        currentStep: update.message,
        stage: update.stage,
        message: update.message,
      }));

      // Auto-redirect when complete
      if (update.stage === "complete" && update.progress === 100) {
        setTimeout(() => {
          router.push(`/quick-start/preview/${projectId}`);
        }, 1000);
      }
    } catch (e) {
      console.error("Failed to parse stream update:", latestUpdate, e);
    }
  }, [streamParts, projectId, router]);

  // Handle stream errors - fall back to polling
  useEffect(() => {
    if (streamError) {
      console.error("Stream error, falling back to polling:", streamError);
      setUseFallback(true);
    }
  }, [streamError]);

  // Fallback polling (if stream fails or not available)
  // useEffect(() => {
  //   if (!useFallback || !projectId) return;

  //   const pollInterval = setInterval(async () => {
  //     try {
  //       const response = await fetch(`/api/quick-start/progress/${projectId}`);

  //       if (!response.ok) {
  //         throw new Error("Failed to fetch progress");
  //       }

  //       const data: GenerationProgress = await response.json();
  //       setProgress(data);

  //       // Auto-redirect when complete
  //       if (data.status === "complete") {
  //         clearInterval(pollInterval);
  //         setTimeout(() => {
  //           router.push(`/quick-start/preview/${projectId}`);
  //         }, 1000);
  //       }

  //       // Handle failure
  //       if (data.status === "failed") {
  //         clearInterval(pollInterval);
  //         setError("Generation failed. Please try again.");
  //       }
  //     } catch (err) {
  //       console.error("Progress polling error:", err);
  //       setError(
  //         err instanceof Error ? err.message : "Failed to fetch progress"
  //       );
  //     }
  //   }, 2500);

  //   return () => clearInterval(pollInterval);
  // }, [useFallback, projectId, router]);

  // Function to fetch progress data from API
  const fetchProgressData = async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/quick-start/progress/${projectId}`);
      if (response.ok) {
        const data: GenerationProgress = await response.json();
        setProgress((prev) => ({
          ...prev,
          ...data,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch progress data:", err);
    }
  };

  // Fetch initial state from database
  useEffect(() => {
    fetchProgressData();
  }, [projectId]);

  // Poll for data updates every 5 seconds (to update cards)
  // useEffect(() => {
  //   if (!projectId || progress.status === "complete") return;

  //   const pollInterval = setInterval(fetchProgressData, 5000);
  //   return () => clearInterval(pollInterval);
  // }, [projectId, progress.status]);

  // Helper function to determine step status
  const getStepStatus = (stepProgress: number) => {
    if (progress.progress >= stepProgress) return "complete";
    if (progress.progress >= stepProgress - 15) return "active";
    return "pending";
  };

  // Define steps based on the pipeline
  const steps = [
    {
      title: "Foundation",
      description: "Analyzing story & establishing style",
      icon: "auto_stories",
      progressThreshold: 15,
    },
    {
      title: "Script & Characters",
      description: "Writing script & designing characters",
      icon: "edit_note",
      progressThreshold: 50,
    },
    {
      title: "Panel Generation",
      description: "Creating manga panels",
      icon: "grid_view",
      progressThreshold: 90,
    },
    {
      title: "Finalizing",
      description: "Adding dialogue & finishing touches",
      icon: "check_circle",
      progressThreshold: 100,
    },
  ];

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-4xl flex-col items-center gap-8 py-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold leading-tight tracking-tight">
            Generating Your Manga...
          </h1>
          <p className="mt-2 text-base font-normal leading-normal text-muted-foreground">
            This may take a few minutes. Sit back and relax!
          </p>
        </div>

        {/* Progress Bar and Timeline */}
        <div className="flex w-full flex-col items-center gap-8 md:flex-row md:items-start">
          {/* Left: Progress and Steps */}
          <div className="w-full max-w-[500px] flex-1">
            {/* Overall Progress */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Overall Progress</p>
                <p className="text-sm font-normal">
                  {Math.round(progress.progress)}%
                </p>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progress.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Timeline Steps */}
            <div className="mt-8 grid grid-cols-[auto_1fr] gap-x-4">
              {steps.map((step, index) => {
                const status = getStepStatus(step.progressThreshold);
                const isLast = index === steps.length - 1;

                return (
                  <div key={step.title} className="contents">
                    {/* Icon Column */}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                          status === "complete"
                            ? "bg-primary/20"
                            : status === "active"
                            ? "border-2 border-primary bg-transparent"
                            : "border border-border"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-xl transition-all duration-300 ${
                            status === "complete"
                              ? "text-primary"
                              : status === "active"
                              ? "text-primary animate-spin"
                              : "text-muted-foreground"
                          }`}
                        >
                          {status === "complete"
                            ? "check_circle"
                            : status === "active"
                            ? "progress_activity"
                            : step.icon}
                        </span>
                      </div>
                      {!isLast && <div className="w-px grow bg-border"></div>}
                    </div>

                    {/* Content Column */}
                    <div
                      className={`flex flex-col ${!isLast ? "pb-8" : ""} pt-1`}
                    >
                      <p
                        className={`text-base font-medium leading-normal ${
                          status === "pending"
                            ? "text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {step.title}
                      </p>
                      <p
                        className={`text-sm font-normal leading-normal ${
                          status === "active"
                            ? "text-primary"
                            : status === "complete"
                            ? "text-muted-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {status === "complete"
                          ? "Complete"
                          : status === "active"
                          ? progress.message || "In Progress"
                          : "Pending"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Animated Preview */}
          <div className="w-full md:w-1/2">
            <div className="grid aspect-2/3 w-full max-w-sm grid-cols-2 grid-rows-3 gap-2">
              {/* Top panel - wide */}
              <div
                className="col-span-2 row-span-1 rounded-lg bg-center bg-no-repeat bg-cover animate-fade-in"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&h=400&fit=crop')`,
                  animationDelay: "0.2s",
                  opacity: 0,
                  animation: "fadeIn 0.8s ease-in forwards 0.2s",
                }}
              />

              {/* Bottom left panel - tall */}
              <div
                className="col-span-1 row-span-2 rounded-lg bg-center bg-no-repeat bg-cover animate-fade-in"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&h=800&fit=crop')`,
                  animationDelay: "0.4s",
                  opacity: 0,
                  animation: "fadeIn 0.8s ease-in forwards 0.4s",
                }}
              />

              {/* Bottom right panel - tall */}
              <div
                className="col-span-1 row-span-2 rounded-lg bg-center bg-no-repeat bg-cover animate-fade-in"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=800&fit=crop')`,
                  animationDelay: "0.6s",
                  opacity: 0,
                  animation: "fadeIn 0.8s ease-in forwards 0.6s",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Button */}
      <div className="absolute bottom-6 left-6">
        <Button
          variant="outline"
          onClick={() => router.push("/quick-start")}
          className="border-primary text-primary hover:bg-primary/10"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
