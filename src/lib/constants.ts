// Z-Index System - Centralized z-index management
export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  sidebar: 50,
  bottomNav: 50,
  popover: 60,
  toast: 70,
  tooltip: 80,
  gamePlayer: 100,
} as const;

// Design Tokens
export const SPACING = {
  xs: '0.25rem', // 4px
  sm: '0.5rem',  // 8px
  md: '0.75rem', // 12px
  lg: '1rem',    // 16px
  xl: '1.5rem',  // 24px
  '2xl': '2rem', // 32px
  '3xl': '3rem', // 48px
} as const;

export const BORDER_RADIUS = {
  sm: '0.5rem',  // 8px
  md: '0.75rem', // 12px
  lg: '1rem',    // 16px
  xl: '1.5rem',  // 24px
  full: '9999px',
} as const;

// Touch Target Sizes (Accessibility)
export const TOUCH_TARGET = {
  minimum: 44, // iOS minimum
  recommended: 48, // Android recommended
} as const;

// Breakpoints
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;
