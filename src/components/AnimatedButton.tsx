import { ReactNode } from 'react';

interface AnimatedButtonProps {
  onClick?: () => void;
  children: ReactNode;
  isDarkMode?: boolean;
}

export const AnimatedButton = ({ onClick, children, isDarkMode = true }: AnimatedButtonProps) => {
  return (
    <button 
      onClick={onClick}
      className="animated-button relative flex items-center gap-1.5 px-5 py-2.5 bg-transparent border-none rounded-full cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-100"
      style={{
        transformOrigin: 'center',
      }}
    >
      {/* Background layer */}
      <div 
        className="absolute inset-0 rounded-full transition-all duration-300"
        style={{
          backgroundColor: isDarkMode ? 'hsla(0, 0%, 12%, 1)' : 'hsla(0, 0%, 95%, 1)',
          boxShadow: isDarkMode 
            ? 'inset 0 0.5px hsl(0, 0%, 100%), inset 0 -1px 2px 0 hsl(0, 0%, 0%), 0px 4px 10px -4px hsla(0 0% 0% / 1)'
            : 'inset 0 0.5px hsl(0, 0%, 0%), inset 0 -1px 2px 0 hsl(0, 0%, 100%), 0px 4px 10px -4px hsla(0 0% 0% / 0.3)',
          zIndex: 0,
        }}
      />

      {/* Gradient overlay on hover */}
      <div 
        className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(at 51% 89%, hsla(266, 45%, 74%, 1) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(266, 36%, 60%, 1) 0px, transparent 50%), radial-gradient(at 22% 91%, hsla(266, 36%, 60%, 1) 0px, transparent 50%)',
          backgroundColor: 'hsla(260 97% 61% / 0.75)',
          zIndex: 2,
        }}
      />

      {/* Rotating border dots */}
      <div 
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          width: 'calc(100% + 2px)',
          height: 'calc(100% + 2px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: -10,
        }}
      >
        <div 
          className="absolute w-full h-8 animate-spin"
          style={{
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            transformOrigin: 'center',
            backgroundColor: isDarkMode ? 'white' : 'black',
            mask: 'linear-gradient(transparent 0%, white 120%)',
            animation: 'rotate 2s linear infinite',
          }}
        />
      </div>

      {/* Sparkle icon */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        className="relative z-10 w-4 h-4 sparkle-icon"
      >
        <path 
          className="sparkle-path"
          strokeLinejoin="round" 
          strokeLinecap="round" 
          stroke={isDarkMode ? "white" : "black"}
          fill={isDarkMode ? "white" : "black"}
          d="M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z" 
        />
        <path 
          className="sparkle-path"
          strokeLinejoin="round" 
          strokeLinecap="round" 
          stroke={isDarkMode ? "white" : "black"}
          fill={isDarkMode ? "white" : "black"}
          d="M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.40725 15.8784 6.259 15.285L6 14.25Z" 
        />
        <path 
          className="sparkle-path"
          strokeLinejoin="round" 
          strokeLinecap="round" 
          stroke={isDarkMode ? "white" : "black"}
          fill={isDarkMode ? "white" : "black"}
          d="M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z" 
        />
      </svg>

      {/* Button text */}
      <span 
        className="relative z-10 text-xs font-semibold"
        style={{
          backgroundImage: isDarkMode 
            ? 'linear-gradient(90deg, hsla(0 0% 100% / 1) 0%, hsla(0 0% 100% / 1) 120%)'
            : 'linear-gradient(90deg, hsla(0 0% 0% / 1) 0%, hsla(0 0% 0% / 1) 120%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {children}
      </span>

      <style>{`
        @keyframes rotate {
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        .animated-button:hover .sparkle-path {
          animation: sparkle-pulse 1.5s linear 0.5s infinite;
        }

        @keyframes sparkle-pulse {
          0%, 34%, 71%, 100% {
            transform: scale(1);
          }
          17% {
            transform: scale(1.2);
          }
          49% {
            transform: scale(1.2);
          }
          83% {
            transform: scale(1.2);
          }
        }

        .sparkle-path {
          transform-origin: center;
          transition: transform 0.3s ease;
        }
      `}</style>
    </button>
  );
};
