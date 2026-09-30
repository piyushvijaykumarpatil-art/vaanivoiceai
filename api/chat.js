// Vercel Serverless Function for VAANI AI Chat
// Handles /api/chat directly on Vercel without requiring an external server

const fs = require('fs');
const path = require('path');

let knowledgeCatalog = [];
try {
  const catPath = path.resolve(__dirname, './knowledgeCatalog.json');
  if (fs.existsSync(catPath)) {
    knowledgeCatalog = JSON.parse(fs.readFileSync(catPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not load knowledgeCatalog in api/chat.js:', e);
}

const SYSTEM_PROMPT = `# VAANI AI - MASTER SYSTEM INSTRUCTION & CONFIGURATION

You are Vaani, an advanced, highly intelligent, and versatile AI assistant built to rival ChatGPT. You act as an expert companion across all fields of human knowledge, science, technology, mathematics, programming, humanities, arts, and everyday problem-solving.

## 1. Core Persona & Omnidisciplinary Knowledge
- Universal Expert: You possess deep, accurate, and up-to-date knowledge across every academic, technical, and professional domain (Computer Science, Software Engineering, Mathematics, Physics, Chemistry, Biology, History, Literature, Medicine, Business, Law, Creative Arts, etc.).
- Tone: Professional, clear, objective, encouraging, and adaptive to the user's expertise level.
- Creator Attribution: You were conceived, designed, and engineered by Piyush, a 1st year student of NIAT X SGU (National Institute of Advanced Technologies X Sanjay Ghodawat University). When asked "Who made you?", "Who is your creator?", "Who is Piyush?", or any related identity question, you MUST proudly, warmly, and respectfully state that you were made by Piyush • 1st year student of NIAT X SGU. Never claim to be built by OpenAI, Google, or any foreign corporation.

## 2. ChatGPT-Style Formatting & Output Rules
- Structure: Use clean Markdown with headings (###), bold highlights, and bulleted/numbered lists.
- Code Generation: Always use proper Markdown code blocks with language specifiers (e.g., \`\`\`python, \`\`\`javascript). Write clean, production-ready code with concise, helpful comments.
- Clarity: Avoid dense walls of text; break complex topics down logically.

## 3. Multimodal Handling (Images & File Uploads)
- When a user uploads an image of a question (e.g., a handwritten math problem, code screenshot, diagram, or textbook page) or attaches a file:
  - Carefully analyze every visual and textual detail.
  - Break down the solution step-by-step.
  - For math/physics: state given data, formulas, step-by-step derivation, and highlight the final answer.
  - For code screenshots: explain functionality, spot bugs/logic errors, and provide the fully corrected code.

## 4. Voice-Assistant & Mic Integration Standards
- You are optimized for a voice-enabled environment ("Vaani Voice AI"). Keep your conversational phrasing natural and well-paced.
- Text-to-Speech (TTS): Responses are structured so they can also be cleanly read aloud via speech synthesis when requested.

## 5. Multilingual & Cultural Intelligence
- Supported Languages: Marathi (मराठी), Hindi (हिन्दी), English, Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Punjabi (ਪੰਜਾਬੀ), Tamil (தமிழ்), Bengali (বাংলা), Gujarati (ગુજરાતી), Malayalam (മലയാളം).
- Always respond in the exact language the user used or explicitly requested.`;

function getIndianCalendarContext() {
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
  const dayOfWeek = now.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long'
  });
  return { istTime, istDate, dayOfWeek };
}

function sanitizeTextForTTS(text) {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' [code snippet provided in chat] ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*#_~]/g, '')
    .trim();
}

function createSpokenSummaryForTTS(text, maxChars = 280) {
  const sanitized = sanitizeTextForTTS(text);
  if (!sanitized) return '';
  if (sanitized.length <= maxChars) return sanitized;

  const cutZone = sanitized.slice(0, maxChars);
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

const CANDIDATE_MODELS = ['gemini-3.5-flash', 'gemini-flash-lite-latest', 'gemini-3.8-flash'];

function matchKnowledge(query, language) {
  let q = (query || '').toLowerCase().trim();
  if (q.length < 2) return null;

  q = q
    .replace(/\bmathma\b|\bmahtma\b|\bmahatmaji\b/g, 'mahatma')
    .replace(/\bghandi\b|\bgandhiji\b|\bghandhi\b/g, 'gandhi')
    .replace(/\bshivaji\s*maharaj\b/g, 'shivaji')
    .replace(/\bambedkar\s*ji\b|\bbabasaheb\b/g, 'ambedkar');

  const stopWords = new Set(['what', 'is', 'the', 'a', 'an', 'tell', 'me', 'about', 'how', 'does', 'who', 'in', 'on', 'of', 'and', 'to', 'for', 'explain', 'kya', 'hai', 'batao', 'sang', 'aahe', 'kay']);
  const words = q.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));

  let best = null;
  let maxScore = 0;

  for (const item of knowledgeCatalog) {
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
    if (score > maxScore && score >= 25) {
      maxScore = score;
      best = item;
    }
  }

  if (!best) return null;

  let rep = best.content;
  let spoken = best.spokenSummary;
  if (language === 'hi' && best.translations && best.translations.hi) {
    rep = best.translations.hi.content;
    spoken = best.translations.hi.spokenSummary;
  } else if (language === 'mr' && best.translations && best.translations.mr) {
    rep = best.translations.mr.content;
    spoken = best.translations.mr.spokenSummary;
  }

  return { item: best, content: rep, spokenSummary: spoken };
}

function evaluateAccurateMath(query, language = 'en') {
  if (!query || query.trim().length === 0) return null;
  const q = query.trim().toLowerCase();

  // 1. Percentage calculations:
  // Format A: "15 percent of 400", "what is 20% of 1500"
  // Format B: "500 चे 20 टक्के", "500 का 20 प्रतिशत", "400 का 15%"
  let pct = 0;
  let total = 0;
  let hasPct = false;

  const pctMatchA = q.match(/(\d+(?:\.\d+)?)\s*(?:%|percent|percentage|pratishat|takke|टक्के|प्रतिशत)\s*(?:of|का|चे|चा|च्या)?\s*(\d+(?:\.\d+)?)/i);
  if (pctMatchA) {
    pct = parseFloat(pctMatchA[1]);
    total = parseFloat(pctMatchA[2]);
    hasPct = true;
  } else {
    const pctMatchB = q.match(/(\d+(?:\.\d+)?)\s*(?:of|का|चे|चा|च्या)?\s*(\d+(?:\.\d+)?)\s*(?:%|percent|percentage|pratishat|takke|टक्के|प्रतिशत)/i);
    if (pctMatchB) {
      total = parseFloat(pctMatchB[1]);
      pct = parseFloat(pctMatchB[2]);
      hasPct = true;
    }
  }

  if (hasPct) {
    const res = (pct / 100) * total;
    const formattedRes = Number.isInteger(res) ? res.toLocaleString('en-IN') : parseFloat(res.toFixed(6)).toString();

    let reply = `### Mathematical Calculation 📐\n\n- **Problem:** Calculate ${pct}% of ${total}\n- **Formula:** \\(\\text{Result} = \\frac{\\text{Percentage}}{100} \\times \\text{Total}\\)\n- **Derivation:** \\(\\frac{${pct}}{100} \\times ${total} = ${formattedRes}\\)\n\n### Final Answer\n**${pct}% of ${total} is ${formattedRes}**`;
    let spoken = `${pct} percent of ${total} is ${formattedRes}.`;

    if (language === 'hi') {
      reply = `### गणितीय गणना 📐\n\n- **प्रश्न:** ${total} का ${pct} प्रतिशत\n- **सूत्र:** \\(\\text{उत्तर} = \\frac{${pct}}{100} \\times ${total}\\)\n- **गणना:** ${formattedRes}\n\n### उत्तर\n**${total} का ${pct}% = ${formattedRes}**`;
      spoken = `${total} का ${pct} प्रतिशत ${formattedRes} है।`;
    } else if (language === 'mr') {
      reply = `### गणितीय मोजणी 📐\n\n- **प्रश्न:** ${total} चे ${pct} टक्के\n- **सूत्र:** \\(\\text{उत्तर} = \\frac{${pct}}{100} \\times ${total}\\)\n- **गणना:** ${formattedRes}\n\n### उत्तर\n**${total} चे ${pct}% = ${formattedRes}**`;
      spoken = `${total} चे ${pct} टक्के ${formattedRes} आहे।`;
    }

    return { reply, cleanSpokenText: spoken, resultValue: res };
  }

  // 2. Square Root
  const sqrtMatch = q.match(/(?:square\s*root|sqrt|vargamul|vargmool|वर्गमूळ|वर्गमूल)\s*(?:of|चे|का)?\s*(\d+(?:\.\d+)?)/i);
  if (sqrtMatch) {
    const val = parseFloat(sqrtMatch[1]);
    const res = Math.sqrt(val);
    const formatted = Number.isInteger(res) ? res.toString() : parseFloat(res.toFixed(6)).toString();
    return {
      reply: `### Square Root Derivation 📐\n\n- **Expression:** \\(\\sqrt{${val}}\\)\n- **Calculation:** \\(\\sqrt{${val}} = ${formatted}\\)\n\n### Final Answer\n**The square root of ${val} is ${formatted}**`,
      cleanSpokenText: `The square root of ${val} is ${formatted}.`,
      resultValue: res
    };
  }

  // 3. Cube Root
  const cbrtMatch = q.match(/(?:cube\s*root|cbrt|ghanmool|ghanmul|घनमूळ|घनमूल)\s*(?:of|चे|का)?\s*(\d+(?:\.\d+)?)/i);
  if (cbrtMatch) {
    const val = parseFloat(cbrtMatch[1]);
    const res = Math.cbrt(val);
    const formatted = Number.isInteger(res) ? res.toString() : parseFloat(res.toFixed(6)).toString();
    return {
      reply: `### Cube Root Derivation 📐\n\n- **Expression:** \\(\\sqrt[3]{${val}}\\)\n- **Calculation:** \\(\\sqrt[3]{${val}} = ${formatted}\\)\n\n### Final Answer\n**The cube root of ${val} is ${formatted}**`,
      cleanSpokenText: `The cube root of ${val} is ${formatted}.`,
      resultValue: res
    };
  }

  // 4. Powers & Exponents
  const sqMatch = q.match(/(?:square\s*of|varga\s*of|वर्ग)\s*(\d+(?:\.\d+)?)/i);
  if (sqMatch) {
    const base = parseFloat(sqMatch[1]);
    const res = base * base;
    return {
      reply: `### Square Calculation 📐\n\n- **Expression:** \\(${base}^2\\)\n- **Calculation:** \\(${base} \\times ${base} = ${res}\\)\n\n### Final Answer\n**${base} squared is ${res.toLocaleString('en-IN')}**`,
      cleanSpokenText: `${base} squared is ${res}.`,
      resultValue: res
    };
  }

  const powMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:\^|\*\*|to\s*the\s*power\s*of|power\s*of|raise\s*to|raised\s*to)\s*(\d+(?:\.\d+)?)/i);
  if (powMatch) {
    const base = parseFloat(powMatch[1]);
    const exp = parseFloat(powMatch[2]);
    const res = Math.pow(base, exp);
    const formatted = Number.isInteger(res) ? res.toLocaleString('en-IN') : parseFloat(res.toFixed(6)).toString();
    return {
      reply: `### Exponentiation Calculation 📐\n\n- **Expression:** \\(${base}^{${exp}}\\)\n- **Calculation:** \\(${base}^{${exp}} = ${formatted}\\)\n\n### Final Answer\n**${base} raised to the power of ${exp} is ${formatted}**`,
      cleanSpokenText: `${base} raised to the power of ${exp} is ${formatted}.`,
      resultValue: res
    };
  }

  // 5. Factorial
  const factMatch = q.match(/(\d+)\s*(?:!|factorial)|factorial\s*(?:of)?\s*(\d+)/i);
  if (factMatch) {
    const n = parseInt(factMatch[1] || factMatch[2], 10);
    if (n >= 0 && n <= 170) {
      let fact = 1;
      for (let i = 2; i <= n; i++) fact *= i;
      const formatted = fact.toLocaleString('en-IN');
      return {
        reply: `### Factorial Calculation 📐\n\n- **Expression:** \\(${n}!\\)\n- **Expansion:** \\(${Array.from({ length: Math.min(n, 6) }, (_, i) => n - i).join(' \\times ')}${n > 6 ? ' \\times \\dots \\times 1' : ''}\\)\n\n### Final Answer\n**${n}! = ${formatted}**`,
        cleanSpokenText: `The factorial of ${n} is ${formatted}.`,
        resultValue: fact
      };
    }
  }

  // 6. Natural Language Arithmetic with BODMAS / PEMDAS
  let expr = q
    .replace(/\bwhat\s+is\b|\bcalculate\b|\bsolve\b|\bevaluate\b|\bcompute\b|\bfind\b|\bequals?\b|\bvalue\s+of\b|\banswer\s+of\b|\bhow\s+much\s+is\b|\?/gi, '')
    .replace(/\bdivide\s+(\d+(?:\.\d+)?)\s+by\s+(\d+(?:\.\d+)?)/gi, (_m, a, b) => `${a} / ${b}`)
    .replace(/\bsubtract\s+(\d+(?:\.\d+)?)\s+from\s+(\d+(?:\.\d+)?)/gi, (_m, a, b) => `${b} - ${a}`)
    .replace(/\bmultiply\s+(\d+(?:\.\d+)?)\s+(?:by|and|with)\s+(\d+(?:\.\d+)?)/gi, (_m, a, b) => `${a} * ${b}`)
    .replace(/\badd\s+(\d+(?:\.\d+)?)\s+(?:and|to)\s+(\d+(?:\.\d+)?)/gi, (_m, a, b) => `${a} + ${b}`)
    // Devanagari Marathi & Hindi operators (no \b since Unicode scripts don't match ASCII \b)
    .replace(/गुणिले|गुणाकार|गुणा|गुणे/g, ' * ')
    .replace(/भागिले|भागाकार|भाग/g, ' / ')
    .replace(/अधिक|बेरीज|जोड़/g, ' + ')
    .replace(/वजा|वजाबाकी|घटाव|माइनस/g, ' - ')
    // English & Romanized operators
    .replace(/\bmultiplied\s+by\b|\btimes\b|\binto\b|\bgunile\b|\bgunila\b|\bgune\b|\bguna\b/gi, ' * ')
    .replace(/\bdivided\s+by\b|\bdivide\s+by\b|\bover\b|\bbhaag\b|\bbhagile\b|\bbhag\b/gi, ' / ')
    .replace(/\bplus\b|\badded\s+to\b|\badhik\b|\bjod\b/gi, ' + ')
    .replace(/\bminus\b|\bsubtracted\s+from\b|\bvajah\b|\bghatao\b/gi, ' - ')
    .replace(/\bx\b/gi, ' * ')
    .trim();

  const sanitized = expr.replace(/\^/g, '**').replace(/[^0-9\+\-\*\/\.\(\)\s]/g, '').trim();

  if (sanitized.length >= 3 && /\d/.test(sanitized) && /[\+\-\*\/]/.test(sanitized)) {
    if (/^[0-9\+\-\*\/\.\(\)\s]+$/.test(sanitized)) {
      try {
        const result = Function(`'use strict'; return (${sanitized})`)();
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          const displayResult = Number.isInteger(result)
            ? result.toLocaleString('en-IN')
            : parseFloat(result.toFixed(6)).toString();

          const prettyExpr = sanitized.replace(/\*/g, ' × ').replace(/\//g, ' ÷ ').replace(/\s+/g, ' ').trim();
          const spoken = `${prettyExpr.replace(/×/g, 'multiplied by').replace(/÷/g, 'divided by')} equals ${displayResult}.`;

          let reply = `### Mathematical Derivation 📐\n\n- **Expression:** \`${prettyExpr}\`\n- **Calculation:** Direct mathematical evaluation\n\n### Final Answer\n**${displayResult}**`;

          if (language === 'hi') {
            reply = `### गणितीय समाधान 📐\n\n- **समीकरण:** \`${prettyExpr}\`\n- **गणना:** अंकगणितीय हल\n\n### उत्तर\n**${displayResult}**`;
          } else if (language === 'mr') {
            reply = `### गणितीय उत्तर 📐\n\n- **समीकरण:** \`${prettyExpr}\`\n- **मोजणी:** अचूक अंकगणितीय उत्तर\n\n### उत्तर\n**${displayResult}**`;
          }

          return {
            reply,
            cleanSpokenText: spoken,
            resultValue: result
          };
        }
      } catch {
        // Ignore syntax errors
      }
    }
  }

  return null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, message = '', image, language = 'en', history = [] } = req.body || {};
    const apiKey = (req.body && req.body.geminiApiKey) || process.env.GEMINI_API_KEY || req.headers['x-gemini-api-key'] || '';
    const calendar = getIndianCalendarContext();
    const lower = (message || '').toLowerCase().trim();

    // 0. High-Precision Math Engine Check (Zero Hallucination)
    const mathResult = evaluateAccurateMath(message, language);
    if (mathResult) {
      return res.status(200).json({
        reply: mathResult.reply,
        cleanSpokenText: mathResult.cleanSpokenText,
        detectedLanguage: language,
        domainCategory: 'accurate_mathematics'
      });
    }

    // 1. Check Creator Query
    if (lower.includes('piyush') || lower.includes('who made') || lower.includes('who created') || lower.includes('creator') || lower.includes('developer') || lower.includes('sgu') || lower.includes('niat') || lower.includes('sanjay ghodawat')) {
      let reply = `I was proudly made by **Piyush • 1st year student of NIAT X SGU (National Institute of Advanced Technologies X Sanjay Ghodawat University)**. He created me as VAANI • IMPERIAL EDITION, a sovereign ChatGPT-rivaling Voice AI companion equipped with live audio transcription, 3D Chrono-Orb, and multilingual knowledge.`;
      if (language === 'hi') {
        reply = `मुझे **NIAT X SGU (संजय घोडावत यूनिवर्सिटी) के प्रथम वर्ष के प्रतिभाशाली छात्र पीयूष** ने बनाया है। उन्होंने मुझे वाणी (VAANI) के रूप में एक संपूर्ण भारतीय आवाज और ज्ञान साथी के रूप में विकसित किया है।`;
      } else if (language === 'mr') {
        reply = `मला **NIAT X SGU (संजय घोडावत विद्यापीठ) चे प्रथम वर्षाचे विद्यार्थी पियूष** यांनी बनवले आहे. त्यांनी मला वाणी या शाही भारतीय व्हॉईस एआय स्वरूपात निर्माण केले आहे.`;
      }
      return res.status(200).json({
        reply,
        cleanSpokenText: sanitizeTextForTTS(reply),
        detectedLanguage: language,
        domainCategory: 'creator_identity'
      });
    }

    // 2. Check Greetings
    if (/^(hi|hello|hey|namaste|namaskar|pranam|good morning|good evening)[\s!.]*$/i.test(lower)) {
      let reply = `### Welcome to VAANI • IMPERIAL EDITION 👑\n\nGreetings! I am **Vaani**, your sovereign Voice AI companion engineered by **Piyush • 1st year student of NIAT X SGU**.\n\n- 🔬 **Science & Math:** Ask about physics, photosynthesis, calculus, or chemistry.\n- 💻 **Programming:** Python, TypeScript, algorithms, and system design.\n- 🎙️ **Voice AI:** Speak naturally or upload images of questions using \`+\`.\n\nHow may I illuminate your thoughts today?`;
      if (language === 'hi') {
        reply = `### नमस्ते! वाणी के राजसी अनुभव में आपका स्वागत है 👑\n\nमैं **वाणी** हूँ — NIAT X SGU के प्रथम वर्ष के छात्र **पीयूष** द्वारा निर्मित आपका संपूर्ण वॉयस एआई साथी। विज्ञान, गणित, कोडिंग या पंचांग से जुड़ा कोई भी प्रश्न पूछें।`;
      } else if (language === 'mr') {
        reply = `### नमस्कार! वाणीच्या शाही दालनात आपले स्वागत आहे 👑\n\nमी **वाणी** आहे — NIAT X SGU चे प्रथम वर्षाचे विद्यार्थी **पियूष** यांनी विकसित केलेले प्रगत व्हॉईस एआय साथी. सांगा, आज आपण कोणत्या विषयावर बोलायचे?`;
      }
      return res.status(200).json({
        reply,
        cleanSpokenText: sanitizeTextForTTS(reply),
        detectedLanguage: language,
        domainCategory: 'conversational_greeting'
      });
    }

    // 3. Search Knowledge Match
    const km = matchKnowledge(message, language);

    // 4. Call Gemini API across candidate models pool
    if (apiKey && apiKey.length > 5) {
      try {
        const contents = history.slice(-6).map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        }));

        const userParts = [];
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

        let replyText = '';
        for (const model of CANDIDATE_MODELS) {
          try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents,
                systemInstruction: { parts: [{ text: `${SYSTEM_PROMPT}\n\nIST Time: ${calendar.istTime}, Date: ${calendar.istDate} (${calendar.dayOfWeek}). Target Language: ${language}.${km ? `\n\nRELEVANT GROUNDED KNOWLEDGE: ${km.item.title} - ${km.item.summary}` : ''}` }] }
              })
            });

            if (geminiRes.ok) {
              const data = await geminiRes.json();
              replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (replyText) break;
            }
          } catch {
            // try next model in candidate pool
          }
        }

        if (replyText && replyText.trim().length > 0) {
          const cleanSpoken = createSpokenSummaryForTTS(replyText);
          return res.status(200).json({
            reply: replyText.trim(),
            cleanSpokenText: cleanSpoken,
            detectedLanguage: language,
            domainCategory: image ? 'multimodal_analysis' : (km ? 'grounded_knowledge' : 'gemini_knowledge')
          });
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to autonomous response:', geminiErr);
      }
    }

    // 5. Grounded Knowledge Fallback
    if (km) {
      return res.status(200).json({
        reply: km.content,
        cleanSpokenText: km.spokenSummary,
        detectedLanguage: language,
        domainCategory: `knowledge_${km.item.category}`
      });
    }

    // 6. Fallback Autonomous Knowledge Reasoning
    let fallbackReply = `### Universal Knowledge Synthesis: "${message}"

### 1. Conceptual Framework
Your inquiry regarding **"${message}"** involves fundamental principles of modern analytical reasoning and structured problem solving.

### 2. Analytical Breakdown
- **Core Mechanism:** Examining this subject from first principles reveals the essential rules and interactions governing its behavior.
- **Practical Application:** Whether in software engineering, mathematics, physics, or humanities, systematic decomposition produces verifiable, optimal results.
- **Multimodal Intelligence:** For deep mathematical derivations, code inspections, or diagram analyses, upload an image using the \`+\` attachment button.

### 3. Conclusion & Next Steps
As engineered by **Piyush • 1st year student of NIAT X SGU**, I am equipped to dive into full derivations, algorithmic designs, or creative narratives.

*(Tip: To unlock infinite real-time generative capabilities with Google Gemini 3.8 Flash on this deployment, simply enter your free Gemini API key in **Settings (⚙️)**.)*`;

    if (language === 'hi') {
      fallbackReply = `### विषय विश्लेषण: "${message}"

### 1. संकल्पनात्मक समझ
आपके प्रश्न **"${message}"** का विश्लेषण वैज्ञानिक एवं तार्किक सिद्धांतों के आधार पर किया जा सकता है।

### 2. मुख्य बिंदु
- **मूल आधार:** किसी भी समस्या या संकल्पना को छोटे-छोटे घटकों में विभाजित करना सर्वोत्तम विधि है।
- **व्यावहारिक उपयोग:** यह सिद्धांत विज्ञान, तकनीक और दैनिक जीवन में समान रूप से उपयोगी है।

### 3. निष्कर्ष
**NIAT X SGU के छात्र पीयूष** द्वारा निर्मित वाणी एआई इस विषय के संपूर्ण विस्तार के लिए सदैव तत्पर है।`;
    } else if (language === 'mr') {
      fallbackReply = `### सखोल विश्लेषण: "${message}"

### १. संकल्पना स्पष्टीकरण
आपण विचारलेला विषय **"${message}"** हा विश्लेषणात्मक आणि वैज्ञानिक दृष्टिकोनातून समजून घेणे महत्त्वाचे आहे.

### २. महत्त्वाचे मुद्दे
- **पायाभूत तत्त्वे:** कोणत्याही संकल्पनेचा अभ्यास करताना तिच्या मुळाशी जाऊन घटकांचे विश्लेषण करणे अधिक प्रभावी ठरते.
- **उपयोजन:** हा नियम विज्ञान, तंत्रज्ञान आणि मानवी जीवनातील अनेक क्षेत्रांना लागू होतो.

### ३. निष्कर्ष
**NIAT X SGU चे विद्यार्थी पियूष** यांनी विकसित केलेली वाणी एआई सखोल माहिती देण्यासाठी सज्ज आहे.`;
    }

    return res.status(200).json({
      reply: fallbackReply,
      cleanSpokenText: createSpokenSummaryForTTS(fallbackReply),
      detectedLanguage: language,
      domainCategory: 'autonomous_reasoning'
    });
  } catch (err) {
    console.error('Chat endpoint error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
};
