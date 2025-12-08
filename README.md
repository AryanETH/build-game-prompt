# 🌀 Oplus AI — Create, Share & Play Instant AI-Generated Games

**Oplus AI** is a next-generation platform where anyone can instantly generate, customize, and play mini-games using AI. Inspired by TikTok's vertical content flow, Oplus AI introduces the world's first scrollable feed of AI-generated mini-games, complete with real-time interactions and social sharing.

[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://www.appcreator24.com/app3825715-wkm26q)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## ✨ Key Features

### 🎮 AI-Powered Game Creation
Create playable games within seconds using advanced AI:
- **Text-to-Game** — Describe your game idea in plain English
- **Imagine Mode** — AI expands short prompts into detailed game concepts
- **Multiple Game Engines** — Vanilla JS, Phaser, Three.js support
- **Graphics Quality Options** — Realistic, cartoon, pixel art, minimalist styles
- **Auto-generated thumbnails** — AI creates game cover images
- **Multiplayer support** — Co-op and competitive modes
- **Remix system** — Fork and customize existing games
- **Interactive creation flow** — Step-by-step game building with live preview

### 📱 TikTok-Style Game Feed
- **Vertical scrolling feed** — Swipe through games like social media
- **Infinite scroll** with lazy loading
- **Auto-play** games on scroll
- **Pull-to-refresh** for new content
- **9:16 mobile-first** design for optimal viewing
- **Skeleton loading** for smooth UX
- **Feed tabs** — For You, Following, Trending

### 🎨 Social Gaming Platform
- **Follow/Unfollow** creators and build your community
- **Real-time notifications** (20+ notification types)
- **Broadcast notifications** — Admins can send announcements with images/videos
- **Achievement system** — 20+ unlockable achievements with XP and badges
- **Comment system** with replies, mentions (@username), and hashtags (#tag)
- **Reactions** — Like, love, fire, star emojis on games
- **GIF support** in comments via Giphy integration
- **Activity feed** — Track all interactions
- **Profile customization** with circular avatar cropper
- **Plus membership** with golden badge
- **Online/Offline status** indicators

### 💰 In-App Economy & Monetization
- **Coin system** — Virtual currency (₹1 = 2 coins)
- **UPI payment integration** with QR codes
- **Mobile & Desktop payment flows**
- **UTR verification** system
- **Payment screenshot upload**
- **Admin coin approval** dashboard
- **Coin purchase history**
- **Email notifications** for coin credits
- **Creator monetization** opportunities

### 🎯 Multiplayer & Real-time Features
- **Matchmaking system** — Find opponents for multiplayer games
- **Turn-based gameplay** — Take turns playing games
- **Live match sessions** with scores
- **Voice chat** during gameplay (WebRTC)
- **Real-time presence** — See who's online
- **Queue system** — Join matchmaking queues
- **Spectator mode** — Watch opponents play

### 🔗 Sharing & Discovery
- **Instant sharing** — Share games via link (no downloads)
- **Public profiles** — View any user's games and stats
- **Search** — Find games, users, hashtags
- **Location filter** — Discover games by region
- **Trending algorithm** — Surface popular content
- **Clickable followers/following** lists
- **Deep linking** — Direct links to games and profiles

### 🎨 UI/UX Excellence
- **Dark/Light theme** with smooth transitions
- **Responsive design** — Mobile, tablet, desktop
- **Mobile bottom navigation**
- **Animated buttons** and interactions
- **Sound effects** — Click, success, error sounds
- **Rocket cursor** animation
- **Scroll reveal** animations
- **Count-up animations** for stats
- **Rounded dialog cards** (modern design)
- **Image cropper** with zoom and drag
- **Skeleton screens** for loading states
- **Error boundaries** for graceful failures
- **Toast notifications** with Sonner

### 🛡️ Admin & Moderation
- **Admin panel** with full control
- **Game management** — Create, edit, delete games
- **User management** — View all users and stats
- **Coin purchase approval** — Verify and credit coins
- **Broadcast notifications** — Send announcements to all users
- **Analytics dashboard** — Total games, users, likes, plays, comments
- **Content moderation** tools
- **Dark/Light theme** for admin panel

---

## 🛠 Tech Stack

### Frontend Framework & Build Tools
- **React 18.3** — UI framework with hooks
- **TypeScript 5.8** — Type safety and IntelliSense
- **Vite 5.4** — Lightning-fast build tool & dev server
- **React Router 6.30** — Client-side routing
- **Zustand 5.0** — Lightweight state management

### Styling & UI Components
- **Tailwind CSS 3.4** — Utility-first CSS framework
- **shadcn/ui** — 48+ pre-built accessible components
- **Radix UI** — Unstyled, accessible component primitives
  - Dialog, Dropdown, Popover, Tooltip, Avatar, Tabs, etc.
- **Lucide React** — 1000+ beautiful icons
- **next-themes** — Dark/Light mode support
- **tailwindcss-animate** — Animation utilities
- **class-variance-authority** — Component variants
- **Embla Carousel** — Touch-friendly carousels

### Backend & Database
- **Supabase 2.77** — Backend as a Service (BaaS)
  - **PostgreSQL** — Relational database
  - **Row Level Security (RLS)** — Fine-grained access control
  - **Real-time subscriptions** — Live data updates
  - **Authentication** — Email, OAuth, magic links
  - **Storage** — Images, videos, thumbnails
  - **Edge Functions** — Serverless Deno functions

### AI & Generation
- **OpenRouter API** — Access to multiple AI models
- **Google Generative AI** — Gemini models
- **RapidAPI** — AI image generation for thumbnails
- **AI-powered** game code generation
- **Prompt engineering** for game mechanics
- **Thumbnail generation** from descriptions

### Real-time & Communication
- **Supabase Realtime** — WebSocket-based live updates
- **Presence system** — Online/offline status
- **Broadcast channels** — Real-time messaging
- **WebRTC** — Peer-to-peer voice chat
- **Real-time notifications** — Instant updates
- **Live matchmaking** — Real-time player matching

### Forms & Validation
- **React Hook Form 7.61** — Performant form handling
- **Zod 3.25** — TypeScript-first schema validation
- **@hookform/resolvers** — Form validation integration

### Data Fetching & State
- **TanStack Query 5.90** — Server state management
- **Optimistic updates** — Instant UI feedback
- **Caching & invalidation** — Smart data management
- **Infinite queries** — Pagination support

### Media & Assets
- **QRCode** — Generate payment QR codes
- **react-easy-crop** — Image cropping with zoom
- **DOMPurify** — XSS protection for user content
- **date-fns** — Date formatting and manipulation
- **Giphy API** — GIF picker integration

### UI Utilities
- **cmdk** — Command palette
- **Sonner** — Beautiful toast notifications
- **Recharts** — Charts and analytics
- **Vaul** — Drawer component
- **input-otp** — OTP input fields
- **react-resizable-panels** — Resizable layouts

### Development Tools
- **ESLint 9** — Code linting
- **TypeScript ESLint** — TypeScript-specific linting
- **Autoprefixer** — CSS vendor prefixes
- **PostCSS** — CSS processing
- **@vitejs/plugin-react-swc** — Fast React refresh

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/oplus-ai.git
cd oplus-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_EMAIL=your_admin_email
```

4. **Run database migrations**
- Open Supabase SQL Editor
- Run the setup scripts in order:
  1. `QUICK_SETUP.sql`
  2. `ACHIEVEMENTS_SETUP.sql`
  3. `REACTIONS_SETUP.sql`
  4. `SETUP_NOTIFICATIONS_RLS.sql`

5. **Deploy Edge Functions** (Optional)
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Deploy functions
supabase functions deploy generate-game
supabase functions deploy generate-thumbnail
supabase functions deploy broadcast-notification
```

6. **Start development server**
```bash
npm run dev
```

7. **Open in browser**
```
http://localhost:5173
```

---

## 📲 Try Oplus AI

### � Web Appt
**[Launch Oplus AI →](https://www.appcreator24.com/app3825715-wkm26q)**

### 📱 Scan to Open
<div align="center">
  <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://www.appcreator24.com/app3825715-wkm26q" alt="Scan to open Oplus AI" />
  <p><i>Scan with your phone camera to open Oplus AI</i></p>
</div>

---

## 🎮 How It Works

1. **Explore** — Open Oplus AI and scroll through the game feed
2. **Create** — Tap Create → describe your game → AI generates it instantly
3. **Customize** — Edit game settings, upload custom UI mockups
4. **Play** — Your game is immediately playable
5. **Share** — Publish publicly or share with friends
6. **Earn** — Get likes, followers, and unlock achievements

---

## 📁 Project Structure

```
oplus-ai/
├── src/
│   ├── components/          # Reusable UI components (45+ components)
│   │   ├── ui/             # shadcn/ui components (48 components)
│   │   ├── GameFeed.tsx    # TikTok-style game feed
│   │   ├── GamePlayer.tsx  # Game player component
│   │   ├── NotificationPanel.tsx  # Real-time notifications
│   │   ├── AchievementsPanel.tsx  # Achievement system
│   │   ├── CoinPurchase.tsx       # Coin purchase flow
│   │   ├── TurnBasedGame.tsx      # Multiplayer game UI
│   │   ├── ImageCropper.tsx       # Avatar cropping
│   │   ├── GifPicker.tsx          # GIF picker
│   │   └── ...
│   ├── pages/              # Route pages (16 pages)
│   │   ├── Feed.tsx        # Main feed page
│   │   ├── Profile.tsx     # User profiles
│   │   ├── Create.tsx      # Game creation
│   │   ├── Admin.tsx       # Admin panel
│   │   ├── Activity.tsx    # Activity feed
│   │   ├── Search.tsx      # Search page
│   │   ├── Settings.tsx    # User settings
│   │   └── ...
│   ├── hooks/              # Custom React hooks (13 hooks)
│   │   ├── useAchievements.ts     # Achievement logic
│   │   ├── useMatchmaking.ts      # Multiplayer matchmaking
│   │   ├── use-voice-chat.ts      # Voice chat
│   │   ├── useOptimisticLike.ts   # Optimistic updates
│   │   ├── usePullToRefresh.ts    # Pull to refresh
│   │   └── ...
│   ├── lib/                # Utilities & helpers
│   │   ├── notificationSystem.ts  # Notification templates
│   │   ├── activityLogger.ts      # Activity tracking
│   │   ├── realtime.ts            # Real-time subscriptions
│   │   ├── sounds.ts              # Sound effects
│   │   ├── sanitize.ts            # XSS protection
│   │   └── ...
│   ├── integrations/       # External services
│   │   └── supabase/       # Supabase client & types
│   ├── store/              # Zustand stores
│   │   ├── gameStore.ts    # Game state
│   │   └── userStore.ts    # User state
│   └── types/              # TypeScript types
├── supabase/
│   └── functions/          # Edge functions (10 functions)
│       ├── generate-game/          # AI game generation
│       ├── generate-thumbnail/     # AI thumbnail generation
│       ├── broadcast-notification/ # Broadcast system
│       ├── imagine-game/           # Imagine mode
│       ├── send-coin-credit-email/ # Email notifications
│       └── ...
├── public/                 # Static assets
│   ├── logo.svg           # Oplus logo
│   └── ...
└── ...
```

---

## 🎯 Core Features Breakdown

### Game Feed
- Infinite scroll with lazy loading
- Auto-play videos on scroll
- Like, comment, share buttons
- Creator profile links
- Game statistics (plays, likes)
- Pull-to-refresh
- Skeleton loading states

### Game Creation
- AI-powered generation from text
- Imagine mode for detailed concepts
- Multiple game engines (Vanilla, Phaser, Three.js)
- Graphics quality options (realistic, cartoon, pixel, minimalist)
- Multiplayer mode selection (co-op, competitive)
- Thumbnail generation
- Preview before publishing
- Remix existing games
- Fallback templates when AI unavailable

### Social Features
- Follow/unfollow users
- Real-time notifications (20+ types)
- Activity feed
- Comments with replies
- @mentions support
- #hashtags support
- Linkified text (URLs, hashtags, mentions)
- GIF picker in comments
- Reactions (like, love, fire, star)
- Public profiles with stats
- Clickable followers/following lists

### Gamification
- Achievement system (20+ achievements)
- XP and leveling
- Badges and rewards
- Progress tracking
- Milestone notifications
- Leaderboards
- Creator rankings

### Monetization
- Coin purchase system
- UPI payment integration
- QR code payments (mobile & desktop)
- UTR verification
- Payment screenshot upload
- Admin approval workflow
- Email notifications
- Plus membership with golden badge
- Creator payouts

### Multiplayer
- Matchmaking system
- Turn-based gameplay
- Live match sessions
- Real-time scores
- Voice chat (WebRTC)
- Queue system
- Spectator mode
- Player presence

---

## 📌 Roadmap

### Phase 1 (Current) ✅
- ✅ TikTok-style game feed
- ✅ AI game generation
- ✅ Social features (follow, like, comment)
- ✅ Achievement system
- ✅ Coin economy
- ✅ Real-time notifications
- ✅ Multiplayer matchmaking
- ✅ Voice chat
- ✅ Admin panel
- ✅ Broadcast notifications

### Phase 2 (In Progress) 🔄
- 🔄 Advanced game editor
- 🔄 Game templates library
- 🔄 Creator analytics dashboard
- 🔄 Enhanced multiplayer modes

### Phase 3 (Planned) 📋
- 📋 AI-powered multiplayer generation
- 📋 Game asset marketplace
- 📋 Creator monetization program
- 📋 In-app token economy
- 📋 Advanced UI → game auto-converter
- 📋 AR mini-game support
- 📋 Mobile native apps (iOS/Android)
- 📋 Game tournaments
- 📋 Live streaming integration

---

## 🤝 Contributing

We welcome contributions from developers, designers, and creators!

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow the existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Be respectful and constructive

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have an idea? We'd love to hear from you!

- **Bug Reports**: [Open an issue](https://github.com/yourusername/oplus-ai/issues/new?template=bug_report.md)
- **Feature Requests**: [Open an issue](https://github.com/yourusername/oplus-ai/issues/new?template=feature_request.md)
- **Questions**: [Start a discussion](https://github.com/yourusername/oplus-ai/discussions)

---

## 📧 Support & Contact

- **Email**: oplusai.team@gmail.com
- **Twitter**: [@OplusAI](https://twitter.com/oplusai)
- **Discord**: [Join our community](https://discord.gg/oplusai)
- **Website**: [oplus.ai](https://www.appcreator24.com/app3825715-wkm26q)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenRouter** for AI model access
- **Supabase** for backend infrastructure
- **shadcn/ui** for beautiful components
- **Lucide** for icon system
- **Vercel** for hosting
- **Giphy** for GIF integration
- All our amazing **contributors** and **community members**

---

## ⭐ Show Your Support

If you like Oplus AI, please give it a **star ⭐** on GitHub!

It helps us grow and motivates us to keep improving the platform.

<div align="center">
  <h3>Made with ❤️ by the Oplus AI Team</h3>
  <p>Empowering everyone to create games with AI</p>
</div>

---

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/oplus-ai?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/oplus-ai?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/yourusername/oplus-ai?style=social)

---

<div align="center">
  <p>
    <a href="https://www.appcreator24.com/app3825715-wkm26q">Website</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-roadmap">Roadmap</a> •
    <a href="#-contributing">Contributing</a> •
    <a href="#-support--contact">Support</a>
  </p>
</div>
