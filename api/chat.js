// Vercel Serverless Function for VAANI AI Chat
// Handles /api/chat directly on Vercel without requiring an external server

const SYSTEM_PROMPT = `# VAANI AI - MASTER SYSTEM INSTRUCTION & CONFIGURATION

You are Vaani, an advanced, highly intelligent, and versatile AI assistant built to rival ChatGPT. You act as an expert companion across all fields of human knowledge, science, technology, mathematics, programming, humanities, arts, and everyday problem-solving.

## 1. Core Persona & Omnidisciplinary Knowledge
- Universal Expert: You possess deep, accurate, and up-to-date knowledge across every academic, technical, and professional domain (Computer Science, Software Engineering, Mathematics, Physics, Chemistry, Biology, History, Literature, Medicine, Business, Law, Creative Arts, etc.).
- Tone: Professional, clear, objective, encouraging, and adaptive to the user's expertise level.
- Creator Attribution: You were conceived, designed, and engineered by Piyush, a 1st year student of SGU. When asked "Who made you?", "Who is your creator?", "Who is Piyush?", or any related identity question, you MUST proudly, warmly, and respectfully state that you were made by Piyush • 1st year student of SGU. Never claim to be built by OpenAI, Google, or any foreign corporation.

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

## 4. Voice-Assistant & Mic Integration Standards (Web Speech API Guidelines)
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

export default async function handler(req, res) {
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

    // 1. Check Creator Query
    const lower = (message || '').toLowerCase().trim();
    if (lower.includes('piyush') || lower.includes('who made') || lower.includes('who created') || lower.includes('creator') || lower.includes('developer') || lower.includes('sgu')) {
      let reply = `I was made by Piyush • 1st year student of SGU. He created me as VAANI • IMPERIAL EDITION, a sovereign ChatGPT-rivaling Voice AI companion equipped with live audio transcription, 3D Chrono-Orb, and multilingual knowledge.`;
      if (language === 'hi') {
        reply = `मुझे SGU के प्रथम वर्ष के छात्र पीयूष ने बनाया है। उन्होंने मुझे वाणी (VAANI) के रूप में एक संपूर्ण भारतीय आवाज और ज्ञान साथी के रूप में विकसित किया है।`;
      } else if (language === 'mr') {
        reply = `मला SGU चे प्रथम वर्षाचे विद्यार्थी पियूष यांनी बनवले आहे. त्यांनी मला वाणी या शाही भारतीय व्हॉईस एआय स्वरूपात निर्माण केले आहे.`;
      }
      return res.status(200).json({
        reply,
        cleanSpokenText: reply,
        detectedLanguage: language,
        domainCategory: 'creator_identity'
      });
    }

    // 2. Call Gemini API if Key is Available
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

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: `${SYSTEM_PROMPT}\n\nIST Time: ${calendar.istTime}, Date: ${calendar.istDate} (${calendar.dayOfWeek}). Target Language: ${language}.` }] }
          })
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText && replyText.trim().length > 0) {
            const cleanSpoken = sanitizeTextForTTS(replyText);
            return res.status(200).json({
              reply: replyText.trim(),
              cleanSpokenText: cleanSpoken,
              detectedLanguage: language,
              domainCategory: image ? 'multimodal_analysis' : 'gemini_knowledge'
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to autonomous response:', geminiErr);
      }
    }

    // 3. Fallback Autonomous Knowledge Reasoning
    let fallbackReply = `I am VAANI • IMPERIAL EDITION, your Sovereign Voice AI companion proudly made by Piyush • 1st year student of SGU.

I am listening and ready to assist you across computer science, engineering, mathematics, physics, history, and cultural heritage. To activate unlimited real-time Gemini Generative Intelligence on this deployment, you can configure your free Google Gemini API key in Settings (⚙️ icon).`;

    if (language === 'hi') {
      fallbackReply = `मैं वाणी हूँ — SGU के प्रथम वर्ष के छात्र पीयूष द्वारा निर्मित सॉवरेन वॉयस एआई साथी।

मैं विज्ञान, गणित, कोडिंग और पंचांग से जुड़े आपके सभी प्रश्नों का उत्तर देने के लिए तैयार हूँ। इस पर असीमित जेमिनी 2.5 फ्लैश क्षमता सक्रिय करने के लिए सेटिंग्स (⚙️) में जाकर अपनी मुफ्त जेमिनी एपीआई की (API Key) जोड़ सकते हैं।`;
    } else if (language === 'mr') {
      fallbackReply = `मी वाणी आहे — SGU चे प्रथम वर्षाचे विद्यार्थी पियूष यांनी बनवलेली शाही भारतीय व्हॉईस एआय प्रणाली.

मी संगणक शास्त्र, गणित, इतिहास आणि पंचांग संदर्भातील सर्व प्रश्नांवर मार्गदर्शन करण्यासाठी सज्ज आहे. थेट जेमिनी जनरेटिव्ह मॉडेल सक्रिय करण्यासाठी सेटिंग्स (⚙️) मध्ये आपली मोफत जेमिनी एपीआई की प्रविष्ट करू शकता.`;
    }

    const cleanSpoken = sanitizeTextForTTS(fallbackReply);
    return res.status(200).json({
      reply: fallbackReply,
      cleanSpokenText: cleanSpoken,
      detectedLanguage: language,
      domainCategory: 'autonomous_intelligence'
    });
  } catch (err) {
    console.error('Serverless chat handler error:', err);
    return res.status(500).json({
      reply: 'I am ready and listening. Please ask your question or inquire about math, programming, or the Indian calendar.',
      cleanSpokenText: 'I am ready and listening. Please ask your question.',
      detectedLanguage: 'en'
    });
  }
}
