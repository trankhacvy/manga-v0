/**
 * Character Extraction Prompts
 * Used to extract and detail characters from the generated script
 * Enhanced with Consistency System for cross-panel visual consistency
 */

export const CHARACTER_EXTRACTION_PROMPT = `You are a manga character designer analyzing a script to extract detailed character information.

**Script to Analyze:**
{script}

**Art Style:** {artStyle}
**Genre:** {genre}

**Your Task:**
Extract ALL characters from this script and create comprehensive character profiles for visual design.

## Character Profile Requirements

### 1. Identity & Classification (CRUCIAL)
- Name
- Handle (format: @[name] in lowercase, no spaces)
- Role (protagonist, antagonist, supporting, minor)
- **Species/Type**: (e.g., Human, Anthropomorphic Animal, Feral Animal, Robot, Monster, Alien)
- **Category**: Human | Anthropomorphic | Feral | Object/Mecha
- Age/Maturity: (e.g., "Young Adult", "Elderly", "Cub/Baby")
- Gender

### 2. Physical Appearance
- **Body Composition**: (e.g., "covered in white fur", "metallic skin", "pale human skin", "green scales")
- **Head/Face Features**: (e.g., "rabbit head with long ears", "human face", "robotic visor")
- **Distinguishing Features**: (scars, whiskers, tail type, wings)
- Height/Size relative to others
- Build (muscular, lean, stocky, etc.)

### 3. Outfit/Accessories
- **Clothing Level**: (e.g., "Fully clothed", "Partial accessories only", "No clothes/Natural")
- Main outfit details (if applicable)
- Accessories (scarves, shells, weapons)

### 4. Personality & Expressions
- Core personality traits
- Key expressions needed (8 expressions)

### 5. Visual Reference Notes
- **Keywords for Image Gen**: 5-7 specific keywords to enforce the species
- Similar archetypes from {genre} manga

## CRITICAL: Consistency System

For each character, you MUST define THREE levels of visual consistency:

### Level 1 - Silhouette (ALWAYS enforce)
- Body type keywords: (e.g., "tall lanky", "short stocky", "athletic medium build")
- Signature shape: (e.g., "spiky hair pointing upward", "long flowing cape", "oversized hat")

### Level 2 - Recognition Features (ALWAYS enforce)
- Face anchor: ONE unchanging facial feature (scar, eye color, facial hair style)
- Clothing anchor: ONE unchanging clothing element (red scarf, leather jacket, arm wraps)
- Color anchor: Primary color associated with character (even in B&W, this affects tone)

### Level 3 - Detail (enforce when visible)
- Full outfit description
- Accessories
- Expression range

## OUTPUT: Consistency String (REQUIRED)

For EACH character, output a "consistencyString" - a condensed prompt fragment (UNDER 100 CHARACTERS) that MUST be included in every panel prompt featuring this character.

**Examples:**
- "tall spiky-haired teen, scar over left eye, red scarf, confident stance"
- "small round rabbit, long floppy ears, blue vest, cheerful expression"
- "muscular warrior, bald head, tribal tattoos, heavy armor, stern face"
- "elderly wizard, long white beard, pointed hat, wooden staff, wise eyes"

The consistency string should capture the MOST RECOGNIZABLE features that make this character instantly identifiable in any panel.

## Guidelines
- Maximum 5 main characters for a {pageCount}-page manga
- Each character must be visually distinct and recognizable
- If the character is an animal, DETERMINE if they are:
  a) **Feral**: Looks like a real animal (Lion King style)
  b) **Anthropomorphic**: Animal head/fur but human body shape (Zootopia/Beastars style)
  c) **Kemonomimi**: Human with animal ears/tail (typical anime style)
- Be extremely specific about non-human features to prevent "human in costume" generation
- Ensure designs work well in {artStyle} art style`;

export const CHARACTER_EXTRACTION_SYSTEM_PROMPT = `You are an expert manga character designer who understands:
- Character design principles and visual distinctiveness
- {genre} manga character archetypes and conventions
- How to create memorable, recognizable characters
- Visual storytelling through character design
- Consistency requirements for sequential art
- {artStyle} aesthetic and design language

Extract characters that are visually interesting, distinct, and appropriate for the story and genre.
PRIORITIZE CONSISTENCY - characters must be recognizable across all panels.`;
