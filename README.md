# Offline Notes App - Interview Task

## Description
This is a take home assignment for interview candidates. 
Read this file carefully and implement the [tasks](#your-tasks) mentioned below. 
Check the [Deliverables](#Deliverables) section for what to submit.

## How to Run the App

This application is built using Next.js.

1.  **Clone/Fork:**
    ```bash
    git clone https://github.com/interview177/offline-notes-test
    cd offline-notes-test
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Database Setup:**
    ```bash
    # Create a MySQL database named 'offline_notes'
    mysql -u root -p
    CREATE DATABASE offline_notes;
    
    # Create the notes table
    CREATE TABLE notes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      local_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      tags JSON,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    );
    ```
4.  **Environment Variables:**
    Create a `.env.local` file in the root directory with:
    ```
    DB_HOST=localhost
    DB_USER=your_mysql_username
    DB_PASSWORD=your_mysql_password
    DB_NAME=offline_notes
    ```
5.  **Run Development Server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## Implementation Details

### Backend Data Store

I chose MySQL as the backend data store for the following reasons:
1. **Reliability**: MySQL is a mature, battle-tested database system with strong ACID compliance
2. **JSON Support**: MySQL 5.7+ supports JSON data type, which is perfect for storing tags
3. **Transaction Support**: Essential for maintaining data consistency during sync operations
4. **Performance**: Efficient for both read and write operations
5. **Scalability**: Can handle growing data volumes and concurrent users

The database schema is designed to support both online and offline operations:
- `id`: Auto-incrementing primary key for server-side identification
- `local_id`: UUID for client-side identification and offline operations
- `title`: Note title
- `content`: Note content
- `tags`: JSON array of tags
- `created_at`: Timestamp for creation date
- `updated_at`: Timestamp for last update

### State Management for Tagging and Filtering

The application uses React's built-in hooks for state management:

1. **Tag State Management**:
   - `useState` for managing tags within each note
   - `useCallback` for tag operations (add/remove)
   - Tags are stored both locally (IndexedDB) and on the server

2. **Filtering State Management**:
   - `useState` for selected tags
   - `useMemo` for filtered notes list
   - Client-side filtering using array methods
   - Real-time updates as tags are selected/deselected

### Tag Storage Integration

Tags are stored in a JSON column in MySQL and as an array in IndexedDB:

**Pros**:
1. **Flexibility**: JSON allows for easy addition/removal of tags without schema changes
2. **Query Support**: MySQL's JSON functions allow for tag-based queries
3. **Consistency**: Same data structure in both local and server storage
4. **Performance**: No need for separate tag tables or joins

**Cons**:
1. **Limited Query Capabilities**: Can't easily query across all notes for specific tags
2. **No Tag Normalization**: Same tag might be stored multiple times
3. **Validation**: Need to handle JSON validation on both client and server

### Conflict Detection Logic

Conflicts are detected during the sync process in `refreshNotes`:

1. **Version Tracking**:
   - Each note has `localEditSynced` and `localDeleteSynced` flags
   - Server notes have `updated_at` timestamp

2. **Conflict Scenarios**:
   - **Edit Conflict**: Local note modified while offline AND server note modified
   - **Delete Conflict**: Local note deleted while offline AND server note modified
   - **Create Conflict**: Same `localId` used for different notes

3. **Detection Process**:
   ```typescript
   if (localNote.localEditSynced === false && serverNote.updated_at > lastSyncTime) {
     // Conflict detected
   }
   ```

### Conflict Resolution Strategy

The proposed conflict resolution strategy is a "Last Write Wins" with user confirmation:

1. **UI Flow**:
   - Show conflict dialog when conflicts are detected
   - Display both versions (local and server)
   - Allow user to choose which version to keep
   - Option to merge changes manually

2. **Resolution Options**:
   - Keep local version
   - Keep server version
   - Merge changes (for non-conflicting fields)
   - Create new note (for create conflicts)

3. **Implementation Details**:
   - Store conflict metadata in IndexedDB
   - Show conflict indicators in UI
   - Provide resolution UI in note editor
   - Update sync status after resolution

## Current Architecture

[Previous architecture section remains unchanged.]

## Your Tasks

[Previous tasks section remains unchanged.]

## Deliverables

[Previous deliverables section remains unchanged.]

Thank You!