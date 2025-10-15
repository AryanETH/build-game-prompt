/**
 * Sound effects for the application
 * Uses Web Audio API to generate simple sound effects
 */

// Audio context for sound generation
let audioContext: AudioContext | null = null;

// Initialize audio context
const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      return null;
    }
  }
  
  return audioContext;
};

// Helper function to create a simple tone
const createTone = (frequency: number, duration: number, volume: number = 0.1): void => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
};

// Helper function to create a click sound (short, high-pitched)
const createClickSound = (): void => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume audio context if suspended (required for user interaction)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // Create a short, sharp click sound
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.setValueAtTime(800, ctx.currentTime);
  oscillator.type = 'square';
  
  // Quick attack and decay
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.1);
};

// Helper function to create a success sound (ascending tone)
const createSuccessSound = (): void => {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // Create an ascending chord
  const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
  
  frequencies.forEach((freq, index) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime + index * 0.1);
    gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + index * 0.1 + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.1 + 0.3);
    
    oscillator.start(ctx.currentTime + index * 0.1);
    oscillator.stop(ctx.currentTime + index * 0.1 + 0.3);
  });
};

// Helper function to create an error sound (descending tone)
const createErrorSound = (): void => {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // Create a descending tone
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.setValueAtTime(400, ctx.currentTime);
  oscillator.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.2);
  oscillator.type = 'sawtooth';
  
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.3);
};

/**
 * Play a click sound effect
 * Used for button clicks and interactions
 */
export const playClick = (): void => {
  try {
    createClickSound();
  } catch (error) {
    console.warn('Failed to play click sound:', error);
  }
};

/**
 * Play a success sound effect
 * Used for successful actions
 */
export const playSuccess = (): void => {
  try {
    createSuccessSound();
  } catch (error) {
    console.warn('Failed to play success sound:', error);
  }
};

/**
 * Play an error sound effect
 * Used for error states
 */
export const playError = (): void => {
  try {
    createErrorSound();
  } catch (error) {
    console.warn('Failed to play error sound:', error);
  }
};