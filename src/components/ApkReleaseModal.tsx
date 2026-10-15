import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  ExternalLink,
  ShieldCheck,
  Key,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  Play,
  Terminal,
  Layers,
  ArrowRight,
  GitBranch,
} from 'lucide-react';

interface ApkReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkReleaseModal: React.FC<ApkReleaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const repoReleasesUrl = 'https://github.com/Connacri/CyberScrape/releases';
  const repoActionsUrl = 'https://github.com/Connacri/CyberScrape/actions/workflows/build-apk.yml';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(repoReleasesUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const tagCommand = 'git tag v1.0.0 && git push origin v1.0.0';
  const handleCopyCmd = () => {
    navigator.clipboard.writeText(tagCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-950 border border-emerald-500/40 shadow-[0_0_60px_rgba(0,255,102,0.2)] p-5 sm:p-7 text-slate-100 font-sans space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-black border border-emerald-400/60 shadow-[0_0_15px_rgba(0,255,102,0.35)] shrink-0 flex items-center justify-center p-1">
              <img
                src="/icon.png"
                alt="CYBER-VACUUM Icon"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Application Android APK Signée</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-[#00ff88] border border-emerald-500/30">
                  CI/CD GITHUB
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Compilation, Signature Keystore & Publication GitHub Releases
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border border-emerald-500/40 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                TÉLÉCHARGEMENT DIRECT DEPUIS LES RELEASES
              </span>
              <p className="text-xs text-slate-300 mt-1">
                L'APK compilé et signé officiellement est déposé directement dans les <strong>Releases GitHub</strong> du dépôt Connacri/CyberScrape.
              </p>
            </div>
            <a
              href={repoReleasesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-[#00ff88] text-slate-950 font-mono font-black text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,102,0.4)] hover:brightness-110 transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 fill-slate-950" />
              <span>Ouvrir les Releases</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pt-1 border-t border-slate-800">
            <span className="truncate flex-1">{repoReleasesUrl}</span>
            <button
              onClick={handleCopyLink}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>
        </div>

        {/* Diagnostic: Why no APK found yet? */}
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Pourquoi aucun APK n'est encore visible dans vos Releases GitHub ?
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Par défaut, GitHub requiert <strong>2 vérifications simples</strong> pour que le workflow automatique publie le fichier APK dans l'onglet Releases :
              </p>
              <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside pl-1">
                <li>
                  <strong className="text-white">Permission d'écriture GitHub Actions :</strong>
                  <br />
                  Allez sur votre dépôt GitHub : <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded">Settings &gt; Actions &gt; General &gt; Workflow permissions</code>, sélectionnez <strong className="text-emerald-400">"Read and write permissions"</strong> puis Enregistrer. Sans cela, GitHub bloque la création automatique de releases.
                </li>
                <li>
                  <strong className="text-white">Déclencher la compilation en 1 clic :</strong>
                  <br />
                  Rendez-vous dans l'onglet <strong className="text-cyan-300">Actions</strong> de votre dépôt GitHub &gt; Sélectionnez <strong>"Build & Sign Android APK"</strong> &gt; Cliquez sur le bouton gris <strong>"Run workflow"</strong> &gt; Validez avec le bouton vert. L'APK sera généré et publié dans les Releases en ~2 minutes !
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Alternative: Trigger via Git Tag */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ou déclencher via un Tag Git :</span>
            </span>
            <button
              onClick={handleCopyCmd}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCmd ? 'Copié' : 'Copier commande'}</span>
            </button>
          </div>
          <pre className="p-2.5 rounded-xl bg-black border border-slate-800 text-[#00ff88] font-mono text-xs overflow-x-auto">
            {tagCommand}
          </pre>
        </div>

        {/* Secrets Configuration Summary */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 font-mono flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <span>VARIABLES SECRETS GITHUB RECOMMANDÉES (Settings &gt; Secrets and variables) :</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-emerald-400 font-bold block">ANDROID_KEYSTORE_BASE64</span>
              <span className="text-[11px] text-slate-400">Keystore encodé base64 (auto-généré si vide)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-emerald-400 font-bold block">KEYSTORE_PASSWORD / KEY_ALIAS</span>
              <span className="text-[11px] text-slate-400">Mots de passe et alias de signature</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-cyan-400 font-bold block">VITE_SUPABASE_URL &amp; ANON_KEY</span>
              <span className="text-[11px] text-slate-400">Connexion base de données Supabase</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-cyan-400 font-bold block">GEMINI_API_KEY</span>
              <span className="text-[11px] text-slate-400">Clé API Google Gemini pour le mode IA</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <a
            href={repoActionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Aller au Workflow GitHub Actions</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
