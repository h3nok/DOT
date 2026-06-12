import React from 'react';

interface JsonModelExplorerProps {
  selectedNodeId: string;
  selectedNode: {
    id: string;
    label: string;
    type: string;
    description: string;
    properties?: Record<string, any>;
  };
}

export const JsonModelExplorer: React.FC<JsonModelExplorerProps> = ({ selectedNodeId, selectedNode }) => {
  // Prettify and highlight JSON
  const highlightJSON = (obj: any) => {
    const jsonStr = JSON.stringify(obj, null, 2);
    const escaped = jsonStr
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'json-string';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        } else {
          cls = 'json-number';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  const codeData = {
    id: selectedNode.id,
    label: selectedNode.label,
    type: selectedNode.properties?.nodeType || selectedNode.type,
    properties: selectedNode.properties || {},
  };

  return (
    <div className="lg:col-span-1 p-5 bg-black/40 border-t lg:border-t-0 lg:border-l border-border/15 flex flex-col justify-between space-y-4">
      <div className="space-y-3.5">
        {/* Header Tab */}
        <div className="flex items-center justify-between pb-2 border-b border-border/10">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-[9px] font-bold text-slate-300 uppercase tracking-widest">
              DATA_MODEL://{selectedNodeId}.json
            </span>
          </div>
          <span className="font-mono text-[8px] text-muted-foreground bg-slate-500/5 border border-border/20 px-1 py-0.5 rounded font-extrabold">
            PGP_ENCRYPTED
          </span>
        </div>

        {/* Beautiful Interactive Syntax-Highlighted Code Container */}
        <div className="rounded-lg bg-black/80 border border-border/20 p-3 h-48 overflow-y-auto font-mono text-[10px] leading-normal shadow-inner scrollbar-thin">
          <pre className="whitespace-pre-wrap font-mono text-slate-300 break-all select-text selection:bg-sky-500/30">
            <code dangerouslySetInnerHTML={{
              __html: highlightJSON(codeData)
            }} />
          </pre>
        </div>
      </div>

      {/* Semantic Node Description Context */}
      <div className="p-3 rounded-lg bg-sky-500/5 border border-sky-500/10 space-y-1.5">
        <span className="font-mono text-[9px] font-extrabold text-sky-400 block uppercase tracking-wider">
          Semantic Context
        </span>
        <p className="text-muted-foreground text-[10.5px] leading-relaxed">
          {selectedNode.description}
        </p>
      </div>
    </div>
  );
};
