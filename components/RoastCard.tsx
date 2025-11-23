import React, { useState } from 'react';
import { RoastResponse } from '../types';
import { Copy, Check, MessageCircleWarning, Ghost, Link2, Zap } from 'lucide-react';

interface RoastCardProps {
  roast: RoastResponse;
  index: number;
  theme: 'sparkle' | 'mystic';
}

export const RoastCard: React.FC<RoastCardProps> = ({ roast, index, theme }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roast.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const isSparkle = theme === 'sparkle';

  // Dynamic Theme Colors
  const borderColor = isSparkle ? 'group-hover:border-sparkle-primary' : 'group-hover:border-mystic-secondary';
  const labelBg = isSparkle ? 'bg-sparkle-card border-sparkle-muted text-sparkle-text' : 'bg-mystic-card border-mystic-primary/30 text-mystic-secondary';
  const buttonClass = isSparkle 
    ? 'bg-sparkle-primary/10 hover:bg-sparkle-primary text-sparkle-primary border-sparkle-primary/30' 
    : 'bg-mystic-primary/10 hover:bg-mystic-primary text-mystic-primary border-mystic-primary/30';
  
  const getPowerStyle = (power: number) => {
    if (power >= 90) return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/50' };
    if (power >= 70) return { color: isSparkle ? 'text-pink-500' : 'text-purple-400', bg: isSparkle ? 'bg-pink-500/10' : 'bg-purple-500/10', border: isSparkle ? 'border-pink-500/50' : 'border-purple-500/50' };
    return { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/50' };
  };

  const powerStyle = getPowerStyle(roast.attackPower);

  return (
    <div 
      className={`bg-black/60 backdrop-blur-md border border-white/5 rounded-xl p-5 relative group hover:border-opacity-100 transition-all duration-300 shadow-lg animate-in fade-in slide-in-from-bottom-4 overflow-hidden ${borderColor}`}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* Decorative Corner */}
      <div className={`absolute -top-10 -right-10 w-20 h-20 blur-xl rounded-full transition-all duration-500 ${isSparkle ? 'bg-sparkle-primary/20 group-hover:bg-sparkle-primary/40' : 'bg-mystic-secondary/20 group-hover:bg-mystic-secondary/40'}`}></div>

      {/* Header */}
      <div className="flex justify-between items-start mb-3 relative z-10">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${labelBg}`}>
          <Ghost className="w-3 h-3" />
          {roast.style}
        </span>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md border ${powerStyle.bg} ${powerStyle.border}`}>
          <MessageCircleWarning className={`w-4 h-4 ${powerStyle.color}`} />
          <span className={`text-xs font-bold font-mono ${powerStyle.color}`}>
            ATK: {roast.attackPower}%
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4 relative z-10">
        <p className="text-lg md:text-xl font-bold text-gray-100 leading-relaxed font-sans tracking-wide">
          "{roast.content}"
        </p>
      </div>

      {/* Explanation */}
      {roast.explanation && (
        <div className={`mb-3 text-xs italic border-l-2 pl-3 py-1 ${isSparkle ? 'text-gray-500 border-sparkle-muted/30' : 'text-slate-400 border-mystic-muted/30'}`}>
          <span className="flex items-center gap-1 font-bold mb-0.5 opacity-80">
            <Zap className="w-3 h-3" /> 暴论解析:
          </span>
          {roast.explanation}
        </div>
      )}

      {/* Sources (if any) */}
      {roast.sources && roast.sources.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 relative z-10">
          {roast.sources.map((source, i) => (
             <a 
               key={i} 
               href={source.uri} 
               target="_blank" 
               rel="noopener noreferrer"
               className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-colors ${isSparkle ? 'bg-sparkle-bg/50 border-sparkle-muted text-sparkle-text hover:bg-sparkle-muted' : 'bg-mystic-bg/50 border-mystic-muted text-mystic-text hover:bg-mystic-muted'}`}
             >
               <Link2 className="w-3 h-3" />
               <span className="truncate max-w-[150px]">{source.title}</span>
             </a>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 mt-auto pt-3 border-t border-white/5 relative z-10">
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full hover:text-white transition-all text-sm font-bold border group-hover:border-opacity-100 ${buttonClass}`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? '已复制' : '复制内容'}
        </button>
      </div>
    </div>
  );
};