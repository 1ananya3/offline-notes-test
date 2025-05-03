USE offline_notes;

-- Insert sample notes with tags
INSERT INTO notes (title, content, local_id, created_at, updated_at, tags) VALUES
('Meeting Notes', 'Discuss project timeline and deliverables', 'note1', NOW(), NOW(), '["work", "meeting"]'),
('Shopping List', 'Milk, eggs, bread, fruits', 'note2', NOW(), NOW(), '["personal", "shopping"]'),
('Project Ideas', 'New features and improvements', 'note3', NOW(), NOW(), '["work", "ideas"]'),
('Book Recommendations', 'To read: Atomic Habits, Deep Work', 'note4', NOW(), NOW(), '["personal", "books"]'),
('Weekly Tasks', 'Complete documentation, review PRs', 'note5', NOW(), NOW(), '["work", "tasks"]'),
('Recipe Ideas', 'Try new pasta recipe', 'note6', NOW(), NOW(), '["personal", "food"]'),
('Team Meeting', 'Discuss sprint planning', 'note7', NOW(), NOW(), '["work", "meeting"]'),
('Travel Plans', 'Book flights and hotels', 'note8', NOW(), NOW(), '["personal", "travel"]'),
('Bug Fixes', 'List of issues to resolve', 'note9', NOW(), NOW(), '["work", "bugs"]'),
('Movie Watchlist', 'Inception, Interstellar', 'note10', NOW(), NOW(), '["personal", "movies"]'); 