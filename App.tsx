import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateRoasts, regenerateSingleRoast, analyzeContextWithAI } from './services/geminiService';
import { RoastResponse, RoastStyle } from './types';
import { StyleSelector } from './components/StyleSelector';
import { RoastCard } from './components/RoastCard';
import { Drama, AlertTriangle, Loader2, PartyPopper, Trash2, MessageCircleHeart, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  "抛开事实不谈，难道你就没有错吗",
  "别问我为什么，懂得都懂",
  "我不喜欢这个，所以这个是垃圾",
  "我是路人，有一说一，我觉得",
  "你行你上啊",
  "他虽然出轨了，但他还是个好男孩"
];

export default function App() {
  const [input, setInput] = useState('');
  const [backgroundInfo, setBackgroundInfo] = useState('');
  const [suggestedContext, setSuggestedContext] = useState('');
  const [isAnalyzingContext, setIsAnalyzingContext] = useState(false);
  const [style, setStyle] = useState<RoastStyle | 'ALL'>(RoastStyle.SHORT_PUNCHY);
  const [results, setResults] = useState<RoastResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [visualProgress, setVisualProgress] = useState(0);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  // Theme Logic: SHORT_PUNCHY is Sparkle (Red), others are Mystic (Blue/Purple)
  const theme = style === RoastStyle.SHORT_PUNCHY ? 'sparkle' : 'mystic';
  
  const bgClass = theme === 'sparkle' ? 'bg-sparkle-bg text-sparkle-text' : 'bg-mystic-bg text-mystic-text';
  const selectionClass = theme === 'sparkle' ? 'selection:bg-sparkle-primary' : 'selection:bg-mystic-primary';
  const primaryColor = theme === 'sparkle' ? 'text-sparkle-primary' : 'text-mystic-primary';
  const secondaryColor = theme === 'sparkle' ? 'text-sparkle-secondary' : 'text-mystic-secondary';
  
  const orb1 = theme === 'sparkle' ? 'bg-sparkle-primary/20' : 'bg-mystic-primary/20';
  const orb2 = theme === 'sparkle' ? 'bg-sparkle-secondary/20' : 'bg-mystic-secondary/20';
  const buttonGradient = theme === 'sparkle' 
    ? 'from-sparkle-primary to-sparkle-secondary shadow-[0_0_20px_rgba(244,63,94,0.5)]' 
    : 'from-mystic-primary to-mystic-secondary shadow-[0_0_20px_rgba(139,92,246,0.5)]';

  // --- PROGRESS BAR LOGIC ---
  useEffect(() => {
    let interval: any;
    if (loading) {
      if (results.length === 0) {
        setVisualProgress(0);
        interval = setInterval(() => {
          setVisualProgress(prev => {
            if (prev >= 80) { clearInterval(interval); return 80; }
            return prev + (80 - prev) * 0.05; 
          });
        }, 100);
      } else {
        const realProgress = 80 + (results.length * 4);
        setVisualProgress(Math.min(realProgress, 100));
      }
    } else {
      setVisualProgress(results.length > 0 ? 100 : 0);
    }
    return () => clearInterval(interval);
  }, [loading, results.length]);

  // --- AI CONTEXT GUESSING ---
  useEffect(() => {
    if (backgroundInfo) {
      setSuggestedContext('');
      setIsAnalyzingContext(false);
      return;
    }
    if (!input || input.length < 5) {
      setSuggestedContext('');
      setIsAnalyzingContext(false);
      return;
    }

    setIsAnalyzingContext(true);
    const timer = setTimeout(async () => {
      try {
        const guess = await analyzeContextWithAI(input);
        setSuggestedContext(guess);
      } catch (e) { console.error(e); } finally { setIsAnalyzingContext(false); }
    }, 1200);

    return () => clearTimeout(timer);
  }, [input, backgroundInfo]);


  const handleApplySuggestion = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (suggestedContext) {
      setBackgroundInfo(suggestedContext);
      setSuggestedContext('');
      setTimeout(() => { backgroundInputRef.current?.focus(); }, 0);
    }
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]); 
    setVisualProgress(0);
    
    try {
      await generateRoasts(input, style, backgroundInfo, (newRoast) => {
        setResults(prev => [...prev, newRoast]);
      });
    } catch (err: any) {
      setError(err.message || "啧，网络好像坏掉了呢~");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoast = (id: string, newContent: string) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, content: newContent } : r));
  };

  const handleRegenerateRoast = async (id: string) => {
    const roastToRegenerate = results.find(r => r.id === id);
    if (!roastToRegenerate || !input.trim()) return;

    setRegeneratingId(id);
    try {
      const newRoast = await regenerateSingleRoast(input, roastToRegenerate.style, roastToRegenerate.content, backgroundInfo);
      setResults(prev => prev.map(r => r.id === id ? newRoast : r));
    } catch (err: any) {
      setError(err.message || "刷新失败");
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleClear = () => {
    setInput('');
    setResults([]);
    setBackgroundInfo('');
    setSuggestedContext('');
    setIsAnalyzingContext(false);
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
        <div className="absolute top-1/4 right-5 text-9xl font-black opacity-5 select-none writing-vertical-rl text-white">ATTACK</div>
        <div className="absolute bottom-1/3 left-5 text-8xl font-black opacity-5 select-none text-white">CRIT</div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-8 md:pt-16">
        <header className="text-center mb-10 relative">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-20 blur-2xl -z-10 transition-colors duration-700 ${theme === 'sparkle' ? 'bg-sparkle-primary/30' : 'bg-mystic-primary/30'}`}></div>
          <div className={`inline-flex items-center justify-center p-4 mb-4 rounded-2xl bg-black/40 border backdrop-blur-sm animate-float transition-colors duration-700 ${theme === 'sparkle' ? 'border-sparkle-primary/50' : 'border-mystic-primary/50'}`}>
            <Drama className={`w-10 h-10 mr-3 animate-pulse-glow transition-colors duration-700 ${primaryColor}`} />
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white drop-shadow-lg">
              键来 <span className={`text-2xl align-top transition-colors duration-700 ${primaryColor}`}>PRO</span>
            </h1>
          </div>
          <p className="text-white/70 max-w-lg mx-auto text-base font-medium flex items-center justify-center gap-2">
            <span className={secondaryColor}>✨</span> 专治各种不服 <span className={secondaryColor}>✨</span>
          </p>
        </header>

        <div className={`bg-black/40 backdrop-blur-md border rounded-3xl p-1 md:p-6 mb-8 shadow-2xl relative overflow-hidden group transition-all duration-700 ${theme === 'sparkle' ? 'border-sparkle-muted/40' : 'border-mystic-muted/40'}`}>
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent opacity-50 transition-colors duration-700 ${theme === 'sparkle' ? 'via-sparkle-primary' : 'via-mystic-primary'}`}></div>
          
          <StyleSelector selected={style} onChange={setStyle} disabled={loading} theme={theme} />

          <div className="relative">
            <div className={`relative bg-black/20 rounded-2xl overflow-hidden flex flex-col border transition-all duration-300 focus-within:shadow-lg ${theme === 'sparkle' ? 'border-sparkle-muted/30 focus-within:border-sparkle-primary' : 'border-mystic-muted/30 focus-within:border-mystic-primary'}`}>
              
              {/* Context Inputs */}
              <div className="bg-black/20 border-b border-white/5 relative group/ctx">
                <div className="flex items-center px-4 py-2">
                  <div className="p-1.5 rounded mr-3 opacity-70">
                    <MessageCircleHeart className={`w-4 h-4 ${theme === 'sparkle' ? 'text-pink-400' : 'text-purple-400'}`} />
                  </div>
                  
                  <div className="relative w-full h-10 flex items-center">
                     <input
                      ref={backgroundInputRef}
                      type="text"
                      value={backgroundInfo}
                      onChange={(e) => setBackgroundInfo(e.target.value)}
                      placeholder={isAnalyzingContext ? "AI 正在分析成分..." : (suggestedContext ? "" : "添加事件背景 (比如: 对方急了, 或者是xx卫兵)...")}
                      disabled={loading}
                      className="w-full h-full bg-transparent text-sm md:text-base text-white/80 placeholder:text-gray-600 focus:outline-none font-bold relative z-10"
                    />
                    
                    {isAnalyzingContext && !backgroundInfo && (
                        <div className="absolute top-0 left-0 h-full w-full flex items-center pointer-events-none z-20 pl-1">
                          <Loader2 className={`w-3 h-3 mr-2 animate-spin ${theme === 'sparkle' ? 'text-sparkle-primary' : 'text-mystic-primary'}`} />
                        </div>
                    )}
                    
                    {!backgroundInfo && !isAnalyzingContext && suggestedContext && (
                      <div className="absolute top-0 left-0 h-full w-full flex items-center pointer-events-none z-20">
                        <span 
                          onClick={handleApplySuggestion}
                          className={`cursor-pointer pointer-events-auto flex items-center transition-all duration-300 group/hint ${theme === 'sparkle' ? 'text-sparkle-primary/40 hover:text-sparkle-primary' : 'text-mystic-primary/40 hover:text-mystic-primary'}`}
                        >
                          <Sparkles className="w-3 h-3 mr-1.5 animate-pulse" />
                          <span className="italic font-bold tracking-wide group-hover/hint:underline decoration-dashed underline-offset-4">
                            猜测背景: {suggestedContext}? <span className="text-[10px] opacity-60 ml-1 not-italic">(点击填入)</span>
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="在此粘贴对方的暴论 (Ctrl+Enter 开怼)..."
                className="w-full h-16 md:h-24 bg-transparent text-white p-5 resize-none focus:outline-none placeholder:text-gray-600 font-sans text-lg leading-relaxed"
                disabled={loading}
              />
              
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
                    ${!input.trim() || loading ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : `bg-gradient-to-r text-white ${buttonGradient}`}
                  `}
                >
                  <div className="absolute top-0 -left-full w-full h-full bg-white/20 skew-x-12 group-hover/btn:animate-[shimmer_1s_infinite]"></div>
                  {loading ? (
                    <> <Loader2 className="w-5 h-5 animate-spin" /> <span>正在输出...</span> </>
                  ) : (
                    <> <span>火力全开</span> <PartyPopper className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" /> </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {loading && (
             <div className="mt-4 px-2 animate-in fade-in duration-300">
                <div className="flex justify-between items-center text-[10px] font-bold mb-1 opacity-70 tracking-widest uppercase">
                   <span className={primaryColor}>{results.length === 0 ? "Analyzing weakness..." : "Generating Impacts..."}</span>
                   <span className="text-white font-mono">{Math.round(visualProgress)}%</span>
                </div>
                <div className="relative h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                   <div 
                      className={`absolute top-0 left-0 h-full transition-all duration-300 ease-out shadow-[0_0_10px_currentColor] ${theme === 'sparkle' ? 'bg-gradient-to-r from-sparkle-primary to-sparkle-secondary' : 'bg-gradient-to-r from-mystic-primary to-mystic-secondary'}`}
                      style={{ width: `${visualProgress}%` }}
                   >
                     <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1s_infinite]"></div>
                   </div>
                </div>
             </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-8 bg-red-950/40 border border-red-500/50 rounded-xl text-red-200 animate-shake">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

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
              <RoastCard 
                key={roast.id} 
                roast={roast} 
                index={index} 
                theme={theme} 
                onUpdate={handleUpdateRoast}
                onRegenerate={handleRegenerateRoast}
                isRegenerating={regeneratingId === roast.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}