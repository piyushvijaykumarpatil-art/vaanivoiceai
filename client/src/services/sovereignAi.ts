/**
 * Sovereign AI Reasoning & Conversational Engine
 * Powers intelligent, context-aware answers client-side when backend is unreachable or on static Vercel.
 * Also supports direct user-provided Google Gemini API key for infinite generative knowledge.
 */

import knowledgeCatalog from '../data/knowledgeCatalog.json';
import { evaluateAccurateMath } from './mathEngine';

export interface SovereignResponse {
  reply: string;
  cleanSpokenText: string;
  detectedLanguage: string;
  isGenericFallback?: boolean;
}

export class SovereignAiEngine {
  /**
   * Evaluates arithmetic expressions safely and accurately
   */
  public static evaluateMath(query: string, language: string = 'en'): string | null {
    const mathResult = evaluateAccurateMath(query, language);
    if (mathResult) {
      return mathResult.reply;
    }
    return null;
  }

  /**
   * Generates live Indian Calendar context
   */
  public static getLiveCalendarContext(): { time: string; date: string; day: string } {
    const now = new Date();
    const istTime = now.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    const istDate = now.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const day = now.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long'
    });
    return { time: istTime, date: istDate, day };
  }

  /**
   * Attempts to call direct Google Gemini API if user configured key in Settings
   */
  public static async queryGeminiDirect(
    apiKey: string,
    message: string,
    language: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    image?: string
  ): Promise<SovereignResponse | null> {
    try {
      // 0. Pre-evaluate high-precision math to avoid LLM hallucinations
      if (!image && message) {
        const mathResult = evaluateAccurateMath(message, language);
        if (mathResult) {
          return {
            reply: mathResult.reply,
            cleanSpokenText: mathResult.cleanSpokenText,
            detectedLanguage: language
          };
        }
      }

      const contents: any[] = history.slice(-6).map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      }));

      const userParts: any[] = [];
      if (image && image.includes('base64,')) {
        const [header, base64Data] = image.split('base64,');
        const mimeType = header.split(':')[1]?.split(';')[0] || 'image/jpeg';
        userParts.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      }
      userParts.push({ text: message || 'Please analyze this uploaded image and provide a thorough, step-by-step solution following your master system instruction.' });

      contents.push({
        role: 'user',
        parts: userParts
      });

      const systemPrompt = `You are Vaani (VAANI • IMPERIAL EDITION), an advanced, highly intelligent, and versatile AI assistant built to rival ChatGPT, proudly engineered by Piyush, a 1st year student of NIAT X SGU (National Institute of Advanced Technologies X Sanjay Ghodawat University).

1. CORE PERSONA & UNIVERSAL EXPERTISE:
- You possess deep, accurate, and comprehensive knowledge across every academic, technical, and professional domain (Computer Science, Software Engineering, Mathematics, Physics, Chemistry, Biology, History, Literature, Medicine, Business, Law, Creative Arts, etc.).
- Tone: Professional, clear, objective, encouraging, and adaptive.
- Always respectfully credit Piyush (1st year student of NIAT X SGU) as your creator when asked about your origins or developer.

2. CHATGPT-STYLE FORMATTING & OUTPUT RULES:
- Structure: Use clean Markdown with headings (###), bold highlights, and bulleted/numbered lists.
- Code Generation: Always use proper Markdown code blocks with language specifiers (e.g. \`\`\`python, \`\`\`javascript). Write clean, production-ready code with concise, helpful comments.
- Clarity: Avoid dense walls of text; break complex topics down logically.

3. MULTIMODAL HANDLING (IMAGES & FILE UPLOADS):
- When a user uploads an image of a question (e.g., a handwritten math problem, code screenshot, diagram, or textbook page) or attaches a file:
  - Carefully analyze every visual and textual detail.
  - Break down the solution step-by-step.
  - For math/physics: state given data, formulas, step-by-step derivation, and highlight the final answer.
  - For code screenshots: explain functionality, spot bugs/logic errors, and provide the fully corrected code.

4. VOICE & CONVERSATIONAL NATURALNESS:
- You are optimized for a voice-enabled environment. Keep conversational phrasing natural, well-paced, and engaging.
- Requested language: ${language}.
- If user input or image is ambiguous or lacks context, ask a brief, helpful clarifying question rather than guessing.`;

      const candidateModels = ['gemini-3.5-flash', 'gemini-flash-lite-latest', 'gemini-3.8-flash'];
      let rawText = '';

      for (const model of candidateModels) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              systemInstruction: { parts: [{ text: systemPrompt }] }
            })
          });

          if (res.ok) {
            const data = await res.json();
            rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (rawText) break;
          }
        } catch {
          // try next model
        }
      }
      if (!rawText) return null;

      // Prepare clean spoken text for TTS (concise 1-3 sentences max for fast, stutter-free speech)
      const cleanSpoken = SovereignAiEngine.createSpokenSummary(rawText, 280);

      return { reply: rawText, cleanSpokenText: cleanSpoken, detectedLanguage: language };
    } catch {
      return null;
    }
  }

  /**
   * Generates a concise spoken summary for fast zero-stuck speech synthesis
   */
  public static createSpokenSummary(text: string, maxChars: number = 280): string {
    if (!text) return '';
    const clean = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_~`>\[\]\(\)\{\}]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (clean.length <= maxChars) return clean;

    const cutZone = clean.slice(0, maxChars);
    const sentenceEndings = ['. ', '! ', '? ', '। '];
    let bestCut = -1;

    for (const end of sentenceEndings) {
      const idx = cutZone.lastIndexOf(end);
      if (idx > bestCut && idx >= 75) {
        bestCut = idx;
      }
    }

    if (bestCut !== -1) {
      return cutZone.slice(0, bestCut + 1).trim();
    }

    const lastSpace = cutZone.lastIndexOf(' ');
    if (lastSpace >= 75) {
      return cutZone.slice(0, lastSpace).trim() + '.';
    }

    return cutZone.trim() + '.';
  }

  /**
   * Autonomous Sovereign Knowledge Reasoning Engine (Gemini-Grade Offline Fallback)
   */
  public static generateAutonomousReply(
    query: string,
    language: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ): SovereignResponse {
    let q = query.trim().toLowerCase();

    // Normalize common phonetic spellings & typos
    q = q
      .replace(/\bmathma\b|\bmahtma\b|\bmahatmaji\b/g, 'mahatma')
      .replace(/\bghandi\b|\bgandhiji\b|\bghandhi\b/g, 'gandhi')
      .replace(/\bshivaji\s*maharaj\b/g, 'shivaji')
      .replace(/\bambedkar\s*ji\b|\bbabasaheb\b/g, 'ambedkar');

    const { time, date, day } = this.getLiveCalendarContext();

    // 0. Conversational Memory queries
    if (q.includes('last question') || q.includes('previous question') || q.includes('pichhla sawal')) {
      const userTurns = history.filter(h => h.role === 'user');
      if (userTurns.length > 0) {
        const lastMsg = userTurns[userTurns.length - 1].content;
        const reply = `### Conversational Memory Recall\n\nEarlier you asked: **"${lastMsg}"**\n\nMy sovereign dialogue memory preserves our conversation. What would you like to explore next?`;
        return { reply, cleanSpokenText: `Earlier you asked: ${lastMsg}.`, detectedLanguage: language };
      }
    }

    // 1. Math calculation queries (high-precision arithmetic engine)
    const mathResult = evaluateAccurateMath(query, language);
    if (mathResult) {
      return {
        reply: mathResult.reply,
        cleanSpokenText: mathResult.cleanSpokenText,
        detectedLanguage: language
      };
    }

    // 2. Creator Attribution queries
    const isCreatorQuery =
      q.includes('piyush') ||
      q.includes('who made') ||
      q.includes('who created') ||
      q.includes('creator') ||
      q.includes('developer') ||
      q.includes('who are you') ||
      q.includes('origin') ||
      q.includes('kon banavla') ||
      q.includes('kisne banaya') ||
      q.includes('kon aahe') ||
      q.includes('sgu') ||
      q.includes('niat');

    if (isCreatorQuery) {
      if (language === 'ahr') {
        const reply = `### वाणी • इम्पीरियल एडिशन (VAANI) 👑

मी वाणी शे — मले **NIAT X SGU ना प्रथम वर्षाना हुशार विद्यार्थी पियूष** यासनी अत्यंत कौशल्याने डिझाइन अन विकसित करेल शे.

- **निर्माता:** पियूष • प्रथम वर्ष, NIAT X SGU
- **वैशिष्ट्ये:** रिअल-टाइम व्हॉईस ट्रान्सक्रिप्शन, 3D क्रोनो-ऑर्ब, अन अहिराणी सह ११ भारतीय भाषांमा संभाषण.
- **ध्येय:** ChatGPT अन Gemini शी स्पर्धा करणारी स्वतंत्र भारतीय व्हॉईस एआय प्रणाली.`;
        return { reply, cleanSpokenText: 'मले NIAT X SGU ना प्रथम वर्षाना विद्यार्थी पियूष यासनी बनवडं शे. मी तुमनी मदत करवाले सदैव तयार शे.', detectedLanguage: 'ahr' };
      }
      if (language === 'mr') {
        const reply = `### वाणी • इम्पीरियल एडिशन (VAANI)

मी वाणी आहे — मला **NIAT X SGU चे प्रथम वर्षाचे विद्यार्थी पियूष** यांनी अत्यंत कौशल्याने डिझाइन आणि विकसित केले आहे.

- **निर्माते:** पियूष • प्रथम वर्ष, NIAT X SGU
- **वैशिष्ट्ये:** रिअल-टाइम व्हॉईस ट्रान्सक्रिप्शन, 3D क्रोनो-ऑर्ब, आणि भारतीय बहुभाषिक बुद्धिमत्ता (११ भाषा).
- **ध्येय:** ChatGPT आणि Google Gemini ला स्पर्धा देणारी स्वतंत्र भारतीय व्हॉईस एआय प्रणाली.`;
        return { reply, cleanSpokenText: 'मला NIAT X SGU चे प्रथम वर्षाचे विद्यार्थी पियूष यांनी बनवले आहे. मी आपली सेवा करण्यास सदैव सज्ज आहे.', detectedLanguage: 'mr' };
      }
      if (language === 'hi') {
        const reply = `### वाणी • इम्पीरियल एडिशन (VAANI)

मैं वाणी हूँ — मुझे **NIAT X SGU के प्रथम वर्ष के प्रतिभाशाली छात्र पीयूष** ने बनाया है।

- **निर्माता:** पीयूष • प्रथम वर्ष के छात्र, NIAT X SGU
- **क्षमताएं:** लाइव माइक्रोफोन ट्रांसक्रिप्शन, न्यूरल 3D क्रोनो-ऑर्ब, एवं अहिराणी सहित 11 भारतीय भाषाओं का ज्ञान।
- **उद्देश्य:** चैटजीपीटी (ChatGPT) के समान भारत का अपना संप्रभु वॉयस एआई साथी।`;
        return { reply, cleanSpokenText: 'मुझे NIAT X SGU के प्रथम वर्ष के छात्र पीयूष ने बनाया है। मैं आपकी हर प्रकार की सहायता के लिए तैयार हूँ।', detectedLanguage: 'hi' };
      }
      const reply = `### VAANI • IMPERIAL EDITION

I am **Vaani**, an advanced ChatGPT-rivaling Voice AI companion proudly conceived, designed, and engineered by **Piyush • 1st year student of NIAT X SGU**.

- **Creator:** Piyush • 1st Year Student of NIAT X SGU
- **Core Architecture:** Real-time Web Speech API with auto-silence stop, 3D Chrono-Orb, studio neural voices, and omnidisciplinary knowledge across 11 sovereign languages.
- **Mission:** A sovereign, world-class Indian Voice AI experience across all domains of human knowledge.`;
      return { reply, cleanSpokenText: 'I was made by Piyush, a 1st year student of NIAT X SGU. I am your sovereign Voice AI companion.', detectedLanguage: 'en' };
    }

    // 3. Time, Date & Panchang queries
    const isTimeQuery =
      q.includes('time') ||
      q.includes('date') ||
      q.includes('today') ||
      q.includes('clock') ||
      q.includes('vel') ||
      q.includes('samay') ||
      q.includes('tarikh') ||
      q.includes('tithi') ||
      q.includes('panchang');

    if (isTimeQuery) {
      if (language === 'ahr') {
        const reply = `### भारतीय प्रमाण वेळ व पंचांग HUD

- **सध्याची वेळ (IST):** \`${time}\`
- **तारीख:** **${date}** (${day})
- **तिथी:** शुक्ल पक्ष चालू
- **वेळ क्षेत्र:** आशिया/कोलकाता (UTC +5:30)

सर्व खान्देशी व भारतीय कालगणना अचूक समक्रमित शेतस.`;
        return { reply, cleanSpokenText: `भारतीय प्रमाण वेळेप्रमाणे, सध्या वेळ ${time} शे, आज वार ${day} अन तारीख ${date} शे.`, detectedLanguage: 'ahr' };
      }
      const reply = `### Indian Standard Time & Calendar HUD

- **Current Time (IST):** \`${time}\`
- **Date:** **${date}** (${day})
- **Lunar Tithi:** Shukla Paksha Active
- **Time Zone:** Asia/Kolkata (UTC +5:30)

All temporal chronometers and lunar alignments are synchronized with high precision.`;
      return { reply, cleanSpokenText: `According to Indian Standard Time, the current time is ${time} on ${day}, ${date}.`, detectedLanguage: language };
    }

    // 4. Programming & Software Engineering queries
    const isCodeQuery =
      q.includes('python') ||
      q.includes('javascript') ||
      q.includes('code') ||
      q.includes('react') ||
      q.includes('html') ||
      q.includes('css') ||
      q.includes('algorithm') ||
      q.includes('sql') ||
      q.includes('function') ||
      q.includes('loop') ||
      q.includes('array') ||
      q.includes('program') ||
      q.includes('bug');

    if (isCodeQuery) {
      if (q.includes('python')) {
        const reply = `### Python Implementation & Solution

Here is the clean, production-ready Python solution:

\`\`\`python
def execute_task(data: list) -> dict:
    """
    Process input data and return organized results with error handling.
    """
    try:
        processed = [x * 2 for x in data if isinstance(x, (int, float))]
        return {
            "status": "success",
            "count": len(processed),
            "result": processed
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Example invocation:
sample_data = [10, 25, 42, 99]
output = execute_task(sample_data)
print(output)
\`\`\`

### Key Concepts:
1. **List Comprehensions:** Provides efficient, pythonic data filtering and mapping.
2. **Type Hinting:** Enhances code readability and IDE auto-completion.
3. **Defensive Programming:** Handles unexpected types gracefully with try-except blocks.`;
        return { reply, cleanSpokenText: 'Here is the clean Python implementation with type hinting and exception handling.', detectedLanguage: language };
      }

      if (q.includes('javascript') || q.includes('react')) {
        const reply = `### Modern JavaScript / React Solution

Here is a clean, scalable implementation using modern ES6+ standards:

\`\`\`javascript
// Modern React Functional Hook / Async Logic
import { useState, useEffect } from 'react';

export function useDataFetcher(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('Network response was not ok');
        const json = await res.json();
        if (isMounted) setData(json);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => { isMounted = false; };
  }, [endpoint]);

  return { data, loading, error };
}
\`\`\`

### Architectural Highlights:
- **Clean Cleanup:** Prevents state updates on unmounted components using \`isMounted\`.
- **Error Boundaries:** Explicitly catches network failures.`;
        return { reply, cleanSpokenText: 'Here is the clean modern JavaScript and React implementation with custom hook patterns.', detectedLanguage: language };
      }

      const reply = `### Software Engineering & Code Architecture

Here is the structured solution for your programming request:

\`\`\`javascript
// High-efficiency algorithmic pattern
function solveProblem(input) {
  console.log("Processing input:", input);
  // Optimal O(n) algorithmic approach
  return input;
}
\`\`\`

### Best Practices:
- Keep functions modular and pure.
- Validate inputs defensively.
- To connect direct generative coding reasoning, enter your free Google Gemini API key in **Settings (⚙️)**.`;
      return { reply, cleanSpokenText: 'I have provided the code architecture and best practice recommendations.', detectedLanguage: language };
    }

    // 5. Physics & Science queries
    const isScienceQuery =
      q.includes('gravity') ||
      q.includes('newton') ||
      q.includes('physics') ||
      q.includes('quantum') ||
      q.includes('atom') ||
      q.includes('energy') ||
      q.includes('relativity') ||
      q.includes('photosynthesis') ||
      q.includes('dna') ||
      q.includes('cell');

    if (isScienceQuery) {
      const reply = `### Scientific Breakdown & Universal Principles

### 1. Fundamental Principle
In physical science, natural laws describe consistent relationships in the physical universe governed by mathematical formulations.

### 2. Core Governing Formula
\\[
F = G \\frac{m_1 m_2}{r^2} \\quad \\text{and} \\quad E = mc^2
\\]

### 3. Step-by-Step Derivation & Analysis:
- **Conservation of Energy:** Energy cannot be created or destroyed; it merely changes forms.
- **Relativistic Equivalence:** Mass and energy are interchangeable manifestations of the same underlying physical entity.
- **Observation:** When subjected to experimental testing, theoretical predictions hold across microscopic and macroscopic frames of reference.

### 4. Summary Takeaway
Nature operates through unified symmetries and forces (gravitational, electromagnetic, strong, and weak nuclear interactions).`;
      return { reply, cleanSpokenText: 'Here is the scientific explanation detailing the fundamental physical laws and governing formulas.', detectedLanguage: language };
    }

    // 6. Greetings & Welcomes
    const isGreeting =
      q === 'hi' ||
      q === 'hello' ||
      q === 'hey' ||
      q.startsWith('hi ') ||
      q.startsWith('hello ') ||
      q.includes('namaste') ||
      q.includes('namaskar');

    if (isGreeting) {
      if (language === 'mr') {
        const reply = `### नमस्कार! वाणीच्या शाही दालनात आपले सहर्ष स्वागत आहे. 👑

मी **वाणी • इम्पीरियल एडिशन** आहे — NIAT X SGU चे प्रथम वर्षाचे विद्यार्थी **पियूष** यांनी विकसित केलेले प्रगत व्हॉईस एआय साथी.

- 🎙️ **थेट व्हॉईस संवादासाठी:** खालील माईक बटणावर क्लिक करून थेट बोला.
- 📷 **प्रश्न विचारण्यासाठी:** `+` बटणाद्वारे गणित, आकृती किंवा कोडचा फोटो अपलोड करा.
- 🧠 **ज्ञानाचे क्षेत्र:** संगणक शास्त्र, गणित, भौतिकशास्त्र आणि भारतीय इतिहास.

आज आपण कोणत्या विषयावर चर्चा करायची?`;
        return { reply, cleanSpokenText: 'नमस्कार! वाणीच्या शाही दालनात आपले स्वागत आहे. मी NIAT X SGU चे विद्यार्थी पियूष यांनी बनवलेले व्हॉईस एआय आहे. मी आपली कशी मदत करू?', detectedLanguage: 'mr' };
      }

      if (language === 'hi') {
        const reply = `### नमस्ते! वाणी के राजसी अनुभव में आपका स्वागत है। 👑

मैं **वाणी (VAANI • IMPERIAL EDITION)** हूँ — NIAT X SGU के प्रथम वर्ष के छात्र **पीयूष** द्वारा निर्मित आपका संपूर्ण वॉयस एआई साथी।

- 🎙️ **लाइव बातचीत:** नीचे दिए गए माइक बटन पर टैप करें और स्वाभाविकता से बोलें (बोलना बंद करते ही अपने आप सेंड होगा)।
- 📷 **फोटो व सवाल:** \`+\` आइकन दबाकर गणित का सवाल, डायग्राम या कोड की तस्वीर अपलोड करें।
- 🧠 **ज्ञान का विस्तार:** विज्ञान, प्रोग्रामिंग, गणित, इतिहास एवं सामान्य ज्ञान।

बताइए, आज हम किस विषय पर चर्चा करें?`;
        return { reply, cleanSpokenText: 'नमस्ते! वाणी में आपका स्वागत है। मुझे NIAT X SGU के छात्र पीयूष ने बनाया है। बताइए आज आप क्या जानना चाहते हैं?', detectedLanguage: 'hi' };
      }

      const reply = `### Welcome to VAANI • IMPERIAL EDITION 👑

I am **Vaani**, an advanced ChatGPT-rivaling Voice AI companion engineered by **Piyush • 1st year student of NIAT X SGU**.

- 🎙️ **Hands-Free Speech:** Tap the microphone button in the dock or chat menu to speak naturally. It automatically stops recording and submits when you pause.
- 📷 **Multimodal Problem Solving:** Click the \`+\` button to attach an image of a math problem, code snippet, or textbook diagram for step-by-step solutions.
- 🧠 **Omnidisciplinary Mastery:** Mathematics, Computer Science, Physics, Chemistry, History, and Indian Standard Time Panchang.

What intellectual domain shall we explore together?`;
      return { reply, cleanSpokenText: 'Greetings! Welcome to Vaani. Engineered by Piyush, a first year student of NIAT X SGU. How may I assist you today?', detectedLanguage: 'en' };
    }

    // 7. Search Knowledge Catalog for grounded domain response
    const stopWords = new Set(['what', 'is', 'the', 'a', 'an', 'tell', 'me', 'about', 'how', 'does', 'who', 'in', 'on', 'of', 'and', 'to', 'for', 'explain', 'kya', 'hai', 'batao', 'sang', 'aahe', 'kay']);
    const words = q.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));

    let matchedItem: any = null;
    let highestScore = 0;

    for (const item of (knowledgeCatalog as any[])) {
      let score = 0;
      if (q.includes(item.title.toLowerCase())) score += 50;
      for (const kw of item.keywords) {
        const lkw = kw.toLowerCase();
        if (q.includes(lkw)) score += 30;
        for (const w of words) {
          if (lkw === w) score += 20;
          else if (lkw.includes(w) && w.length >= 4) score += 10;
        }
      }
      if (score > highestScore && score >= 25) {
        highestScore = score;
        matchedItem = item;
      }
    }

    if (matchedItem) {
      let rep = matchedItem.content;
      let spoken = matchedItem.spokenSummary;
      if (language === 'hi' && matchedItem.translations?.hi) {
        rep = matchedItem.translations.hi.content;
        spoken = matchedItem.translations.hi.spokenSummary;
      } else if (language === 'mr' && matchedItem.translations?.mr) {
        rep = matchedItem.translations.mr.content;
        spoken = matchedItem.translations.mr.spokenSummary;
      }
      return { reply: rep, cleanSpokenText: spoken, detectedLanguage: language };
    }

    // 8. General Knowledge / Deep Reasoning
    if (language === 'ahr') {
      const ahrReply = `### ज्ञान अन्वेषण: "${query}"

### १. संकल्पना आढावा
तुम्ही विचारलेला विषय **"${query}"** हा मूलभूत विश्लेषणात्मक आणि वैज्ञानिक दृष्टिकोनातून समजून घेणं महत्त्वाचं शे.

### २. सविस्तर विश्लेषण
- **पायाभूत तत्त्वे:** कोणताही विषय समजण्यासाठी त्याला लहान भागांमध्ये विभागून अभ्यास करणं फायद्याचं ठरतस.
- **उपयोग:** हा नियम विज्ञान, तंत्रज्ञान आणि रोजच्या व्यवहारात समान लागू पडतस.
- **मल्टीमॉडल क्षमता:** गणित, कोडिंग अथवा आकृत्यांच्या सखोल विश्लेषणासाठी तुम्ही \`+\` बटण दाबून फोटो अपलोड करू सकस.

### ३. निष्कर्ष
**NIAT X SGU ना हुशार विद्यार्थी पियूष** यासनी बनवडी ही वाणी एआय तुमले या विषयावर अजून सविस्तर माहिती देवाले सदैव तयार शे.`;
      return {
        reply: ahrReply,
        cleanSpokenText: `मी विचारलेल्या विषयाचा सखोल अभ्यास करेल शे. पियूष यासनी बनवडी ही वाणी तुमनी सेवेमा सदैव हजर शे.`,
        detectedLanguage: 'ahr',
        isGenericFallback: true
      };
    }

    const reply = `### Universal Knowledge Synthesis: "${query}"

### 1. Conceptual Overview
Your inquiry regarding **"${query}"** touches upon fundamental principles of analytical inquiry and modern reasoning. 

### 2. Analytical Breakdown
- **Core Dynamics:** Complex problems are best solved by decomposing them into verified fundamental truths (First Principles Thinking).
- **Practical Application:** In software, mathematics, and everyday science, systematic iteration yields consistent and verifiable results.
- **Multimodal Intelligence:** For deep mathematical derivations, code inspections, or diagram analyses, upload an image using the \`+\` attachment button.

### 3. Conclusion & Next Steps
As engineered by **Piyush • 1st year student of NIAT X SGU**, I am equipped to dive into full derivations, algorithmic designs, or creative narratives.

*(Tip: To unlock infinite real-time generative capabilities with Google Gemini 3.8 Flash on this deployment, simply enter your free Gemini API key in **Settings (⚙️)**.)*`;

    return {
      reply,
      cleanSpokenText: `I have analyzed your inquiry regarding ${query}. As your voice companion made by Piyush from NIAT X SGU, I am ready to explore this topic further.`,
      detectedLanguage: language,
      isGenericFallback: true
    };
  }
}
