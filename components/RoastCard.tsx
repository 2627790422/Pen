import React, { useState, useRef, useEffect } from 'react';
import { RoastResponse } from '../types';
import { Copy, Check, MessageCircleWarning, Ghost, RefreshCw, Pencil, Save, X } from 'lucide-react';

interface RoastCardProps {
  roast: RoastResponse;
  index: number;
  theme: 'sparkle' | 'mystic';
  onUpdate: (id: string, newContent: string) => void;
  onRegenerate: (id: string) => void;
  isRegenerating: boolean;
}

export const RoastCard: React.FC<RoastCardProps> = ({ roast, index, theme, onUpdate, onRegenerate, isRegenerating }) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(roast.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Adjust height
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roast.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      onUpdate(roast.id, editContent);
    } else {
      setEditContent(roast.content); // Revert if empty
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(roast.content);
    setIsEditing(false);
  };

  const isSparkle = theme === 'sparkle';

  // Dynamic Theme Colors
  const borderColor = isSparkle ? 'group-hover:border-sparkle-primary' : 'group-hover:border-mystic-secondary';
  const labelBg = isSparkle ? 'bg-sparkle-card border-sparkle-muted text-sparkle-text' : 'bg-mystic-card border-mystic-primary/30 text-mystic-secondary';
  
  // Button Styles
  const buttonBase = "p-1.5 rounded-full transition-colors duration-200 border border-transparent";
  const actionButtonClass = isSparkle 
    ? `${buttonBase} hover:bg-sparkle-primary/20 text-sparkle-text/70 hover:text-sparkle-text`
    : `${buttonBase} hover:bg-mystic-primary/20 text-mystic-text/70 hover:text-mystic-text`;
    
  const copyButtonClass = isSparkle 
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
      className={`bg-black/60 backdrop-blur-md border border-white/5 rounded-xl p-3 relative group hover:border-opacity-100 transition-all duration-300 shadow-lg animate-in fade-in slide-in-from-bottom-4 overflow-hidden ${borderColor}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Decorative Corner */}
      <div className={`absolute -top-10 -right-10 w-20 h-20 blur-xl rounded-full transition-all duration-500 opacity-50 ${isSparkle ? 'bg-sparkle-primary/20 group-hover:bg-sparkle-primary/40' : 'bg-mystic-secondary/20 group-hover:bg-mystic-secondary/40'}`}></div>

      {/* Header - Compact */}
      <div className="flex justify-between items-center mb-2 relative z-10">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${labelBg}`}>
          <Ghost className="w-3 h-3" />
          {roast.style}
        </span>
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${powerStyle.bg} ${powerStyle.border}`}>
          <MessageCircleWarning className={`w-3 h-3 ${powerStyle.color}`} />
          <span className={`text-[10px] font-bold font-mono ${powerStyle.color}`}>
            ATK: {roast.attackPower}%
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="mb-2 relative z-10">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-black/40 text-white rounded p-2 text-base font-sans focus:outline-none focus:ring-1 focus:ring-white/30 resize-none overflow-hidden"
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <button onClick={handleCancelEdit} className="p-1 rounded hover:bg-white/10 text-gray-400">
                <X className="w-4 h-4" />
              </button>
              <button onClick={handleSaveEdit} className={`p-1 rounded ${isSparkle ? 'text-green-400 hover:bg-green-400/10' : 'text-cyan-400 hover:bg-cyan-400/10'}`}>
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-base md:text-lg font-bold text-gray-100 leading-snug font-sans tracking-wide">
            "{roast.content}"
          </p>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center justify-between pt-2 border-t border-white/5 relative z-10 opacity-60 group-hover:opacity-100 transition-opacity">
          
          <div className="flex gap-1">
             <button 
                onClick={() => setIsEditing(true)} 
                className={actionButtonClass}
                title="编辑文案"
              >
                <Pencil className="w-3.5 h-3.5" />
             </button>
             <button 
                onClick={() => onRegenerate(roast.id)} 
                className={actionButtonClass}
                disabled={isRegenerating}
                title="重新生成这一条"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
             </button>
          </div>

          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full hover:text-white transition-all text-xs font-bold border group-hover:border-opacity-100 ${copyButtonClass}`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      )}
    </div>
  );
};