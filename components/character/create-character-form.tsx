"use client";

import { useState } from "react";

type CreationMethod = "description" | "reference-image";

interface CreateCharacterFormProps {
  projectId: string;
  onSubmit: (data: {
    name: string;
    handle: string;
    description: string;
    method: CreationMethod;
    referenceImage?: File;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function CreateCharacterForm({
  projectId,
  onSubmit,
  onCancel,
}: CreateCharacterFormProps) {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState<CreationMethod>("description");
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate handle from name
  const handleNameChange = (newName: string) => {
    setName(newName);
    // Auto-generate handle if not manually edited
    if (!handle || handle === generateHandle(name)) {
      setHandle(generateHandle(newName));
    }
  };

  const generateHandle = (name: string): string => {
    // Convert name to handle format: @Name -> @name (lowercase, alphanumeric only)
    const cleaned = name.replace(/[^a-zA-Z0-9]/g, "");
    return cleaned ? `@${cleaned}` : "";
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setReferenceImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter a character name");
      return;
    }

    if (!handle.trim() || !handle.startsWith("@")) {
      alert("Please enter a valid @handle (e.g., @Akira)");
      return;
    }

    if (method === "description" && !description.trim()) {
      alert("Please enter a character description");
      return;
    }

    if (method === "reference-image" && !referenceImage) {
      alert("Please upload a reference image");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        handle,
        description,
        method,
        referenceImage: referenceImage || undefined,
      });
    } catch (error) {
      console.error("Failed to create character:", error);
      alert("Failed to create character. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Character Name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Enter character name"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label
          htmlFor="handle"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          @Handle *
        </label>
        <input
          id="handle"
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="@Akira"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
          required
          pattern="^@[a-zA-Z0-9_-]+$"
        />
        <p className="mt-1 text-xs text-gray-500">
          Unique identifier for this character (e.g., @Akira). Use this in
          prompts for consistency.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Creation Method *
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMethod("description")}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              method === "description"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <div className="font-medium mb-1">From Description</div>
            <div className="text-xs text-gray-600">
              Generate character from text description
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMethod("reference-image")}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              method === "reference-image"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <div className="font-medium mb-1">From Reference Image</div>
            <div className="text-xs text-gray-600">
              Use an existing image as reference
            </div>
          </button>
        </div>
      </div>

      {method === "description" && (
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Character Description *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the character's appearance, personality, and key features..."
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            required={method === "description"}
          />
          <p className="mt-1 text-xs text-gray-500">
            Be specific about physical features, clothing, and distinctive
            traits for better AI generation.
          </p>
        </div>
      )}

      {method === "reference-image" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reference Image *
          </label>
          <div className="space-y-3">
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  id="reference-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  required={method === "reference-image"}
                />
                <label
                  htmlFor="reference-image"
                  className="cursor-pointer block"
                >
                  <div className="text-gray-600 mb-2">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Upload an image
                    </span>{" "}
                    or drag and drop
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </label>
              </div>
            ) : (
              <div className="relative border border-gray-300 rounded-lg p-4">
                <img
                  src={imagePreview}
                  alt="Reference preview"
                  className="max-h-64 mx-auto rounded"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500">
              Upload a reference image of your character. The AI will generate
              turnaround views and expressions based on this image.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Creating Character..." : "Create Character"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
