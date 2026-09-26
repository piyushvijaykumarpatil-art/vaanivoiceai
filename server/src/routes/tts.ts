import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ttsService } from '../services/ttsEngine.js';

export const ttsRouter = Router();

const TTSRequestSchema = z.object({
  text: z.string().min(1).max(3000),
  language: z.string().default('en'),
  voice: z.string().optional(),
  rate: z.string().default('+0%'),
  pitch: z.string().default('+0Hz')
});

ttsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = TTSRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid TTS payload', details: parseResult.error.format() });
      return;
    }

    const { text, language, voice, rate, pitch } = parseResult.data;
    const { buffer, contentType } = await ttsService.synthesize(text, language, voice, rate, pitch);

    res.set({
      'Content-Type': contentType,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=86400',
      'Accept-Ranges': 'bytes'
    });

    res.send(buffer);
  } catch (err: any) {
    console.error('TTS route error:', err);
    res.status(500).json({ error: 'Text to speech synthesis failed', message: err.message });
  }
});

ttsRouter.get('/stream', async (req: Request, res: Response): Promise<void> => {
  try {
    const text = String(req.query.text || '');
    const language = String(req.query.language || 'en');
    const voice = req.query.voice ? String(req.query.voice) : undefined;
    const rate = req.query.rate ? String(req.query.rate) : '+0%';
    const pitch = req.query.pitch ? String(req.query.pitch) : '+0Hz';

    if (!text) {
      res.status(400).send('Missing text query parameter');
      return;
    }

    const { buffer, contentType } = await ttsService.synthesize(text, language, voice, rate, pitch);

    res.set({
      'Content-Type': contentType,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=86400',
      'Accept-Ranges': 'bytes'
    });

    res.send(buffer);
  } catch (err: any) {
    console.error('TTS stream error:', err);
    res.status(500).send('Failed to stream audio');
  }
});
