interface LogoProps {
  variant?: 'full' | 'horizontal' | 'icon';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  forceWhite?: boolean;
  forceBlack?: boolean;
}

const sizeClasses = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-12',
  xl: 'h-32 md:h-40'
};

export const Logo = ({ 
  variant = 'horizontal', 
  className = '', 
  size = 'md',
  forceWhite = false,
  forceBlack = false
}: LogoProps) => {
  const logoSrc = {
    full: '/Oplus full logo.png',
    horizontal: '/Oplus full horizonatal.png',
    icon: '/Oplus only.png'
  }[variant];

  // Determine invert class based on props
  let invertClass = '';
  if (forceWhite) {
    invertClass = 'invert'; // Always white
  } else if (forceBlack) {
    invertClass = ''; // Always black
  } else {
    invertClass = 'dark:invert'; // Auto switch based on theme
  }

  return (
    <img 
      src={logoSrc}
      alt="Oplus"
      className={`w-auto ${sizeClasses[size]} ${invertClass} ${className}`}
    />
  );
};
