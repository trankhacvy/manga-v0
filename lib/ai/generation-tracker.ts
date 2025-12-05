// /**
//  * Generation Progress Tracking System
//  * Handles polling, progress updates, and estimated time remaining
//  */

// import type { AIProvider } from "./image-generation";

// export interface GenerationJob {
//   id: string;
//   panelId: string;
//   provider: AIProvider;
//   status: "queued" | "processing" | "complete" | "failed";
//   progress: number; // 0-100
//   startTime: number;
//   estimatedDuration: number; // milliseconds
//   imageUrl?: string;
//   error?: string;
// }

// export interface GenerationTracker {
//   jobs: Map<string, GenerationJob>;
//   activePolling: Map<string, NodeJS.Timeout>;
// }

// // Global tracker instance
// const tracker: GenerationTracker = {
//   jobs: new Map(),
//   activePolling: new Map(),
// };

// /**
//  * Start tracking a generation job
//  */
// export function startTracking(
//   jobId: string,
//   panelId: string,
//   provider: AIProvider,
//   estimatedDuration: number = 8000 // Default 8 seconds
// ): GenerationJob {
//   const job: GenerationJob = {
//     id: jobId,
//     panelId,
//     provider,
//     status: "queued",
//     progress: 0,
//     startTime: Date.now(),
//     estimatedDuration,
//   };

//   tracker.jobs.set(jobId, job);
//   return job;
// }

// /**
//  * Update job progress
//  */
// export function updateProgress(
//   jobId: string,
//   progress: number,
//   status?: "queued" | "processing" | "complete" | "failed"
// ): GenerationJob | null {
//   const job = tracker.jobs.get(jobId);
//   if (!job) return null;

//   job.progress = Math.min(100, Math.max(0, progress));
//   if (status) {
//     job.status = status;
//   }

//   tracker.jobs.set(jobId, job);
//   return job;
// }

// /**
//  * Mark job as complete
//  */
// export function completeJob(
//   jobId: string,
//   imageUrl: string
// ): GenerationJob | null {
//   const job = tracker.jobs.get(jobId);
//   if (!job) return null;

//   job.status = "complete";
//   job.progress = 100;
//   job.imageUrl = imageUrl;

//   tracker.jobs.set(jobId, job);
//   stopPolling(jobId);

//   return job;
// }

// /**
//  * Mark job as failed
//  */
// export function failJob(jobId: string, error: string): GenerationJob | null {
//   const job = tracker.jobs.get(jobId);
//   if (!job) return null;

//   job.status = "failed";
//   job.error = error;

//   tracker.jobs.set(jobId, job);
//   stopPolling(jobId);

//   return job;
// }

// /**
//  * Get job by ID
//  */
// export function getJob(jobId: string): GenerationJob | null {
//   return tracker.jobs.get(jobId) || null;
// }

// /**
//  * Get all active jobs
//  */
// export function getActiveJobs(): GenerationJob[] {
//   return Array.from(tracker.jobs.values()).filter(
//     (job) => job.status === "queued" || job.status === "processing"
//   );
// }

// /**
//  * Calculate estimated time remaining
//  */
// export function getEstimatedTimeRemaining(jobId: string): number {
//   const job = tracker.jobs.get(jobId);
//   if (!job) return 0;

//   if (job.status === "complete" || job.status === "failed") {
//     return 0;
//   }

//   const elapsed = Date.now() - job.startTime;
//   const remaining = job.estimatedDuration - elapsed;

//   return Math.max(0, remaining);
// }

// /**
//  * Calculate progress based on elapsed time
//  */
// export function calculateTimeBasedProgress(jobId: string): number {
//   const job = tracker.jobs.get(jobId);
//   if (!job) return 0;

//   const elapsed = Date.now() - job.startTime;
//   const progress = (elapsed / job.estimatedDuration) * 100;

//   // Cap at 95% until we get actual completion
//   return Math.min(95, progress);
// }

// /**
//  * Start polling for job status
//  */
// export function startPolling(
//   jobId: string,
//   onProgress: (job: GenerationJob) => void,
//   onComplete: (job: GenerationJob) => void,
//   onError: (job: GenerationJob) => void,
//   options: {
//     interval?: number;
//     maxAttempts?: number;
//     useTimeBasedProgress?: boolean;
//   } = {}
// ): void {
//   const {
//     interval = 1000,
//     maxAttempts = 60,
//     useTimeBasedProgress = true,
//   } = options;

//   let attempts = 0;

//   const poll = async () => {
//     attempts++;

//     const job = tracker.jobs.get(jobId);
//     if (!job) {
//       stopPolling(jobId);
//       return;
//     }

//     // Check if max attempts reached
//     if (attempts >= maxAttempts) {
//       failJob(jobId, "Generation timeout - max polling attempts reached");
//       onError(job);
//       stopPolling(jobId);
//       return;
//     }

//     try {
//       // Fetch status from API
//       const response = await fetch(`/api/generation/status/${jobId}`);

//       if (!response.ok) {
//         throw new Error(`Status check failed: ${response.statusText}`);
//       }

//       const status = await response.json();

//       // Update job with API response
//       if (status.status === "complete") {
//         completeJob(jobId, status.imageUrl);
//         onComplete(job);
//         stopPolling(jobId);
//         return;
//       } else if (status.status === "failed") {
//         failJob(jobId, status.error || "Generation failed");
//         onError(job);
//         stopPolling(jobId);
//         return;
//       } else {
//         // Update progress
//         const progress = useTimeBasedProgress
//           ? Math.max(status.progress || 0, calculateTimeBasedProgress(jobId))
//           : status.progress || 0;

//         updateProgress(jobId, progress, status.status);
//         onProgress(job);
//       }
//     } catch (error) {
//       console.error("Polling error:", error);

//       // Use time-based progress as fallback
//       if (useTimeBasedProgress) {
//         const progress = calculateTimeBasedProgress(jobId);
//         updateProgress(jobId, progress, "processing");
//         onProgress(job);
//       }
//     }
//   };

//   // Start polling
//   const intervalId = setInterval(poll, interval);
//   tracker.activePolling.set(jobId, intervalId);

//   // Initial poll
//   poll();
// }

// /**
//  * Stop polling for job status
//  */
// export function stopPolling(jobId: string): void {
//   const intervalId = tracker.activePolling.get(jobId);
//   if (intervalId) {
//     clearInterval(intervalId);
//     tracker.activePolling.delete(jobId);
//   }
// }

// /**
//  * Stop all active polling
//  */
// export function stopAllPolling(): void {
//   tracker.activePolling.forEach((intervalId) => {
//     clearInterval(intervalId);
//   });
//   tracker.activePolling.clear();
// }

// /**
//  * Clean up completed jobs
//  */
// export function cleanupCompletedJobs(olderThan: number = 60000): void {
//   const now = Date.now();

//   tracker.jobs.forEach((job, jobId) => {
//     if (
//       (job.status === "complete" || job.status === "failed") &&
//       now - job.startTime > olderThan
//     ) {
//       tracker.jobs.delete(jobId);
//     }
//   });
// }

// /**
//  * Format time remaining as human-readable string
//  */
// export function formatTimeRemaining(milliseconds: number): string {
//   if (milliseconds <= 0) {
//     return "Completing...";
//   }

//   const seconds = Math.ceil(milliseconds / 1000);

//   if (seconds < 60) {
//     return `${seconds}s remaining`;
//   }

//   const minutes = Math.floor(seconds / 60);
//   const remainingSeconds = seconds % 60;

//   if (remainingSeconds === 0) {
//     return `${minutes}m remaining`;
//   }

//   return `${minutes}m ${remainingSeconds}s remaining`;
// }

// /**
//  * Get progress percentage as string
//  */
// export function formatProgress(progress: number): string {
//   return `${Math.round(progress)}%`;
// }

// /**
//  * Get job status display text
//  */
// export function getStatusText(status: GenerationJob["status"]): string {
//   switch (status) {
//     case "queued":
//       return "Queued";
//     case "processing":
//       return "Generating";
//     case "complete":
//       return "Complete";
//     case "failed":
//       return "Failed";
//     default:
//       return "Unknown";
//   }
// }

// /**
//  * Estimate duration based on panel size and complexity
//  */
// export function estimateGenerationDuration(options: {
//   width: number;
//   height: number;
//   hasIPAdapter?: boolean;
//   hasControlNet?: boolean;
//   hasInpainting?: boolean;
//   model?: string;
// }): number {
//   const {
//     width,
//     height,
//     hasIPAdapter = false,
//     hasControlNet = false,
//     hasInpainting = false,
//     model = "flux-dev",
//   } = options;

//   // Base duration (milliseconds)
//   let duration = 6000; // 6 seconds base

//   // Adjust for resolution
//   const pixels = width * height;
//   if (pixels > 1024 * 1024) {
//     duration += 4000; // +4s for high res
//   } else if (pixels > 768 * 768) {
//     duration += 2000; // +2s for medium-high res
//   }

//   // Adjust for features
//   if (hasIPAdapter) {
//     duration += 1000; // +1s for IP-Adapter
//   }

//   if (hasControlNet) {
//     duration += 1500; // +1.5s for ControlNet
//   }

//   if (hasInpainting) {
//     duration += 1000; // +1s for inpainting
//   }

//   // Adjust for model
//   if (model === "flux-schnell") {
//     duration *= 0.5; // Schnell is 2x faster
//   } else if (model === "flux-manga") {
//     duration *= 1.2; // Custom models may be slower
//   }

//   return duration;
// }

// /**
//  * Create a generation job with automatic tracking
//  */
// export async function trackGeneration(
//   jobId: string,
//   panelId: string,
//   provider: AIProvider,
//   options: {
//     estimatedDuration?: number;
//     onProgress?: (job: GenerationJob) => void;
//     onComplete?: (job: GenerationJob) => void;
//     onError?: (job: GenerationJob) => void;
//     pollInterval?: number;
//     maxAttempts?: number;
//   } = {}
// ): Promise<GenerationJob> {
//   const {
//     estimatedDuration = 8000,
//     onProgress = () => {},
//     onComplete = () => {},
//     onError = () => {},
//     pollInterval = 1000,
//     maxAttempts = 60,
//   } = options;

//   // Start tracking
//   const job = startTracking(jobId, panelId, provider, estimatedDuration);

//   // Start polling
//   startPolling(jobId, onProgress, onComplete, onError, {
//     interval: pollInterval,
//     maxAttempts,
//     useTimeBasedProgress: true,
//   });

//   return job;
// }

// /**
//  * Batch track multiple generations
//  */
// export function trackBatchGeneration(
//   jobs: Array<{
//     jobId: string;
//     panelId: string;
//     provider: AIProvider;
//     estimatedDuration?: number;
//   }>,
//   options: {
//     onProgress?: (completedCount: number, totalCount: number) => void;
//     onComplete?: (results: GenerationJob[]) => void;
//     onError?: (errors: Array<{ jobId: string; error: string }>) => void;
//   } = {}
// ): void {
//   const {
//     onProgress = () => {},
//     onComplete = () => {},
//     onError = () => {},
//   } = options;

//   const results: GenerationJob[] = [];
//   const errors: Array<{ jobId: string; error: string }> = [];
//   let completedCount = 0;

//   jobs.forEach(({ jobId, panelId, provider, estimatedDuration }) => {
//     trackGeneration(jobId, panelId, provider, {
//       estimatedDuration,
//       onProgress: () => {
//         // Individual progress updates
//       },
//       onComplete: (job) => {
//         completedCount++;
//         results.push(job);
//         onProgress(completedCount, jobs.length);

//         if (completedCount === jobs.length) {
//           onComplete(results);
//         }
//       },
//       onError: (job) => {
//         completedCount++;
//         errors.push({ jobId: job.id, error: job.error || "Unknown error" });
//         onProgress(completedCount, jobs.length);

//         if (completedCount === jobs.length) {
//           if (errors.length > 0) {
//             onError(errors);
//           }
//           onComplete(results);
//         }
//       },
//     });
//   });
// }
