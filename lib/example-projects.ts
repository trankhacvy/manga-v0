import type { StyleType } from "@/types";

export interface ExampleProject {
  id: string;
  title: string;
  genre: string;
  synopsis: string;
  style: StyleType;
  thumbnail?: string;
  description: string;
  pages: ExamplePage[];
}

export interface ExamplePage {
  pageNumber: number;
  panels: ExamplePanel[];
}

export interface ExamplePanel {
  x: number;
  y: number;
  width: number;
  height: number;
  prompt: string;
  bubbles: ExampleBubble[];
}

export interface ExampleBubble {
  x: number;
  y: number;
  text: string;
  type: "standard" | "shout" | "whisper" | "thought";
}

export const exampleProjects: ExampleProject[] = [
  {
    id: "example-shonen-adventure",
    title: "Hero's Journey",
    genre: "Action/Adventure",
    synopsis:
      "A young warrior discovers their hidden powers and embarks on an epic quest to save their village from an ancient evil.",
    style: "shonen",
    description:
      "Classic shonen-style action manga with dynamic fight scenes and character growth.",
    pages: [
      {
        pageNumber: 1,
        panels: [
          {
            x: 50,
            y: 50,
            width: 400,
            height: 300,
            prompt:
              "Wide establishing shot of a peaceful village at sunrise, traditional Japanese architecture, mountains in background, shonen manga style",
            bubbles: [
              {
                x: 100,
                y: 80,
                text: "Another peaceful morning in the village...",
                type: "standard",
              },
            ],
          },
          {
            x: 500,
            y: 50,
            width: 300,
            height: 300,
            prompt:
              "Close-up of young protagonist with spiky hair, determined expression, shonen manga style",
            bubbles: [
              {
                x: 550,
                y: 80,
                text: "Today's the day I prove myself!",
                type: "shout",
              },
            ],
          },
          {
            x: 50,
            y: 400,
            width: 750,
            height: 250,
            prompt:
              "Action scene of protagonist training with wooden sword, dynamic motion lines, shonen manga style",
            bubbles: [
              {
                x: 300,
                y: 450,
                text: "I won't give up!",
                type: "shout",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "example-shojo-romance",
    title: "Cherry Blossom Dreams",
    genre: "Romance/Drama",
    synopsis:
      "A shy high school student finds courage when she meets a mysterious transfer student who shares her love of art.",
    style: "shojo",
    description:
      "Sweet shojo romance with beautiful backgrounds and emotional character moments.",
    pages: [
      {
        pageNumber: 1,
        panels: [
          {
            x: 50,
            y: 50,
            width: 350,
            height: 400,
            prompt:
              "Shy girl with long flowing hair looking out classroom window at cherry blossoms, soft lighting, shojo manga style with sparkles",
            bubbles: [
              {
                x: 100,
                y: 100,
                text: "Spring is finally here...",
                type: "thought",
              },
            ],
          },
          {
            x: 450,
            y: 50,
            width: 350,
            height: 200,
            prompt:
              "Close-up of girl's surprised face with large expressive eyes, shojo manga style",
            bubbles: [
              {
                x: 500,
                y: 80,
                text: "Huh?!",
                type: "standard",
              },
            ],
          },
          {
            x: 450,
            y: 300,
            width: 350,
            height: 350,
            prompt:
              "Handsome boy with gentle smile standing in doorway, backlit by sunlight, shojo manga style with flower effects",
            bubbles: [
              {
                x: 500,
                y: 350,
                text: "Hi, I'm the new transfer student.",
                type: "standard",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "example-4koma-comedy",
    title: "Daily Life Chaos",
    genre: "Comedy/Slice of Life",
    synopsis:
      "Four-panel comedy strips following the hilarious misadventures of college roommates.",
    style: "chibi",
    description:
      "Cute 4-koma style comedy with expressive chibi characters and relatable humor.",
    pages: [
      {
        pageNumber: 1,
        panels: [
          {
            x: 50,
            y: 50,
            width: 700,
            height: 150,
            prompt:
              "Chibi character sitting at desk with laptop, normal expression, simple background, 4-koma manga style",
            bubbles: [
              {
                x: 100,
                y: 80,
                text: "Time to be productive!",
                type: "standard",
              },
            ],
          },
          {
            x: 50,
            y: 250,
            width: 700,
            height: 150,
            prompt:
              "Same chibi character now distracted by phone, slightly guilty expression, 4-koma manga style",
            bubbles: [
              {
                x: 100,
                y: 280,
                text: "Just one quick check...",
                type: "whisper",
              },
            ],
          },
          {
            x: 50,
            y: 450,
            width: 700,
            height: 150,
            prompt:
              "Chibi character completely absorbed in phone, sparkly eyes, 4-koma manga style",
            bubbles: [
              {
                x: 100,
                y: 480,
                text: "Oh wow, cat videos!",
                type: "standard",
              },
            ],
          },
          {
            x: 50,
            y: 650,
            width: 700,
            height: 150,
            prompt:
              "Chibi character panicking at sunset, exaggerated shocked expression, 4-koma manga style",
            bubbles: [
              {
                x: 100,
                y: 680,
                text: "IT'S ALREADY 6PM?!",
                type: "shout",
              },
            ],
          },
        ],
      },
    ],
  },
];
