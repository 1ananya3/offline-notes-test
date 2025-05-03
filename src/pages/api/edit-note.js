import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const { title, content, tags } = req.body;

      if (!id || !title) {
        return res.status(400).json({ error: 'Missing note ID or title' });
      }

      const connection = await pool.getConnection();
      try {
        const [result] = await connection.query(
          'UPDATE notes SET title = ?, content = ?, tags = ?, updated_at = NOW() WHERE id = ?',
          [title, content || '', JSON.stringify(tags || []), id]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Note not found' });
        }

        const [updatedNote] = await connection.query(
          'SELECT * FROM notes WHERE id = ?',
          [id]
        );

        res.status(200).json(updatedNote[0]);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error editing note:', error);
      res.status(500).json({ error: 'Failed to edit note' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}