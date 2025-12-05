-- Add thumbnail field to projects table
ALTER TABLE projects
ADD COLUMN thumbnail TEXT;

-- Populate thumbnail with the first panel's image_url for existing projects
UPDATE projects
SET thumbnail = (
  SELECT panels.image_url
  FROM panels
  JOIN pages ON pages.id = panels.page_id
  WHERE pages.project_id = projects.id
    AND panels.image_url IS NOT NULL
  ORDER BY pages.page_number ASC, panels.panel_index ASC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1
  FROM panels
  JOIN pages ON pages.id = panels.page_id
  WHERE pages.project_id = projects.id
    AND panels.image_url IS NOT NULL
);

-- Add comment to document the field
COMMENT ON COLUMN projects.thumbnail IS 'Optional thumbnail image URL for the project, typically the first panel image';
