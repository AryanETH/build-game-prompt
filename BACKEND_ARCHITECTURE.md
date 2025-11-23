# Game Creation Backend Technical Process

## Complete Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/TypeScript)                      │
│                         src/pages/Create.tsx                             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ User clicks "Generate"
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS (Deno)                        │
│                         Serverless Backend                               │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
        ┌───────────────┐ ┌──────────────┐ ┌─────────────────┐
        │ generate-game │ │ generate-    │ │ generate-music  │
        │               │ │ thumbnail    │ │                 │
        └───────┬───────┘ └──────┬───────┘ └────────┬────────┘
                │                │                   │
                │                │                   │
                ▼                ▼                   ▼
        ┌───────────────┐ ┌──────────────┐ ┌─────────────────┐
        │ OpenRouter AI │ │ RapidAPI     │ │ Free Music      │
        │ (DeepSeek)    │ │ (Flux AI)    │ │ Library         │
        └───────┬───────┘ └──────┬───────┘ └────────┬────────┘
                │                │                   │
                │ Returns        │ Returns           │ Returns
                │ HTML5 Code     │ Image Binary      │ MP3 URL
                │                │                   │
                └────────────────┼───────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  SUPABASE POSTGRES DB  │
                    │  + Storage Buckets     │
                    └────────────────────────┘
```

---

## Step-by-Step Backend Process

### **STEP 1: User Initiates Game Creation**

**Frontend (Create.tsx)**
```typescript
const handleGenerate = async () => {
  // User input
  const prompt = "Create a space shooter game";
  const title = "Space Invaders";
  const options = {
    isMultiplayer: false,
    graphicsQuality: "realistic"
  };
  
  // Call Edge Function
  const { data } = await supabase.functions.invoke('generate-game', {
    body: { prompt, title, options }
  });
}
```

**What happens:**
- User fills form with prompt, title, description
- Clicks "Generate" button
- Frontend makes HTTP POST to Supabase Edge Function
- Request includes JWT token for authentication

---

### **STEP 2: Edge Function - Game Code Generation**

**Location:** `supabase/functions/generate-game/index.ts`

**Process:**

#### A. Authentication & Environment Setup
```typescript
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
```

#### B. AI Request to OpenRouter
```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'deepseek/deepseek-chat',  // AI Model
    messages: [
      {
        role: 'system',
        content: `You are an expert mini-game generator...
        
        CRITICAL RULES:
        - Generate COMPLETE HTML file
        - Include inline CSS and JavaScript
        - Game MUST be immediately playable
        - Include visible characters/sprites
        - Auto-assign keyboard controls
        - Canvas rendering for graphics
        - Score tracking, lives system
        - Game over logic
        - Under 700 lines of code
        - Mobile + Desktop responsive
        `
      },
      {
        role: 'user',
        content: `Prompt: ${prompt}\nOptions: ${JSON.stringify(options)}`
      }
    ]
  })
});
```

#### C. Response Processing
```typescript
const data = await response.json();
const rawCode = data.choices?.[0]?.message?.content ?? '';

// Sanitize: Remove markdown, ensure HTML structure
const sanitizeGameHtml = (input: string): string => {
  let out = input.trim();
  out = out.replace(/^```[a-zA-Z]*\n?|```$/gms, ''); // Remove ```html
  
  // Wrap if missing <html> tag
  if (!/(<html[\s>])/i.test(out)) {
    out = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
  ${out}
</body>
</html>`;
  }
  return out;
};

const gameCode = sanitizeGameHtml(rawCode);
```

#### D. Error Handling with Fallback
```typescript
if (!response.ok) {
  if (response.status === 429) {
    return { error: 'Rate limit exceeded' };
  }
  if (response.status === 402) {
    return { error: 'Payment required - add credits' };
  }
  throw new Error('Failed to generate game');
}
```

**Fallback Template** (if AI fails):
```typescript
// Frontend has buildFallbackGameCode()
// Returns pre-built arcade runner game
// Ensures users can always create games
```

---

### **STEP 3: Edge Function - Thumbnail Generation**

**Location:** `supabase/functions/generate-thumbnail/index.ts`

**Process:**

#### A. Extract Game Metadata
```typescript
const { description } = await req.json();

// Extract protagonist/partner names
const nameMatches = [...description.matchAll(/[A-Z][a-zA-Z]+/g)];
const protagonist = nameMatches[0]?.[0] || "Hero";
const partner = nameMatches[1]?.[0] || "Companion";

// Detect genre from keywords
let genre = "Action";
const descLower = description.toLowerCase();
if (descLower.includes("sci") || descLower.includes("space")) 
  genre = "Sci-Fi";
else if (descLower.includes("fantasy") || descLower.includes("magic")) 
  genre = "Fantasy";
// ... more genre detection
```

#### B. Create AI Image Prompt
```typescript
const finalPrompt = `Create a stunning vertical mobile game screenshot in 9:16 portrait format (1080x1920 pixels).

GAME CONCEPT: ${description}

VISUAL REQUIREMENTS:
- VERTICAL PORTRAIT orientation (9:16 aspect ratio)
- Mobile game screenshot aesthetic
- Cinematic, high-quality 3D rendering
- ${genre} genre visual style
- Dramatic lighting and atmospheric effects

COMPOSITION:
- Vertical framing for mobile screens
- Main action/characters in center frame
- Professional game marketing screenshot quality

STRICT RULES:
- NO text, UI elements, HUD, or game interface
- NO logos, watermarks, or borders
- Pure cinematic game scene only

Seed: ${Date.now()}`;
```

#### C. Call RapidAPI (Flux AI)
```typescript
const apiKey = Deno.env.get("RAPIDAPI_KEY");

const rapid = await fetch(
  "https://ai-text-to-image-generator-flux-free-api.p.rapidapi.com/...",
  {
    method: "POST",
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": "ai-text-to-image-generator-flux-free-api.p.rapidapi.com",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `prompt=${encodeURIComponent(finalPrompt)}&aspect_ratio=9:16&width=1080&height=1920&seed=${Date.now()}`
  }
);

const binaryImage = new Uint8Array(await rapid.arrayBuffer());
```

#### D. Upload to Supabase Storage
```typescript
const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

const filePath = `public/${Date.now()}-${safeTitle}.jpg`;

await supabase.storage
  .from("thumbnails")  // Storage bucket
  .upload(filePath, binaryImage, {
    contentType: "image/jpeg",
    upsert: false,
  });

const { data: publicUrlData } = supabase.storage
  .from("thumbnails")
  .getPublicUrl(filePath);

return { thumbnailUrl: publicUrlData.publicUrl };
```

---

### **STEP 4: Edge Function - Music Generation**

**Location:** `supabase/functions/generate-music/index.ts`

**Process:**

```typescript
// Currently uses free music library
const freeMusicLibrary = [
  'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
  'https://assets.mixkit.co/music/preview/mixkit-games-worldbeat-466.mp3',
  'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3',
  // ... more tracks
];

// Return random track
const randomMusic = freeMusicLibrary[Math.floor(Math.random() * freeMusicLibrary.length)];

return { musicUrl: randomMusic };
```

**Note:** Can be upgraded to AI music generation (Suno AI, MusicGen, etc.)

---

### **STEP 5: Database Storage**

**Location:** Supabase PostgreSQL Database

#### Games Table Schema
```sql
CREATE TABLE public.games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  game_code TEXT NOT NULL,              -- Full HTML5 game code
  thumbnail_url TEXT,                   -- Generated thumbnail
  cover_url TEXT,                       -- Cover image
  creator_id UUID REFERENCES profiles(id),
  
  -- Game metadata
  likes_count INTEGER DEFAULT 0,
  plays_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 2,
  
  -- Multiplayer features
  is_multiplayer BOOLEAN DEFAULT false,
  multiplayer_type TEXT,                -- 'co-op', 'versus', etc.
  graphics_quality TEXT,                -- 'realistic', 'pixel', etc.
  
  -- Privacy
  is_public BOOLEAN DEFAULT true,
  
  -- Audio
  sound_url TEXT,                       -- Background music
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Insert Game Record
```typescript
const fullPayload = {
  title: title.slice(0, 100),
  description: description.slice(0, 500),
  game_code: gameCode,                  // Complete HTML
  creator_id: userId,
  is_multiplayer: options.isMultiplayer,
  multiplayer_type: options.multiplayerType,
  graphics_quality: options.graphicsQuality,
  thumbnail_url: thumbnailUrl,
  cover_url: thumbnailUrl,
  sound_url: musicUrl,
  is_public: true,
};

const { data, error } = await supabase
  .from('games')
  .insert(fullPayload)
  .select('*')
  .single();
```

---

## Data Flow Diagram

```
User Input (Frontend)
    ↓
    prompt: "Create space shooter"
    title: "Space Invaders"
    options: { multiplayer: false }
    ↓
┌───────────────────────────────────────┐
│   Supabase Edge Function Gateway      │
└───────────────────────────────────────┘
    ↓
    ├─→ generate-game
    │       ↓
    │   OpenRouter API (DeepSeek AI)
    │       ↓
    │   Returns: Complete HTML5 game code
    │       ↓
    │   Sanitize & validate
    │
    ├─→ generate-thumbnail
    │       ↓
    │   RapidAPI (Flux AI Image Generator)
    │       ↓
    │   Returns: Binary image (1080x1920 JPG)
    │       ↓
    │   Upload to Supabase Storage
    │       ↓
    │   Returns: Public URL
    │
    └─→ generate-music
            ↓
        Free Music Library
            ↓
        Returns: MP3 URL
    ↓
┌───────────────────────────────────────┐
│      Supabase PostgreSQL Database     │
│                                       │
│  INSERT INTO games (                  │
│    game_code,                         │
│    thumbnail_url,                     │
│    sound_url,                         │
│    ...                                │
│  )                                    │
└───────────────────────────────────────┘
    ↓
Returns game ID to frontend
    ↓
Navigate to /game/{id}
```

---

## Technology Stack

### **Backend Infrastructure**
- **Supabase Edge Functions** - Serverless Deno runtime
- **PostgreSQL** - Relational database
- **Supabase Storage** - Object storage for images/assets
- **Row Level Security (RLS)** - Database-level permissions

### **AI Services**
- **OpenRouter** - AI gateway (routes to DeepSeek)
- **DeepSeek Chat** - Code generation model
- **RapidAPI Flux** - Image generation
- **Mixkit** - Free music library

### **Authentication**
- **Supabase Auth** - JWT-based authentication
- **Row Level Security** - User-specific data access

### **APIs Used**
```
OpenRouter API:
  POST https://openrouter.ai/api/v1/chat/completions
  Model: deepseek/deepseek-chat
  Cost: ~$0.14 per 1M input tokens

RapidAPI Flux:
  POST https://ai-text-to-image-generator-flux-free-api.p.rapidapi.com/...
  Format: 9:16 portrait (1080x1920)
  Cost: Free tier available

Mixkit Music:
  GET https://assets.mixkit.co/music/preview/...
  Cost: Free
```

---

## Error Handling & Fallbacks

### **AI Generation Fails**
```typescript
try {
  // Call OpenRouter
} catch (error) {
  if (error.status === 402) {
    toast.error("Add credits to OpenRouter");
  }
  // Use fallback template
  producedCode = buildFallbackGameCode(title);
}
```

### **Thumbnail Generation Fails**
```typescript
catch (error) {
  // Use placeholder
  const placeholderUrl = `https://placehold.co/1080x1920/6D28D9/FFFFFF/png?text=${gameTitle}`;
  setThumbnailUrl(placeholderUrl);
}
```

### **Database Schema Mismatch**
```typescript
let insertRes = await supabase.from('games').insert(fullPayload);
if (insertRes.error) {
  // Fallback to minimal payload
  const minimalPayload = { title, description, game_code, creator_id };
  insertRes = await supabase.from('games').insert(minimalPayload);
}
```

---

## Security Features

### **Row Level Security (RLS)**
```sql
-- Only creator can update their games
CREATE POLICY "Users can update their own games"
  ON public.games FOR UPDATE
  USING (auth.uid() = creator_id);

-- Everyone can view public games
CREATE POLICY "Games are viewable by everyone"
  ON public.games FOR SELECT
  USING (is_public = true OR auth.uid() = creator_id);
```

### **JWT Verification**
```typescript
// Edge Function verifies JWT token
const token = req.headers.get('Authorization').replace('Bearer ', '');
const claims = await verifyClerkJwt(token, PUBLIC_KEY);
const userId = claims?.sub;
```

### **Input Sanitization**
```typescript
// Remove markdown code fences
out = out.replace(/^```[a-zA-Z]*\n?|```$/gms, '');

// Ensure HTML structure
if (!/(<html[\s>])/i.test(out)) {
  out = wrapInHtmlTemplate(out);
}
```

---

## Performance Optimizations

### **Parallel Processing**
```typescript
// Generate thumbnail and music simultaneously
const [thumbnailResult, musicResult] = await Promise.all([
  generateThumbnail(prompt),
  generateMusic(title)
]);
```

### **Caching Strategy**
- Generated games stored in database
- Thumbnails cached in CDN (Supabase Storage)
- Music URLs are static (no regeneration needed)

### **Code Size Limits**
- AI instructed to keep games under 700 lines
- Reduces storage and improves load times
- Inline CSS/JS (no external dependencies)

---

## Cost Analysis

**Per Game Creation:**
- OpenRouter (DeepSeek): ~$0.001 - $0.01
- RapidAPI (Flux): Free tier or ~$0.02
- Supabase Storage: ~$0.001 per image
- Database: Negligible (included in plan)

**Total: ~$0.01 - $0.03 per game**

---

## Monitoring & Logging

```typescript
console.log('Generating game from prompt:', prompt);
console.log('Game generated successfully');
console.error('Error in generate-game function:', {
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});
```

**Logs accessible via:**
- Supabase Dashboard → Edge Functions → Logs
- Real-time streaming during development

---

## Summary

Your game creation backend is a **serverless AI pipeline** that:

1. ✅ Takes user prompts
2. ✅ Generates complete HTML5 games via AI
3. ✅ Creates marketing thumbnails via AI
4. ✅ Adds background music
5. ✅ Stores everything in PostgreSQL + Storage
6. ✅ Returns playable game instantly
7. ✅ Has fallbacks for every failure point
8. ✅ Costs pennies per game
9. ✅ Scales automatically (serverless)
10. ✅ Secure with RLS and JWT

**It's essentially a "Game-as-a-Service" platform powered by AI.**
