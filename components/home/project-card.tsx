"use client";

import { ProjectModel, StyleType } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

// Project Card Component
export function ProjectCard({
  project,
  onClick,
}: // formatDate,
// getStyleLabel,
{
  project: ProjectModel;
  onClick: () => void;
  // formatDate: (date: string | Date) => string;
  // getStyleLabel: (style: StyleType) => string;
}) {
  return (
    <Card onClick={onClick} className="p-2! overflow-hidden gap-0">
      {/* Image Container */}
      <div
        className="w-full aspect-square bg-center bg-cover rounded-lg overflow-hidden mb-2"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(100, 100, 100, 0.3), rgba(150, 150, 150, 0.3))`,
          backgroundColor: "#f0f0f0",
        }}
      >
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-300 text-6xl font-bold">
              {project.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Content Container */}
      <CardContent className="flex flex-col gap-1 p-3!">
        <h3 className="text-lg font-semibold truncate">{project.title}</h3>
        <p className="text-sm text-muted-foreground">
          {project.genre || "Untitled Folder"}
        </p>
      </CardContent>
    </Card>
  );
}
