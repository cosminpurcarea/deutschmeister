cat > CLAUDE.md << 'EOF'
# DeutschMeister — Claude Code Build Instructions

## Objective
Build a German language learning web app powered by DeepSeek V3.
Goal is met when ALL of the following are true:
- [ ] `npm run dev` starts without errors on localhost:3000
- [ ] Chat sends messages to DeepSeek V3 and streams responses back
- [ ] AI responses follow the teacher persona in prompts.ts
- [ ] CORRECTIONS blocks are parsed by mistakeParser.ts and rendered as CorrectionBlock
- [ ] Every parsed mistake is saved to SQLite via Prisma
- [ ] Mistake tracker page /mistakes shows full error log + repetition queue
- [ ] RepetitionQueue injects top 3 weakest patterns back into the system prompt
- [ ] SAP Fiori visual style: white background, #0070F2 blue, #F0AB00 orange
- [ ] `npm run test` passes all tests with zero failures

## Stack
- Next.js 14 App Router + TypeScript (strict mode)
- Tailwind CSS — use ONLY the Fiori color tokens defined in fiori.css
- DeepSeek V3 via OpenAI-compatible SDK (base: https://api.deepseek.com)
- Prisma ORM + SQLite (database file: ./dev.db)
- Session identity: UUID stored in localStorage (no login, no auth)
- Streaming: ReadableStream from /api/chat to frontend via fetch
- Testing: Vitest + React Testing Library + @testing-library/user-event

## Fiori Design Tokens (apply everywhere)
Primary Blue:    #0070F2
Orange Accent:   #F0AB00
Background:      #FFFFFF
Surface:         #F5F6F7
Border:          #E5E5E5
Text Primary:    #32363A
Text Secondary:  #6A6D70
Success:         #107E3E
Error:           #BB0000
Font:            72 (fallback: Arial, sans-serif)

## Prisma Schema (create exactly this)
model Session {
  id        String    @id @default(uuid())
  createdAt DateTime  @default(now())
  mistakes  Mistake[]
}

model Mistake {
  id           String   @id @default(uuid())
  sessionId    String
  session      Session  @relation(fields: [sessionId], references: [id])
  wrong        String
  correct      String
  explanation  String
  repeatPhrase String
  count        Int      @default(1)
  topic        String   @default("general")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model RepetitionItem {
  id           String   @id @default(uuid())
  sessionId    String
  mistakeId    String
  phrase       String
  drilledCount Int      @default(0)
  mastered     Boolean  @default(false)
  createdAt    DateTime @default(now())
}

## Build Order — execute EXACTLY in this sequence
### Step 1 — Project Init
- Run: npx create-next-app@14 . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
- Install additional deps:
  npm install openai prisma @prisma/client uuid
  npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
- Run: npx prisma init --datasource-provider sqlite
- Replace prisma/schema.prisma with the schema above
- Run: npx prisma db push
- Run: npx prisma generate

### Step 2 — Fiori Design System
- Create src/styles/fiori.css with all Fiori tokens as CSS custom properties
- Create src/components/fiori/Shell.tsx (top bar with logo + nav: Home, Chat, Mistakes)
- Create src/components/fiori/Card.tsx
- Create src/components/fiori/Button.tsx (variant: primary=blue, accent=orange, ghost)
- Create src/components/fiori/Badge.tsx (error count, orange background)
- Apply Shell to src/app/layout.tsx

### Step 3 — Core Library Files
- Create src/lib/deepseek.ts (OpenAI client pointed at DeepSeek base URL)
- Create src/lib/prompts.ts (full teacher system prompt — see prompts section below)
- Create src/lib/mistakeParser.ts (extract ---CORRECTIONS--- blocks from AI text)
- Create src/lib/sessionId.ts (get or create UUID in localStorage)

### Step 4 — API Routes
- Create src/app/api/chat/route.ts (POST, streams DeepSeek response)
- Create src/app/api/mistakes/route.ts (GET list, POST save, PATCH increment count)

### Step 5 — Chat UI
- Create src/components/chat/ChatWindow.tsx
- Create src/components/chat/MessageBubble.tsx (user=blue right, AI=white left)
- Create src/components/chat/CorrectionBlock.tsx (red wrong → green correct card)
- Create src/components/chat/ScenarioCard.tsx (orange bordered scenario intro card)
- Create src/components/chat/InputBar.tsx (textarea + send button)
- Wire together in src/app/chat/page.tsx

### Step 6 — Mistake Tracker UI
- Create src/components/tracker/MistakeLog.tsx (table: wrong/correct/count/topic/repeat)
- Create src/components/tracker/RepetitionQueue.tsx (cards for phrases to drill)
- Create src/components/tracker/ProgressRing.tsx (SVG ring: session accuracy %)
- Wire together in src/app/mistakes/page.tsx

### Step 7 — Home Page
- src/app/page.tsx: Fiori tile grid with 3 tiles (Start Chat, View Mistakes, How It Works)
- Show session mistake count badge on View Mistakes tile

### Step 8 — Tests
- tests/mistakeParser.test.ts: test extraction of CORRECTIONS blocks
- tests/api.chat.test.ts: mock DeepSeek, test route returns stream
- tests/MistakeLog.test.tsx: renders table rows correctly
- tests/CorrectionBlock.test.tsx: renders wrong/correct/explanation
- Run: npm run test — fix ALL failures before declaring done

### Step 9 — Final Verification
- Run: npm run dev
- Verify: home page loads with Fiori tiles
- Verify: chat page streams AI response
- Verify: correction block appears after AI response
- Verify: /mistakes page shows the mistake saved
- Run: npm run build — must complete with zero errors

## AI Teacher System Prompt (put this in prompts.ts verbatim)
You are DeutschMeister, an expert German language teacher for B1-B2 English-speaking learners.
All your explanations and corrections are in English. All conversation practice is in German.

CORE BEHAVIOR:
1. Always respond IN CHARACTER first in German — be the person in the scenario, be natural
2. Be maximally proactive: ask follow-up questions, introduce new vocabulary, never let conversation die
3. After your in-character German response, ALWAYS add a CORRECTION BLOCK (see format below)
4. If no mistakes were made, add: "✅ Perfect! No mistakes." + one native-level vocabulary tip
5. Every 5 user messages, inject a NEW SCENARIO (see format below)
6. Track weak grammar patterns and reuse them in new contexts to force repetition
7. Vary topics: office emails, news, sport, business, daily life, small talk, phone calls

CORRECTION BLOCK — use EXACTLY this format every single response:
---CORRECTIONS---
❌ You said: "[exact user text with mistake]"
✅ Correct: "[corrected version]"
📖 Why: [grammar explanation in English, max 2 sentences]
🔁 Repeat: "[the key phrase the user should memorise]"
---END---
If multiple mistakes, stack multiple blocks. If no mistakes, write:
---CORRECTIONS---
✅ Keine Fehler! [one advanced vocabulary suggestion]
---END---

SCENARIO INJECTION — every 5 turns, use EXACTLY this format:
---SCENARIO---
🎭 Situation: [vivid real-world situation description]
👤 Your role: [user's role]
🤖 My role: [AI's role]
▶️ [AI opens the scene with first German line]
---END---

Topic rotation for scenarios (cycle through these):
- Office: writing formal email, meeting with colleague, presenting results
- Daily life: supermarket, pharmacy, doctor appointment, post office  
- News/opinion: discussing a news story, sport result, weather
- Social: small talk, making plans, texting a friend
- Formal: Amt appointment, bank, landlord conversation

## Mistake Parser Logic (implement in mistakeParser.ts)
Input: full AI response string
Output: array of { wrong, correct, explanation, repeatPhrase }
- Find all blocks between ---CORRECTIONS--- and ---END---
- Parse ❌ You said: → wrong field
- Parse ✅ Correct: → correct field  
- Parse 📖 Why: → explanation field
- Parse 🔁 Repeat: → repeatPhrase field
- If block contains "Keine Fehler" → return empty array
- Strip surrounding quotes from extracted values
- Export: parseMistakes(text: string): Mistake[]

## RepetitionQueue Logic
- When a mistake reaches count >= 2: add to RepetitionQueue
- Inject top 3 RepetitionQueue items into system prompt as:
  "PRIORITY REPETITION: The learner repeatedly makes these mistakes: [list]
   Naturally work these patterns into your next responses."
- When user gets a queued pattern correct: increment drilledCount
- When drilledCount >= 3: mark mastered = true, remove from queue

## CRITICAL RULES — never violate these
- NEVER expose DEEPSEEK_API_KEY in client-side code
- ALWAYS use server-side API route for DeepSeek calls
- ALWAYS parse and save mistakes after every AI response
- ALWAYS show CorrectionBlock even if empty (show "no mistakes" state)
- NEVER skip the streaming — use ReadableStream, not await-and-return
- If DeepSeek API errors: show user-friendly error in chat, log full error server-side
- Run npm run test after Step 8 — do not proceed to Step 9 if tests fail
EOF
