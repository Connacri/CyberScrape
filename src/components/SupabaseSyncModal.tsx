import React, { useState } from 'react';
import { SupabaseConfig } from '../types';
import {
  testSupabaseConnection,
  generateSupabaseSqlSchema,
} from '../utils/supabaseClient';
import {
  Database,
  Check,
  Copy,
  AlertCircle,
  ExternalLink,
  X,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SupabaseConfig;
  onSaveConfig: (config: SupabaseConfig) => void;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [form, setForm] = useState<SupabaseConfig>({ ...config });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedFixSql, setCopiedFixSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'fix'>('config');

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(form);
      setTestResult(res);
      if (res.success) {
        setForm((prev) => ({ ...prev, isConnected: true }));
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig(form);
    onClose();
  };

  const handleCopySql = () => {
    const sql = generateSupabaseSqlSchema(form.tableName || 'scraped_products');
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCopyFixSql = () => {
    const sql = `-- CYBER-VACUUM // Correction SQLSTATE 23505 (schema_migrations_pkey version 001)
DELETE FROM supabase_migrations.schema_migrations WHERE version = '001';`;
    navigator.clipboard.writeText(sql);
    setCopiedFixSql(true);
    setTimeout(() => setCopiedFixSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-xl bg-slate-950 border border-emerald-500/40 p-5 shadow-2xl font-mono text-xs text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Database className="w-5 h-5" />
            <span className="text-sm">CONNEXION BASE DE DONNÉES SUPABASE</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 mt-3">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 font-mono text-xs border-b-2 font-semibold transition-colors ${
              activeTab === 'config'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Paramètres Supabase
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2 font-mono text-xs border-b-2 font-semibold transition-colors ${
              activeTab === 'sql'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Générateur Schema SQL
          </button>
          <button
            onClick={() => setActiveTab('fix')}
            className={`px-4 py-2 font-mono text-xs border-b-2 font-semibold transition-colors ${
              activeTab === 'fix'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Dépannage Erreur 23505
          </button>
        </div>

        {/* Content */}
        {activeTab === 'config' ? (
          <div className="space-y-4 mt-4">
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Connectez votre instance Supabase pour stocker de façon persistante les catalogues e-commerce aspirés et alimenter vos dashboards en temps réel.
            </p>

            {/* URL */}
            <div>
              <label className="block text-[11px] text-emerald-400 font-bold mb-1">
                SUPABASE PROJECT URL
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value.trim() })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Anon Key */}
            <div>
              <label className="block text-[11px] text-emerald-400 font-bold mb-1">
                SUPABASE ANON KEY (PUBLIQUE)
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={form.anonKey}
                onChange={(e) => setForm({ ...form, anonKey: e.target.value.trim() })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Table Name */}
            <div>
              <label className="block text-[11px] text-emerald-400 font-bold mb-1">
                NOM DE LA TABLE CIBLE
              </label>
              <input
                type="text"
                placeholder="scraped_products"
                value={form.tableName}
                onChange={(e) => setForm({ ...form, tableName: e.target.value.trim() })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Auto-Sync checkbox */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <input
                type="checkbox"
                id="autoSync"
                checked={form.autoSync}
                onChange={(e) => setForm({ ...form, autoSync: e.target.checked })}
                className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="autoSync" className="text-xs text-slate-300 cursor-pointer">
                Synchroniser automatiquement chaque produit aspiré vers Supabase
              </label>
            </div>

            {/* Test connection output */}
            {testResult && (
              <div
                className={`p-3 rounded-lg border text-xs ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>
        ) : activeTab === 'sql' ? (
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Script de création de table PostgreSQL / Supabase :</span>
              <button
                onClick={handleCopySql}
                className="px-2.5 py-1 rounded bg-slate-900 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1.5 transition-all"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? 'Copié !' : 'Copier SQL'}
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto p-3 rounded-lg bg-black/80 border border-slate-800 text-emerald-400 font-mono text-[11px] leading-relaxed select-text">
              <pre>{generateSupabaseSqlSchema(form.tableName || 'scraped_products')}</pre>
            </div>

            <p className="text-[10px] text-slate-500">
              Ouvrez votre dashboard Supabase &gt; SQL Editor &gt; Nouveau query, collez ce code et cliquez sur "Run".
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-[11px] leading-relaxed">
              <span className="font-bold">Résolution de l'erreur SQLSTATE 23505 (schema_migrations_pkey) :</span>
              <p className="mt-1 text-slate-300">
                Cette erreur survient lorsqu'une migration avec la version <code className="text-amber-300 bg-black/50 px-1 py-0.5 rounded">001</code> existe déjà dans la table interne Supabase.
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Commande SQL corrective à exécuter dans Supabase SQL Editor :</span>
              <button
                onClick={handleCopyFixSql}
                className="px-2.5 py-1 rounded bg-slate-900 border border-amber-500/40 text-amber-400 hover:bg-amber-500/20 flex items-center gap-1.5 transition-all"
              >
                {copiedFixSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedFixSql ? 'Copié !' : 'Copier Correction SQL'}
              </button>
            </div>

            <div className="p-3 rounded-lg bg-black/80 border border-slate-800 text-amber-400 font-mono text-[11px] leading-relaxed select-text">
              <pre>{`-- Nettoyage de la clé de migration en conflit :
DELETE FROM supabase_migrations.schema_migrations WHERE version = '001';

-- Ou avec Supabase CLI :
-- supabase migration repair --status applied 001`}</pre>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-5 pt-3 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2">
          {activeTab === 'config' ? (
            <button
              onClick={handleTest}
              disabled={isTesting || !form.url || !form.anonKey}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 hover:border-cyan-500/40 flex items-center gap-1.5 disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              Tester la connexion
            </button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
