# Game Engines Feature

## Overview
Added support for multiple professional game engines to the Oplus AI Game Engine platform. Users can now choose from 5 different engines when creating games.

## Supported Engines

### 1. **Vanilla HTML5 Canvas** (Default)
- **Best for:** Fast, lightweight games
- **Use cases:** Simple games, prototypes, maximum compatibility
- **Features:** Pure JavaScript, no dependencies

### 2. **Phaser.js**
- **Best for:** 2D games
- **Use cases:** 
  - Shooting games (top-down, side-scrolling)
  - Platformers (Mario-style, Metroidvania)
  - Racing games (arcade racing, endless runners)
  - Battle games (fighting, arena combat)
- **Features:** Built-in physics, sprite system, animations, tilemap support
- **CDN:** `https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js`

### 3. **Three.js**
- **Best for:** 3D browser games
- **Use cases:**
  - First-person shooters
  - 3D racing games
  - Space simulators
  - 3D puzzle games
- **Features:** WebGL rendering, 3D math, lighting, shadows, textures
- **CDN:** `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js`

### 4. **Babylon.js**
- **Best for:** AAA-level 3D graphics
- **Use cases:**
  - Advanced 3D games with realistic physics
  - VR/AR experiences
  - Complex 3D simulations
  - Professional game development
- **Features:** PBR materials, advanced physics, particle systems, post-processing
- **CDN:** `https://cdn.babylonjs.com/babylon.js`

### 5. **PlayCanvas**
- **Best for:** Professional game development
- **Used by:** King, Zynga, Facebook Instant Games
- **Use cases:**
  - Commercial games
  - Mobile games
  - Social games
  - Professional projects
- **Features:** Entity-Component-System, built-in physics, asset management
- **CDN:** `https://code.playcanvas.com/playcanvas-stable.min.js`

## Implementation Details

### Frontend Changes (`src/pages/Create.tsx`)
- Added `gameEngine` state variable
- Added engine selector dropdown with descriptions
- Passes engine selection to both `imagine-game` and `generate-game` functions

### Backend Changes (`supabase/functions/generate-game/index.ts`)
- Added `getEngineInstructions()` function with detailed setup guides for each engine
- Added `getEngineDescription()` helper function
- Updated AI prompts to include engine-specific instructions
- AI now generates code using the selected engine's architecture and best practices

## How It Works

1. **User selects engine** from dropdown in Create page
2. **Imagine step** considers engine capabilities when designing game concept
3. **Generate step** creates game code using selected engine:
   - Includes appropriate CDN links
   - Follows engine's architecture patterns
   - Uses engine's built-in features (physics, rendering, etc.)
   - Implements engine-specific best practices

## Benefits

- **Flexibility:** Choose the right tool for the job
- **Professional Quality:** Use industry-standard engines
- **Better Performance:** Leverage optimized engines for complex games
- **3D Support:** Create 3D games with Three.js, Babylon.js, or PlayCanvas
- **Learning:** Explore different game development approaches

## Usage Example

```typescript
// User selects "Phaser.js" engine
// Enters prompt: "A space shooter with asteroids"
// AI generates Phaser 3 game with:
// - Phaser.Scene architecture
// - Arcade Physics for collisions
// - Sprite groups for enemies
// - Particle emitters for effects
// - Built-in camera system
```

## Future Enhancements

- Add more engines (PixiJS, Matter.js, etc.)
- Engine-specific templates and examples
- Performance benchmarking per engine
- Engine recommendation based on game type
- Custom engine configurations
