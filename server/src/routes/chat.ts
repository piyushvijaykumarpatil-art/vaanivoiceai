import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { generateChatResponse } from '../services/gemini.js';
import { sanitizeTextForTTS } from '../utils/textSanitizer.js';
import { localDb, SessionRecord } from '../db/acidEngine.js';

export const chatRouter = Router();

const ChatRequestSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().default(''),
  image: z.string().optional(),
  language: z.enum(['mr', 'hi', 'en', 'te', 'kn', 'pa', 'ta', 'bn', 'gu', 'ml']).default('en'),
  geminiApiKey: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).default([])
});

chatRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = ChatRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid chat request', details: parseResult.error.format() });
      return;
    }

    const { sessionId, message, image, language, history, geminiApiKey } = parseResult.data;
    const clientKey = geminiApiKey || (req.headers['x-gemini-api-key'] as string | undefined);

    // Generate intelligent AI response with multimodal support
    const aiResult = await generateChatResponse(message, language, history, image, clientKey);
    const cleanSpoken = sanitizeTextForTTS(aiResult.reply);

    // Save to local ACID database session
    const existingSession = await localDb.getSessionById(sessionId);
    const userMsg = {
      id: `msg_${Date.now()}_u`,
      role: 'user' as const,
      content: message || (image ? '📷 [Attached Image Analysis]' : ''),
      timestamp: new Date().toISOString(),
      language
    };
    const assistantMsg = {
      id: `msg_${Date.now()}_a`,
      role: 'assistant' as const,
      content: aiResult.reply,
      timestamp: new Date().toISOString(),
      language: aiResult.detectedLanguage
    };

    let session: SessionRecord;
    if (existingSession) {
      existingSession.messages.push(userMsg, assistantMsg);
      existingSession.message_count = existingSession.messages.length;
      existingSession.ended_at = new Date().toISOString();
      session = await localDb.upsertSession(existingSession);
    } else {
      session = await localDb.upsertSession({
        id: sessionId,
        title: message.slice(0, 40) || 'Sovereign Dialogue',
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_seconds: 0,
        language,
        personality: 'imperial',
        messages: [userMsg, assistantMsg],
        message_count: 2,
        created_at: new Date().toISOString()
      });
    }

    res.json({
      reply: aiResult.reply,
      cleanSpokenText: cleanSpoken,
      detectedLanguage: aiResult.detectedLanguage,
      domainCategory: aiResult.domainCategory,
      calendarData: aiResult.calendarData,
      sessionId: session.id
    });
  } catch (err: any) {
    console.error('Chat route error:', err);
    res.status(500).json({ error: 'Failed to process chat message', message: err.message });
  }
});
