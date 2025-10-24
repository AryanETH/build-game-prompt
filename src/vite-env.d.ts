/// <reference types="vite/client" />

// Minimal Clerk global typing to satisfy TS without installing packages
declare global {
  interface Window {
    Clerk?: any;
  }
}

export {};
