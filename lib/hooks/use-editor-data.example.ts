/**
 * Example usage of useEditorData hook
 * 
 * This hook handles loading project data for the editor, including:
 * - Project metadata
 * - Pages
 * - Panels
 * - Characters
 * 
 * It also provides automatic retry logic and error handling.
 */

import { useEditorData } from "./use-editor-data";
import { useEditorStore } from "@/lib/store/editor-store";

// Example 1: Basic usage with default options
function EditorComponent({ projectId }: { projectId: string }) {
  const { isLoading, error, retry } = useEditorData({
    projectId,
  });

  // Access loaded data from the store
  const project = useEditorStore((state) => state.project);
  const pages = useEditorStore((state) => state.pages);
  const panels = useEditorStore((state) => state.panels);
  const characters = useEditorStore((state) => state.characters);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={retry}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h1>{project?.title}</h1>
      <p>{pages.length} pages</p>
      <p>{panels.length} panels</p>
      <p>{characters.length} characters</p>
    </div>
  );
}

// Example 2: Custom retry configuration
function EditorWithCustomRetry({ projectId }: { projectId: string }) {
  const { isLoading, error, retry, isRetrying, retryCount } = useEditorData({
    projectId,
    autoRetry: true,
    maxRetries: 5, // Try up to 5 times
    retryDelay: 3000, // Wait 3 seconds between retries (with exponential backoff)
  });

  if (isRetrying) {
    return <div>Retrying... (Attempt {retryCount}/5)</div>;
  }

  if (isLoading) {
    return <div>Loading editor data...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Failed after {retryCount} attempts</p>
        <p>Error: {error}</p>
        <button onClick={retry}>Try Again</button>
      </div>
    );
  }

  return <div>Editor loaded successfully!</div>;
}

// Example 3: Disable auto-retry
function EditorWithManualRetry({ projectId }: { projectId: string }) {
  const { isLoading, error, retry } = useEditorData({
    projectId,
    autoRetry: false, // Disable automatic retries
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={retry}>Retry Manually</button>
      </div>
    );
  }

  return <div>Editor ready!</div>;
}

// Example 4: Using with loading overlay
function EditorWithOverlay({ projectId }: { projectId: string }) {
  const { isLoading, error, retry, isRetrying } = useEditorData({
    projectId,
  });

  const project = useEditorStore((state) => state.project);

  return (
    <div className="relative">
      {/* Main content */}
      <div>
        <h1>{project?.title || "Untitled Project"}</h1>
        {/* Editor UI */}
      </div>

      {/* Loading overlay */}
      {(isLoading || isRetrying) && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-4 rounded">
            {isRetrying ? "Retrying..." : "Loading..."}
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-4 rounded">
            <p className="text-red-600">{error}</p>
            <button onClick={retry} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Example 5: Accessing specific data from store
function CharacterList({ projectId }: { projectId: string }) {
  const { isLoading, error } = useEditorData({ projectId });
  
  // Select only the data you need
  const characters = useEditorStore((state) => state.characters);
  const getCharacterByHandle = useEditorStore((state) => state.getCharacterByHandle);

  if (isLoading) return <div>Loading characters...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Characters</h2>
      <ul>
        {characters.map((char) => (
          <li key={char.id}>
            {char.name} ({char.handle})
          </li>
        ))}
      </ul>
      
      {/* Example of using utility method */}
      <button onClick={() => {
        const akira = getCharacterByHandle("@Akira");
        console.log("Found character:", akira);
      }}>
        Find @Akira
      </button>
    </div>
  );
}

export {
  EditorComponent,
  EditorWithCustomRetry,
  EditorWithManualRetry,
  EditorWithOverlay,
  CharacterList,
};
