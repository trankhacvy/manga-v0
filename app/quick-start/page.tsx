"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { StyleType } from "@/types";
import { H1 } from "@/components/ui/typography";

const GENRE_OPTIONS = [
  "Action",
  "Romance",
  "Comedy",
  "Drama",
  "Fantasy",
  "Sci-Fi",
  "Horror",
  "Mystery",
  "Slice of Life",
];

const ART_STYLE_OPTIONS: {
  value: StyleType;
  label: string;
  image: string;
  description: string;
}[] = [
  {
    value: "shonen",
    label: "Classic Shonen",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBME-zl_BA8MJBr4QTDPjnMvJoEV000DwzsZbapPcd34On-7INJRoWp2BOHVCDRWDg_JK9OUC8XTtM30URvpLrKfCSd9FIovJHd6hi_BiisNOZN8gOAzvQ-2TU5N1XYWdviSimOpaN2prit1nukHgygXp9l-AJOecCR0PLfmP8v9heECpbEVNJfN9sMIbf_AvmpBJri8S_OH6AjF_96avhlpHp7IqZZrR9DoU_0RIUEyOIYJHFEZZGvVzQkbMFZtjxEZ1mI5dhDv8KG",
    description:
      "Dynamic anime action scene with strong lines and vibrant colors.",
  },
  {
    value: "shojo",
    label: "Delicate Shojo",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBjn777tG0GwByYmVFu438zf_8kEt3m1ssOiNK1fD6HowRNo8zfeeK4lA9rrL8iOQkMHt3CNoHPM-kwcsdY8COk66tyOq-pNWdolTnUv_kiZS1X4HpsOu3gV_CzD0e5VjgYYStezcpBgfPKkP8BrZwRsQ59EZc50MyRbpQrjCKAolgaLJLwrGonQHSLPh60fSKRCnR6WvsF2wlrO6T2TAn5C_8A2mcUk4Cg9U8JHqTiOx87DmMRh1uE8ZJfyzxwp9WPAzn119wPFCLu",
    description:
      "Soft, expressive character art with pastel colors and detailed eyes.",
  },
  {
    value: "noir",
    label: "Ink Wash",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDlqb8zYJwRRB-8BAit1HhyuH1ISQwRn5od1MK3kO7Z6ZXRoD7gZE_CSvoDwdZvmBzVEhYRaLf5AKpfGDTunii10Ccpzj_STQK84ZrQqSzPSuAqFBsKA81wSuAEaa2A1iDCtXElSXeGG26BoYp6pungDJB14bw99VHQ__XP2a50mGG60_8VrWGYhcFsAshvAOp9NQHD7EU8UaEI5GBUw50Bd_ejdhuUm0EnBJvZpPriFHZKE6_Q41y1qlFF_Np9mVXTX1vjOWe_3SCe",
    description:
      "Traditional Japanese ink wash painting style, monochrome and atmospheric.",
  },
  {
    value: "cyberpunk",
    label: "Cyberpunk",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAshKTT4MqC2YK9SrxKYCAl8YuAucehaUwDtCP8LcCA-J_QCmvyPmKuGK6XAZLEi4f_CFGkg66LkU1ldEqbl7hWfqvUuyr-yqshzCqyTXVCFQI9_V4CyvhUNOI7B6ouCPUbitX4juO-NGtOcRNE30l5ssyaK3Um7Bu-v3SR76BL2TkSMWZln8LvQRikHFw9T0DUMAIjL3y2_yOsmj5IxvJd6HE3X6E3bDnNAgFdz1RhMr2pv4BnKwnMcaYK5z0DRrNmAQ80F4TIVyH-",
    description:
      "Neon-lit futuristic cityscape with cyborgs and advanced technology.",
  },
  {
    value: "seinen",
    label: "Seinen",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBME-zl_BA8MJBr4QTDPjnMvJoEV000DwzsZbapPcd34On-7INJRoWp2BOHVCDRWDg_JK9OUC8XTtM30URvpLrKfCSd9FIovJHd6hi_BiisNOZN8gOAzvQ-2TU5N1XYWdviSimOpaN2prit1nukHgygXp9l-AJOecCR0PLfmP8v9heECpbEVNJfN9sMIbf_AvmpBJri8S_OH6AjF_96avhlpHp7IqZZrR9DoU_0RIUEyOIYJHFEZZGvVzQkbMFZtjxEZ1mI5dhDv8KG",
    description:
      "Mature storytelling with complex characters and realistic art.",
  },
  {
    value: "webtoon",
    label: "Webtoon",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBjn777tG0GwByYmVFu438zf_8kEt3m1ssOiNK1fD6HowRNo8zfeeK4lA9rrL8iOQkMHt3CNoHPM-kwcsdY8COk66tyOq-pNWdolTnUv_kiZS1X4HpsOu3gV_CzD0e5VjgYYStezcpBgfPKkP8BrZwRsQ59EZc50MyRbpQrjCKAolgaLJLwrGonQHSLPh60fSKRCnR6WvsF2wlrO6T2TAn5C_8A2mcUk4Cg9U8JHqTiOx87DmMRh1uE8ZJfyzxwp9WPAzn119wPFCLu",
    description: "Vertical scrolling format optimized for mobile viewing.",
  },
  {
    value: "american",
    label: "American Comic",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAshKTT4MqC2YK9SrxKYCAl8YuAucehaUwDtCP8LcCA-J_QCmvyPmKuGK6XAZLEi4f_CFGkg66LkU1ldEqbl7hWfqvUuyr-yqshzCqyTXVCFQI9_V4CyvhUNOI7B6ouCPUbitX4juO-NGtOcRNE30l5ssyaK3Um7Bu-v3SR76BL2TkSMWZln8LvQRikHFw9T0DUMAIjL3y2_yOsmj5IxvJd6HE3X6E3bDnNAgFdz1RhMr2pv4BnKwnMcaYK5z0DRrNmAQ80F4TIVyH-",
    description: "Bold lines and vibrant colors typical of Western comics.",
  },
  {
    value: "chibi",
    label: "Chibi",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBjn777tG0GwByYmVFu438zf_8kEt3m1ssOiNK1fD6HowRNo8zfeeK4lA9rrL8iOQkMHt3CNoHPM-kwcsdY8COk66tyOq-pNWdolTnUv_kiZS1X4HpsOu3gV_CzD0e5VjgYYStezcpBgfPKkP8BrZwRsQ59EZc50MyRbpQrjCKAolgaLJLwrGonQHSLPh60fSKRCnR6WvsF2wlrO6T2TAn5C_8A2mcUk4Cg9U8JHqTiOx87DmMRh1uE8ZJfyzxwp9WPAzn119wPFCLu",
    description:
      "Cute, super-deformed characters with exaggerated proportions.",
  },
  {
    value: "ghibli",
    label: "Ghibli",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDlqb8zYJwRRB-8BAit1HhyuH1ISQwRn5od1MK3kO7Z6ZXRoD7gZE_CSvoDwdZvmBzVEhYRaLf5AKpfGDTunii10Ccpzj_STQK84ZrQqSzPSuAqFBsKA81wSuAEaa2A1iDCtXElSXeGG26BoYp6pungDJB14bw99VHQ__XP2a50mGG60_8VrWGYhcFsAshvAOp9NQHD7EU8UaEI5GBUw50Bd_ejdhuUm0EnBJvZpPriFHZKE6_Q41y1qlFF_Np9mVXTX1vjOWe_3SCe",
    description: "Whimsical, detailed animation style with magical elements.",
  },
  {
    value: "marvel",
    label: "Marvel",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAshKTT4MqC2YK9SrxKYCAl8YuAucehaUwDtCP8LcCA-J_QCmvyPmKuGK6XAZLEi4f_CFGkg66LkU1ldEqbl7hWfqvUuyr-yqshzCqyTXVCFQI9_V4CyvhUNOI7B6ouCPUbitX4juO-NGtOcRNE30l5ssyaK3Um7Bu-v3SR76BL2TkSMWZln8LvQRikHFw9T0DUMAIjL3y2_yOsmj5IxvJd6HE3X6E3bDnNAgFdz1RhMr2pv4BnKwnMcaYK5z0DRrNmAQ80F4TIVyH-",
    description: "Superhero action with dynamic poses and dramatic lighting.",
  },
  {
    value: "manga-classic",
    label: "Manga Classic",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBME-zl_BA8MJBr4QTDPjnMvJoEV000DwzsZbapPcd34On-7INJRoWp2BOHVCDRWDg_JK9OUC8XTtM30URvpLrKfCSd9FIovJHd6hi_BiisNOZN8gOAzvQ-2TU5N1XYWdviSimOpaN2prit1nukHgygXp9l-AJOecCR0PLfmP8v9heECpbEVNJfN9sMIbf_AvmpBJri8S_OH6AjF_96avhlpHp7IqZZrR9DoU_0RIUEyOIYJHFEZZGvVzQkbMFZtjxEZ1mI5dhDv8KG",
    description: "Traditional manga style with ink and screentone techniques.",
  },
  {
    value: "anime-cel",
    label: "Anime Cel",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBjn777tG0GwByYmVFu438zf_8kEt3m1ssOiNK1fD6HowRNo8zfeeK4lA9rrL8iOQkMHt3CNoHPM-kwcsdY8COk66tyOq-pNWdolTnUv_kiZS1X4HpsOu3gV_CzD0e5VjgYYStezcpBgfPKkP8BrZwRsQ59EZc50MyRbpQrjCKAolgaLJLwrGonQHSLPh60fSKRCnR6WvsF2wlrO6T2TAn5C_8A2mcUk4Cg9U8JHqTiOx87DmMRh1uE8ZJfyzxwp9WPAzn119wPFCLu",
    description:
      "Flat colors and bold outlines typical of anime cel animation.",
  },
];

const PAGE_COUNT_OPTIONS = [1, 10];

const formSchema = z.object({
  storyDescription: z
    .string()
    .min(1, "Story description is required")
    .refine((val) => {
      const wordCount = val.trim().split(/\s+/).filter(Boolean).length;
      return wordCount <= 3000;
    }, "Story must be 3000 words or less"),
  genre: z.string().optional(),
  artStyle: z.enum([
    "shonen",
    "shojo",
    "seinen",
    "webtoon",
    "american",
    "noir",
    "chibi",
    "ghibli",
    "cyberpunk",
    "marvel",
    "manga-classic",
    "anime-cel",
  ]),
  pageCount: z.number().int().positive(),
});

type FormValues = z.infer<typeof formSchema>;

export default function QuickStartPage() {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storyDescription:
        "Once upon a time in a distant galaxy, a lone hero discovered a power that could change the fate of the universe...",
      genre: "",
      artStyle: "shonen",
      pageCount: 1,
    },
  });

  const wordCount = form
    .watch("storyDescription")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const onSubmit = async (values: FormValues) => {
    try {
      console.log(values);

      const response = await fetch("/api/quick-start/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate manga");
      }

      const result = await response.json();

      // Store access token and estimated time in sessionStorage for the progress page
      if (result.accessToken && result.runId) {
        sessionStorage.setItem(
          `manga-generation-${result.projectId}`,
          JSON.stringify({
            runId: result.runId,
            accessToken: result.accessToken,
            estimatedTime: result.estimatedTime || 180,
          })
        );
      }

      // Redirect to progress page
      router.push(`/quick-start/progress/${result.projectId}`);
    } catch (err) {
      console.error("Generation error:", err);
      form.setError("root", {
        message:
          err instanceof Error ? err.message : "Failed to generate manga",
      });
    }
  };

  return (
    <div className="flex flex-1 justify-center px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40 py-10 sm:py-16 md:py-20">
      <div className="layout-content-container flex flex-col w-full max-w-[960px] flex-1">
        <main className="flex flex-col items-center flex-1 px-4">
          <div className="flex flex-col w-full items-center text-center gap-4">
            <H1>Start Your Next Manga</H1>
            <p className="text-muted-foreground text-base sm:text-lg font-normal leading-normal">
              Tell us your story, and let AI bring it to life!
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full max-w-3xl mt-10 sm:mt-12 space-y-6"
            >
              {/* Story Input */}
              <FormField
                control={form.control}
                name="storyDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Story</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A young sorcerer discovers a hidden power while protecting their village from a mythical beast..."
                        className="min-h-60 resize-y"
                        disabled={form.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-end items-center">
                      {/* <FormDescription>
                        <a
                          className="text-primary hover:underline"
                          href="#"
                          onClick={(e) => e.preventDefault()}
                        >
                          Need help writing a prompt?
                        </a>
                      </FormDescription> */}
                      <p
                        className={`text-sm font-normal leading-normal ${
                          wordCount > 3000
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {wordCount} / 3000 words
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Genre Selection */}
              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre (Optional)</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {GENRE_OPTIONS.map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() =>
                              field.onChange(field.value === g ? "" : g)
                            }
                            disabled={form.formState.isSubmitting}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              field.value === g
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            } disabled:opacity-50`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Art Style Selection */}
              <FormField
                control={form.control}
                name="artStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Art Style</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {ART_STYLE_OPTIONS.map((style) => (
                          <button
                            key={style.value}
                            type="button"
                            onClick={() => field.onChange(style.value)}
                            disabled={form.formState.isSubmitting}
                            className={`group relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg transition-all ${
                              field.value === style.value
                                ? "ring-4 ring-primary shadow-lg"
                                : "ring-2 ring-transparent hover:ring-2 hover:ring-primary/50"
                            } disabled:opacity-50`}
                          >
                            <img
                              src={style.image}
                              alt={style.description}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                            <span className="absolute bottom-2 left-3 text-sm font-semibold text-white">
                              {style.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Page Count Selection */}
              <FormField
                control={form.control}
                name="pageCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Pages</FormLabel>
                    <FormControl>
                      <Progress
                        isSlider
                        min={Math.min(...PAGE_COUNT_OPTIONS)}
                        max={Math.max(...PAGE_COUNT_OPTIONS)}
                        value={field.value}
                        onChange={field.onChange}
                        showLabel
                        // disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Root Error Message */}
              {form.formState.errors.root && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">
                    {form.formState.errors.root.message}
                  </p>
                </div>
              )}

              {/* Generate Button */}
              <div className="w-full max-w-xs mx-auto pt-4">
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full h-12 text-base font-bold"
                  size="lg"
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    "Generate Manga"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </main>
      </div>
    </div>
  );
}
