import React, { useState, useRef, useEffect } from 'react';
import { generateRoasts } from './services/geminiService';
import { RoastResponse, RoastStyle } from './types';
import { StyleSelector } from './components/StyleSelector';
import { RoastCard } from './components/RoastCard';
import { Drama, AlertTriangle, Loader2, PartyPopper, Trash2, Globe, MessageCircleHeart } from 'lucide-react';

const SUGGESTIONS = [
  "你这么普通，为什么这么自信？",
  "玩游戏这么菜，回家养猪去吧。",
  "急了急了，他急了。",
  "这就是你的观点？跟没说一样。"
];

export default function App() {
  const [input, setInput] = useState('');
  const [platform, setPlatform] = useState('');
  const [backgroundInfo, setBackgroundInfo] = useState('');
  const [style, setStyle] = useState<RoastStyle | 'ALL'>(RoastStyle.SHORT_PUNCHY);
  const [results, setResults] = useState<RoastResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Theme Logic
  const theme = style === RoastStyle.SHORT_PUNCHY ? 'sparkle' : 'mystic';
  
  // Dynamic Background Classes
  const bgClass = theme === 'sparkle' ? 'bg-sparkle-bg text-sparkle-text' : 'bg-mystic-bg text-mystic-text';
  const selectionClass = theme === 'sparkle' ? 'selection:bg-sparkle-primary' : 'selection:bg-mystic-primary';
  const primaryColor = theme === 'sparkle' ? 'text-sparkle-primary' : 'text-mystic-primary';
  const secondaryColor = theme === 'sparkle' ? 'text-sparkle-secondary' : 'text-mystic-secondary';
  
  // Animation/Orb Colors
  const orb1 = theme === 'sparkle' ? 'bg-sparkle-primary/20' : 'bg-mystic-primary/20';
  const orb2 = theme === 'sparkle' ? 'bg-sparkle-secondary/20' : 'bg-mystic-secondary/20';
  const buttonGradient = theme === 'sparkle' 
    ? 'from-sparkle-primary to-sparkle-secondary shadow-[0_0_20px_rgba(244,63,94,0.5)]' 
    : 'from-mystic-primary to-mystic-secondary shadow-[0_0_20px_rgba(139,92,246,0.5)]';

  const handleGenerate = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);
    setResults([]);
    
    try {
      const data = await generateRoasts(input, style, platform, backgroundInfo);
      setResults(data);
    } catch (err: any) {
      setError(err.message || "啧，网络好像坏掉了呢~");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setResults([]);
    setError(null);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };

  return (
    <div className={`min-h-screen ${bgClass} ${selectionClass} font-sans pb-20 overflow-x-hidden relative transition-colors duration-700`}>
      
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-grid pointer-events-none z-0 opacity-20"></div>
      <div className="fixed top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-32 h-32 ${orb1} rounded-full blur-[80px] animate-float transition-colors duration-700`}></div>
        <div className={`absolute bottom-20 right-10 w-48 h-48 ${orb2} rounded-full blur-[100px] animate-float-delayed transition-colors duration-700`}></div>
        
        {/* Anime Decorative Text */}
        <div className="absolute top-1/4 right-5 text-9xl font-black opacity-5 select-none writing-vertical-rl text-white">
          ATTACK
        </div>
        <div className="absolute bottom-1/3 left-5 text-8xl font-black opacity-5 select-none text-white">
          CRIT
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-8 md:pt-16">
        {/* Header */}
        <header className="text-center mb-10 relative">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-20 blur-2xl -z-10 transition-colors duration-700 ${theme === 'sparkle' ? 'bg-sparkle-primary/30' : 'bg-mystic-primary/30'}`}></div>
          <div className={`inline-flex items-center justify-center p-4 mb-4 rounded-2xl bg-black/40 border backdrop-blur-sm animate-float transition-colors duration-700 ${theme === 'sparkle' ? 'border-sparkle-primary/50' : 'border-mystic-primary/50'}`}>
            <Drama className={`w-10 h-10 mr-3 animate-pulse-glow transition-colors duration-700 ${primaryColor}`} />
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white drop-shadow-lg">
              键来 <span className={`text-2xl align-top transition-colors duration-700 ${primaryColor}`}>PRO</span>
            </h1>
          </div>
          <p className="text-white/70 max-w-lg mx-auto text-base font-medium flex items-center justify-center gap-2">
            <span className={secondaryColor}>✨</span> 
            专治各种不服 
            <span className={secondaryColor}>✨</span>
          </p>
        </header>

        {/* Input Section */}
        <div className={`bg-black/40 backdrop-blur-md border rounded-3xl p-1 md:p-6 mb-8 shadow-2xl relative overflow-hidden group transition-all duration-700 ${theme === 'sparkle' ? 'border-sparkle-muted/40' : 'border-mystic-muted/40'}`}>
          {/* Decorative Borders */}
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent opacity-50 transition-colors duration-700 ${theme === 'sparkle' ? 'via-sparkle-primary' : 'via-mystic-primary'}`}></div>
          
          <StyleSelector selected={style} onChange={setStyle} disabled={loading} theme={theme} />

          <div className="relative">
            <div className={`relative bg-black/20 rounded-2xl overflow-hidden flex flex-col border transition-all duration-300 focus-within:shadow-lg ${theme === 'sparkle' ? 'border-sparkle-muted/30 focus-within:border-sparkle-primary' : 'border-mystic-muted/30 focus-within:border-mystic-primary'}`}>
              
              {/* Context Inputs */}
              <div className="bg-black/20 border-b border-white/5">
                {/* Platform Input (Emphasized) */}
                <div className="flex flex-col md:flex-row md:items-center px-4 py-3 border-b border-white/5 transition-colors relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme === 'sparkle' ? 'bg-sparkle-secondary' : 'bg-mystic-secondary'}`}></div>
                  
                  <div className="flex items-center mb-2 md:mb-0 w-full">
                    <div className={`p-1.5 rounded mr-3 ${theme === 'sparkle' ? 'bg-sparkle-secondary/10' : 'bg-mystic-secondary/10'}`}>
                      <Globe className={`w-4 h-4 ${secondaryColor}`} />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        placeholder="在此输入URL 或 平台名称 (AI会自动读取内容/分析社区氛围)..."
                        disabled={loading}
                        className="w-full bg-transparent text-sm md:text-base text-white placeholder:text-gray-500 focus:outline-none font-bold tracking-wide"
                      />
                    </div>
                  </div>
                  <span className={`hidden md:inline-block text-[10px] font-bold px-2 py-0.5 border rounded uppercase tracking-wider whitespace-nowrap ${theme === 'sparkle' ? 'text-sparkle-secondary border-sparkle-secondary/30 bg-sparkle-secondary/10' : 'text-mystic-secondary border-mystic-secondary/30 bg-mystic-secondary/10'}`}>
                    TARGET URL / SITE
                  </span>
                </div>

                {/* Background Input */}
                <div className="flex items-center px-4 py-2">
                  <div className="p-1.5 rounded mr-3 opacity-70">
                    <MessageCircleHeart className={`w-4 h-4 ${theme === 'sparkle' ? 'text-pink-400' : 'text-purple-400'}`} />
                  </div>
                  <input
                    type="text"
                    value={backgroundInfo}
                    onChange={(e) => setBackgroundInfo(e.target.value)}
                    placeholder="添加事件背景 (比如: 对方急了, 或者是xx卫兵)..."
                    disabled={loading}
                    className="w-full bg-transparent text-sm text-white/80 placeholder:text-gray-600 focus:outline-none py-1"
                  />
                </div>
              </div>

              {/* Main Text Area */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="在此粘贴对方的暴论 (Ctrl+Enter 开怼)..."
                className="w-full h-32 md:h-44 bg-transparent text-white p-5 resize-none focus:outline-none placeholder:text-gray-600 font-sans text-lg leading-relaxed"
                disabled={loading}
              />
              
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 bg-black/30 border-t border-white/5">
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar mask-gradient">
                  {!input && SUGGESTIONS.map((s, i) => (
                    <button 
                      key={i}
                      onClick={() => setInput(s)}
                      className={`whitespace-nowrap px-3 py-1 text-xs rounded-full border border-gray-700 text-gray-400 transition-all ${theme === 'sparkle' ? 'hover:text-sparkle-primary hover:border-sparkle-primary hover:bg-sparkle-primary/5' : 'hover:text-mystic-primary hover:border-mystic-primary hover:bg-mystic-primary/5'}`}
                    >
                      {s}
                    </button>
                  ))}
                  {input && (
                     <button 
                      onClick={handleClear}
                      className="flex items-center gap-1 px-3 py-1 text-xs rounded-full text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors whitespace-nowrap"
                    >
                      <Trash2 className="w-3 h-3" /> <span className="hidden sm:inline">清空内容</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!input.trim() || loading}
                  className={`
                    flex items-center gap-2 px-6 md:px-8 py-2.5 rounded-xl font-black text-base transition-all transform active:scale-95 relative overflow-hidden group/btn whitespace-nowrap
                    ${!input.trim() || loading 
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                      : `bg-gradient-to-r text-white ${buttonGradient}`}
                  `}
                >
                  {/* Sheen Effect */}
                  <div className="absolute top-0 -left-full w-full h-full bg-white/20 skew-x-12 group-hover/btn:animate-[shimmer_1s_infinite]"></div>

                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>正在对线...</span>
                    </>
                  ) : (
                    <>
                      <span>火力全开</span>
                      <PartyPopper className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-8 bg-red-950/40 border border-red-500/50 rounded-xl text-red-200 animate-shake">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        {/* Results Area */}
        <div className="space-y-6">
           {results.length > 0 && (
             <div className={`flex items-center justify-center gap-4 text-sm font-black uppercase tracking-[0.2em] mb-8 ${secondaryColor}`}>
                <span className={`w-12 h-px bg-gradient-to-r from-transparent ${theme === 'sparkle' ? 'to-sparkle-secondary' : 'to-mystic-secondary'}`}></span>
                <span className="animate-pulse">⚡ 处刑现场 ⚡</span>
                <span className={`w-12 h-px bg-gradient-to-l from-transparent ${theme === 'sparkle' ? 'to-sparkle-secondary' : 'to-mystic-secondary'}`}></span>
             </div>
           )}

           <div className="grid grid-cols-1 gap-6">
            {results.map((roast, index) => (
              <RoastCard key={index} roast={roast} index={index} theme={theme} />
            ))}
          </div>

          {!loading && results.length === 0 && !error && (
            <div className="text-center py-20 opacity-40">
              <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center border-2 border-dashed animate-float ${theme === 'sparkle' ? 'bg-sparkle-card border-sparkle-muted/50 text-sparkle-muted' : 'bg-mystic-card border-mystic-muted/50 text-mystic-muted'}`}>
                <Drama className="w-10 h-10" />
              </div>
              <p className="text-white/60 font-bold">准备好开始对线了吗？</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}