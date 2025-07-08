import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypePrismPlus from 'rehype-prism-plus';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../../contexts/SimpleThemeContext';
import 'katex/dist/katex.min.css';

interface EnhancedMarkdownProps {
  content: string;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
  lineHeight?: 'normal' | 'relaxed' | 'loose';
  allowMath?: boolean;
  allowCodeHighlight?: boolean;
  codeTheme?: 'auto' | 'light' | 'dark';
}

const EnhancedMarkdown: React.FC<EnhancedMarkdownProps> = ({
  content,
  className = '',
  maxWidth = 'xl',
  fontSize = 'base',
  lineHeight = 'relaxed',
  allowMath = true,
  allowCodeHighlight = true,
  codeTheme = 'auto'
}) => {
  const { theme } = useTheme();
  
  // Determine if we should use dark theme
  const isDark = theme === 'dark' || theme === 'midnight' || 
    (codeTheme === 'auto' && theme.includes('dark'));

  // Max width classes
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full'
  };

  // Font size classes
  const fontSizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  // Line height classes  
  const lineHeightClasses = {
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
    loose: 'leading-loose'
  };

  // Remark and rehype plugins
  const getPlugins = () => {
    const remarkPlugins: any[] = [remarkGfm];
    const rehypePlugins: any[] = [];

    if (allowMath) {
      remarkPlugins.push(remarkMath);
      rehypePlugins.push(rehypeKatex);
    }

    if (allowCodeHighlight) {
      rehypePlugins.push([rehypePrismPlus, { ignoreMissing: true }]);
    }

    return { remarkPlugins, rehypePlugins };
  };

  const { remarkPlugins, rehypePlugins } = getPlugins();

  // Custom components for rendering
  const components = {
    // Enhanced code blocks with syntax highlighting
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      if (!inline && match && allowCodeHighlight) {
        return (
          <div className="my-6">
            <div className="relative">
              {/* Language label */}
              {language && (
                <div className="absolute top-0 left-4 -translate-y-1/2 px-3 py-1 bg-muted text-muted-foreground text-xs font-mono rounded-md border border-border">
                  {language}
                </div>
              )}
              
              <SyntaxHighlighter
                style={isDark ? oneDark : oneLight}
                language={language}
                PreTag="div"
                className="!bg-card !border !border-border !rounded-lg !p-4 !pt-6"
                customStyle={{
                  margin: 0,
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace'
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      }

      // Inline code
      return (
        <code 
          className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded font-mono text-sm border border-border"
          {...props}
        >
          {children}
        </code>
      );
    },

    // Enhanced headings with proper spacing and hierarchy
    h1: ({ children }: any) => (
      <h1 className="text-3xl font-bold mb-6 mt-8 text-foreground border-b border-border pb-2">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-semibold mb-4 mt-6 text-foreground">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-semibold mb-3 mt-5 text-foreground">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-lg font-medium mb-2 mt-4 text-foreground">
        {children}
      </h4>
    ),

    // Enhanced paragraphs
    p: ({ children }: any) => (
      <p className="mb-4 text-foreground/90">
        {children}
      </p>
    ),

    // Enhanced lists
    ul: ({ children }: any) => (
      <ul className="mb-4 pl-6 space-y-1 list-disc text-foreground/90">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="mb-4 pl-6 space-y-1 list-decimal text-foreground/90">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="text-foreground/90">
        {children}
      </li>
    ),

    // Enhanced blockquotes
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-primary pl-4 my-6 italic text-muted-foreground bg-muted/30 py-2 rounded-r">
        {children}
      </blockquote>
    ),

    // Enhanced tables
    table: ({ children }: any) => (
      <div className="my-6 overflow-x-auto">
        <table className="w-full border-collapse border border-border rounded-lg">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-muted">
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody>
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="border-b border-border">
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
      <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="border border-border px-4 py-2 text-foreground/90">
        {children}
      </td>
    ),

    // Enhanced links
    a: ({ href, children }: any) => (
      <a 
        href={href}
        className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
        target={href?.startsWith('http') ? '_blank' : '_self'}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),

    // Enhanced horizontal rule
    hr: () => (
      <hr className="my-8 border-border" />
    ),

    // Math display components (handled by rehype-katex)
    div: ({ className, children, ...props }: any) => {
      if (className === 'math math-display') {
        return (
          <div className="my-6 overflow-x-auto">
            <div className="flex justify-center">
              <div className={className} {...props}>
                {children}
              </div>
            </div>
          </div>
        );
      }
      return <div className={className} {...props}>{children}</div>;
    }
  };

  return (
    <div className={`
      markdown-content
      ${maxWidthClasses[maxWidth]}
      ${fontSizeClasses[fontSize]}
      ${lineHeightClasses[lineHeight]}
      mx-auto
      ${className}
    `}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default EnhancedMarkdown;
