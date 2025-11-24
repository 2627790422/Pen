import React from 'react';
import { RoastStyle } from '../types';
import { Sparkles, Drama } from 'lucide-react';

interface StyleSelectorProps {
  selected: RoastStyle | 'ALL';
  onChange: (style: RoastStyle | 'ALL') => void;
  disabled: boolean;
  theme: 'sparkle' | 'mystic';
}

const styles = [
  { 
    id: RoastStyle.SHORT_PUNCHY, 
    label: '一针见血', 
    icon: Drama, 
    desc: '贴吧老哥 / 极致嘴臭 / 破防打击',
    isHot: true 
  },
  { 
    id: 'ALL', 
    label: '逻辑鬼才', 
    icon: Sparkles, 
    desc: '逻辑漏洞 / 阴阳怪气 / 降维打击' 
  },
];

export const StyleSelector: React.FC<StyleSelectorProps> = ({ selected, onChange, disabled, theme }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {styles.map((style) => {
        const isSelected = selected === style.id;
        const Icon = style.icon;
        
        let containerClass = "relative overflow-hidden group p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2";
        
        // Dynamic color classes based on active theme
        const activeBorder = theme === 'sparkle' ? 'border-sparkle-primary' : 'border-mystic-primary';
        const activeShadow = theme === 'sparkle' ? 'shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'shadow-[0_0_20px_rgba(139,92,246,0.4)]';
        const activeBg = theme === 'sparkle' ? 'bg-sparkle-card' : 'bg-mystic-card';
        const hotBadgeBg = theme === 'sparkle' ? 'bg-sparkle-primary' : 'bg-mystic-secondary';
        
        if (isSelected) {
           containerClass += ` ${activeBg} ${activeBorder} ${activeShadow} scale-[1.02]`;
        } else {
          containerClass += " bg-black/40 border-white/10 hover:bg-white/5 hover:border-white/20";
        }
        
        if (disabled) {
          containerClass += " opacity-50 cursor-not-allowed";
        } else {
          containerClass += " cursor-pointer hover:-translate-y-1";
        }

        // Icon Colors
        let iconColor = 'text-gray-400';
        if (isSelected) {
            if (theme === 'sparkle') iconColor = 'text-sparkle-primary';
            else iconColor = 'text-mystic-primary';
        }

        return (
          <button
            key={style.id}
            onClick={() => onChange(style.id as RoastStyle | 'ALL')}
            disabled={disabled}
            className={containerClass}
          >
            {/* Hot Badge */}
            {style.isHot && (
              <div className={`absolute top-0 right-0 ${hotBadgeBg} text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10 font-mono`}>
                HOT
              </div>
            )}

            <div className={`p-3 rounded-full transition-colors relative ${
              isSelected ? 'bg-white/10' : 'bg-black/50'
            }`}>
              <Icon className={`w-7 h-7 transition-colors ${iconColor}`} />
            </div>
            
            <div className="text-center relative z-10">
              <div className={`font-bold text-lg tracking-wide ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                {style.label}
              </div>
              <div className={`text-xs mt-1 font-medium ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                {style.desc}
              </div>
            </div>
            
            {/* Background Animations */}
            {isSelected && (
              <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'sparkle' ? 'from-sparkle-primary/10' : 'from-mystic-primary/10'} to-transparent pointer-events-none`} />
            )}
          </button>
        );
      })}
    </div>
  );
};