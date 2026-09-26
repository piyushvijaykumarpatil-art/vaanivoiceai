import fs from 'fs';
import path from 'path';
import { dbMutex } from '../utils/mutex.js';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language?: string;
  audioDurationMs?: number;
}

export interface SessionRecord {
  id: string;
  title: string;
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
  language: string;
  personality: string;
  messages: ChatMessage[];
  message_count: number;
  created_at: string;
}

export interface MemoryRecord {
  id: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface SettingRecord {
  id: string;
  config: Record<string, any>;
  updated_at: string;
}

export interface FeedbackRecord {
  id: string;
  rating: number;
  category: string;
  comments: string;
  user_name: string;
  created_at: string;
}

export interface KnowledgeRecord {
  id: string;
  title: string;
  keywords: string[];
  summary: string;
  category: string;
  language: string;
  created_at: string;
}

export interface DatabaseSchema {
  sessions: SessionRecord[];
  memories: MemoryRecord[];
  settings: SettingRecord[];
  feedbacks: FeedbackRecord[];
  knowledge: KnowledgeRecord[];
}

export class AcidJsonEngine {
  private dbPath: string;
  private tempPath: string;

  constructor(filePath?: string) {
    if (filePath) {
      this.dbPath = filePath;
    } else if (process.env.LOCAL_DB_PATH) {
      this.dbPath = path.resolve(process.cwd(), process.env.LOCAL_DB_PATH);
    } else {
      const candidateRoot = path.resolve(process.cwd(), '..', 'data', 'vaani.database.json');
      if (fs.existsSync(candidateRoot)) {
        this.dbPath = candidateRoot;
      } else {
        this.dbPath = path.resolve(process.cwd(), 'data', 'vaani.database.json');
      }
    }
    this.tempPath = `${this.dbPath}.tmp`;
    this.ensureDatabaseExists();
  }

  private ensureDatabaseExists(): void {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.dbPath)) {
      const initialData: DatabaseSchema = {
        sessions: [],
        memories: [
          {
            id: 'mem_creator_piyush',
            content: 'Vaani was created by Piyush, a 1st year engineering student at NIAT Pune.',
            category: 'creator',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        settings: [
          {
            id: 'default_user',
            config: {
              theme: 'gold',
              language: 'en',
              supabaseUrl: 'https://zjqkcyrsqkzkvztgrcnx.supabase.co',
              supabaseKey: '',
              voicePitch: '+0Hz',
              voiceRate: '+0%'
            },
            updated_at: new Date().toISOString()
          }
        ],
        feedbacks: [],
        knowledge: [
          {
            id: 'know_creator_lore',
            title: 'Creator Lore - Piyush',
            keywords: ['piyush', 'creator', 'niat', 'engineer', 'author'],
            summary: 'Engineered by Piyush, 1st Year Innovator at NIAT Pune. Designed as a Sovereign Voice AI companion.',
            category: 'identity',
            language: 'en',
            created_at: new Date().toISOString()
          }
        ]
      };
      fs.writeFileSync(this.dbPath, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  }

  public async readDatabase(): Promise<DatabaseSchema> {
    return dbMutex.runExclusive(async () => {
      try {
        const raw = await fs.promises.readFile(this.dbPath, 'utf-8');
        return JSON.parse(raw) as DatabaseSchema;
      } catch (err) {
        console.error('Error reading ACID database, recovering default structure:', err);
        return {
          sessions: [],
          memories: [],
          settings: [],
          feedbacks: [],
          knowledge: []
        };
      }
    });
  }

  public async writeDatabase(data: DatabaseSchema): Promise<void> {
    return dbMutex.runExclusive(async () => {
      const payload = JSON.stringify(data, null, 2);
      // Atomic write pattern: write to .tmp file, then atomic rename
      await fs.promises.writeFile(this.tempPath, payload, 'utf-8');
      await fs.promises.rename(this.tempPath, this.dbPath);
    });
  }

  // --- SESSIONS CRUD ---
  public async getSessions(): Promise<SessionRecord[]> {
    const db = await this.readDatabase();
    return db.sessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async getSessionById(id: string): Promise<SessionRecord | undefined> {
    const db = await this.readDatabase();
    return db.sessions.find(s => s.id === id);
  }

  public async upsertSession(session: SessionRecord): Promise<SessionRecord> {
    const db = await this.readDatabase();
    const idx = db.sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      db.sessions[idx] = { ...db.sessions[idx], ...session };
    } else {
      db.sessions.push(session);
    }
    await this.writeDatabase(db);
    return session;
  }

  public async deleteSession(id: string): Promise<boolean> {
    const db = await this.readDatabase();
    const originalLength = db.sessions.length;
    db.sessions = db.sessions.filter(s => s.id !== id);
    if (db.sessions.length !== originalLength) {
      await this.writeDatabase(db);
      return true;
    }
    return false;
  }

  // --- MEMORIES CRUD ---
  public async getMemories(): Promise<MemoryRecord[]> {
    const db = await this.readDatabase();
    return db.memories;
  }

  public async addMemory(content: string, category: string = 'preference'): Promise<MemoryRecord> {
    const db = await this.readDatabase();
    const newMemory: MemoryRecord = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      content,
      category,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.memories.push(newMemory);
    await this.writeDatabase(db);
    return newMemory;
  }

  public async deleteMemory(id: string): Promise<boolean> {
    const db = await this.readDatabase();
    const prevLen = db.memories.length;
    db.memories = db.memories.filter(m => m.id !== id);
    if (db.memories.length !== prevLen) {
      await this.writeDatabase(db);
      return true;
    }
    return false;
  }

  // --- SETTINGS CRUD ---
  public async getSettings(userId: string = 'default_user'): Promise<Record<string, any>> {
    const db = await this.readDatabase();
    const found = db.settings.find(s => s.id === userId);
    return found ? found.config : {
      theme: 'gold',
      language: 'en',
      supabaseUrl: 'https://zjqkcyrsqkzkvztgrcnx.supabase.co',
      supabaseKey: ''
    };
  }

  public async saveSettings(userId: string, config: Record<string, any>): Promise<SettingRecord> {
    const db = await this.readDatabase();
    const idx = db.settings.findIndex(s => s.id === userId);
    const updated: SettingRecord = {
      id: userId,
      config,
      updated_at: new Date().toISOString()
    };
    if (idx >= 0) {
      db.settings[idx] = updated;
    } else {
      db.settings.push(updated);
    }
    await this.writeDatabase(db);
    return updated;
  }

  // --- FEEDBACKS CRUD ---
  public async addFeedback(feedback: Omit<FeedbackRecord, 'id' | 'created_at'>): Promise<FeedbackRecord> {
    const db = await this.readDatabase();
    const record: FeedbackRecord = {
      id: `fb_${Date.now()}`,
      ...feedback,
      created_at: new Date().toISOString()
    };
    db.feedbacks.push(record);
    await this.writeDatabase(db);
    return record;
  }

  public async getFeedbacks(): Promise<FeedbackRecord[]> {
    const db = await this.readDatabase();
    return db.feedbacks;
  }

  // --- KNOWLEDGE CRUD ---
  public async getKnowledge(): Promise<KnowledgeRecord[]> {
    const db = await this.readDatabase();
    return db.knowledge;
  }

  public async addKnowledge(knowledge: Omit<KnowledgeRecord, 'id' | 'created_at'>): Promise<KnowledgeRecord> {
    const db = await this.readDatabase();
    const record: KnowledgeRecord = {
      id: `know_${Date.now()}`,
      ...knowledge,
      created_at: new Date().toISOString()
    };
    db.knowledge.push(record);
    await this.writeDatabase(db);
    return record;
  }
}

export const localDb = new AcidJsonEngine();
