export const LoadingSpinner = ({ fullScreen = false }: { fullScreen?: boolean }) => {
  const content = (
    <div className="relative">
      {/* Outer rotating ring */}
      <div className="absolute inset-0 rounded-full border-4 border-purple-600/20"></div>
      
      {/* Animated gradient ring */}
      <div className="w-20 h-20 rounded-full border-4 border-transparent border-t-purple-600 border-r-pink-600 animate-spin"></div>
      
      {/* Inner pulsing circle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 animate-pulse"></div>
      </div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-purple-600/30 blur-xl animate-pulse"></div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};
