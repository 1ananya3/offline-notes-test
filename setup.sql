CREATE DATABASE IF NOT EXISTS offline_notes;
USE offline_notes;

CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    local_id VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    tags JSON,
    INDEX idx_local_id (local_id)
); 