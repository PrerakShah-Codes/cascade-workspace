import React from 'react';

interface KaTeXRendererProps {
  latex: string;
  block?: boolean;
  className?: string;
}

/**
 * Renders inline (`$...$`) and block (`$$...$$`) LaTeX mathematical expressions.
 * Uses `katex.renderToString` when loaded in runtime and includes a rich mathematical
 * typographic renderer so expressions always display cleanly in both editor and PDF export.
 */
const KaTeXRendererInner: React.FC<KaTeXRendererProps> = ({
  latex,
  block = false,
  className = ''
}) => {
  const formattedHtml = React.useMemo(() => {
    try {
      // Check if global katex is available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const globalKatex = (window as any).katex;
      if (globalKatex && typeof globalKatex.renderToString === 'function') {
        return globalKatex.renderToString(latex, {
          displayMode: block,
          throwOnError: false
        });
      }
    } catch {
      // Fallback to symbolic mathematical typography below
    }

    return formatSymbolicMathHtml(latex);
  }, [latex, block]);

  if (block) {
    return (
      <div
        className={`my-2 py-3 px-4 rounded-lg bg-[#161616] border border-[#4A2574]/70 text-center overflow-x-auto font-serif text-lg tracking-wide text-[#E6E6E6] ${className}`}
        dangerouslySetInnerHTML={{ __html: formattedHtml }}
      />
    );
  }

  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded bg-[#2A1B3D]/70 border border-[#4A2574]/50 font-serif text-[#E6E6E6] ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
    />
  );
};

export const KaTeXRenderer = React.memo(KaTeXRendererInner);
KaTeXRenderer.displayName = 'KaTeXRenderer';

export function formatSymbolicMathHtml(latex: string): string {
  let s = latex
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Fractions: \frac{a}{b}
  s = s.replace(
    /\\frac\{([^{}]+)\}\{([^{}]+)\}/g,
    '<span class="inline-flex flex-col items-center align-middle mx-1"><span class="border-b border-[#7E42C1] px-1 text-sm leading-tight">$1</span><span class="px-1 text-sm leading-tight">$2</span></span>'
  );

  // Common Greek & Mathematical symbols
  const symbols: Record<string, string> = {
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\delta': 'δ',
    '\\Delta': 'Δ',
    '\\epsilon': 'ε',
    '\\eta': 'η',
    '\\theta': 'θ',
    '\\lambda': 'λ',
    '\\mu': 'μ',
    '\\pi': 'π',
    '\\sigma': 'σ',
    '\\tau': 'τ',
    '\\psi': 'ψ',
    '\\omega': 'ω',
    '\\Omega': 'Ω',
    '\\hbar': 'ℏ',
    '\\nabla': '∇',
    '\\partial': '∂',
    '\\sum': '∑',
    '\\int': '∫',
    '\\infty': '∞',
    '\\cdot': '·',
    '\\times': '×',
    '\\pm': '±',
    '\\leq': '≤',
    '\\geq': '≥',
    '\\neq': '≠',
    '\\approx': '≈',
    '\\sqrt': '√',
    '\\mathcal{L}': 'ℒ',
    '\\mathcal{O}': '𝒪',
    '\\mathbf{E}': '𝐄',
    '\\mathbf{B}': '𝐁',
    '\\left(': '(',
    '\\right)': ')'
  };

  for (const [k, v] of Object.entries(symbols)) {
    s = s.split(k).join(v);
  }

  s = s.replace(/\\text\{([^{}]+)\}/g, '<span class="font-sans text-xs">$1</span>');
  s = s.replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>');
  s = s.replace(/\^([0-9a-zA-Z])/g, '<sup>$1</sup>');
  s = s.replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>');
  s = s.replace(/_([0-9a-zA-Z])/g, '<sub>$1</sub>');

  return s;
}
