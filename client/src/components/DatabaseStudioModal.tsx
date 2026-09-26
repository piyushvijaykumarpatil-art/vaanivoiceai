import React, { useState } from 'react';
import { Database, Cloud, RefreshCw, Copy, Check, Download, Upload, Server, X, AlertCircle } from 'lucide-react';
import { testSupabase, syncToSupabase, getSqlSchema, restoreDatabase } from '../utils/api';

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
  const [activeTab, setActiveTab] = useState<'supabase' | 'schema' | 'backup'>('supabase');
  const [supabaseUrl, setSupabaseUrl] = useState('https://zjqkcyrsqkzkvztgrcnx.supabase.co');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean; success?: boolean; message?: string; stats?: any }>({ loading: false });
  const [sqlSchema, setSqlSchema] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  if (!isOpen) return null;

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
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col imperial-glass rounded-3xl border shadow-2xl overflow-hidden"
        style={{ borderColor: `${primaryColor}66` }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `${primaryColor}25`, border: `1px solid ${primaryColor}` }}
            >
              <Database className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-cinzel">Database Studio & Persistence</h2>
              <p className="text-xs text-slate-400">Dual-Layer: Local ACID JSON Engine + Supabase Cloud PostgreSQL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/30 px-6 pt-2">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
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
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'schema'
                ? 'border-amber-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Copy className="w-4 h-4" />
            PostgreSQL SQL Schema
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'backup'
                ? 'border-amber-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            Local ACID DB & Backup
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
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

          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Ready-to-run PostgreSQL table definitions for Supabase SQL Editor</span>
                <button
                  onClick={handleCopySchema}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied to Clipboard!' : 'Copy SQL Schema'}
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-black/70 border border-white/10 text-xs font-mono text-emerald-300 max-h-72 overflow-y-auto whitespace-pre-wrap">
                {sqlSchema || 'Loading schema...'}
              </pre>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Local ACID JSON Engine</h4>
                  <p className="text-xs text-slate-400">
                    Your dialogues, long-term memory, and preferences are saved locally with zero dependencies in <code className="text-amber-300">data/vaani.database.json</code> using atomic file locks.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a
                    href="/api/sync/backup"
                    download="vaani.database.backup.json"
                    className="flex-1 py-2.5 px-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download JSON Backup
                  </a>

                  <label className="flex-1 py-2.5 px-4 rounded-xl border border-dashed border-white/30 bg-black/50 hover:bg-white/5 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Restore from JSON File</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreFile}
                      className="hidden"
                    />
                  </label>
                </div>

                {restoreStatus && (
                  <p className="text-xs text-emerald-400 font-mono mt-2 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/30">
                    {restoreStatus}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
