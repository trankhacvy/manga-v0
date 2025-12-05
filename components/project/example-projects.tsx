"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exampleProjects } from "@/lib/example-projects";
import { toast } from "sonner";

export function ExampleProjects() {
  const router = useRouter();
  const [cloningId, setCloningId] = useState<string | null>(null);

  const handleClone = async (exampleId: string) => {
    try {
      setCloningId(exampleId);

      const response = await fetch("/api/projects/clone-example", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ exampleId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to clone project");
      }

      toast.success("Example project cloned successfully!");
      router.push(`/projects`);
      router.refresh();
    } catch (error) {
      console.error("Error cloning project:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to clone project"
      );
    } finally {
      setCloningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Example Projects</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exampleProjects.map((example) => (
          <div
            key={example.id}
            className="border border-border rounded-lg overflow-hidden bg-card hover:border-primary/50 transition-colors"
          >
            {/* Thumbnail placeholder */}
            <div className="h-40 bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <div className="text-center p-4">
                <div className="text-4xl mb-2">
                  {example.style === "shonen" && "⚔️"}
                  {example.style === "shojo" && "🌸"}
                  {example.style === "chibi" && "😊"}
                  {example.style === "webtoon" && "📱"}
                  {example.style === "american" && "💥"}
                  {example.style === "noir" && "🎩"}
                </div>
                <div className="text-xs font-medium text-muted-foreground uppercase">
                  {example.style}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-lg mb-1">{example.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {example.genre}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {example.synopsis}
                </p>
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-3">
                  {example.description}
                </p>
                <Button
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => handleClone(example.id)}
                  disabled={cloningId === example.id}
                >
                  <Copy className="h-4 w-4" />
                  {cloningId === example.id ? "Cloning..." : "Clone Project"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          Clone an example project to get started quickly. You can customize it
          however you like!
        </p>
      </div>
    </div>
  );
}
