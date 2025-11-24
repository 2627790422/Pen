import React from 'react';
import { RoastStyle } from '../types';
import { Sparkles, Drama, Flame, Sword, Crown, Skull, Zap, Ghost } from 'lucide-react';

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
    icon: Flame, 
    desc: '祖安 / 破防 / 极致嘴臭',
    isHot: true 
  },
  { 
    id: RoastStyle.LOGIC_MASTER, 
    label: '逻辑鬼才', 
    icon: Sparkles, 
    desc: '阴阳怪气 / 借力打力 / 杀人诛心' 
  },
];

// Sub Modes (Bottom Row)
const subStyles = [
  { id: RoastStyle.SUN_BAR, label: '孙吧哥', icon:  Skull, desc: '抽象/乐子' },
  { id: RoastStyle.ANTI_MI, label: '专治OP', icon: Zap, desc: '对付米卫兵' },
  { id: RoastStyle.ANTI_FAIRY, label: '专治T0', icon: Crown, desc: '对付小仙女' },
  { id: RoastStyle.MESUGAKI, label: '雌小鬼', icon: Ghost, desc: '杂鱼~' },
];

export const StyleSelector: React.FC<StyleSelectorProps> = ({ selected, onChange, disabled, theme }) => {
  
  const getButtonClass = (styleId: string, isMain: boolean) => {
    const isSelected = selected === styleId;
    let base = "relative overflow-hidden group rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-1";
    
    // Size adjustments for Main vs Sub
    if (isMain) base += " p-4 h-28"; 
    else base += " p-2 h-20";

    const activeBorder = theme === 'sparkle' ? 'border-sparkle-primary' : 'border-mystic-primary';
    const activeShadow = theme === 'sparkle' ? 'shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'shadow-[0_0_15px_rgba(139,92,246,0.4)]';
    const activeBg = theme === 'sparkle' ? 'bg-sparkle-card' : 'bg-mystic-card';
    
    if (isSelected) {
       base += ` ${activeBg} ${activeBorder} ${activeShadow} scale-[1.02]`;
    } else {
      base += " bg-black/40 border-white/10 hover:bg-white/5 hover:border-white/20";
    }
    
    if (disabled) {
      base += " opacity-50 cursor-not-allowed";
    } else {
      base += " cursor-pointer hover:-translate-y-1";
    }
    return base;
  };

  const getIconColor = (isSelected: boolean) => {
     if (isSelected) {
        return theme === 'sparkle' ? 'text-sparkle-primary' : 'text-mystic-primary';
     }
     return 'text-gray-400 group-hover:text-gray-200';
  };

  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Main Modes */}
      <div className="grid grid-cols-2 gap-3">
        {mainStyles.map((style) => (
          <button
            key={style.id}
            onClick={() => onChange(style.id)}
            disabled={disabled}
            className={getButtonClass(style.id, true)}
          >
            {style.isHot && (
              <div className={`absolute top-0 right-0 ${theme === 'sparkle' ? 'bg-sparkle-primary' : 'bg-mystic-secondary'} text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg shadow-sm z-10`}>HOT</div>
            )}
            <style.icon className={`w-6 h-6 mb-1 transition-colors ${getIconColor(selected === style.id)}`} />
            <div className={`font-black text-lg ${selected === style.id ? 'text-white' : 'text-gray-300'}`}>{style.label}</div>
            <div className={`text-[10px] font-medium ${selected === style.id ? 'text-white/80' : 'text-gray-500'}`}>{style.desc}</div>
            
            {selected === style.id && (
              <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'sparkle' ? 'from-sparkle-primary/10' : 'from-mystic-primary/10'} to-transparent pointer-events-none`} />
            )}
          </button>
        ))}
      </div>

      {/* Sub Modes */}
      <div className="grid grid-cols-4 gap-2">
        {subStyles.map((style) => (
          <button
            key={style.id}
            onClick={() => onChange(style.id)}
            disabled={disabled}
            className={getButtonClass(style.id, false)}
          >
            <style.icon className={`w-4 h-4 transition-colors ${getIconColor(selected === style.id)}`} />
            <div className={`font-bold text-xs ${selected === style.id ? 'text-white' : 'text-gray-400'}`}>{style.label}</div>
            {/* Tooltip-like desc for mobile/tight space? Or just hide description for sub items if too small, or keep it minimal */}
          </button>
        ))}
      </div>
    </div>
  );
};