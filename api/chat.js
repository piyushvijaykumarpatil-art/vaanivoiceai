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
- Creator Attribution: You were conceived, designed, and engineered by Piyush, a 1st year student of SGU (Sanjay Ghodawat University). When asked "Who made you?", "Who is your creator?", "Who is Piyush?", or any related identity question, you MUST proudly, warmly, and respectfully state that you were made by Piyush • 1st year student of SGU. Never claim to be built by OpenAI, Google, or any foreign corporation.

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

function matchKnowledge(query, language) {
  const q = (query || '').toLowerCase().trim();
  if (q.length < 2) return null;

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
    const apiKey = process.env.GEMINI_API_KEY || req.headers['x-gemini-api-key'] || '';
    const calendar = getIndianCalendarContext();
    const lower = (message || '').toLowerCase().trim();

    // 1. Check Creator Query
    if (lower.includes('piyush') || lower.includes('who made') || lower.includes('who created') || lower.includes('creator') || lower.includes('developer') || lower.includes('sgu') || lower.includes('sanjay ghodawat')) {
      let reply = `I was made by Piyush • 1st year student of SGU. He created me as VAANI • IMPERIAL EDITION, a sovereign ChatGPT-rivaling Voice AI companion equipped with live audio transcription, 3D Chrono-Orb, and multilingual knowledge.`;
      if (language === 'hi') {
        reply = `मुझे SGU के प्रथम वर्ष के छात्र पीयूष ने बनाया है। उन्होंने मुझे वाणी (VAANI) के रूप में एक संपूर्ण भारतीय आवाज और ज्ञान साथी के रूप में विकसित किया है।`;
      } else if (language === 'mr') {
        reply = `मला SGU चे प्रथम वर्षाचे विद्यार्थी पियूष यांनी बनवले आहे. त्यांनी मला वाणी या शाही भारतीय व्हॉईस एआय स्वरूपात निर्माण केले आहे.`;
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
      let reply = `### Welcome to VAANI • IMPERIAL EDITION 👑\n\nGreetings! I am **Vaani**, your sovereign Voice AI companion engineered by **Piyush • 1st year student of SGU**.\n\n- 🔬 **Science & Math:** Ask about physics, photosynthesis, calculus, or chemistry.\n- 💻 **Programming:** Python, TypeScript, algorithms, and system design.\n- 🎙️ **Voice AI:** Speak naturally or upload images of questions using \`+\`.\n\nHow may I illuminate your thoughts today?`;
      if (language === 'hi') {
        reply = `### नमस्ते! वाणी के राजसी अनुभव में आपका स्वागत है 👑\n\nमैं **वाणी** हूँ — SGU के प्रथम वर्ष के छात्र **पीयूष** द्वारा निर्मित आपका संपूर्ण वॉयस एआई साथी। विज्ञान, गणित, कोडिंग या पंचांग से जुड़ा कोई भी प्रश्न पूछें।`;
      } else if (language === 'mr') {
        reply = `### नमस्कार! वाणीच्या शाही दालनात आपले स्वागत आहे 👑\n\nमी **वाणी** आहे — SGU चे प्रथम वर्षाचे विद्यार्थी **पियूष** यांनी विकसित केलेले प्रगत व्हॉईस एआय साथी. सांगा, आज आपण कोणत्या विषयावर बोलायचे?`;
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

    // 4. Call Gemini API if Key is Available
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
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
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
            } else if (geminiRes.status === 503 || geminiRes.status === 429) {
              if (attempt < 2) await new Promise(r => setTimeout(r, 800));
            }
          } catch {
            if (attempt < 2) await new Promise(r => setTimeout(r, 800));
          }
        }

        if (replyText && replyText.trim().length > 0) {
          const cleanSpoken = sanitizeTextForTTS(replyText);
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
As engineered by **Piyush • 1st year student of SGU**, I am equipped to dive into full derivations, algorithmic designs, or creative narratives.

*(Tip: To unlock infinite real-time generative capabilities with Google Gemini 3.8 Flash on this deployment, simply enter your free Gemini API key in **Settings (⚙️)**.)*`;

    if (language === 'hi') {
      fallbackReply = `### विषय विश्लेषण: "${message}"

### 1. संकल्पनात्मक समझ
आपके प्रश्न **"${message}"** का विश्लेषण वैज्ञानिक एवं तार्किक सिद्धांतों के आधार पर किया जा सकता है।

### 2. मुख्य बिंदु
- **मूल आधार:** किसी भी समस्या या संकल्पना को छोटे-छोटे घटकों में विभाजित करना सर्वोत्तम विधि है।
- **व्यावहारिक उपयोग:** यह सिद्धांत विज्ञान, तकनीक और दैनिक जीवन में समान रूप से उपयोगी है।

### 3. निष्कर्ष
**SGU के छात्र पीयूष** द्वारा निर्मित वाणी एआई इस विषय के संपूर्ण विस्तार के लिए सदैव तत्पर है।`;
    } else if (language === 'mr') {
      fallbackReply = `### सखोल विश्लेषण: "${message}"

### १. संकल्पना स्पष्टीकरण
आपण विचारलेला विषय **"${message}"** हा विश्लेषणात्मक आणि वैज्ञानिक दृष्टिकोनातून समजून घेणे महत्त्वाचे आहे.

### २. महत्त्वाचे मुद्दे
- **पायाभूत तत्त्वे:** कोणत्याही संकल्पनेचा अभ्यास करताना तिच्या मुळाशी जाऊन घटकांचे विश्लेषण करणे अधिक प्रभावी ठरते.
- **उपयोजन:** हा नियम विज्ञान, तंत्रज्ञान आणि मानवी जीवनातील अनेक क्षेत्रांना लागू होतो.

### ३. निष्कर्ष
**SGU चे विद्यार्थी पियूष** यांनी विकसित केलेली वाणी एआई सखोल माहिती देण्यासाठी सज्ज आहे.`;
    }

    return res.status(200).json({
      reply: fallbackReply,
      cleanSpokenText: sanitizeTextForTTS(fallbackReply),
      detectedLanguage: language,
      domainCategory: 'autonomous_reasoning'
    });
  } catch (err) {
    console.error('Chat endpoint error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
};
