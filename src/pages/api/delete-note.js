import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    try {
      const { local_id } = req.query;
      console.log('Delete request received for local_id:', local_id);

      if (!local_id) {
        console.error('Missing local_id in request');
        return res.status(400).json({ error: 'Missing note local_id' });
      }

      const connection = await pool.getConnection();
      try {
        // First check if the note exists
        const [existingNote] = await connection.query(
          'SELECT * FROM notes WHERE local_id = ?',
          [local_id]
        );

        console.log('Existing note check result:', existingNote);

        if (existingNote.length === 0) {
          console.error('Note not found with local_id:', local_id);
          return res.status(404).json({ error: 'Note not found' });
        }

        // Delete the note
        const [result] = await connection.query(
          'DELETE FROM notes WHERE local_id = ?',
          [local_id]
        );

        console.log('Delete operation result:', result);

        if (result.affectedRows === 0) {
          console.error('No rows affected when deleting note with local_id:', local_id);
          return res.status(404).json({ error: 'Note not found' });
        }

        res.status(200).json({ 
          message: 'Note deleted successfully', 
          local_id: local_id,
          deleted: true 
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      res.status(500).json({ 
        error: 'Failed to delete note',
        details: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}