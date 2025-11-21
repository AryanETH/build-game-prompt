import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Sparkles, Play, Check, RotateCcw } from "lucide-react";
import { DinoGame } from "./DinoGame";

interface GameCreationFlowProps {
  isDarkMode?: boolean;
}

export const GameCreationFlow = ({ isDarkMode = true }: GameCreationFlowProps) => {
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [displayedPrompt, setDisplayedPrompt] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedLand, setSelectedLand] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const fullPrompt = "Create a simple Dino Jump game: choose dino color and environment, press space to jump over obstacles, and show a live score as the player survives.";

  const colors = [
    { name: "Green", value: "#22c55e", bg: "bg-green-500" },
    { name: "Blue", value: "#3b82f6", bg: "bg-blue-500" },
    { name: "Red", value: "#ef4444", bg: "bg-red-500" }
  ];

  const lands = [
    { name: "Grass", emoji: "🌱", bg: "from-green-600 to-green-800" },
    { name: "Desert", emoji: "🏜️", bg: "from-yellow-600 to-orange-800" },
    { name: "Ice", emoji: "❄️", bg: "from-blue-400 to-cyan-600" }
  ];

  const handleImagine = () => {
    setPrompt(fullPrompt);
    setIsTypingComplete(false);
  };

  // Typing animation effect
  useEffect(() => {
    if (prompt && displayedPrompt.length < prompt.length) {
      const timeout = setTimeout(() => {
        setDisplayedPrompt(prompt.slice(0, displayedPrompt.length + 1));
      }, 20); // Faster typing speed (was 30)
      return () => clearTimeout(timeout);
    } else if (prompt && displayedPrompt.length === prompt.length && !isTypingComplete) {
      // Typing complete, unlock step 2
      setIsTypingComplete(true);
      setTimeout(() => setStep(2), 300); // Small delay before unlocking
    }
  }, [prompt, displayedPrompt, isTypingComplete]);

  const handleGeneratePrompt = () => {
    if (selectedColor && selectedLand) {
      setIsGenerating(true);
      setTimeout(() => {
        setIsGenerating(false);
        setStep(3);
        setTimeout(() => setStep(4), 2000);
      }, 1500);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setScore(0);
  };

  const handleRetry = () => {
    setStep(1);
    setPrompt("");
    setDisplayedPrompt("");
    setIsTypingComplete(false);
    setSelectedColor("");
    setSelectedLand("");
    setIsGenerating(false);
    setScore(0);
    setIsPlaying(false);
  };



  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isPlaying) {
        e.preventDefault();
        // Jump animation would go here
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying]);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Step 1: Imagine */}
      <div className={`backdrop-blur-sm border rounded-2xl p-6 transition-all ${
        isDarkMode 
          ? `bg-white/5 ${step >= 1 ? 'border-white/20' : 'border-white/10'} ${step === 1 ? 'ring-2 ring-white/30' : ''}` 
          : `bg-black/5 ${step >= 1 ? 'border-black/20' : 'border-black/10'} ${step === 1 ? 'ring-2 ring-black/30' : ''}`
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Step 1: Imagine</h3>
          {step > 1 && <Check className="h-5 w-5 text-green-400" />}
        </div>
        <p className={`text-sm mb-4 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
          Click to start with a dino game idea
        </p>
        <Button
          onClick={handleImagine}
          disabled={step > 1}
          className={`w-full border ${
            isDarkMode 
              ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white' 
              : 'bg-black/10 hover:bg-black/20 border-black/20 text-black'
          }`}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Imagine
        </Button>
        {prompt && (
          <div className={`mt-4 p-3 rounded-lg border ${
            isDarkMode 
              ? 'bg-white/5 border-white/10' 
              : 'bg-black/5 border-black/10'
          }`}>
            <p className={`text-sm ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
              {displayedPrompt}
              {displayedPrompt.length < prompt.length && (
                <span className="animate-pulse">|</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Step 2: Prompting */}
      <div className={`backdrop-blur-sm border rounded-2xl p-6 transition-all ${
        isDarkMode 
          ? `bg-white/5 ${step >= 2 ? 'border-white/20' : 'border-white/10'} ${step === 2 ? 'ring-2 ring-white/30' : ''}` 
          : `bg-black/5 ${step >= 2 ? 'border-black/20' : 'border-black/10'} ${step === 2 ? 'ring-2 ring-black/30' : ''}`
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Step 2: Customize</h3>
          {step > 2 && <Check className="h-5 w-5 text-green-400" />}
        </div>
        
        <div className={`${step < 2 ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
            Choose color and environment
          </p>
          
          {/* Color Selection */}
          <div className="mb-4">
          <p className={`text-xs mb-2 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>Dino Color:</p>
          <div className="flex gap-2">
            {colors.map((color) => (
              <button
                key={color.name}
                onClick={() => setSelectedColor(color.name)}
                disabled={step !== 2}
                className={`w-10 h-10 rounded-lg ${color.bg} border-2 ${
                  selectedColor === color.name ? (isDarkMode ? 'border-white' : 'border-black') : (isDarkMode ? 'border-white/20' : 'border-black/20')
                } transition-all hover:scale-110 disabled:opacity-50`}
              />
            ))}
          </div>
        </div>

        {/* Land Selection */}
        <div className="mb-4">
          <p className={`text-xs mb-2 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>Environment:</p>
          <div className="flex gap-2">
            {lands.map((land) => (
              <button
                key={land.name}
                onClick={() => setSelectedLand(land.name)}
                disabled={step !== 2}
                className={`flex-1 p-2 rounded-lg bg-gradient-to-br ${land.bg} border-2 ${
                  selectedLand === land.name ? (isDarkMode ? 'border-white' : 'border-black') : (isDarkMode ? 'border-white/20' : 'border-black/20')
                } transition-all hover:scale-105 disabled:opacity-50`}
              >
                <div className="text-2xl">{land.emoji}</div>
                <div className="text-xs text-white/80">{land.name}</div>
              </button>
            ))}
          </div>
        </div>

          <Button
            onClick={handleGeneratePrompt}
            disabled={!selectedColor || !selectedLand || step !== 2}
            className={`w-full ${
              isDarkMode 
                ? 'bg-white text-black hover:bg-white/90' 
                : 'bg-black text-white hover:bg-black/90'
            }`}
          >
            Generate
          </Button>
        </div>
      </div>

      {/* Step 3: Creation */}
      <div className={`backdrop-blur-sm border rounded-2xl p-6 transition-all ${
        isDarkMode 
          ? `bg-white/5 ${step >= 3 ? 'border-white/20' : 'border-white/10'} ${step === 3 ? 'ring-2 ring-white/30' : ''}` 
          : `bg-black/5 ${step >= 3 ? 'border-black/20' : 'border-black/10'} ${step === 3 ? 'ring-2 ring-black/30' : ''}`
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Step 3: Creation</h3>
          {step > 3 && <Check className="h-5 w-5 text-green-400" />}
        </div>
        
        <div className={`${step < 3 ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
            AI is building your game...
          </p>
          
          {step >= 3 && (
          <div className="space-y-3">
            <div className={`h-32 rounded-lg bg-gradient-to-br border flex items-center justify-center relative overflow-hidden ${
              isDarkMode 
                ? 'from-white/10 to-white/5 border-white/10' 
                : 'from-black/10 to-black/5 border-black/10'
            }`}>
              {isGenerating ? (
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 border-2 rounded-full animate-spin ${
                    isDarkMode 
                      ? 'border-white/20 border-t-white' 
                      : 'border-black/20 border-t-black'
                  }`} />
                  <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>Generating...</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-2" style={{ 
                    color: colors.find(c => c.name === selectedColor)?.value 
                  }}>🦖</div>
                  <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>Game Ready!</p>
                </div>
              )}
            </div>
            {step >= 3 && !isGenerating && (
              <div className={`text-xs space-y-1 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span>Color: {selectedColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span>Land: {selectedLand}</span>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Step 4: Publish */}
      <div className={`backdrop-blur-sm border rounded-2xl p-6 transition-all ${
        isDarkMode 
          ? `bg-white/5 ${step >= 4 ? 'border-white/20' : 'border-white/10'} ${step === 4 ? 'ring-2 ring-white/30' : ''}` 
          : `bg-black/5 ${step >= 4 ? 'border-black/20' : 'border-black/10'} ${step === 4 ? 'ring-2 ring-black/30' : ''}`
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Step 4: Play</h3>
          {isPlaying && <div className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>Score: {score}</div>}
        </div>
        
        <div className={`${step < 4 ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
            Press spacebar to jump!
          </p>
          
          {step >= 4 && (
          <div className="space-y-3">
            <div className={`h-32 rounded-lg bg-gradient-to-br ${
              selectedLand === 'Grass' ? 'from-green-600 to-green-800' :
              selectedLand === 'Desert' ? 'from-yellow-600 to-orange-800' :
              'from-blue-400 to-cyan-600'
            } border border-white/10 flex items-center justify-center relative overflow-hidden`}>
              {isPlaying ? (
                <DinoGame 
                  color={colors.find(c => c.name === selectedColor)?.value || '#22c55e'}
                  landType={selectedLand}
                  onScoreUpdate={setScore}
                  onRetry={handleRetry}
                />
              ) : (
                <div className="text-5xl animate-bounce" style={{ 
                  color: colors.find(c => c.name === selectedColor)?.value 
                }}>
                  🦖
                </div>
              )}
              {isPlaying && (
                <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white z-10">
                  {score}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handlePlay}
                disabled={isPlaying}
                className={`flex-1 ${
                  isDarkMode 
                    ? 'bg-white text-black hover:bg-white/90' 
                    : 'bg-black text-white hover:bg-black/90'
                }`}
              >
                <Play className="mr-2 h-4 w-4" />
                {isPlaying ? 'Playing...' : 'Play Game'}
              </Button>
              
              <Button
                onClick={handleRetry}
                variant="outline"
                className={`${
                  isDarkMode 
                    ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white' 
                    : 'bg-black/10 hover:bg-black/20 border-black/20 text-black'
                }`}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            
            {isPlaying && (
              <p className={`text-xs text-center ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                Press SPACE to jump • DOWN for fast drop
              </p>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
};
