"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Filter, SortAsc, Grid3x3 } from "lucide-react";
import { ProjectCard } from "./project-card";
import { useProjects } from "@/hooks/useProjects";

export function ProjectList() {
  const router = useRouter();
  const { projects, isLoading, isError } = useProjects();

  const handleCreateProject = () => {
    router.push("/quick-start");
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/editor/${projectId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load projects</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Get recent projects (last 4)
  const recentProjects = projects.slice(0, 4);

  return (
    <div className="px-5 pt-25">
      {/* Recent Projects Section */}
      {recentProjects.length > 0 && (
        <section className="mb-10">
          <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3">
            Recent Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-x-auto gap-6 px-4 pb-4">
            {recentProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project.id)}
                // formatDate={formatDate}
                // getStyleLabel={getStyleLabel}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Projects Section */}
      <section>
        <div className="flex justify-between items-center gap-2 px-4 py-3">
          <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
            All Projects
          </h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:bg-slate-800"
            >
              <Filter className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:bg-slate-800"
            >
              <SortAsc className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:bg-slate-800"
            >
              <Grid3x3 className="size-5" />
            </Button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/30 p-12 text-center min-h-[350px] transition-colors hover:border-primary hover:bg-primary/10 mx-4">
            <div className="mb-4 text-primary">
              <Plus className="size-12" />
            </div>
            <h3 className="text-white font-semibold text-lg">
              Create New Manga
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Start a new project and bring your story to life.
            </p>
            <Button
              onClick={handleCreateProject}
              className="mt-6 bg-primary hover:bg-primary/90"
            >
              <Plus className="size-4 mr-2" />
              New Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Empty State Card */}
            <div
              onClick={handleCreateProject}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/30 p-8 text-center min-h-[350px] transition-colors hover:border-primary hover:bg-primary/10 cursor-pointer"
            >
              <div className="mb-4 text-primary">
                <Plus className="size-12" />
              </div>
              <h3 className="text-white font-semibold">Create New Manga</h3>
              <p className="text-slate-400 text-sm mt-1">
                Start a new project and bring your story to life.
              </p>
              <Button className="mt-6 bg-primary hover:bg-primary/90">
                <Plus className="size-4 mr-2" />
                New Project
              </Button>
            </div>

            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project.id)}
                // formatDate={formatDate}
                // getStyleLabel={getStyleLabel}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
