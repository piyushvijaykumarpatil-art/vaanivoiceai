import { Router, Request, Response } from 'express';
import { localDb } from '../db/acidEngine.js';
import { getIndianCalendarContext } from '../services/calendarService.js';

export const metaRouter = Router();

// Feedbacks
metaRouter.get('/feedbacks', async (req: Request, res: Response) => {
  try {
    const feedbacks = await localDb.getFeedbacks();
    res.json(feedbacks);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch feedbacks', message: err.message });
  }
});

metaRouter.post('/feedbacks', async (req: Request, res: Response): Promise<void> => {
  try {
    const { rating, category, comments, userName } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }
    const record = await localDb.addFeedback({
      rating,
      category: category || 'general',
      comments: comments || '',
      user_name: userName || 'Anonymous Sovereign User'
    });
    res.json(record);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record feedback', message: err.message });
  }
});

// Memories
metaRouter.get('/memories', async (req: Request, res: Response) => {
  try {
    const memories = await localDb.getMemories();
    res.json(memories);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch memories', message: err.message });
  }
});

metaRouter.post('/memories', async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, category } = req.body;
    if (!content) {
      res.status(400).json({ error: 'Memory content is required' });
      return;
    }
    const record = await localDb.addMemory(content, category || 'preference');
    res.json(record);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save memory', message: err.message });
  }
});

metaRouter.delete('/memories/:id', async (req: Request, res: Response) => {
  try {
    const success = await localDb.deleteMemory(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete memory', message: err.message });
  }
});

// Settings
metaRouter.get('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await localDb.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch settings', message: err.message });
  }
});

metaRouter.post('/settings', async (req: Request, res: Response) => {
  try {
    const result = await localDb.saveSettings('default_user', req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save settings', message: err.message });
  }
});

// Calendar HUD
metaRouter.get('/calendar', (req: Request, res: Response) => {
  try {
    const calendar = getIndianCalendarContext();
    res.json(calendar);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch calendar context', message: err.message });
  }
});
