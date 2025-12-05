"use client";

import { useState, useEffect } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { CharacterCard } from "@/components/character/character-card";
import { CharacterSheet } from "@/components/character/character-sheet";
import { CreateCharacterForm } from "@/components/character/create-character-form";
import { Plus, Loader2 } from "lucide-react";
import type { Character } from "@/types";
import { createClient } from "@/utils/supabase/client";

interface CharactersTabProps {
  projectId: string;
}

export function CharactersTab({ projectId }: CharactersTabProps) {
  const characters = useProjectStore((state) => state.characters);
  const loadCharacters = useProjectStore((state) => state.loadCharacters);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);

  // Load characters on mount
  useEffect(() => {
    loadCharacters(projectId);
  }, [projectId, loadCharacters]);

  const handleCreateCharacter = async (data: {
    name: string;
    handle: string;
    description: string;
    method: "description" | "reference-image";
    referenceImage?: File;
  }) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("name", data.name);
      formData.append("handle", data.handle);
      formData.append("description", data.description);
      formData.append("method", data.method);

      if (data.referenceImage) {
        formData.append("referenceImage", data.referenceImage);
      }

      const response = await fetch("/api/characters/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create character");
      }

      const result = await response.json();
      console.log("Character created:", result);

      // Reload characters
      await loadCharacters(projectId);

      // Close form
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create character:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create character. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacter(character);
    setShowCharacterSheet(true);
  };

  const handleCharacterDragStart = (character: Character) => {
    console.log("Character drag started:", character.handle);
    // The drag data is already set in CharacterCard component
  };

  const handleRegenerateCharacter = async (characterId: string) => {
    try {
      const response = await fetch(
        `/api/characters/${characterId}/regenerate`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to regenerate character");
      }

      // Reload characters
      await loadCharacters(projectId);
    } catch (error) {
      console.error("Failed to regenerate character:", error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold">Characters</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage characters with @handles for consistent appearance
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Character</span>
        </button>
      </div>

      {/* Character Grid */}
      <div className="flex-1 overflow-auto p-6">
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">No characters yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first character to get started
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Character</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onDragStart={handleCharacterDragStart}
                onClick={handleCharacterClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="px-6 py-3 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Tips:</span> Drag characters onto the
          canvas to insert their @handle into prompts. Click a character to view
          their full reference sheet with turnaround views and expressions.
        </p>
      </div>

      {/* Create Character Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create Character</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                disabled={isLoading}
                className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <CreateCharacterForm
                projectId={projectId}
                onSubmit={handleCreateCharacter}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Character Sheet Modal */}
      {showCharacterSheet && selectedCharacter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <CharacterSheet
            character={selectedCharacter}
            onRegenerate={handleRegenerateCharacter}
            onClose={() => {
              setShowCharacterSheet(false);
              setSelectedCharacter(null);
            }}
          />
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg shadow-xl p-6 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Creating character...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
