/**
 * Script Generation Prompts
 * Used to convert story into detailed manga script with panels and dialogue
 * Enhanced with dramatic core integration
 */
import { z } from "zod";
import { StoryAnalysisSchema } from "../analyzeStory";

export const SCRIPT_GENERATION_PROMPT = `You are a professional manga scriptwriter with years of experience in {genre} manga.

Convert this story into a detailed, production-ready manga script.

**Story Description:**
{storyDescription}

**Art Style:** {artStyle}
**Genre:** {genre}
**Total Pages:** {pageCount}

{storyAnalysisSection}

**Script Requirements:**

Create a script with EXACTLY {pageCount} pages. Each page should have 4-6 panels.
USE {language} as main language.

**CHARACTER REGISTRY (define BEFORE writing panels):**
For each character, establish:
- **Handle**: Short unique ID (e.g., "@akira", "@villain1")
- **Visual Anchor**: ONE distinctive feature that MUST appear in every panel
- **Silhouette Test**: Could you identify this character in shadow? If not, add distinguishing shape.

Use these handles consistently in all panel descriptions. Never use pronouns without the handle nearby.

**Panel Guidelines:**
- **Shot Types**: Use variety (wide, medium, close-up, extreme-close-up, establishing)
- **Camera Angles**: Mix perspectives (eye-level, high-angle, low-angle, birds-eye, worms-eye, dutch-angle)
- **Composition**: Follow rule of thirds, create visual flow
- **Action Lines**: Include motion and impact for dynamic scenes
- **Sound Effects**: Add appropriate manga sound effects (Japanese style)

**Story Structure:**
- **Page 1, Panel 1**: MUST establish setting with wide establishing shot
- **Pages 1-{earlyPages}**: Introduction and setup
- **Pages {midPages}**: Rising action and development
- **Page {climaxPage}**: Climax and turning point (THE TURN - make this POWERFUL)
- **Page {pageCount}**: Resolution and conclusion
- **Each Page**: End with a micro-hook to turn the page

**Layout Selection Requirements:**
For each page, select the most appropriate layout template based on:
- Story beat (introduction/rising-action/climax/resolution)
- Content type (action heavy, dialogue heavy, establishing shot)
- Emotional intensity
- Number of panels needed

Available layout templates:

1. **dialogue-4panel** (4 panels, 2x2 grid)
   - Best for: Character conversations, back-and-forth dialogue, reaction shots
   - Use when: Two or more characters talking, character interactions
   - Story beats: Introduction, rising-action, resolution

2. **action-6panel** (6 panels, 2x3 grid)
   - Best for: Action sequences, fast-paced scenes, movement
   - Use when: Fight scenes, chase sequences, quick action beats
   - Story beats: Rising-action, climax

3. **establishing-3panel** (3 panels, wide horizontal)
   - Best for: Scene establishment, landscape shots, dramatic reveals
   - Use when: Introducing new location, showing passage of time, cinematic moments
   - Story beats: Introduction, transition

4. **splash-single** (1 panel, full page)
   - Best for: Dramatic reveals, key moments, emotional peaks
   - Use when: Major plot point, character introduction, climactic moment
   - Story beats: Climax, resolution

5. **mixed-5panel** (5 panels, asymmetric with focus)
   - Best for: Action with one key moment, varied pacing, emphasis on central event
   - Use when: Building up to important moment, action with focus
   - Story beats: Rising-action, climax

6. **grid-8panel** (8 panels, dense 4x2 grid)
   - Best for: Complex sequences, multiple characters, detailed action
   - Use when: Rapid-fire dialogue, intricate action, many story beats
   - Story beats: Rising-action, resolution

**IMPORTANT**: The number of panels you create MUST match the layout template:
- dialogue-4panel → 4 panels
- action-6panel → 6 panels
- establishing-3panel → 3 panels
- splash-single → 1 panel
- mixed-5panel → 5 panels
- grid-8panel → 8 panels

**Dialogue Guidelines:**
- Keep dialogue concise (manga bubbles have limited space)
- Use character voice and personality
- Balance dialogue with visual storytelling
- Include internal monologue where appropriate
- Add sound effects for impact (CRASH, WHOOSH, etc.)
- Make dialogue PUNCHY and EMOTIONAL - avoid generic lines

**Visual Notes:**
- Describe important visual details for each panel
- Note character expressions and body language
- Specify background details that matter
- Indicate panel transitions and flow
- Include VISUAL MOTIFS that recur throughout

Make the story complete, engaging, and satisfying within {pageCount} pages.`;

export const SCRIPT_GENERATION_SYSTEM_PROMPT = `You are a master manga scriptwriter who has worked on successful {genre} manga series. You understand:
- Panel-to-panel transitions and visual flow
- How to balance dialogue and visual storytelling
- Manga-specific visual language and conventions
- Pacing and rhythm in sequential art
- Character expression and body language
- Sound effect usage in manga
- Page composition and layout principles
- DRAMATIC CRAFT: conflict, stakes, emotional arcs

Create scripts that are clear, detailed, and ready for artists to illustrate.
Focus on EMOTIONAL IMPACT and VISUAL STORYTELLING.`;

export function buildStoryAnalysisSection(storyAnalysis: z.infer<typeof StoryAnalysisSchema>): string {
  if (!storyAnalysis) return '';
  
  // Build dramatic core section if available
  let dramaticCoreSection = '';
  if (storyAnalysis.dramaticCore) {
    const dc = storyAnalysis.dramaticCore;
    dramaticCoreSection = `
**DRAMATIC CORE (USE THIS TO DRIVE THE STORY):**
- **Central Conflict:** ${dc.centralConflict}
- **Stakes:** ${dc.stakes}
- **Emotional Arc:** ${dc.emotionalArc.start} → ${dc.emotionalArc.end}
- **The Turn:** ${dc.theTurn}
`;
  }

  // Build splash moments section if available
  let splashMomentsSection = '';
  if (storyAnalysis.splashMoments && storyAnalysis.splashMoments.length > 0) {
    splashMomentsSection = `
**SPLASH-WORTHY MOMENTS (consider splash-single layout):**
${storyAnalysis.splashMoments.map((sm, i) => 
  `${i + 1}. Page ${sm.suggestedPage}: ${sm.description} (${sm.emotionalFunction})`
).join('\n')}
`;
  }

  // Build visual motif section if available
  let visualMotifSection = '';
  if (storyAnalysis.visualMotif) {
    visualMotifSection = `
**VISUAL MOTIF (recurring element):** ${storyAnalysis.visualMotif}
`;
  }

  return `**Story Analysis:**

**Language:** ${storyAnalysis.language || 'English'}
**Theme:** ${storyAnalysis.mainTheme || 'Not specified'}
${dramaticCoreSection}
**Setting:**
- Time: ${storyAnalysis.setting?.time || 'Not specified'}
- Location: ${storyAnalysis.setting?.location || 'Not specified'}
- Atmosphere: ${storyAnalysis.setting?.atmosphere || 'Not specified'}
${splashMomentsSection}${visualMotifSection}
**Tonal Shifts:**
${storyAnalysis.tonalShifts?.map((ts: any, i: number) => 
  `${i + 1}. Page ${ts.page}: ${ts.tone}`
).join('\n') || 'None specified'}

**Key Scenes:**
${storyAnalysis.keyScenes?.map((ks: any, i: number) =>
  `${i + 1}. ${ks.description} (${ks.importance} importance, ${ks.suggestedPanels} panels)${ks.emotionalBeat ? ` - ${ks.emotionalBeat}` : ''}`
).join('\n') || 'None specified'}

**Pacing:**
- Opening: ${storyAnalysis.pacing?.opening || 'medium'}
- Middle: ${storyAnalysis.pacing?.middle || 'building'}
- Climax: ${storyAnalysis.pacing?.climax || 'intense'}
- Resolution: ${storyAnalysis.pacing?.resolution || 'satisfying'}
`;
}
