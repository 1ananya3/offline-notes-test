import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const connection = await pool.getConnection();
      try {
        const [notes] = await connection.query(
          `SELECT 
            id, 
            title, 
            content, 
            local_id as localId, 
            DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.000Z') as createdAt,
            DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s.000Z') as updatedAt,
            tags 
          FROM notes 
          ORDER BY created_at DESC`
        );
        res.status(200).json(notes);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}