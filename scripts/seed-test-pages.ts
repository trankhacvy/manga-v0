/**
 * Seed Test Pages Script
 * 
 * Creates a test project with multiple pages using different layout templates
 * to test the rendering system.
 * 
 * Usage: npx tsx scripts/seed-test-pages.ts
 */

import { createJobClient } from '@/utils/supabase/server';
import { createPageWithLayout } from '@/lib/db/pages';
import { updatePanelContent, updatePanelBubbles } from '@/lib/db/panels';
import { getAllLayouts } from '@/lib/layout-templates';
import { detectBubbleType } from '@/lib/bubble-types';
require("dotenv").config({ path: ".env.local" });

async function main() {
  console.log('🌱 Starting seed script...\n');

  const supabase = await createJobClient();

  // Get current user
  // const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  // if (userError || !user) {
  //   console.error('❌ Error: Not authenticated. Please log in first.');
  //   process.exit(1);
  // }

  // console.log(`✅ Authenticated as: ${user.email}\n`);

  // Create test project
  console.log('📦 Creating test project...');
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: 'e2d1dbfd-8bc0-4ceb-86e0-05375d75015a',
      title: 'Layout System Test Project',
      genre: 'Action',
      synopsis: 'A test project to demonstrate the layout system with various page layouts and speech bubbles.',
      style: 'manga-classic',
      total_pages: 4
      // canvas_mode: 'paginated',
    })
    .select()
    .single();

  if (projectError || !project) {
    console.error('❌ Error creating project:', projectError);
    process.exit(1);
  }

  console.log(`✅ Created project: ${project.title} (${project.id})\n`);

  // Create test characters
  console.log('👥 Creating test characters...');
  const characters = [
    {
      name: 'Hero',
      handle: '@hero',
      description: 'The brave protagonist',
    },
    {
      name: 'Villain',
      handle: '@villain',
      description: 'The mysterious antagonist',
    },
    {
      name: 'Sidekick',
      handle: '@sidekick',
      description: 'The loyal companion',
    },
  ];

  const createdCharacters = [];
  for (const char of characters) {
    const { data, error } = await supabase
      .from('characters')
      .insert({
        project_id: project.id,
        name: char.name,
        handle: char.handle,
        description: char.description,
        reference_images: null,
        turnaround: {},
        expressions: [],
        outfits: [],
        prompt_triggers: [],
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating character ${char.name}:`, error);
    } else {
      createdCharacters.push(data);
      console.log(`  ✅ Created character: ${char.name} (${char.handle})`);
    }
  }

  console.log('-----');

  // Get all available layouts
  const layouts = getAllLayouts();
  console.log(`📐 Found ${layouts.length} layout templates\n`);

  // Test data for different page types
  const testPages = [
    {
      layoutId: 'dialogue-4panel',
      storyBeat: 'introduction',
      panels: [
        {
          prompt: 'Hero standing in a city street, determined expression',
          characterHandles: ['@hero'],
          bubbles: [
            { text: 'This city needs a hero.', type: 'standard' },
          ],
        },
        {
          prompt: 'Villain watching from shadows, sinister smile',
          characterHandles: ['@villain'],
          bubbles: [
            { text: '(Soon, everything will change...)', type: 'thought' },
          ],
        },
        {
          prompt: 'Sidekick running towards hero, worried',
          characterHandles: ['@sidekick'],
          bubbles: [
            { text: 'Wait! I have news!', type: 'standard' },
          ],
        },
        {
          prompt: 'Hero and sidekick talking, serious conversation',
          characterHandles: ['@hero', '@sidekick'],
          bubbles: [
            { text: 'What happened?', type: 'standard' },
          ],
        },
      ],
    },
    {
      layoutId: 'action-6panel',
      storyBeat: 'action',
      panels: [
        {
          prompt: 'Hero running through alley',
          characterHandles: ['@hero'],
          bubbles: [],
        },
        {
          prompt: 'Villain appearing from above',
          characterHandles: ['@villain'],
          bubbles: [
            { text: 'STOP RIGHT THERE!', type: 'shout' },
          ],
        },
        {
          prompt: 'Hero dodging attack',
          characterHandles: ['@hero'],
          bubbles: [],
        },
        {
          prompt: 'Close-up of hero\'s determined face',
          characterHandles: ['@hero'],
          bubbles: [
            { text: 'I won\'t let you win!', type: 'standard' },
          ],
        },
        {
          prompt: 'Villain laughing menacingly',
          characterHandles: ['@villain'],
          bubbles: [
            { text: 'HA HA HA!', type: 'shout' },
          ],
        },
        {
          prompt: 'Epic clash between hero and villain',
          characterHandles: ['@hero', '@villain'],
          bubbles: [],
        },
      ],
    },
    {
      layoutId: 'establishing-3panel',
      storyBeat: 'establishing',
      panels: [
        {
          prompt: 'Wide shot of city skyline at sunset',
          characterHandles: [],
          bubbles: [
            { text: '[Meanwhile, across the city...]', type: 'narration' },
          ], 
        },
        {
          prompt: 'Street level view, people walking',
          characterHandles: [],
          bubbles: [
            { text: '[The citizens go about their day, unaware of the danger...]', type: 'narration' },
          ],
        },
        {
          prompt: 'Dark building with ominous atmosphere',
          characterHandles: [],
          bubbles: [
            { text: '[But in the shadows, evil plots...]', type: 'narration' },
          ],
        },
      ],
    },
    {
      layoutId: 'splash-single',
      storyBeat: 'dramatic',
      panels: [
        {
          prompt: 'Dramatic full-page shot of hero in heroic pose, city behind them, dramatic lighting',
          characterHandles: ['@hero'],
          bubbles: [
            { text: 'I AM THE GUARDIAN OF THIS CITY!', type: 'shout' },
          ],
        },
      ],
    },
    {
      layoutId: 'mixed-5panel',
      storyBeat: 'conflict',
      panels: [
        {
          prompt: 'Sidekick looking worried',
          characterHandles: ['@sidekick'],
          bubbles: [
            { text: 'This doesn\'t look good...', type: 'whisper' },
          ],
        },
        {
          prompt: 'Villain preparing attack',
          characterHandles: ['@villain'],
          bubbles: [
            { text: 'Prepare yourself!', type: 'standard' },
          ],
        },
        {
          prompt: 'LARGE FOCUS PANEL: Epic battle scene, hero vs villain, energy effects',
          characterHandles: ['@hero', '@villain'],
          bubbles: [
            { text: 'CLASH!', type: 'shout' },
          ],
        },
        {
          prompt: 'Hero struggling, injured',
          characterHandles: ['@hero'],
          bubbles: [
            { text: '(I can\'t give up...)', type: 'thought' },
          ],
        },
        {
          prompt: 'Sidekick cheering from sidelines',
          characterHandles: ['@sidekick'],
          bubbles: [
            { text: 'You can do it!', type: 'standard' },
          ],
        },
      ],
    },
    {
      layoutId: 'grid-8panel',
      storyBeat: 'dialogue',
      panels: [
        {
          prompt: 'Hero face, serious',
          characterHandles: ['@hero'],
          bubbles: [
            { text: 'We need a plan.', type: 'standard' },
          ],
        },
        {
          prompt: 'Sidekick face, thinking',
          characterHandles: ['@sidekick'],
          bubbles: [
            { text: 'What if we...', type: 'standard' },
          ],
        },
        {
          prompt: 'Hero listening',
          characterHandles: ['@hero'],
          bubbles: [
            { text: 'Go on...', type: 'standard' },
          ],
        },
        {
          prompt: 'Sidekick explaining with hand gestures',
          characterHandles: ['@sidekick'],
          bubbles: [
            { text: 'We could use the old tunnel!', type: 'standard' },
          ],
        },
        {
          prompt: 'Hero nodding',
          characterHandles: ['@hero'],
          bubbles: [
            { text: 'That might work.', type: 'standard' },
          ],
        },
        {
          prompt: 'Sidekick excited',
          characterHandles: ['@sidekick'],
          bubbles: [
            { text: 'Really?!', type: 'standard' },
          ],
        },
        {
          prompt: 'Hero determined',
          characterHandles: ['@hero'],
          bubbles: [
            { text: 'Let\'s do it!', type: 'standard' },
          ],
        },
        {
          prompt: 'Both characters ready for action',
          characterHandles: ['@hero', '@sidekick'],
          bubbles: [
            { text: 'Together!', type: 'shout' },
          ],
        },
      ],
    },
  ];

  // Create pages with panels
  console.log('📄 Creating test pages...\n');
  
  for (let i = 0; i < testPages.length; i++) {
    const testPage = testPages[i];
    const pageNumber = i + 1;

    console.log(`  Page ${pageNumber}: ${testPage.layoutId}`);

    try {
      // Create page with layout
      const { page, panels } = await createPageWithLayout(
        project.id,
        pageNumber,
        testPage.layoutId,
        {
          width: 1200,
          height: 1800,
          storyBeat: testPage.storyBeat,
        }
      );

      console.log(`    ✅ Created page with ${panels.length} panels`);

      // Update each panel with content
      for (let j = 0; j < panels.length && j < testPage.panels.length; j++) {
        const panel = panels[j];
        const panelData = testPage.panels[j];

        // Update panel content
        await updatePanelContent(panel.id, {
          prompt: panelData.prompt,
          character_handles: panelData.characterHandles,
          // Note: In real usage, image_url would be set after generation
          image_url: '',
        });

        // Update panel bubbles with proper positioning
        if (panelData.bubbles.length > 0) {
          const bubbles = panelData.bubbles.map((bubble, idx) => {
            // Auto-detect bubble type if not specified
            const bubbleType = bubble.type || detectBubbleType(bubble.text).id;
            
            // Calculate relative position within panel
            // Top area for bubbles, stacked vertically
            const relativeY = 0.1 + (idx * 0.15);
            
            return {
              id: `bubble-${panel.id}-${idx}`,
              text: bubble.text,
              type: bubbleType,
              // Relative positions (will be converted to absolute by renderer)
              relativeX: 0.5,
              relativeY: relativeY,
              relativeWidth: 0.7,
              relativeHeight: 0.12,
              // Absolute positions (calculated for current panel size)
              x: Math.round(panel.width * 0.15),
              y: Math.round(panel.height * relativeY),
              width: Math.round(panel.width * 0.7),
              height: Math.round(panel.height * 0.12),
            };
          });

          await updatePanelBubbles(panel.id, bubbles);
        }
      }

      console.log(`    ✅ Updated panel content and bubbles`);
    } catch (error) {
      console.error(`    ❌ Error creating page ${pageNumber}:`, error);
    }

    console.log('');
  }

  console.log('✨ Seed script completed!\n');
  console.log('📊 Summary:');
  console.log(`  - Project: ${project.title}`);
  console.log(`  - Project ID: ${project.id}`);
  console.log(`  - Characters: ${createdCharacters.length}`);
  console.log(`  - Pages: ${testPages.length}`);
  console.log(`  - Layouts tested: ${testPages.map(p => p.layoutId).join(', ')}`);
  console.log('\n🎨 You can now test the rendering system with this project!');
  console.log(`   Navigate to: /project/${project.id}\n`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
