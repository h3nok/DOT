import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

interface TerminalLogsProps {
  logs: string[];
}

export const TerminalLogs: React.FC<TerminalLogsProps> = ({ logs }) => {
  const terminalScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider">
        <Terminal className="w-3.5 h-3.5 animate-pulse" />
        <span>COGNITIVE PIPELINE TELEMETRY</span>
      </div>
      {/* Terminal Logs Display */}
      <div ref={terminalScrollRef} className="h-28 overflow-y-auto bg-black rounded-lg p-3 font-mono text-[10px] leading-relaxed text-emerald-400 border border-border/20 space-y-1 scrollbar-thin">
        {logs.map((log, i) => (
          <div key={i} className="whitespace-pre-wrap">{log}</div>
        ))}
      </div>
    </div>
  );
};
