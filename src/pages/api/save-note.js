import { db } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const noteData = req.body;

      // Basic validation (optional, but good practice)
      if (!noteData || !noteData.title || !noteData.localId || !noteData.createdAt) {
        return res.status(400).json({ error: 'Invalid note data' });
      }

      // TODO: Implement logic to save the note to your chosen data store.
      // - Connect to the database/data source.
      // - Save the noteData object.
      // - Retrieve the unique identifier assigned by the data store (e.g., MongoDB _id, SQL primary key).
      // - Replace the example response below with the actual assigned identifier.
      const {title,content='', tags=[], createdAt, updatedAt} = noteData;

      await db.query(
        'INSERT INTO all_notes (title, content, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [title, content, JSON.stringify(tags), new Date(createdAt), updatedAt ? new Date(updatedAt) : new Date()]
      );
      
      
      const insertedId = noteData.id; // Placeholder: Use localId as temporary example ID

      // Respond with the identifier the client expects
      res.status(200).json({ insertedId: insertedId });
    } catch (error) {
      console.error('Error saving note:', error);
      res.status(500).json({ error: 'Failed to save note' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}