-- Remove the unique constraint on (project_id, handle) from characters table
ALTER TABLE characters DROP CONSTRAINT characters_project_id_handle_key;
