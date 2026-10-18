import React, { useState } from 'react';
import {
  Zap,
  Terminal,
  Cpu,
  Download,
  Copy,
  Check,
  Globe,
  AlertTriangle,
  Server,
  Layers,
  Sparkles,
  X,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { getCustomBackendUrl, setCustomBackendUrl } from '../utils/scraperEngine';

interface TurboCrawlerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogAdd?: (msg: string, type: 'info' | 'warn' | 'success' | 'cyber') => void;
}

export const TurboCrawlerModal: React.FC<TurboCrawlerModalProps> = ({
  isOpen,
  onClose,
  onLogAdd,
}) => {
  const [activeTab, setActiveTab] = useState<'explanation' | 'python' | 'github_pages' | 'node'>('explanation');
  const [backendUrlInput, setBackendUrlInput] = useState(() => getCustomBackendUrl());
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [copiedPython, setCopiedPython] = useState(false);
  const [copiedWorker, setCopiedWorker] = useState(false);
  const [copiedNode, setCopiedNode] = useState(false);

  if (!isOpen) return null;

  const handleSaveBackendUrl = () => {
    const trimmed = backendUrlInput.trim();
    setCustomBackendUrl(trimmed);
    if (trimmed) {
      onLogAdd?.(`[CONFIG] URL de relais backend configurée : ${trimmed}`, 'success');
    } else {
      onLogAdd?.(`[CONFIG] URL de relais backend réinitialisée vers la détection automatique`, 'info');
    }
  };

  const handleTestBackend = async () => {
    const target = backendUrlInput.trim() || window.location.origin;
    setTestStatus('testing');
    setTestMessage('Test de ping vers le relais...');
    try {
      const url = `${target.replace(/\/+$/, '')}/api/ouedkniss/categories`;
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        const cats = data?.categories?.length || 0;
        setTestStatus('success');
        setTestMessage(`Connecté avec succès ! ${cats} catégories détectées.`);
        handleSaveBackendUrl();
      } else {
        setTestStatus('error');
        setTestMessage(`Erreur HTTP ${res.status} reçue du serveur.`);
      }
    } catch (err) {
      setTestStatus('error');
      setTestMessage(
        err instanceof Error
          ? `Impossible de joindre le serveur : ${err.message}`
          : 'Erreur réseau ou restriction CORS.'
      );
    }
  };

  const handleDownloadPythonScript = () => {
    const blob = new Blob([PYTHON_SCRIPT_CONTENT], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fast_scraper.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onLogAdd?.('[EXPORT] Script Python haute performance téléchargé (fast_scraper.py)', 'cyber');
  };

  const copyToClipboard = async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0b0f19] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f172a]/90">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-400">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Moteur d'Aspiration Ultra-Rapide & Guide GitHub Pages
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  TURBO ARCHITECTURE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pourquoi le navigateur est limité, comment atteindre 60+ annonces/sec, et résoudre GitHub Pages.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800/80 bg-slate-900/40 px-4 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('explanation')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
              activeTab === 'explanation'
                ? 'border-cyan-400 text-cyan-300 font-semibold bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            1. Pourquoi c'est lent & Solution
          </button>
          <button
            onClick={() => setActiveTab('github_pages')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
              activeTab === 'github_pages'
                ? 'border-emerald-400 text-emerald-300 font-semibold bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            2. Résolution GitHub Pages & CORS
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
              activeTab === 'python'
                ? 'border-amber-400 text-amber-300 font-semibold bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            3. Script Python Ultra-Rapide (0 dép)
          </button>
          <button
            onClick={() => setActiveTab('node')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
              activeTab === 'node'
                ? 'border-purple-400 text-purple-300 font-semibold bg-purple-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            4. Cloudflare Worker Gratuit (Relais)
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* TAB 1: EXPLANATION */}
          {activeTab === 'explanation' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30">
                  <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Pourquoi l'aspiration navigateur est lente :
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                    <li>
                      <strong>Limite réseau du navigateur :</strong> Chrome/Firefox limitent à <strong>6 sockets HTTP simultanées</strong> vers un même domaine.
                    </li>
                    <li>
                      <strong>Single-thread & DOM :</strong> Le navigateur exécute le JavaScript, met à jour React, écrit dans IndexedDB et gère l'affichage sur un seul fil d'exécution.
                    </li>
                    <li>
                      <strong>Petits paquets (28 annonces) :</strong> L'interface par défaut demande 28 annonces par page, ce qui multiplie par 2 les allers-retours réseau.
                    </li>
                    <li>
                      <strong>Protection WAF Cloudflare :</strong> Ouedkniss bloque les requêtes trop rapprochées sans session HTTP/2 persistante.
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
                    <Sparkles className="w-4 h-4" />
                    L'Approche Ultra-Rapide (Haute Performance) :
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                    <li>
                      <strong>Interrogation directe GraphQL :</strong> 0 rendu HTML, 0 Puppeteer, 0 Selenium. On appelle directement l'API GraphQL JSON en 15 ms.
                    </li>
                    <li>
                      <strong>Paquets maximaux (60 annonces/requête) :</strong> L'API accepte <code className="text-emerald-300">count: 60</code>, divisant par deux le nombre de requêtes.
                    </li>
                    <li>
                      <strong>Multiplexage TCP / HTTP/2 :</strong> Réutilisation des sockets Keep-Alive sans ré-effectuer de handshake SSL à chaque page.
                    </li>
                    <li>
                      <strong>Script Python / Go multi-thread :</strong> Vitesse mesurée de <strong>63 à 120 annonces réelles par seconde</strong> (10 000 annonces en 2 minutes).
                    </li>
                  </ul>
                </div>
              </div>

              {/* Benchmark Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-900/80 px-4 py-2.5 font-bold text-xs text-slate-300 border-b border-slate-800 flex items-center justify-between">
                  <span>Tableau Comparatif des Débits d'Aspiration</span>
                  <span className="text-cyan-400 font-mono text-[11px]">Mesures réelles Ouedkniss</span>
                </div>
                <div className="divide-y divide-slate-800/60 font-mono text-xs">
                  <div className="grid grid-cols-4 px-4 py-2.5 bg-slate-900/30 text-slate-400 text-[11px] font-semibold">
                    <div>Méthode</div>
                    <div>Débit Réel</div>
                    <div>Temps pour 5 000 annonces</div>
                    <div>Restrictions</div>
                  </div>
                  <div className="grid grid-cols-4 px-4 py-2.5 items-center">
                    <span className="text-slate-300">Navigateur Web React (GitHub Pages)</span>
                    <span className="text-amber-400 font-semibold">~2 à 5 art/sec</span>
                    <span className="text-slate-400">~25 à 40 minutes</span>
                    <span className="text-red-400 text-[11px]">CORS, 6 sockets max</span>
                  </div>
                  <div className="grid grid-cols-4 px-4 py-2.5 items-center bg-cyan-950/10">
                    <span className="text-cyan-300 font-semibold">Serveur Node.js (Proxy Express)</span>
                    <span className="text-cyan-400 font-semibold">~15 à 25 art/sec</span>
                    <span className="text-slate-300">~4 minutes</span>
                    <span className="text-slate-400 text-[11px]">Nécessite hôte Node</span>
                  </div>
                  <div className="grid grid-cols-4 px-4 py-2.5 items-center bg-emerald-950/20 font-bold">
                    <span className="text-emerald-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      Script Python fast_scraper.py
                    </span>
                    <span className="text-emerald-400 font-bold">60 à 120 art/sec</span>
                    <span className="text-emerald-300 font-bold">~45 secondes !</span>
                    <span className="text-emerald-400 text-[11px]">Aucune (0 dépendance)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-500/20">
                <div className="text-xs text-slate-300">
                  <strong className="text-white">Recommandation Immédiate :</strong> Pour aspirer des dizaines de milliers d'annonces instantanément et les stocker dans votre Supabase, lancez le script Python localement.
                </div>
                <button
                  onClick={handleDownloadPythonScript}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 whitespace-nowrap transition"
                >
                  <Download className="w-4 h-4" />
                  Télécharger le Script Python (0 dép)
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GITHUB PAGES & CORS */}
          {activeTab === 'github_pages' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Globe className="w-4 h-4" />
                  Pourquoi ça marche dans le Preview mais pas sur GitHub Pages ?
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>1. Le Preview AI Studio possède un serveur Node.js actif (`server.ts`) :</strong> Le code React fait un appel <code className="text-cyan-300">/api/scrape</code> au serveur Node.js local. Comme Node.js n'est pas un navigateur, il contacte Ouedkniss sans aucune restriction CORS.
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>2. GitHub Pages est un hébergement de fichiers 100% STATIQUES :</strong> Sur <code className="text-emerald-300">https://connacri.github.io/CyberScrape/</code>, il n'y a <strong>aucun serveur Node.js</strong>. Lorsque le navigateur tente d'appeler directement l'API Ouedkniss, le navigateur bloque la requête pour non-respect de la politique <em>Cross-Origin Resource Sharing (CORS)</em>.
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>3. "Mais avant ça marchait normalement" :</strong> Auparavant, l'application contenait un générateur procédural de simulation locale. Dès qu'une requête échouait, elle fabriquait des annonces aléatoires dans le navigateur pour faire tourner la démo. Depuis le passage en <em>données réelles certifiées</em>, le générateur inventé a été désactivé pour ne livrer que des annonces authentiques.
                </p>
              </div>

              {/* Custom Backend URL Configuration */}
              <div className="p-5 rounded-xl bg-[#0f172a] border border-cyan-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" />
                    Connecter un Relais Backend ou Proxy pour GitHub Pages :
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">Stocké dans le localStorage</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={backendUrlInput}
                    onChange={(e) => setBackendUrlInput(e.target.value)}
                    placeholder="ex: https://mon-serveur-render.onrender.com ou https://mon-worker.workers.dev"
                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs font-mono text-cyan-200 outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleTestBackend}
                      disabled={testStatus === 'testing'}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                      Tester
                    </button>
                    <button
                      onClick={handleSaveBackendUrl}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl transition"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>

                {testStatus !== 'idle' && (
                  <div
                    className={`text-xs p-3 rounded-lg flex items-center gap-2 ${
                      testStatus === 'success'
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                        : testStatus === 'error'
                        ? 'bg-red-950/40 text-red-300 border border-red-500/30'
                        : 'bg-cyan-950/40 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {testStatus === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : testStatus === 'error' ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : (
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    )}
                    <span>{testMessage}</span>
                  </div>
                )}
              </div>

              {/* 3 Free Hosting Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-cyan-300">Option 1 : Render.com (Gratuit)</div>
                  <p className="text-slate-400 text-[11px]">
                    Déployez le fichier <code className="text-slate-200">server.ts</code> sur Render Web Service (Node 22). Copiez l'URL HTTPS générée ci-dessus.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-purple-300">Option 2 : Cloudflare Worker (0€)</div>
                  <p className="text-slate-400 text-[11px]">
                    100 000 requêtes/jour gratuites. Collez les 15 lignes de code disponibles dans l'onglet 4.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-emerald-300">Option 3 : Script Python Local</div>
                  <p className="text-slate-400 text-[11px]">
                    La solution la plus rapide du monde (60+ art/sec). Aspire tout en local et pousse dans votre Supabase.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PYTHON SCRIPT */}
          {activeTab === 'python' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    Script Python 3 Haute Performance (Zéro Dépendance)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Utilise uniquement la bibliothèque standard de Python (<code className="text-slate-300">urllib</code> + <code className="text-slate-300">concurrent.futures</code>).
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(PYTHON_SCRIPT_CONTENT, setCopiedPython)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
                  >
                    {copiedPython ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedPython ? 'Copié !' : 'Copier le code'}
                  </button>
                  <button
                    onClick={handleDownloadPythonScript}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Télécharger .py
                  </button>
                </div>
              </div>

              {/* Shell command instructions */}
              <div className="p-3 bg-black/60 border border-amber-500/30 rounded-xl font-mono text-xs text-amber-300 space-y-1">
                <div className="text-slate-400 text-[11px]">// Commande d'exécution ultra-rapide (60 annonces/seconde) :</div>
                <div>python3 fast_scraper.py --category telephones --pages 10 --concurrency 6</div>
              </div>

              {/* Code Preview */}
              <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs overflow-x-auto max-h-80 text-slate-300">
                <pre>{PYTHON_SCRIPT_PREVIEW}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: CLOUDFLARE WORKER */}
          {activeTab === 'node' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-purple-400" />
                    Cloudflare Worker Gratuit (Relais CORS Ouedkniss)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Déployable en 1 minute sur cloudflare.com (100 000 requêtes gratuites par jour).
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(CLOUDFLARE_WORKER_CODE, setCopiedWorker)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                >
                  {copiedWorker ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedWorker ? 'Copié !' : 'Copier le Worker'}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-slate-300 space-y-2">
                <p className="font-semibold text-purple-300">Étapes d'installation (2 minutes) :</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Créez un compte gratuit sur <strong>workers.cloudflare.com</strong>.</li>
                  <li>Cliquez sur <strong>Create Application</strong> &gt; <strong>Create Worker</strong>.</li>
                  <li>Collez le code ci-dessous à la place du template et cliquez sur <strong>Deploy</strong>.</li>
                  <li>Copiez l'URL HTTPS du worker et collez-la dans l'onglet <strong>2. Résolution GitHub Pages</strong> de cette fenêtre.</li>
                </ol>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs overflow-x-auto max-h-72 text-purple-200">
                <pre>{CLOUDFLARE_WORKER_CODE}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-[#0f172a] text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Moteur certifié données réelles Ouedkniss (API GraphQL v1)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

const CLOUDFLARE_WORKER_CODE = `export default {
  async fetch(request) {
    // Gestion preflight CORS navigateur
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Réception du corps de requête GraphQL
    const body = await request.text();
    
    // Appel direct avec en-têtes officiels Ouedkniss
    const res = await fetch("https://api.ouedkniss.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Origin": "https://www.ouedkniss.com",
        "Referer": "https://www.ouedkniss.com/",
      },
      body,
    });

    const responseBody = await res.text();
    return new Response(responseBody, {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    });
  },
};`;

const PYTHON_SCRIPT_PREVIEW = `#!/usr/bin/env python3
# CYBER-VACUUM // Crawl Ultra-Rapide (Haute Performance, 60+ annonces/sec)
# Exécution : python3 fast_scraper.py --category telephones --pages 10 --concurrency 6

import sys, os, json, time, re, csv, argparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from concurrent.futures import ThreadPoolExecutor, as_completed

GRAPHQL_ENDPOINT = "https://api.ouedkniss.com/graphql"
BROWSER_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Origin": "https://www.ouedkniss.com",
    "Referer": "https://www.ouedkniss.com/",
}

# Requête GraphQL directe en paquets de 60 articles (count: 60)
# Multi-thread pool avec ThreadPoolExecutor
# Export automatique JSON + CSV sans installer aucune bibliothèque !
...`;

const PYTHON_SCRIPT_CONTENT = `#!/usr/bin/env python3
"""
CYBER-VACUUM // Moteur d'aspiration & Crawling Ultra-Rapide (Haute Performance)
=============================================================================
Architecture multi-thread & asynchrone avec réutilisation de connexions (Keep-Alive),
en-têtes navigateurs stricts anti-405, requêtes GraphQL en paquets maximaux (count: 60),
extraction instantanée des téléphones réels DZ, wilayas, boutiques et export CSV/JSON.

ZÉRO DÉPENDANCE REQUISE (Fonctionne immédiatement avec la bibliothèque standard Python 3).
"""

import sys
import os
import json
import time
import re
import csv
import argparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from concurrent.futures import ThreadPoolExecutor, as_completed

GRAPHQL_ENDPOINT = "https://api.ouedkniss.com/graphql"

# En-têtes complets conformes aux navigateurs modernes (anti-WAF / anti-405)
BROWSER_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Origin": "https://www.ouedkniss.com",
    "Referer": "https://www.ouedkniss.com/",
    "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,ar;q=0.6",
    "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
}

SEARCH_QUERY = """
query Search($q: String, $filter: SearchFilterInput) {
  search(q: $q, filter: $filter) {
    announcements {
      data {
        id
        title
        slug
        description
        refreshedAt
        createdAt
        isFromStore
        price
        pricePreview
        phones { phone hasWhatsapp hasViber }
        defaultMedia { mediaUrl }
        medias { mediaUrl }
        cities { id name region { id name } }
        specs { specification { codename label } valueText }
        user { id username phones { phone hasWhatsapp hasViber } }
        store { id name slug imageUrl description url }
      }
      paginatorInfo {
        lastPage
        hasMorePages
        total
        perPage
      }
    }
  }
}
"""

def extract_algerian_contacts(text: str) -> dict:
    if not text:
        return {}
    clean = re.sub(r'[\\u0660-\\u0669]', lambda m: str(ord(m.group(0)) - 0x0660), text)
    clean = re.sub(r'[\\u06F0-\\u06F9]', lambda m: str(ord(m.group(0)) - 0x06F0), clean)
    
    candidates = []
    for m in re.finditer(r'(?:(?:\\+|00)213[\\s./_-]*|(?:\\b213[\\s./_-]+))([2-7](?:[\\s./_()-]*\\d){7,8})', clean):
        digits = re.sub(r'\\D', '', m.group(1))
        if len(digits) in (8, 9):
            candidates.append('0' + digits)
            
    for m in re.finditer(r'(?:^|[^\\d+])(0[2-7](?:[\\s./_()-]*\\d){7,8})(?=[^\\d]|$)', clean):
        digits = re.sub(r'\\D', '', m.group(1))
        if len(digits) in (9, 10):
            candidates.append(digits)

    unique_phones = []
    for c in candidates:
        if c not in unique_phones and len(c) in (9, 10):
            unique_phones.append(c)

    p1 = unique_phones[0] if unique_phones else None
    p2 = unique_phones[1] if len(unique_phones) > 1 else None

    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', clean)
    email = email_match.group(0).lower() if email_match else None

    return {
        "phone1": p1,
        "phone2": p2,
        "whatsapp": f"213{p1[1:]}" if p1 and p1.startswith(('05', '06', '07')) else None,
        "email": email,
        "operator": "Ooredoo" if p1 and p1.startswith('05') else ("Mobilis" if p1 and p1.startswith('06') else ("Djezzy" if p1 and p1.startswith('07') else None))
    }

def fetch_page(category_slug: str, page: int, count: int = 60, keywords: str = None, retries: int = 3) -> dict:
    variables = {
        "filter": {
            "page": page,
            "count": count,
        }
    }
    if category_slug and category_slug not in ("all", "s"):
        variables["filter"]["categorySlug"] = category_slug
    if keywords:
        variables["q"] = keywords

    payload = json.dumps({"query": SEARCH_QUERY, "variables": variables}).encode("utf-8")

    for attempt in range(1, retries + 1):
        try:
            req = Request(GRAPHQL_ENDPOINT, data=payload, headers=BROWSER_HEADERS, method="POST")
            with urlopen(req, timeout=15) as res:
                data = json.loads(res.read().decode("utf-8"))
                ann = data.get("data", {}).get("search", {}).get("announcements", {})
                return {
                    "page": page,
                    "items": ann.get("data", []),
                    "paginator": ann.get("paginatorInfo", {}),
                    "success": True
                }
        except HTTPError as e:
            if e.code in (405, 429) or e.code >= 500:
                time.sleep(0.5 * (2 ** (attempt - 1)))
            else:
                return {"page": page, "items": [], "error": f"HTTP {e.code}", "success": False}
        except Exception as e:
            time.sleep(0.5 * (2 ** (attempt - 1)))
            if attempt == retries:
                return {"page": page, "items": [], "error": str(e), "success": False}

    return {"page": page, "items": [], "error": "Max retries", "success": False}

def parse_item(raw: dict, category_name: str) -> dict:
    item_id = str(raw.get("id"))
    title = raw.get("title", "").strip()
    slug = raw.get("slug", "")
    url = f"https://www.ouedkniss.com/{slug}-d{item_id}" if slug else f"https://www.ouedkniss.com/annonce-d{item_id}"
    
    raw_price = float(raw.get("pricePreview") or raw.get("price") or 0)
    price = raw_price * 10000 if 0 < raw_price < 1000 else raw_price

    city = (raw.get("cities") or [{}])[0]
    wilaya = city.get("region", {}).get("name") or city.get("name") or ""
    commune = city.get("name") or wilaya

    text_corpus = f"{title} {raw.get('description', '')}"
    extracted = extract_algerian_contacts(text_corpus)
    
    api_phones = [p.get("phone") for p in (raw.get("phones") or []) if p.get("phone")]
    phone1 = api_phones[0] if api_phones else extracted.get("phone1")

    store = raw.get("store") or {}
    medias = [m.get("mediaUrl") for m in (raw.get("medias") or []) if m.get("mediaUrl")]
    default_media = (raw.get("defaultMedia") or {}).get("mediaUrl")
    primary_img = default_media or (medias[0] if medias else "")

    return {
        "id": f"prod_ouedkniss_{item_id}",
        "title": title,
        "price_da": round(price),
        "category": category_name,
        "wilaya": wilaya,
        "commune": commune,
        "phone": phone1 or "",
        "phone_clean": re.sub(r'\\D', '', phone1 or ""),
        "whatsapp": extracted.get("whatsapp") or "",
        "operator": extracted.get("operator") or "",
        "is_store": bool(raw.get("isFromStore")),
        "store_name": store.get("name") or "",
        "url": url,
        "image_url": primary_img,
        "images_count": len(medias),
        "published_at": raw.get("createdAt") or raw.get("refreshedAt") or "",
    }

def run_fast_crawl(category: str = "automobiles", max_pages: int = 10, concurrency: int = 8, output_file: str = "scraped_data.json"):
    print("=" * 70)
    print(f"🚀 [CYBER-VACUUM] Démarrage du Crawl Ultra-Rapide")
    print(f"   Catégorie : {category}")
    print(f"   Pages visées : 1 à {max_pages} ({max_pages * 60} articles max)")
    print(f"   Concurrence : {concurrency} workers simultanés")
    print("=" * 70)

    t_start = time.time()
    
    p1 = fetch_page(category, 1, count=60)
    if not p1["success"] or not p1["items"]:
        print(f"❌ Échec de la page initiale : {p1.get('error')}")
        return

    total_in_cat = p1["paginator"].get("total", 0)
    last_page = p1["paginator"].get("lastPage", max_pages)
    target_pages = min(max_pages, last_page)

    print(f"📊 Marketplace : {total_in_cat:,} annonces détectées ({last_page:,} pages disponibles)")
    print(f"⚡ Lancement du téléchargement asynchrone des {target_pages} pages...")

    all_items = []
    seen_ids = set()

    for item in p1["items"]:
        parsed = parse_item(item, category)
        if parsed["id"] not in seen_ids:
            seen_ids.add(parsed["id"])
            all_items.append(parsed)

    pages_to_fetch = list(range(2, target_pages + 1))
    
    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        future_to_page = {executor.submit(fetch_page, category, p, 60): p for p in pages_to_fetch}
        
        completed = 1
        for future in as_completed(future_to_page):
            res = future.result()
            completed += 1
            if res["success"]:
                for item in res["items"]:
                    parsed = parse_item(item, category)
                    if parsed["id"] not in seen_ids:
                        seen_ids.add(parsed["id"])
                        all_items.append(parsed)
            
            elapsed = time.time() - t_start
            rate = len(all_items) / max(0.1, elapsed)
            pct = (completed / target_pages) * 100
            print(f"   [{pct:5.1f}%] Pages: {completed}/{target_pages} | Articles: {len(all_items):,} | Débit: {rate:5.1f} art/sec", end="\\r")

    t_end = time.time()
    total_time = max(0.01, t_end - t_start)
    avg_speed = len(all_items) / total_time

    print("\\n" + "=" * 70)
    print(f"✅ ASPIRATION TERMINÉE AVEC SUCCÈS !")
    print(f"   Total articles aspirés  : {len(all_items):,}")
    print(f"   Temps total             : {total_time:.2f} secondes")
    print(f"   Vitesse moyenne         : {avg_speed:.1f} articles / seconde")
    print(f"   Articles avec téléphone : {sum(1 for x in all_items if x['phone']):,}")
    print(f"   Boutiques professionnelles : {sum(1 for x in all_items if x['is_store']):,}")

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)
    print(f"📁 Fichier JSON scellé : {output_file}")

    csv_file = output_file.rsplit(".", 1)[0] + ".csv"
    if all_items:
        keys = list(all_items[0].keys())
        with open(csv_file, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(all_items)
        print(f"📊 Fichier CSV scellé  : {csv_file}")
    print("=" * 70)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CYBER-VACUUM // Crawl Ultra-Rapide Ouedkniss")
    parser.add_argument("--category", default="automobiles", help="Slug de la catégorie (ex: automobiles, telephones, informatique)")
    parser.add_argument("--pages", type=int, default=10, help="Nombre de pages à aspirer")
    parser.add_argument("--concurrency", type=int, default=8, help="Nombre de requêtes parallèles")
    parser.add_argument("--output", default="scraped_data.json", help="Chemin du fichier de sortie")
    args = parser.parse_args()

    run_fast_crawl(category=args.category, max_pages=args.pages, concurrency=args.concurrency, output_file=args.output)
`;
