import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const noteData = req.body;

      // Basic validation
      if (!noteData || !noteData.title || !noteData.localId || !noteData.createdAt) {
        return res.status(400).json({ error: 'Invalid note data' });
      }

      const connection = await pool.getConnection();
      try {
        const [result] = await connection.query(
          'INSERT INTO notes (title, content, local_id, created_at, updated_at, tags) VALUES (?, ?, ?, ?, ?, ?)',
          [
            noteData.title,
            noteData.content || '',
            noteData.localId,
            new Date(noteData.createdAt),
            new Date(),
            JSON.stringify(noteData.tags || [])
          ]
        );

        res.status(200).json({ insertedId: result.insertId });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error saving note:', error);
      res.status(500).json({ error: 'Failed to save note' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}