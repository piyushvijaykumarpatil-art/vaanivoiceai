import { Router, Request, Response } from 'express';
import { testSupabaseConnection, syncLocalToSupabase, POSTGRES_SQL_SCHEMA } from '../db/supabaseClient.js';
import { localDb, DatabaseSchema } from '../db/acidEngine.js';

export const syncRouter = Router();

// Test Supabase connection
syncRouter.post('/test', async (req: Request, res: Response) => {
  try {
    const { url, key } = req.body;
    if (!url || !key) {
      res.status(400).json({ success: false, message: 'URL and Anon Key are required' });
      return;
    }
    const result = await testSupabaseConnection(url, key);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Trigger sync local -> Supabase
syncRouter.post('/supabase', async (req: Request, res: Response) => {
  try {
    const { url, key } = req.body;
    const result = await syncLocalToSupabase(url, key);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get PostgreSQL schema text
syncRouter.get('/schema', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(POSTGRES_SQL_SCHEMA);
});

// Download JSON backup
syncRouter.get('/backup', async (req: Request, res: Response) => {
  try {
    const db = await localDb.readDatabase();
    res.setHeader('Content-Disposition', 'attachment; filename="vaani.database.backup.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(db, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate backup', message: err.message });
  }
});

// Restore JSON backup
syncRouter.post('/restore', async (req: Request, res: Response): Promise<void> => {
  try {
    const backupData: DatabaseSchema = req.body;
    if (!backupData || !Array.isArray(backupData.sessions) || !Array.isArray(backupData.memories)) {
      res.status(400).json({ error: 'Invalid database backup structure' });
      return;
    }
    await localDb.writeDatabase(backupData);
    res.json({ success: true, message: 'Database restored successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Restore failed', message: err.message });
  }
});
