import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Award, ChevronRight, ExternalLink, Sparkles, Gamepad2, Zap, Target, Trophy, Users, Search, Paintbrush } from "lucide-react";
import { Logo } from "@/components/Logo";

// --- Visual Assets (SVG Illustrations) ---
const RealParachuteSVG = () => (
  <svg width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Main Canopy - Technical Rectangular Shape */}
    <path d="M5 55C5 25 25 5 60 5C95 5 115 25 115 55H5Z" fill="url(#canopyGradient)" stroke="#fff" strokeWidth="0.5" />
    <path d="M15 55V20C15 20 35 10 60 10C85 10 105 20 105 20V55" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
    <path d="M35 55V12M85 55V12M60 55V10" stroke="white" strokeOpacity="0.1" strokeWidth="1" />
    {/* Ribbing/Cells */}
    {[25, 45, 75, 95].map(x => (
      <path key={x} d={`M${x} 55C${x} 35 ${x+2} 15 ${x} 12`} stroke="white" strokeOpacity="0.2" strokeWidth="0.5" />
    ))}
    <defs>
      <linearGradient id="canopyGradient" x1="60" y1="5" x2="60" y2="55" gradientUnits="userSpaceOnUse">
        <stop stopColor="#9333EA" />
        <stop offset="1" stopColor="#4F46E5" />
      </linearGradient>
    </defs>
  </svg>
);

const RealManSVG = ({ landed }: { landed: boolean }) => (
  <svg width="40" height="60" viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Body Silhouette / Jumpsuit */}
    <path d="M15 15C15 12.2386 17.2386 10 20 10C22.7614 10 25 12.2386 25 15V22H15V15Z" fill="#1E293B" />
    {/* Helmet */}
    <circle cx="20" cy="12" r="4.5" fill="#FACC15" />
    <path d="M18 11H22V13H18V11Z" fill="#0F172A" fillOpacity="0.6" />
    {/* Torso & Harness */}
    <rect x="16" y="22" width="8" height="12" rx="2" fill="#334155" />
    <path d="M16 23L24 33M24 23L16 33" stroke="white" strokeOpacity="0.3" strokeWidth="0.8" />
    {/* Arms */}
    <motion.path 
      animate={!landed ? { d: ["M16 24L8 18", "M16 24L8 22", "M16 24L8 18"] } : { d: "M16 24L12 30" }}
      stroke="#334155" strokeWidth="3" strokeLinecap="round" 
    />
    <motion.path 
      animate={!landed ? { d: ["M24 24L32 18", "M24 24L32 22", "M24 24L32 18"] } : { d: "M24 24L28 30" }}
      stroke="#334155" strokeWidth="3" strokeLinecap="round" 
    />
    {/* Legs */}
    <motion.path 
      animate={!landed ? { d: ["M17 34L14 48", "M17 34L15 46", "M17 34L14 48"] } : { d: "M17 34L18 52" }}
      stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" 
    />
    <motion.path 
      animate={!landed ? { d: ["M23 34L26 48", "M23 34L25 46", "M23 34L26 48"] } : { d: "M23 34L22 52" }}
      stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" 
    />
  </svg>
);


// --- Page Components ---
const BackgroundNebula = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020205]">
    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
    <svg className="absolute inset-0 w-full h-full opacity-20">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
    <div className="absolute inset-0" style={{ 
      backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
      backgroundSize: '40px 40px'
    }} />
  </div>
);

const LandingPad = ({ active, landed }: { active: boolean; landed: boolean }) => (
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 flex items-center justify-center pointer-events-none z-0">
    <AnimatePresence>
      {active && !landed && (
        <>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border border-purple-500/20 rounded-full"
          />
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-8 border-2 border-dashed border-purple-500/40 rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-purple-500/5 rounded-full blur-xl" />
          </div>
        </>
      )}
    </AnimatePresence>
  </div>
);

interface GameParachutistProps {
  pos: { x: number; y: number };
  landed: boolean;
  parachuteOpen: boolean;
}

const GameParachutist = ({ pos, landed, parachuteOpen }: GameParachutistProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ 
      opacity: 1,
      x: pos.x, 
      y: pos.y,
      rotate: landed ? 0 : (Math.sin(Date.now() / 300) * 4),
    }}
    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.8 } }}
    className="fixed z-[100] pointer-events-none flex flex-col items-center"
    transition={{ type: "spring", damping: 20, stiffness: 120 }}
  >
    <AnimatePresence mode="wait">
      {parachuteOpen && !landed && (
        <motion.div
          key="parachute"
          initial={{ scale: 0.5, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: -20 }}
          className="mb-[-5px]"
        >
          <RealParachuteSVG />
          <svg width="120" height="40" className="mt-[-5px]">
            <line x1="5" y1="0" x2="50" y2="40" stroke="white" strokeOpacity="0.2" />
            <line x1="115" y1="0" x2="70" y2="40" stroke="white" strokeOpacity="0.2" />
            <line x1="60" y1="0" x2="60" y2="40" stroke="white" strokeOpacity="0.2" />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
    <div className="mt-[-10px]">
      <RealManSVG landed={landed} />
    </div>
    {landed && (
      <motion.div 
        initial={{ scale: 0, opacity: 1 }} 
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute bottom-0 w-16 h-16 bg-white/20 rounded-full blur-2xl"
      />
    )}
  </motion.div>
);


const Internships = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: -250 });
  const [landed, setLanded] = useState(false);
  const [showCharacter, setShowCharacter] = useState(true);
  const [showGameUI, setShowGameUI] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  
  const targetRef = useRef<HTMLDivElement>(null);
  const velocityRef = useRef({ x: 0, y: 1.8 });
  const requestRef = useRef<number>();

  const tracks = [
    {
      id: 0,
      title: "Content & Creator",
      icon: Paintbrush,
      color: "text-rose-400",
      accent: "bg-rose-500",
      description: "Be the voice of Oplus. Translate complex AI tech into relatable Gen-Z vibes.",
      tasks: ["Script/Edit Reels & Shorts", "Meme Strategy", "User Walkthroughs"],
      skills: ["Storytelling", "CapCut/Canva", "Brand Voice"],
      deliverables: "10 Viral-ready pieces per month"
    },
    {
      id: 1,
      title: "User Insight & Growth",
      icon: Search,
      color: "text-cyan-400",
      accent: "bg-cyan-500",
      description: "Deep dive into what makes our users tick. Build the foundation of our community.",
      tasks: ["User Interviews", "Trend Analysis", "Discord Management"],
      skills: ["Psychology", "Market Research", "Community Ops"],
      deliverables: "Weekly Insight Report & Growth Map"
    },
    {
      id: 2,
      title: "Game Design & QA",
      icon: Gamepad2,
      color: "text-purple-400",
      accent: "bg-purple-500",
      description: "Break our games so we can make them better. Help design AI game prompts.",
      tasks: ["Playtesting", "Bug Hunting", "Prompt Engineering"],
      skills: ["Logic", "UX Design", "Product Testing"],
      deliverables: "Documented Bug List & Fun-Log"
    }
  ];

  const startGame = useCallback(() => {
    if (landed || gameActive) return;
    if (targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setTargetRect(rect);
      setPos({ x: window.innerWidth / 2 - 20, y: -200 });
      setGameActive(true);
      setShowGameUI(true);
      setShowCharacter(true);
      velocityRef.current = { x: 0, y: 1.8 };
      setTimeout(() => setShowGameUI(false), 5000);
    }
  }, [landed, gameActive]);

  // Effect to hide man after landing
  useEffect(() => {
    if (landed) {
      const timer = setTimeout(() => {
        setShowCharacter(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [landed]);


  const update = useCallback(() => {
    if (!gameActive || landed) return;
    
    setPos(prev => {
      let nextX = prev.x + velocityRef.current.x;
      let nextY = prev.y + velocityRef.current.y;
      velocityRef.current.x *= 0.98;
      
      if (nextX < 0) nextX = 0;
      if (nextX > window.innerWidth - 60) nextX = window.innerWidth - 60;
      
      if (targetRect) {
        const charCenterX = nextX + 30;
        const charCenterY = nextY + 100;
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;
        const dx = charCenterX - targetCenterX;
        const dist = Math.abs(dx);
        
        if (nextY > targetRect.top - 300) {
          velocityRef.current.x += (targetCenterX - charCenterX) * 0.015;
        }
        
        if (dist < 50 && charCenterY >= targetCenterY - 10) {
          setLanded(true);
          setGameActive(false);
          return { x: targetCenterX - 20, y: targetCenterY - 60 };
        }
      }
      
      if (nextY > window.innerHeight + 100) {
        setGameActive(false);
        return { x: window.innerWidth / 2, y: -200 };
      }
      
      return { x: nextX, y: nextY };
    });
    
    requestRef.current = requestAnimationFrame(update);
  }, [gameActive, landed, targetRect]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!gameActive) return;
      if (e.key === "ArrowLeft" || e.key === "a") velocityRef.current.x -= 1.4;
      if (e.key === "ArrowRight" || e.key === "d") velocityRef.current.x += 1.4;
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameActive]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-purple-500/30 overflow-x-hidden">
      <BackgroundNebula />
      
      {/* Parachutist Animation Container */}
      <AnimatePresence>
        {gameActive && (
          <GameParachutist key="active-man" pos={pos} landed={false} parachuteOpen={true} />
        )}
        {landed && showCharacter && (
          <GameParachutist key="landed-man" pos={pos} landed={true} parachuteOpen={false} />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[110] border-b border-white/[0.05] bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/careers')}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/50 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <Logo variant="horizontal" size="sm" forceWhite />
          </div>
          <button 
            onClick={() => navigate('/auth?mode=signup')}
            className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:bg-purple-400 transition-colors shadow-lg"
          >
            Join Oplus
          </button>
        </div>
      </header>

      <main className="relative z-10 pt-32 pb-20">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 text-center mb-24">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium">
              <Sparkles size={14} />
              Fall 2025 Applications Open
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[1]">
              Be Intern At <br />
              <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Oplus AI.
              </span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              A 4-week intensive remote program. Build real features and shape the future of social gaming with the founding team.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              {[
                { icon: Clock, text: "4 Weeks", color: "text-blue-400" },
                { icon: MapPin, text: "Remote", color: "text-emerald-400" },
                { icon: Zap, text: "Fast Paced", color: "text-amber-400" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <item.icon size={16} className={item.color} />
                  <span className="text-sm font-semibold">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>


        {/* Roles Section */}
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8">
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden h-full group">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 mb-6 uppercase tracking-widest">
                    <Award size={12} /> Detailed Track
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black mb-6">{tracks[activeTab].title}</h3>
                  <p className="text-slate-400 text-lg mb-10 leading-relaxed max-w-xl">{tracks[activeTab].description}</p>
                  
                  <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <h4 className="text-xs uppercase tracking-widest text-white/30 font-black">Weekly Tasks</h4>
                      <ul className="space-y-3">
                        {tracks[activeTab].tasks.map(t => (
                          <li key={t} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xs uppercase tracking-widest text-white/30 font-black">Success Metric</h4>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-medium italic text-slate-400">
                        "{tracks[activeTab].deliverables}"
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
              </div>
            </div>
            
            <div className="md:col-span-4 flex flex-col gap-4">
              {tracks.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-5 p-6 rounded-[2rem] border transition-all duration-500 text-left group relative overflow-hidden
                    ${activeTab === idx ? 'bg-white text-black border-white shadow-2xl' : 'bg-white/[0.03] border-white/10 hover:bg-white/5'}`}
                >
                  <div className={`p-4 rounded-2xl ${activeTab === idx ? 'bg-black text-white' : 'bg-white/5'}`}>
                    <t.icon size={28} />
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-xl tracking-tight">{t.title}</div>
                    <div className={`text-xs font-bold uppercase tracking-widest mt-1 ${activeTab === idx ? 'text-black/40' : 'text-white/20'}`}>
                      Explore Path
                    </div>
                  </div>
                  <ChevronRight size={20} className={`transition-transform duration-500 ${activeTab === idx ? "translate-x-1" : "opacity-0 -translate-x-2"}`} />
                </button>
              ))}
            </div>
          </div>
        </section>


        {/* Features */}
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Trophy, title: "Recognition", desc: "Official Oplus Certificate of Excellence for your portfolio.", bg: "bg-blue-500/10", text: "text-blue-400" },
              { icon: Users, title: "Founders", desc: "Work directly with founding engineers and product leads.", bg: "bg-purple-500/10", text: "text-purple-400" },
              { icon: Target, title: "Future", desc: "Top interns fast-tracked for full-time offers and equity.", bg: "bg-orange-500/10", text: "text-orange-400" }
            ].map((p, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.05] p-10 rounded-[2.5rem] hover:bg-white/[0.04] transition-colors">
                <div className={`w-14 h-14 rounded-2xl ${p.bg} flex items-center justify-center ${p.text} mb-8 shadow-inner`}>
                  <p.icon size={28} />
                </div>
                <h4 className="text-2xl font-black mb-4">{p.title}</h4>
                <p className="text-slate-400 leading-relaxed font-medium">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section with Game */}
        <section className="max-w-6xl mx-auto px-6 mb-20">
          <div 
            onMouseEnter={startGame}
            className="relative p-16 md:p-32 rounded-[3.5rem] bg-[#05050a] border border-white/10 overflow-hidden text-center shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
          >
            <LandingPad active={gameActive} landed={landed} />
            <div ref={targetRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none z-0" />
            
            <div className="relative z-20 space-y-10">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter">Ready to join?</h2>
              <p className="text-slate-400 text-lg md:text-xl max-w-lg mx-auto font-medium leading-relaxed">
                Take the leap. Apply now and start your journey with Oplus. No red tape, just progress.
              </p>
              
              <div className="flex flex-col items-center gap-8">
                <a
                  href="https://forms.gle/fBV9FjTWnFeM1kc96"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-4 px-14 py-6 rounded-full font-black text-2xl
                    ${landed ? "bg-white text-black" : "bg-indigo-600 text-white hover:bg-indigo-500"}`}
                >
                  {landed ? "APPLY NOW" : "Apply for Program"}
                  <ExternalLink size={24} />
                </a>
                
                {!landed && !gameActive && (
                  <div className="flex flex-col items-center gap-3 opacity-30">
                    <div className="text-xs font-black uppercase tracking-[0.3em]">Hover to Deploy</div>
                    <div className="w-px h-16 bg-gradient-to-b from-white to-transparent" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(79,70,229,0.15),transparent)] pointer-events-none" />
          </div>
        </section>
      </main>


      {/* Game UI Overlay */}
      <AnimatePresence>
        {showGameUI && !landed && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] w-full max-w-sm px-6"
          >
            <div className="bg-white text-black px-8 py-6 rounded-[2.5rem] shadow-2xl flex items-center gap-6 border border-white/20">
              <div className="bg-indigo-600 text-white p-4 rounded-2xl animate-pulse">
                <Gamepad2 size={24} />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-1">In Flight</div>
                <div className="text-sm font-bold leading-snug">
                  Use <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-300">ARROW KEYS</span> to guide your landing.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-20 text-center border-t border-white/5 relative z-10 bg-[#020205]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-white/10 font-black text-xs tracking-[0.4em] uppercase mb-6">Oplus AI Inc</div>
          <p className="text-white/30 text-xs font-bold max-w-sm mx-auto leading-relaxed">
            Building social infrastructure for the next generation of Gamers.
          </p>
          <div className="mt-12 text-white/5 text-[9px] font-black tracking-widest">© 2025 ALL RIGHTS RESERVED</div>
        </div>
      </footer>
    </div>
  );
};

export default Internships;
