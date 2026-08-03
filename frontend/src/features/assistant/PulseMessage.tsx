import { CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PulseMessageItem } from './usePulse';

const formatInline = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

type Block =
  | { type: 'header'; text: string; level: number }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'hr' }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'section_title'; text: string }
  | { type: 'paragraph'; text: string };

const parseTableLine = (line: string): string[] =>
  line
    .split('|')
    .map((c) => c.trim())
    .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1 || (arr.length <= 2 && c.length > 0));

const parseBlocks = (content: string): Block[] => {
  const rawLines = content.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Markdown Table Detection
    if (
      trimmed.includes('|') &&
      (trimmed.startsWith('|') || (i + 1 < rawLines.length && rawLines[i + 1].trim().includes('|')))
    ) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().includes('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const headers = parseTableLine(tableLines[0]);
        const dataRows = tableLines
          .slice(1)
          .filter((l) => !/^\|?\s*:?-+:?/.test(l.replaceAll(/\s+/g, '')))
          .map(parseTableLine);
        blocks.push({ type: 'table', headers, rows: dataRows });
        continue;
      }
    }

    // Horizontal Divider
    if (/^([-*_]){3,}$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Blockquote Callout
    if (/^>\s*/.test(trimmed)) {
      let quoteText = trimmed.replace(/^>\s*/, '');
      i++;
      while (i < rawLines.length && /^>\s*/.test(rawLines[i].trim())) {
        quoteText += ' ' + rawLines[i].trim().replace(/^>\s*/, '');
        i++;
      }
      blocks.push({ type: 'quote', text: quoteText });
      continue;
    }

    // Section Headers
    if (/^#{1,3}\s+/.test(trimmed)) {
      const level = (trimmed.match(/^#{1,3}/) || ['#'])[0].length;
      blocks.push({ type: 'header', text: trimmed.replace(/^#{1,3}\s+/, ''), level });
      i++;
      continue;
    }

    // Bullet Lists
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < rawLines.length && /^[-*]\s+/.test(rawLines[i].trim())) {
        items.push(rawLines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    // Standalone bold titles like **Project:** or **Recent Workspace Activity**
    if (/^\*\*[^*]+\*\*:?$/.test(trimmed)) {
      blocks.push({ type: 'section_title', text: trimmed });
      i++;
      continue;
    }

    blocks.push({ type: 'paragraph', text: trimmed });
    i++;
  }

  return blocks;
};

const FormattedContent = ({ content }: { content: string }) => {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-2.5 text-sm leading-relaxed">
      {blocks.map((block, idx) => {
        if (block.type === 'header') {
          return (
            <h4
              key={idx}
              className="mt-4 mb-1 text-xs font-semibold uppercase tracking-wider text-primary border-b border-border/40 pb-1 flex items-center gap-1.5"
            >
              <Sparkles size={13} className="text-primary shrink-0" />
              {formatInline(block.text)}
            </h4>
          );
        }

        if (block.type === 'table') {
          return (
            <div
              key={idx}
              className="my-3 overflow-x-auto rounded-xl border border-border/60 bg-card shadow-2xs"
            >
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/80 text-muted-foreground border-b border-border/60 font-medium">
                  <tr>
                    {block.headers.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="px-3 py-2 font-semibold text-foreground/80 tracking-wider uppercase text-[10px] whitespace-nowrap"
                      >
                        {formatInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {block.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-muted/40 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-foreground/90 whitespace-nowrap">
                          {formatInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote
              key={idx}
              className="my-2.5 rounded-r-xl border-l-3 border-primary bg-primary/5 px-3.5 py-2.5 text-xs text-foreground/90 font-medium"
            >
              {formatInline(block.text)}
            </blockquote>
          );
        }

        if (block.type === 'hr') {
          return <hr key={idx} className="my-3.5 border-border/50" />;
        }

        if (block.type === 'list') {
          return (
            <div key={idx} className="space-y-1 my-1">
              {block.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className="flex items-start gap-2 pl-1 text-xs sm:text-sm text-foreground/90"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/70" />
                  <span className="flex-1">{formatInline(item)}</span>
                </div>
              ))}
            </div>
          );
        }

        if (block.type === 'section_title') {
          return (
            <div
              key={idx}
              className="mt-3.5 mb-1 font-semibold text-xs uppercase tracking-wider text-muted-foreground border-b border-border/30 pb-0.5"
            >
              {formatInline(block.text)}
            </div>
          );
        }

        return (
          <p key={idx} className="text-foreground/90">
            {formatInline(block.text)}
          </p>
        );
      })}
    </div>
  );
};

export const PulseMessage = ({
  message,
  onRetry,
  children,
}: {
  message: PulseMessageItem;
  onRetry: (prompt: string) => void;
  children?: React.ReactNode;
}) => (
  <li
    className={
      message.role === 'user'
        ? 'ml-10 rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground shadow-xs'
        : 'mr-4 rounded-2xl rounded-bl-md border border-border/60 bg-card/95 backdrop-blur-xs px-4 py-3 text-sm shadow-sm'
    }
  >
    {message.role === 'user' ? (
      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
    ) : (
      <FormattedContent content={message.content} />
    )}
    {message.activities?.length ? (
      <ul className="mt-3 space-y-1 border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
        {message.activities.map((activity) => (
          <li className="flex items-center gap-1.5" key={activity}>
            <CheckCircle2 aria-hidden="true" size={13} className="text-emerald-500 shrink-0" />{' '}
            {activity}
          </li>
        ))}
      </ul>
    ) : null}
    {children}
    {message.failedPrompt ? (
      <Button
        className="mt-3"
        size="sm"
        variant="outline"
        type="button"
        onClick={() => onRetry(message.failedPrompt!)}
      >
        <RotateCcw aria-hidden="true" /> Retry
      </Button>
    ) : null}
  </li>
);

