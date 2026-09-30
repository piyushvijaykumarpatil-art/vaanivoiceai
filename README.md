# 👑 VAANI • IMPERIAL EDITION ("The Sovereign Voice AI Experience")

> **👑 Made by Piyush • 1st Year Student of NIAT X SGU**  
> *A Sovereign Real-Time Voice AI Companion engineered with studio-grade human neural voice output, live voice and type interaction, 3D Gyroscopic Royal Chrono-Orb, Google Assistant-level conversational memory, 365-day Indian calendar intelligence, and dual-layer ACID + Supabase persistence.*

---

## 🌟 Key Innovations & Features

### 1. 👑 Creator Attribution & Royal Persona
- **Prominent Attribution**: Honoring **Piyush • 1st Year Student of NIAT X SGU** across the top navigation bar, the imperial landing hero, and conversational identity responses.
- **Conversational Identity**: When asked *"Who made you?"*, *"Who is your creator?"*, or *"Who is Piyush?"*, VAANI warmly and proudly acknowledges Piyush (1st Year Student of NIAT X SGU) in all 10 supported languages.

### 2. 🎙️ Pure Type-to-Voice Interaction Model
- **Zero Microphone Dependency**: Completely eliminates speech-to-text transcription latency, accent mismatches, and microphone permission barriers.
- **Studio-Grade Neural Speech**: The AI responds exclusively by speaking out loud in studio human neural voice with emotional cadence, natural pauses, and correct phonetic pronunciations.
- **Instant Interruption**: Live **"Stop Audio"** button allows immediate interruption and state reset at any moment.

### 3. 🔮 3D Gyroscopic Royal Chrono-Orb & Audio Visualizer
- **Canvas-Rendered 3D Spherical Physics**: Gyroscopic orbital rings with inclination matrices, rotational velocity, dynamic particle stars, and radiant luxury glow.
- **20-Bar Frequency Spectrum Visualizer**: Powered by the Web Audio API `AnalyserNode`, dynamically reacting to live audio frequency data.
- **Dual State Machine**: Ambient breathing pulse during idle silence; expanded orbits and radiant glow pulses during active speech.

### 4. 🎨 1-Click Luxury Themes (6 Royal Presets)
Instant theme switcher dynamically updates CSS variables, radial glows, glassmorphism backdrops, and canvas particles:
1. 👑 **24K Gold**: Imperial Onyx & Gold radiance (`#F59E0B` / `#05070B`)
2. 💎 **Royal Emerald**: Sovereign Royal Jade glassmorphism (`#10B981` / `#040A07`)
3. 🌌 **Celestial Sapphire**: Midnight Deep Blue Astral Radiance (`#3B82F6` / `#040714`)
4. 🌹 **Crimson Ruby**: Velvet Crimson Glow & Sovereignty (`#F43F5E` / `#0C0407`)
5. 🔮 **Cyber Amethyst**: Mystic Purple Cosmic Aura (`#A855F7` / `#080411`)
6. ⚡ **Titanium Cyan**: Aurora Titanium Cyber Brilliance (`#06B6D4` / `#030A0D`)

### 5. 🌐 Multilingual Intelligence (9 Indian Languages + English)
Full conversational fluency and native scripts:
- 🇮🇳 **Marathi (मराठी)** (`mr-IN-AarohiNeural` / `mr-IN-ManoharNeural`)
- 🇮🇳 **Hindi (हिन्दी)** (`hi-IN-SwaraNeural` / `hi-IN-MadhurNeural`)
- 🌐 **English** (`en-US-JennyNeural` / `en-US-GuyNeural`)
- 🇮🇳 **Telugu (తెలుగు)** (`te-IN-ShrutiNeural`)
- 🇮🇳 **Kannada (ಕನ್ನಡ)** (`kn-IN-SapnaNeural`)
- 🇮🇳 **Punjabi (ਪੰਜਾਬੀ)** (`pa-IN-GurpreetNeural`)
- 🇮🇳 **Tamil (தமிழ்)** (`ta-IN-PallaviNeural`)
- 🇮🇳 **Bengali (বাংলা)** (`bn-IN-TanishaaNeural`)
- 🇮🇳 **Gujarati (ગુજરાતી)** (`gu-IN-DhwaniNeural`)

### 6. 🧠 Google Assistant-Grade Memory & Indian Calendar Intelligence
- **Multi-Turn Context Awareness**: Accurately resolves recall queries (*"What was our last chat?"*, *"What did I ask first?"*, *"pichhla sawal kya tha?"*, *"aadhi kay vicharlo hoto?"*).
- **Contextual Pronoun Resolution**: Intelligently resolves entities across conversational turns (*"Where is it?"*, *"Tell me more about it"*, *"aur batao"*).
- **Indian Calendar & Live HUD**: Ticking IST digital chrono-clock (UTC+5:30), Hindu lunar Tithi calculations, Shukla/Krishna Paksha, Shravan season awareness, 365-day Indian festival engine, and quick math evaluation.

### 7. 💾 Dual-Layer ACID Persistence & Database Studio
- **Layer 1 (Local)**: Zero-dependency atomic ACID JSON engine (`data/vaani.database.json`) with in-memory write queues and temp-file atomic swaps (`fs.rename`).
- **Layer 2 (Cloud)**: Supabase Cloud PostgreSQL integration (`https://zjqkcyrsqkzkvztgrcnx.supabase.co`).
- **Database Studio**:
  - Live Supabase connection tester
  - 1-Click "Sync Local Data to Supabase"
  - 1-Click "Copy Complete PostgreSQL SQL Schema"
  - Local JSON database backup download & restore

---

## 🛠️ Architecture & Tech Stack

```
vaani-imperial-edition/
├── package.json              # Orchestration scripts
├── data/
│   └── vaani.database.json   # Local ACID JSON database
├── server/
│   ├── src/
│   │   ├── index.ts          # Express app entry & WebSocket
│   │   ├── db/
│   │   │   ├── acidEngine.ts # Atomic ACID JSON engine
│   │   │   └── supabaseClient.ts # Supabase Cloud sync & SQL exporter
│   │   ├── services/
│   │   │   ├── gemini.ts     # Conversational intelligence & memory
│   │   │   ├── calendarService.ts # IST, Tithi, & festival engine
│   │   │   └── ttsEngine.ts  # Neural speech synthesis pipeline
│   │   ├── routes/
│   │   │   ├── chat.ts       # /api/chat
│   │   │   ├── tts.ts        # /api/tts
│   │   │   ├── sessions.ts   # /api/sessions
│   │   │   ├── sync.ts       # /api/sync
│   │   │   └── feedback.ts   # /api/feedbacks & /api/calendar
│   │   └── utils/
│   │       ├── mutex.ts      # Concurrency write lock
│   │       └── textSanitizer.ts # TTS text cleaner
└── client/
    ├── src/
    │   ├── App.tsx           # Master view coordinator
    │   ├── index.css         # 6 Luxury theme tokens & glassmorphism
    │   ├── audio/
    │   │   └── soundManager.ts # Web Audio API & AnalyserNode
    │   └── components/
    │       ├── LandingHero.tsx       # Imperial portal & language cards
    │       ├── ChronoOrb3D.tsx       # 3D Gyroscopic Royal Chrono-Orb canvas
    │       ├── WaveformVisualizer.tsx# 20-bar reactive equalizer
    │       ├── LuxuryDockInput.tsx   # Pure Type-to-Voice dock
    │       ├── ThemeSwitcher.tsx     # 1-Click luxury theme switcher
    │       ├── LanguageSelector.tsx  # 10 Multilingual selector
    │       ├── LiveHudClock.tsx      # Ticking IST & calendar HUD
    │       ├── CreatorBadge.tsx      # Piyush • NIAT badge & modal
    │       ├── DatabaseStudioModal.tsx# Supabase sync & backup manager
    │       └── TranscriptDrawer.tsx  # Dialogue transcript log
```

---

## 🚀 Running the Application

### 1. Start the Backend Server (Port 5000)
```bash
npm run server
```

### 2. Start the Frontend Application (Port 3000)
```bash
npm run client
```

Open your browser at **`http://localhost:3000`** to experience **Vaani — Imperial Edition**.
