import { Router, Request, Response } from 'express';
import { localDb } from '../db/acidEngine.js';

export const sessionsRouter = Router();

sessionsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const sessions = await localDb.getSessions();
    res.json(sessions);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch sessions', message: err.message });
  }
});

sessionsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await localDb.getSessionById(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch session', message: err.message });
  }
});

sessionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const session = await localDb.upsertSession(req.body);
    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save session', message: err.message });
  }
});

sessionsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await localDb.deleteSession(req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete session', message: err.message });
  }
});
