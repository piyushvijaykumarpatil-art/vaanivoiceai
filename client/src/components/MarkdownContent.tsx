import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface MarkdownContentProps {
  content: string;
  primaryColor?: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, primaryColor = '#F59E0B' }) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Split content by code blocks: ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let blockIndex = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text preceding the code block
    if (match.index > lastIndex) {
      const textChunk = content.substring(lastIndex, match.index);
      elements.push(
        <div key={`text-${lastIndex}`} className="space-y-2">
          {renderFormattedText(textChunk, primaryColor)}
        </div>
      );
    }

    const language = match[1] || 'code';
    const code = match[2];
    const currentBlockIdx = blockIndex++;

    elements.push(
      <div
        key={`code-${match.index}`}
        className="my-3 rounded-xl overflow-hidden border border-white/15 bg-[#0e1117] shadow-xl text-left"
      >
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/5 border-b border-white/10 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span className="uppercase tracking-wider font-semibold text-[11px] text-amber-300/90">{language}</span>
          </div>
          <button
            type="button"
            onClick={() => handleCopyCode(code, currentBlockIdx)}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors text-[11px]"
            title="Copy code"
          >
            {copiedCodeIndex === currentBlockIdx ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-3.5 overflow-x-auto text-xs sm:text-sm font-mono text-emerald-300/95 leading-relaxed bg-[#0a0d12]">
          <code>{code}</code>
        </pre>
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add trailing text chunk
  if (lastIndex < content.length) {
    const trailingChunk = content.substring(lastIndex);
    elements.push(
      <div key={`text-${lastIndex}`} className="space-y-2">
        {renderFormattedText(trailingChunk, primaryColor)}
      </div>
    );
  }

  return <div className="space-y-2 text-left leading-relaxed">{elements}</div>;
};

function renderFormattedText(text: string, primaryColor: string): React.ReactNode[] {
  const lines = text.split('\n');
  const rendered: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      rendered.push(<div key={`empty-${idx}`} className="h-1.5" />);
      return;
    }

    // Headings: ###, ##, #
    if (trimmed.startsWith('### ')) {
      rendered.push(
        <h4 key={`h4-${idx}`} className="text-sm sm:text-base font-bold text-amber-300 mt-2.5 mb-1 flex items-center gap-1.5">
          <span style={{ color: primaryColor }}>▸</span>
          {renderInlineFormatting(trimmed.substring(4))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      rendered.push(
        <h3 key={`h3-${idx}`} className="text-base sm:text-lg font-bold text-white mt-3 mb-1.5 flex items-center gap-1.5 border-b border-white/10 pb-1">
          <span style={{ color: primaryColor }}>✦</span>
          {renderInlineFormatting(trimmed.substring(3))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      rendered.push(
        <h2 key={`h2-${idx}`} className="text-lg sm:text-xl font-black text-white mt-3.5 mb-2 flex items-center gap-2">
          <span>👑</span>
          {renderInlineFormatting(trimmed.substring(2))}
        </h2>
      );
      return;
    }

    // Bullet lists: - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      rendered.push(
        <div key={`li-${idx}`} className="flex items-start gap-2 pl-2 text-xs sm:text-sm text-slate-200">
          <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
          <div className="flex-1">{renderInlineFormatting(trimmed.substring(2))}</div>
        </div>
      );
      return;
    }

    // Numbered lists: 1. , 2. , etc.
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      rendered.push(
        <div key={`ol-${idx}`} className="flex items-start gap-2 pl-2 text-xs sm:text-sm text-slate-200">
          <span className="font-mono text-amber-300 font-semibold shrink-0 text-xs mt-0.5">{numMatch[1]}.</span>
          <div className="flex-1">{renderInlineFormatting(numMatch[2])}</div>
        </div>
      );
      return;
    }

    // Standard paragraph line
    rendered.push(
      <p key={`p-${idx}`} className="text-xs sm:text-sm text-slate-200">
        {renderInlineFormatting(trimmed)}
      </p>
    );
  });

  return rendered;
}

function renderInlineFormatting(str: string): React.ReactNode {
  // Parse inline `code`, **bold**, *italic*
  const tokens: React.ReactNode[] = [];
  const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let k = 0;

  while ((match = inlineRegex.exec(str)) !== null) {
    if (match.index > last) {
      tokens.push(str.substring(last, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={`code-${k++}`}
          className="px-1.5 py-0.5 rounded bg-black/60 border border-white/15 text-amber-300 font-mono text-[11px] sm:text-xs"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={`b-${k++}`} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(
        <em key={`i-${k++}`} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    last = match.index + match[0].length;
  }

  if (last < str.length) {
    tokens.push(str.substring(last));
  }

  return tokens.length > 0 ? tokens : str;
}
