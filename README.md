# Manga IDE

> **"Cursor for Manga" — Transform storytelling into visual manga in under 5 minutes**

An AI-first creative environment that brings the revolutionary Cursor IDE experience to sequential art creation. Never leave the canvas, never break context.

## 🎯 Vision

Manga IDE is designed as "v0.dev for manga" — a platform where amateur creators, content creators, and indie artists can generate professional-quality manga chapters without traditional drawing skills. The system combines deep creative control with AI-powered speed, achieving 2025-grade character consistency through reference sheets, @handle system, and automatic LoRA training.

## ✨ Key Features

### 🚀 Two Entry Points

- **Guided Creation**: Prompt-based generation for quick starts — fill a form, get a complete editable comic in under 5 minutes
- **Blank Canvas**: Full IDE workspace for professional creators with complete control

### 🎨 Persistent IDE Layout

The interface never changes, keeping you in flow:

- **Left Sidebar**: Pages, Script, Characters, Assets, References
- **Center Canvas**: Infinite workspace with paginated or vertical scroll modes
- **Right Sidebar**: Layers, Properties, History, AI Chat
- **Bottom Bar**: Global Prompt Line (Cmd+K) with quick actions
- **Floating Composer** (Cmd+L): Multi-step AI reasoning for complex operations

### 👥 Character Consistency System

Achieve >90% character consistency across all panels:

- **@Handle System**: Permanent identifiers like @Akira for each character
- **Automatic LoRA Training**: Train custom models from 12-20 images in 3 minutes
- **Expression Library**: 8 basic emotions per character
- **Turnaround Sheets**: 8-view character references
- **IP-Adapter Integration**: 2025-grade consistency technology

### 📝 Five Core Tabs

1. **Story Tab**: Full screenplay editor with inline AI assistance
2. **Characters Tab**: Character card management with @handles and LoRA training
3. **Storyboard Tab**: Low-fidelity planning workspace before high-res generation
4. **Pages Tab**: Main canvas with context-aware prompting
5. **Publish Tab**: One-click export to PDF, Webtoon, Tapas, Kindle, EPUB, WebP

### ⚡ AI-Powered Generation

- **Panel Generation**: <8 seconds per panel with parallel processing
- **Character Generation**: Automatic extraction from story with turnarounds
- **Smart Bubbles**: Intelligent speech bubble positioning
- **Style Anchor**: Visual consistency across entire manga
- **Dramatic Core**: Story analysis for enhanced narrative impact

### 🎬 Cursor-Style Interactions

- **Cmd+K**: Quick actions without leaving canvas
- **Cmd+L**: Multi-step AI Composer with before/after diff
- **@Handle Autocomplete**: Reference characters in any prompt
- **@ref-image**: Use reference images from library
- **Inline Editing**: Double-click bubbles for instant text editing
- **Version History**: Complete timeline with branching and restoration

## 🏗️ Architecture

### Tech Stack

**Frontend:**

- Next.js 14/15 (App Router)
- React 18 + TypeScript
- Tailwind CSS + Shadcn/UI
- React-Konva (Canvas manipulation)
- Zustand (State management)

**Backend:**

- Next.js API Routes
- Trigger.dev (Job orchestration)
- Vercel AI SDK (LLM integration)

**Data Layer:**

- Supabase (PostgreSQL + Auth + Storage)
- Row-Level Security (RLS) policies

**AI Services:**

- OpenAI GPT-4o / Claude 3.5 (Script parsing, prompt generation)
- Flux Manga 1.1 / Pony XL / SD3.5 (Image generation)
- IP-Adapter (Character consistency)
- ControlNet (Sketch-to-image)

### Generation Pipeline

```
User Input → Story Analysis (Dramatic Core) → Script Generation
           ↓
Character Extraction → Character Design Sheets → Style Anchor
           ↓
Storyboard Generation → Batched Panel Generation (8 at a time)
           ↓
Smart Bubble Positioning → Final Assembly
```

**Total Time**: ~2-3 minutes for 4 pages

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account
- OpenAI API key
- Fal.ai or Replicate API key
- Trigger.dev account

### Installation

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd manga-ide
pnpm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```bash
# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI Services
OPENAI_API_KEY=sk-...
FAL_API_KEY=...

# Trigger.dev
TRIGGER_API_KEY=...
TRIGGER_API_URL=https://api.trigger.dev

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=...
```

3. **Set up Supabase database:**

Run the migrations in `supabase/migrations/` to create the database schema.

4. **Run the development server:**

```bash
pnpm dev
```

5. **Start Trigger.dev dev server (in separate terminal):**

```bash
pnpm trigger:dev
```

6. **Open the app:**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Documentation

- **[Requirements](.kiro/specs/requirements.md)** - Complete feature requirements with user stories
- **[Design Document](.kiro/specs/design.md)** - Architecture, components, and data models
- **[Quick Reference](trigger/manga/QUICK_REFERENCE.md)** - AI generation pipeline overview
- **[Implementation Tasks](.kiro/specs/tasks.md)** - Development roadmap

## 📁 Project Structure

```
manga-ide/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Home/dashboard
│   ├── editor/[projectId]/  # Main editor workspace
│   ├── quick-start/         # Guided creation flow
│   └── api/                 # API routes
├── components/              # React components
│   ├── editor/             # Canvas, panels, toolbars
│   ├── character/          # Character cards and sheets
│   ├── chat/               # AI chat interface
│   ├── tabs/               # Story, Characters, Storyboard tabs
│   └── ui/                 # Shadcn/UI components
├── lib/                     # Core utilities
│   ├── ai/                 # AI service integrations
│   ├── db/                 # Database operations
│   ├── hooks/              # React hooks
│   ├── store/              # Zustand stores
│   └── rendering/          # Canvas rendering logic
├── trigger/                 # Trigger.dev jobs
│   └── manga/              # Manga generation pipeline
├── types/                   # TypeScript definitions
└── supabase/               # Database migrations
```

## 🎮 Usage

### Quick Start (Guided Creation)

1. Click "Start Creating" on landing page
2. Authenticate with Google/Apple/Discord/Email
3. Select "Guided Creation" and choose art style
4. Fill in story premise (500-3000 words)
5. Click "Generate Comic"
6. Wait ~2-3 minutes for complete project generation
7. Start editing immediately in the full IDE

### Pro Workflow (Blank Canvas)

1. Select "Blank Canvas" from wizard
2. Write script in Story Tab
3. Create character cards in Characters Tab with @handles
4. Plan layouts in Storyboard Tab
5. Generate high-res panels in Pages Tab
6. Export to your preferred format in Publish Tab

### Keyboard Shortcuts

- **Cmd+K**: Open global prompt bar
- **Cmd+L**: Open AI Composer
- **Space+Drag**: Pan canvas
- **Scroll**: Zoom canvas
- **Shift+Click**: Multi-select panels
- **Double-click bubble**: Edit text

## 🔧 Development

### Running Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e
```

### Database Migrations

```bash
# Create new migration
supabase migration new <migration_name>

# Apply migrations
supabase db push
```

### Trigger.dev Jobs

All async AI operations run through Trigger.dev for reliability and scalability:

- `generate-manga`: Main orchestrator
- `analyze-story`: Story analysis + dramatic core
- `generate-script`: Full script generation
- `extract-characters`: Character extraction with consistency strings
- `generate-characters`: Character design sheets
- `generate-storyboard`: Layout planning
- `generate-page-images`: Batched panel generation
- `generate-smart-bubbles`: Bubble positioning

See [QUICK_REFERENCE.md](trigger/manga/QUICK_REFERENCE.md) for pipeline details.

## 🎯 Performance Targets

- **Time to first comic**: <5 minutes
- **Panel generation**: <8 seconds per panel
- **Page load**: <2 seconds
- **Canvas interaction**: 60fps
- **Export time**: <30 seconds for 20 pages
- **Character consistency**: >90% across panels

## 💰 Monetization

### Free Tier

- 50 generations per day
- Casual character consistency
- Standard export formats

### Pro ($18/month)

- Unlimited generations
- Professional consistency with LoRA training
- 4K export
- Watermark removal
- Custom LoRA slot

### SuperPro ($39/month)

- Team collaboration
- Direct platform upload
- Priority queue
- Video export

## 🗺️ Roadmap

### Current (MVP)

- ✅ Guided creation flow
- ✅ Character @handle system
- ✅ Canvas manipulation
- ✅ AI generation pipeline
- ✅ Export to multiple formats

### Q1 2026

- Real-time collaboration
- Mobile companion app
- Advanced export (animated WebP)

### Q2 2026

- Voice mode
- Character/style marketplace
- Team workspaces

### Q3 2026

- Video export
- 3D character models
- AI Director Mode

### Q4 2026

- Print-on-demand integration
- Auto-translation (20+ languages)
- Git-like version control

## 🤝 Contributing

This project follows a spec-driven development approach. See [tasks.md](.kiro/specs/tasks.md) for the implementation roadmap.

## 📄 License

MIT

## 🙏 Acknowledgments

- Inspired by Cursor IDE's revolutionary developer experience
- Built with modern AI technologies (Flux, GPT-4o, Claude)
- Powered by Trigger.dev for reliable job orchestration
