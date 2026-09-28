import React, { useState, useEffect } from 'react';
import { Cloud, RefreshCw, Copy, Check, Download, Upload, Server, X, AlertCircle, Sparkles, Key, ExternalLink } from 'lucide-react';
import { testSupabase, syncToSupabase, getSqlSchema, restoreDatabase } from '../utils/api';
import { SovereignAiEngine } from '../services/sovereignAi';

interface DatabaseStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryColor?: string;
}

export const DatabaseStudioModal: React.FC<DatabaseStudioModalProps> = ({
  isOpen,
  onClose,
  primaryColor = '#F59E0B'
}) => {
  const [activeTab, setActiveTab] = useState<'gemini' | 'supabase' | 'schema' | 'backup'>('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiSaved, setGeminiSaved] = useState(false);
  const [geminiTestStatus, setGeminiTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });

  const [supabaseUrl, setSupabaseUrl] = useState('https://zjqkcyrsqkzkvztgrcnx.supabase.co');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean; success?: boolean; message?: string; stats?: any }>({ loading: false });
  const [sqlSchema, setSqlSchema] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('vaani_gemini_api_key') || '';
      setGeminiApiKey(storedKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveGeminiKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vaani_gemini_api_key', geminiApiKey.trim());
      setGeminiSaved(true);
      setTimeout(() => setGeminiSaved(false), 2500);
    }
  };

  const handleTestGemini = async () => {
    if (!geminiApiKey.trim()) {
      setGeminiTestStatus({ loading: false, success: false, message: 'Please enter a valid Google Gemini API Key first.' });
      return;
    }
    setGeminiTestStatus({ loading: true });
    try {
      const reply = await SovereignAiEngine.queryGeminiDirect(
        geminiApiKey.trim(),
        'Hello Vaani! Please verify that you are operational with Google Gemini 2.5 Flash intelligence.',
        'en',
        []
      );
      if (reply && reply.reply) {
        setGeminiTestStatus({
          loading: false,
          success: true,
          message: 'Gemini 2.5 Flash Verified! Unlimited omnidisciplinary intelligence is now active.'
        });
        localStorage.setItem('vaani_gemini_api_key', geminiApiKey.trim());
      } else {
        setGeminiTestStatus({
          loading: false,
          success: false,
          message: 'Could not connect. Please check that your key from Google AI Studio is active.'
        });
      }
    } catch (e: any) {
      setGeminiTestStatus({
        loading: false,
        success: false,
        message: 'Connection failed: ' + (e?.message || 'Check your internet connection or API key.')
      });
    }
  };

  const handleTestConnection = async () => {
    setTestStatus({ loading: true });
    try {
      const res = await testSupabase(supabaseUrl, supabaseKey);
      setTestStatus({ loading: false, success: res.success, message: res.message });
    } catch (err: any) {
      setTestStatus({ loading: false, success: false, message: err.message || 'Connection failed' });
    }
  };

  const handleSyncToSupabase = async () => {
    setSyncStatus({ loading: true });
    try {
      const res = await syncToSupabase(supabaseUrl, supabaseKey);
      setSyncStatus({
        loading: false,
        success: res.success,
        message: res.success ? 'Local records successfully synced to Supabase Cloud!' : 'Partial sync with warnings',
        stats: res.syncedCounts
      });
    } catch (err: any) {
      setSyncStatus({ loading: false, success: false, message: err.message || 'Sync failed' });
    }
  };

  const handleFetchSchema = async () => {
    try {
      const schema = await getSqlSchema();
      setSqlSchema(schema);
    } catch (err) {
      console.error('Failed to load SQL schema:', err);
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await restoreDatabase(json);
        if (res.success) {
          setRestoreStatus('Database restored successfully from backup!');
        } else {
          setRestoreStatus('Failed to restore database: ' + res.error);
        }
      } catch (err: any) {
        setRestoreStatus('Invalid JSON file format: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col imperial-glass rounded-3xl border shadow-2xl overflow-hidden bg-[#0d1017]/95"
        style={{ borderColor: `${primaryColor}66` }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `${primaryColor}25`, border: `1px solid ${primaryColor}` }}
            >
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-cinzel text-white flex items-center gap-2">
                VAANI <span style={{ color: primaryColor }}>• Studio & Intelligence Settings</span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure Gemini AI Reasoning, Supabase Cloud, and Sovereign DB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/30 px-4 sm:px-6 pt-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('gemini')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'gemini'
                ? 'border-amber-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Gemini AI Intelligence
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'supabase'
                ? 'border-amber-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            Supabase Cloud Sync
          </button>
          <button
            onClick={() => {
              setActiveTab('schema');
              handleFetchSchema();
            }}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'schema'
                ? 'border-amber-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Copy className="w-4 h-4" />
            SQL Schema
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-amber-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            ACID DB & Backup
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* 1. Gemini AI Tab */}
          {activeTab === 'gemini' && (
            <div className="space-y-4">
              <div className="bg-black/50 p-4 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono text-slate-200 font-semibold uppercase tracking-wider">
                      Google Gemini 2.5 Flash API Key
                    </span>
                  </div>
                  {geminiApiKey && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ● Active Key
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your Google Gemini API key to empower Vaani with infinite generative knowledge across all domains of science, coding, mathematics, literature, and multimodal image solving.
                </p>

                <div>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-black/70 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveGeminiKey}
                    className="flex-1 py-2 px-4 rounded-xl text-xs font-bold text-black transition-all flex items-center justify-center gap-1.5 shadow"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {geminiSaved ? <Check className="w-3.5 h-3.5" /> : null}
                    {geminiSaved ? 'Key Saved!' : 'Save Key'}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestGemini}
                    disabled={geminiTestStatus.loading}
                    className="flex-1 py-2 px-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-1.5"
                  >
                    {geminiTestStatus.loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                    Test Intelligence
                  </button>
                </div>
              </div>

              {geminiTestStatus.message && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    geminiTestStatus.success
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border border-red-500/30 text-red-300'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{geminiTestStatus.message}</span>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 space-y-1.5">
                <p className="font-semibold flex items-center gap-1">
                  <span>💡</span> How to get a 100% Free Gemini API Key:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                  <li>Visit Google AI Studio: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-amber-400 underline inline-flex items-center gap-0.5">aistudio.google.com <ExternalLink className="w-2.5 h-2.5" /></a></li>
                  <li>Click <strong>Create API Key</strong> and copy the generated key.</li>
                  <li>Paste it above and click <strong>Save Key</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* 2. Supabase Tab */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Supabase Project URL</label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Supabase Anon Key</label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="Enter your Supabase public anon key"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={testStatus.loading}
                    className="flex-1 py-2 px-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    {testStatus.loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
                    Test Connection
                  </button>
                  <button
                    onClick={handleSyncToSupabase}
                    disabled={syncStatus.loading}
                    className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold text-black transition-all flex items-center justify-center gap-2 shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {syncStatus.loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Sync Local to Supabase
                  </button>
                </div>
              </div>

              {testStatus.message && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  testStatus.success ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{testStatus.message}</span>
                </div>
              )}

              {syncStatus.message && (
                <div className={`p-3 rounded-xl text-xs ${
                  syncStatus.success ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                }`}>
                  <p className="font-semibold">{syncStatus.message}</p>
                  {syncStatus.stats && (
                    <p className="mt-1 text-[11px] font-mono text-slate-300">
                      Sessions: {syncStatus.stats.sessions} | Memories: {syncStatus.stats.memories} | Settings: {syncStatus.stats.settings}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Schema Tab */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">SQL DDL for Tables & Row-Level Security</span>
                <button
                  onClick={handleCopySchema}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied SQL!' : 'Copy SQL Schema'}
                </button>
              </div>
              <pre className="p-4 bg-black/60 border border-white/10 rounded-2xl text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-96 leading-relaxed">
                {sqlSchema || '-- Loading schema...'}
              </pre>
            </div>
          )}

          {/* 4. Backup Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Local JSON Backup & Snapshot</h4>
                  <p className="text-xs text-slate-400">Export or restore your conversations and voice memory snapshots.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="/api/backup/export"
                    download="vaani-database-backup.json"
                    className="flex-1 py-2.5 px-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download JSON Backup
                  </a>

                  <label className="flex-1 py-2.5 px-4 rounded-xl border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 text-xs font-semibold text-amber-300 transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Restore from JSON File
                    <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
                  </label>
                </div>
              </div>

              {restoreStatus && (
                <div className="p-3 rounded-xl text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{restoreStatus}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
