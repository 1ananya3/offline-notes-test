# Offline Notes App

A Next.js application that allows users to create, edit, and delete notes with offline support. The app uses IndexedDB for local storage and MySQL for persistent server-side storage.

## Features

- Create, edit, and delete notes
- Offline support with IndexedDB
- Automatic sync when online
- MySQL backend for persistent storage
- Modern UI with Tailwind CSS
- TypeScript for type safety
- Service Worker for offline functionality

## Tech Stack

- **Frontend:**
 - Next.js 13
 - React 18
 - TypeScript
 - Tailwind CSS
 - Styled Components
 - IndexedDB for offline storage

- **Backend:**
 - Next.js API Routes
 - MySQL for persistent storage
 - mysql2 for database connectivity

## How to Run

1. **Prerequisites:**
 - Node.js (v14 or later)
 - MySQL Server
 - npm or yarn

2. **Database Setup:**
 ```sql
 CREATE DATABASE offline_notes;
 ```

3. **Environment Variables:**
 Create a `.env` file in the project root with the following variables:
 ```env
 DB_HOST=localhost
 DB_USER=your_mysql_username
 DB_PASSWORD=your_mysql_password
 DB_NAME=offline_notes
 ```

4. **Installation:**
 ```bash
 # Install dependencies
 npm install

 # Run the development server
 npm run dev
 ```

5. **Build for Production:**
 ```bash
 npm run build
 npm start
 ```

## Architecture

### Data Storage

The application uses a dual-storage approach:

1. **IndexedDB (Client-side):**
 - Stores notes locally for offline access
 - Maintains sync status flags (`localDeleteSynced`, `localEditSynced`)
 - Uses `localId` for offline identification
 - Automatically syncs with server when online

2. **MySQL (Server-side):**
 - Persistent storage for all notes
 - Uses auto-incrementing `id` as primary key
 - Stores `localId` for client-server mapping
 - Maintains timestamps for creation and updates

### Database Schema

```sql
CREATE TABLE notes (
 id INT AUTO_INCREMENT PRIMARY KEY,
 localId VARCHAR(255) NOT NULL,
 title TEXT NOT NULL,
 createdAt DATETIME NOT NULL,
 updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Sync Mechanism

1. **Online Operations:**
 - Notes are saved to both IndexedDB and MySQL
 - MySQL ID is stored in IndexedDB for future reference
 - Changes are immediately synced to the server

2. **Offline Operations:**
 - Notes are stored only in IndexedDB
 - Sync flags are set to track pending changes
 - Automatic sync occurs when connection is restored

3. **Conflict Detection:**
 - Compares local and server versions of notes
 - Detects conflicts based on `updatedAt` timestamps
 - Logs conflicts for future resolution

## State Management

The application uses React's built-in hooks for state management:

- `useState` for local component state
- `useEffect` for side effects and data fetching
- `useCallback` for memoized functions
- Context API for global state when needed

## API Endpoints

1. **GET /api/notes**
 - Fetches all notes from MySQL
 - Returns notes sorted by creation date

2. **POST /api/save-note**
 - Creates a new note in MySQL
 - Returns the inserted ID

3. **PUT /api/edit-note**
 - Updates an existing note
 - Requires note ID and new title

4. **DELETE /api/delete-note**
 - Removes a note from MySQL
 - Requires note ID

## Error Handling

- Input validation for all API endpoints
- Graceful error handling for offline operations
- Clear error messages for users
- Automatic retry for failed syncs

## Future Improvements

1. **Tag Implementation:**
 - Add support for note tagging
 - Implement tag-based filtering
 - Store tags in both IndexedDB and MySQL

2. **Conflict Resolution UI:**
 - Add UI for resolving conflicts
 - Allow users to choose which version to keep
 - Support merging changes

3. **Enhanced Offline Support:**
 - Background sync for better reliability
 - Conflict resolution during sync
 - Progress indicators for sync operations

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT

