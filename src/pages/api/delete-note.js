import { db } from '../../lib/db';
export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query; // ID of the note to delete (likely localId stored as _id by client)

      if (!id) {
        return res.status(400).json({ error: 'Missing note ID' });
      }

      // TODO: Implement logic to delete the note from your chosen data store.
      // - Connect to the database/data source.
      // - Find and delete the note by its unique identifier (`id`).
      // - Handle the case where the note is not found.
      // - Replace the example response below.
      const [result] = await db.query('DELETE FROM all_notes WHERE local_id = ?', [id]);
      const noteFound = result.affectedRows > 0; 
      if (noteFound) {
        res.status(200).json({ message: 'Note deleted successfully' });
      } else {
        res.status(404).json({ error: 'Note not found' });
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      res.status(500).json({ error: 'Failed to delete note' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}