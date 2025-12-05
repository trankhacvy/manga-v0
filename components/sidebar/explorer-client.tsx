"use client";

import { useProjectStore } from "@/lib/store/project-store";
import { Explorer } from "./explorer";

interface ExplorerClientProps {
  projectId: string;
}

export function ExplorerClient({ projectId }: ExplorerClientProps) {
  const pages = useProjectStore((state) => state.pages);
  const characters = useProjectStore((state) => state.characters);
  const currentPage = useProjectStore((state) => state.currentPage);
  const setCurrentPage = useProjectStore((state) => state.setCurrentPage);
  const createPage = useProjectStore((state) => state.createPage);
  const reorderPages = useProjectStore((state) => state.reorderPages);

  const handlePageSelect = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (page) {
      setCurrentPage(page);
    }
  };

  const handleCreatePage = async () => {
    try {
      const nextPageNumber = pages.length + 1;
      await createPage(projectId, nextPageNumber);
    } catch (error) {
      console.error("Failed to create page:", error);
    }
  };

  const handleReorderPages = async (reorderedPages: typeof pages) => {
    const pageIds = reorderedPages.map((p) => p.id);
    await reorderPages(pageIds);
  };

  const handleCharacterClick = (character: (typeof characters)[0]) => {
    console.log("Character clicked:", character);
    // TODO: Show character sheet modal
  };

  const handleCreateCharacter = () => {
    console.log("Create character clicked");
    // TODO: Show create character modal
  };

  return (
    <Explorer
      projectId={projectId}
      pages={pages}
      characters={characters}
      currentPageId={currentPage?.id}
      onPageSelect={handlePageSelect}
      onCreatePage={handleCreatePage}
      onReorderPages={handleReorderPages}
      onCharacterClick={handleCharacterClick}
      onCreateCharacter={handleCreateCharacter}
    />
  );
}
