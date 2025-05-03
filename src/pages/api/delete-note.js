import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Missing note ID' });
      }

      const connection = await pool.getConnection();
      try {
        // First check if the note exists
        const [existingNote] = await connection.query(
          'SELECT * FROM notes WHERE id = ?',
          [id]
        );

        if (existingNote.length === 0) {
          return res.status(404).json({ error: 'Note not found' });
        }

        // Delete the note
        const [result] = await connection.query(
          'DELETE FROM notes WHERE id = ?',
          [id]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Note not found' });
        }

        res.status(200).json({ message: 'Note deleted successfully', id: id });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      res.status(500).json({ error: 'Failed to delete note' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}