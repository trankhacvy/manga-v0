-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table (simplified for MVP)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  genre TEXT,
  synopsis TEXT,
  style TEXT NOT NULL,
  generation_stage TEXT DEFAULT 'script',
  preview_only BOOLEAN DEFAULT true,
  total_pages INTEGER,
  generation_progress JSONB DEFAULT '{"script": 0, "characters": 0, "storyboard": 0, "preview": 0}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Characters table (simplified - no LoRA for MVP)
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  description TEXT,
  reference_images JSONB,
  turnaround JSONB NOT NULL,
  expressions JSONB DEFAULT '[]'::jsonb,
  prompt_triggers TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, handle)
);

-- Pages table
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  width FLOAT NOT NULL DEFAULT 1200,
  height FLOAT NOT NULL DEFAULT 1800,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, page_number)
);

-- Panels table (simplified)
CREATE TABLE panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  panel_index INTEGER NOT NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  width FLOAT NOT NULL,
  height FLOAT NOT NULL,
  image_url TEXT,
  prompt TEXT,
  character_refs TEXT[] DEFAULT '{}'::text[],
  character_handles TEXT[] DEFAULT '{}'::text[],
  style_locks TEXT[] DEFAULT '{}'::text[],
  bubbles JSONB DEFAULT '[]'::jsonb,
  sketch_url TEXT,
  controlnet_strength FLOAT,
  generation_params JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Panel versions (for version history)
CREATE TABLE panel_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_id UUID NOT NULL REFERENCES panels(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project scripts (one per project)
CREATE TABLE project_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  content TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_characters_project_id ON characters(project_id);
CREATE INDEX idx_characters_handle ON characters(project_id, handle);
CREATE INDEX idx_pages_project_id ON pages(project_id);
CREATE INDEX idx_panels_page_id ON panels(page_id);
CREATE INDEX idx_panel_versions_panel_id ON panel_versions(panel_id);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_scripts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for characters (access through project)
CREATE POLICY "Users can view characters in their projects"
  ON characters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = characters.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create characters in their projects"
  ON characters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = characters.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update characters in their projects"
  ON characters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = characters.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = characters.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete characters in their projects"
  ON characters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = characters.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for pages (access through project)
CREATE POLICY "Users can view pages in their projects"
  ON pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pages.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create pages in their projects"
  ON pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pages.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pages in their projects"
  ON pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pages.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pages.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pages in their projects"
  ON pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pages.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for panels (access through project)
CREATE POLICY "Users can view panels in their projects"
  ON panels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pages
      JOIN projects ON projects.id = pages.project_id
      WHERE pages.id = panels.page_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create panels in their projects"
  ON panels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pages
      JOIN projects ON projects.id = pages.project_id
      WHERE pages.id = panels.page_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update panels in their projects"
  ON panels FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pages
      JOIN projects ON projects.id = pages.project_id
      WHERE pages.id = panels.page_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pages
      JOIN projects ON projects.id = pages.project_id
      WHERE pages.id = panels.page_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete panels in their projects"
  ON panels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pages
      JOIN projects ON projects.id = pages.project_id
      WHERE pages.id = panels.page_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for panel_versions (access through project)
CREATE POLICY "Users can view panel versions in their projects"
  ON panel_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM panels
      JOIN pages ON pages.id = panels.page_id
      JOIN projects ON projects.id = pages.project_id
      WHERE panels.id = panel_versions.panel_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create panel versions in their projects"
  ON panel_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM panels
      JOIN pages ON pages.id = panels.page_id
      JOIN projects ON projects.id = pages.project_id
      WHERE panels.id = panel_versions.panel_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete panel versions in their projects"
  ON panel_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM panels
      JOIN pages ON pages.id = panels.page_id
      JOIN projects ON projects.id = pages.project_id
      WHERE panels.id = panel_versions.panel_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for project_scripts (access through project)
CREATE POLICY "Users can view scripts in their projects"
  ON project_scripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_scripts.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create scripts in their projects"
  ON project_scripts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_scripts.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update scripts in their projects"
  ON project_scripts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_scripts.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_scripts.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete scripts in their projects"
  ON project_scripts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_scripts.project_id
      AND projects.user_id = auth.uid()
    )
  );
