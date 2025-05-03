import { db } from '../../lib/db'; 

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // TODO: Implement logic to fetch notes from your chosen data store (e.g., MongoDB, PostgreSQL, JSON file).
      // - Connect to the database/data source.
      // - Fetch all notes.
      // - Consider sorting notes, e.g., by creation date (descending).
      // - Replace the example response below with the actual notes.

      const notes = await db.query('SELECT * FROM all_notes ORDER BY updated_at DESC'); // Example empty array

      res.status(200).json(notes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}