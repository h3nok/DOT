import React, { useState } from 'react';
import { PremiumButton, PremiumTextArea } from '../../../../shared/components/ui/design-system-primitives';
import { Terminal, Briefcase, Globe, Cpu, ArrowUpRight, Sparkles } from 'lucide-react';

interface FootprintInjectorProps {
  onIngest: (type: 'dev_log' | 'venture' | 'research' | 'code', customText?: string) => void;
  disabled: boolean;
}

const CATEGORIES = [
  {
    id: 'dev_log' as const,
    label: 'Dev Log',
    icon: <Terminal className="w-3.5 h-3.5" />,
    colorClass: 'text-sky-400 border-sky-500/20 bg-sky-500/5',
    activeColorClass: 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-[0_0_12px_rgba(37,99,235,0.15)]',
    placeholder: 'e.g. Optimized on-device SQLite-Vec vector queries down to 0.42ms...',
    preset: 'Architected a custom regional telemetry stream parser inside the SQLite-Vec index to allow low-latency multi-agent discovery over our Austin Node 0x01. Queries execute in 0.45ms.'
  },
  {
    id: 'venture' as const,
    label: 'Venture',
    icon: <Briefcase className="w-3.5 h-3.5" />,
    colorClass: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
    activeColorClass: 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.15)]',
    placeholder: 'e.g. Architected Sullix decentralized crypto labor escrow smart contract...',
    preset: 'Proposing Sullix matching VM escrow smart contract layer built on localized civic consensus. The protocol routes decentralized crypto labor contracts and guarantees ZK privacy.'
  },
  {
    id: 'research' as const,
    label: 'Whitepaper',
    icon: <Globe className="w-3.5 h-3.5" />,
    colorClass: 'text-sky-400 border-sky-500/20 bg-sky-500/5',
    activeColorClass: 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.15)]',
    placeholder: 'e.g. Published zero-knowledge peer verification protocol draft...',
    preset: "Drafted 'Decentralized American Peer Topology: Zero-Knowledge Multi-Agent Orchestration over Regional WebRTC Mesh Grids'. The paper details O(1) trust bounds."
  },
  {
    id: 'code' as const,
    label: 'Git Repo',
    icon: <Cpu className="w-3.5 h-3.5" />,
    colorClass: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    activeColorClass: 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.15)]',
    placeholder: 'e.g. Refactored parallel PGP decryption pipelines inside node store...',
    preset: 'Pushed commit 0x9E1B8A4F: Refactored the core vector ingestion engine, optimizing memory layouts and parallel PGP decryption pipelines inside our on-device model store.'
  }
];

export const FootprintInjector: React.FC<FootprintInjectorProps> = ({ onIngest, disabled }) => {
  const [activeTab, setActiveTab] = useState<'dev_log' | 'venture' | 'research' | 'code'>('dev_log');
  const [textInput, setTextString] = useState('');

  const activeCategory = CATEGORIES.find(cat => cat.id === activeTab) || CATEGORIES[0];

  const handleAutofillPreset = () => {
    setTextString(activeCategory.preset);
  };

  const handleExecuteIngestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || disabled) return;

    // Call the ingestion sequence in UserProfilePage
    onIngest(activeTab, textInput.trim());

    // Clear input after initiating ingestion
    setTextString('');
  };

  return (
    <div className="flex flex-col h-full bg-card/10 border border-border/30 rounded-xl p-4 relative overflow-hidden backdrop-blur-md">
      <div className="flex items-center justify-between mb-3 border-b border-border/10 pb-2">
        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-sky-400/90 font-bold">
          <Terminal className="w-3 h-3 text-sky-400" />
          <span>DECOUPLED_FOOTPRINT_INGESTOR.EXE</span>
        </div>
        <button
          type="button"
          onClick={handleAutofillPreset}
          disabled={disabled}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[8.5px] uppercase tracking-widest text-muted-foreground hover:text-sky-400 border border-border/20 hover:border-sky-500/20 transition-all duration-300 bg-background/30 disabled:opacity-40"
        >
          <Sparkles className="w-2.5 h-2.5" />
          <span>Autofill Preset Feed</span>
        </button>
      </div>

      <form onSubmit={handleExecuteIngestion} className="flex flex-col flex-1 space-y-3">
        {/* Horizontal Category Pill Tabs */}
        <div className="grid grid-cols-4 gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                setActiveTab(cat.id);
                // Clear inputs if they match another tab's preset to prevent copyover
                const isPreviousPreset = CATEGORIES.some(c => c.preset === textInput);
                if (isPreviousPreset || textInput.trim() === '') {
                  setTextString('');
                }
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg border text-[9px] font-mono uppercase tracking-wider font-extrabold transition-all duration-300 disabled:opacity-40
                ${activeTab === cat.id ? cat.activeColorClass : `border-border/30 text-muted-foreground hover:border-foreground/20 hover:bg-foreground/5 bg-background/20`}
              `}
            >
              {cat.icon}
              <span className="hidden sm:inline">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Text Area Input Console */}
        <div className="relative flex-1">
          <PremiumTextArea
            disabled={disabled}
            value={textInput}
            onChange={(e) => setTextString(e.target.value)}
            placeholder={activeCategory.placeholder}
            rows={3}
            maxLength={280}
            className="w-full h-full font-mono text-[10.5px]"
          />
          {textInput.length > 0 && (
            <span className="absolute bottom-2 right-2 text-[8px] font-mono text-muted-foreground/80 bg-black/50 px-1.5 py-0.5 rounded border border-border/10 z-20">
              {textInput.length}/280
            </span>
          )}
        </div>

        {/* Premium Core Action Button */}
        <PremiumButton
          type="submit"
          disabled={disabled || !textInput.trim()}
          variant="primary"
          glow
          shimmer
          icon={<ArrowUpRight className="w-3.5 h-3.5" />}
          className="w-full text-[10px] font-mono uppercase tracking-widest h-10"
        >
          INGEST INTO DIGITAL TWIN
        </PremiumButton>
      </form>
    </div>
  );
};

export default FootprintInjector;
