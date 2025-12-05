import useSWR from "swr";
import { fetcher } from "@/utils/api/fetcher";
import type { ProjectModel } from "@/types/models";

interface ProjectsResponse {
  projects: ProjectModel[];
}

export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<ProjectsResponse>(
    "/api/projects",
    fetcher
  );

  return {
    projects: data?.projects || [],
    isLoading,
    isError: !!error,
    error: error?.message,
    mutate,
  };
}
