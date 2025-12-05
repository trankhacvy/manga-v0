/**
 * Character Design Prompts
 * Used to generate character reference images and turnaround sheets
 */

// export const CHARACTER_DESIGN_PROMPT = `Professional manga character turnaround sheet design.

// **Character: {characterName}**

// **Physical Description:**
// {appearance}

// **Personality:** {personality}

// **Outfit:** {outfit}

// **Art Style:** {artStyle} manga character design

// **Requirements:**
// - Character turnaround sheet layout
// - Show front view, 3/4 view, side view, and back view
// - Clean, professional line art
// - Consistent proportions across all views
// - {artStyle} manga/anime aesthetic
// - Clear, simple design that's easy to reproduce
// - White or transparent background
// - No text or labels on the image

// **Technical Specifications:**
// - Black and white line art with clean inking
// - Manga-style proportions and anatomy
// - Clear silhouette and recognizable design
// - Consistent character features across all views
// - Professional character sheet composition

// **Style Notes:**
// - Follow {artStyle} conventions
// - Maintain visual consistency
// - Clear, readable design
// - Appropriate for {genre} genre

// This is a reference sheet for maintaining character consistency across multiple manga panels.`;

export const CHARACTER_EXPRESSION_SHEET_PROMPT = `Professional manga character expression sheet.

**Character: {characterName}**

**Base Appearance:**
{appearance}

**Expressions to Show:**
{expressions}

**Art Style:** {artStyle} manga character design

**Requirements:**
- Expression sheet layout with {expressionCount} different facial expressions
- Same character showing different emotions
- Front-facing head shots
- Clean line art, manga style
- Consistent character features across all expressions
- {artStyle} manga/anime aesthetic
- White or transparent background
- Clear, exaggerated expressions typical of manga

**Expressions:**
Show the character's face displaying: {expressionList}

**Technical Specifications:**
- Black and white line art
- Manga-style facial expressions
- Clear emotional reads
- Consistent character design
- Professional expression sheet layout

This is a reference sheet for maintaining character expression consistency.`;

// export const CHARACTER_DESIGN_NEGATIVE_PROMPT = [
//   'realistic photo',
//   '3d render',
//   'multiple characters',
//   'crowded',
//   'text labels',
//   'watermark',
//   'low quality',
//   'blurry',
//   'inconsistent design',
//   'color',
//   'messy lines',
//   'unclear features',
// ];

// export function buildCharacterDesignPrompt(character: {
//   name: string;
//   appearance: string;
//   personality: string;
//   outfit: string;
//   artStyle: string;
//   genre?: string;
// }): string {
//   return CHARACTER_DESIGN_PROMPT
//     .replace('{characterName}', character.name)
//     .replace('{appearance}', character.appearance)
//     .replace('{personality}', character.personality)
//     .replace('{outfit}', character.outfit)
//     .replace(/{artStyle}/g, character.artStyle)
//     .replace('{genre}', character.genre || 'manga');
// }


export const CHARACTER_DESIGN_PROMPT = `Professional manga character turnaround sheet design.

**Subject Identity:** {species} ({category})
**Visual Keywords:** {visualKeywords}

**Character Name:** {characterName}

**Detailed Appearance:**
{appearance}

**Personality/Vibe:** {personality}

**Outfit:** {outfit}

**Art Style:** {artStyle} manga character design

**Requirements:**
- Character turnaround sheet layout (Front, Side, Back)
- **SUBJECT FOCUS:** Strictly draw a {species}. Do NOT draw a human unless specified.
- Clean, professional line art
- Consistent proportions across all views
- {artStyle} manga/anime aesthetic
- Clear, simple design that's easy to reproduce
- White or transparent background
- No text or labels on the image

**Technical Specifications:**
- Black and white line art with clean inking
- Manga-style proportions and anatomy
- Clear silhouette and recognizable design
- Consistent character features across all views
- Professional character sheet composition

**Style Notes:**
- Follow {artStyle} conventions
- Maintain visual consistency
- Clear, readable design
- Appropriate for {genre} genre`;

export const CHARACTER_DESIGN_NEGATIVE_PROMPT = [
  'realistic photo',
  '3d render',
  'multiple characters',
  'crowded',
  'text labels',
  'watermark',
  'low quality',
  'blurry',
  'inconsistent design',
  'color',
  'messy lines',
  'unclear features',
  // Các từ khóa bổ sung sẽ được thêm dynamic trong hàm build
];

export function buildCharacterDesignPrompt(character: {
  name: string;
  appearance: string;
  personality: string;
  outfit: string;
  artStyle: string;
  genre?: string;
  // Các trường mới từ Step 3
  species?: string;
  category?: string; // Human, Anthropomorphic, Feral
  visualKeywords?: string;
}): { prompt: string; negativePrompt: string } {
  
  const species = character.species || 'Human';
  const category = character.category || 'Human';
  const keywords = character.visualKeywords || species;

  // 1. Build Positive Prompt
  const prompt = CHARACTER_DESIGN_PROMPT
    .replace('{characterName}', character.name)
    .replace('{species}', species)
    .replace(/{category}/g, category)
    .replace('{visualKeywords}', keywords)
    .replace('{appearance}', character.appearance)
    .replace('{personality}', character.personality)
    .replace('{outfit}', character.outfit)
    .replace(/{artStyle}/g, character.artStyle)
    .replace('{genre}', character.genre || 'manga');

  // 2. Build Smart Negative Prompt
  // Nếu không phải người, cấm AI vẽ mặt người và da người
  const isHuman = category === 'Human';
  const extraNegatives = [];
  
  if (!isHuman) {
    extraNegatives.push(
      'human face', 
      'human skin', 
      'human nose', 
      'gijinka', // Từ khóa tiếng Nhật cho nhân hóa quá mức
      'cosplay', 
      'costume', 
      'man', 
      'woman', 
      'person'
    );
  }

  const negativePrompt = [
    ...CHARACTER_DESIGN_NEGATIVE_PROMPT,
    ...extraNegatives
  ].join(', ');

  return { prompt, negativePrompt };
}

export function buildCharacterExpressionPrompt(character: {
  name: string;
  appearance: string;
  expressions: string[];
  artStyle: string;
}): string {
  return CHARACTER_EXPRESSION_SHEET_PROMPT
    .replace('{characterName}', character.name)
    .replace('{appearance}', character.appearance)
    .replace('{expressions}', character.expressions.join(', '))
    .replace('{expressionCount}', String(character.expressions.length))
    .replace('{expressionList}', character.expressions.join(', '))
    .replace(/{artStyle}/g, character.artStyle);
}
