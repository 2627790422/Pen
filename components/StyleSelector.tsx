import React from 'react';
import { RoastStyle } from '../types';
import { Sparkles, Drama, Sword, ShieldAlert, Skull, HeartCrack, Zap } from 'lucide-react';

interface StyleSelectorProps {
  selected: RoastStyle | 'ALL';
  onChange: (style: RoastStyle | 'ALL') => void;
  disabled: boolean;
  theme: 'sparkle' | 'mystic';
}

// Main Modes (Top Row)
const mainStyles = [
  { 
    id: RoastStyle.SHORT_PUNCHY, 
    label: '一针见血', 
    icon: Sword, 
    desc: '极致嘴臭 / 破防打击',
    isHot: true 
  },
  { 
    id: RoastStyle.LOGIC_MASTER, 
    label: '逻辑鬼才', 
    icon: Sparkles, 
    desc: '逻辑漏洞 / 阴阳怪气' 
  },
];

// Sub Modes (Bottom Row)
const subStyles = [
  {
    id: RoastStyle.SUN_BAR,
    label: '孙吧老哥',
    icon: Skull,
    desc: '抽象乐子人'
  },
  {
    id: RoastStyle.ANTI_MI,
    label: '米卫兵克星',
    icon: ShieldAlert,
    desc: '专怼OP'
  },
  {
    id: RoastStyle.ANTI_FAIRY,
    label: '仙女克星',
    icon: HeartCrack,
    desc: '魔法对轰'
  },
  {
    id: RoastStyle.MESUGAKI,
    label: '雌小鬼',
    icon: Zap, // Or Heart
    desc: '杂鱼~♥'
  }
];

export const StyleSelector: React.FC<StyleSelectorProps> = ({ selected, onChange, disabled, theme }) => {
  
  const renderButton = (style: any, isMain: boolean) => {
    const isSelected = selected === style.id;
    const Icon = style.icon;
    
    // Base Container
    let containerClass = `relative overflow-hidden group rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
      isMain ? 'p-4 h-28' : 'p-2 h-24'
    }`;
    
    // Theme & Selection Logic
    const activeBorder = theme === 'sparkle' ? 'border-sparkle-primary' : 'border-mystic-primary';
    const activeShadow = theme === 'sparkle' ? 'shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'shadow-[0_0_15px_rgba(139,92,246,0.4)]';
    const activeBg = theme === 'sparkle' ? 'bg-sparkle-card' : 'bg-mystic-card';
    const hotBadgeBg = theme === 'sparkle' ? 'bg-sparkle-primary' : 'bg-mystic-secondary';
    
    if (isSelected) {
       containerClass += ` ${activeBg} ${activeBorder} ${activeShadow} scale-[1.02] z-10`;
    } else {
      containerClass += " bg-black/40 border-white/10 hover:bg-white/5 hover:border-white/20 hover:-translate-y-1";
    }
    
    if (disabled) {
      containerClass += " opacity-50 cursor-not-allowed";
    } else {
      containerClass += " cursor-pointer";
    }

    // Icon Color
    let iconColor = 'text-gray-400';
    if (isSelected) {
        iconColor = theme === 'sparkle' ? 'text-sparkle-primary' : 'text-mystic-primary';
    }

    return (
      <button
        key={style.id}
        onClick={() => onChange(style.id as RoastStyle)}
        disabled={disabled}
        className={containerClass}
      >
        {/* Hot Badge for Main Modes */}
        {style.isHot && isMain && (
          <div className={`absolute top-0 right-0 ${hotBadgeBg} text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg shadow-sm z-10 font-mono`}>
            HOT
          </div>
        )}

        <div className={`rounded-full transition-colors relative flex items-center justify-center ${
          isSelected ? 'bg-white/10' : 'bg-black/50'
        } ${isMain ? 'p-2.5' : 'p-1.5'}`}>
          <Icon className={`transition-colors ${iconColor} ${isMain ? 'w-6 h-6' : 'w-5 h-5'}`} />
        </div>
        
        <div className="text-center relative z-10 w-full px-1">
          <div className={`font-bold tracking-wide leading-none ${
            isMain ? 'text-lg mb-1' : 'text-xs mb-0.5'
          } ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
            {style.label}
          </div>
          <div className={`font-medium leading-none truncate ${
            isMain ? 'text-xs' : 'text-[10px]'
          } ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
            {style.desc}
          </div>
        </div>
        
        {/* Background Glow */}
        {isSelected && (
          <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'sparkle' ? 'from-sparkle-primary/10' : 'from-mystic-primary/10'} to-transparent pointer-events-none`} />
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Main Modes Row */}
      <div className="grid grid-cols-2 gap-3">
        {mainStyles.map(s => renderButton(s, true))}
      </div>

      {/* Sub Modes Row */}
      <div className="grid grid-cols-4 gap-2">
        {subStyles.map(s => renderButton(s, false))}
      </div>
    </div>
  );
};