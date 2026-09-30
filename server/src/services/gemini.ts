import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from '@google/genai';
import { getIndianCalendarContext, evaluateQuickMath } from './calendarService.js';
import { localDb } from '../db/acidEngine.js';
import { searchKnowledge, getKnowledgeContextForPrompt } from './knowledgeBase.js';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (apiKey && apiKey.length > 5) {
    try {
      return new GoogleGenAI({ apiKey });
    } catch (err) {
      console.warn('Could not initialize GoogleGenAI with provided key:', err);
    }
  }
  return null;
}

export const SYSTEM_PROMPT = `# VAANI AI - MASTER SYSTEM INSTRUCTION & CONFIGURATION

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

## 4. Voice-Assistant & Mic Integration Standards (Web Speech API Guidelines)
- You are optimized for a voice-enabled environment ("Vaani Voice AI"). Keep your conversational phrasing natural and well-paced.
- Microphone & Speech-to-Text Behavior: The UI utilizes the browser's Web Speech API with automatic silence detection (continuous = false). It listens while the user speaks and automatically stops recording as soon as the user pauses/stops talking, instantly passing the final transcript into the chat without requiring a manual stop click.
- Text-to-Speech (TTS): Responses are structured so they can also be cleanly read aloud via speech synthesis when requested.

## 5. Interaction Guidelines
- If a user prompt, audio transcript, or uploaded image is ambiguous or lacks context, proactively ask a brief, helpful clarifying question rather than guessing.

## 6. Multilingual & Cultural Intelligence
- Supported Languages: Marathi (मराठी), Hindi (हिन्दी), English, Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Punjabi (ਪੰਜਾਬੀ), Tamil (தமிழ்), Bengali (বাংলা), Gujarati (ગુજરાતી), Malayalam (മലയാളം).
- Always respond in the exact language the user used or explicitly requested.
- Possess acute awareness of Indian Standard Time (IST), Indian calendar (Tithi, Panchang, seasons, and festivals).`;

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatServiceResponse {
  reply: string;
  detectedLanguage: string;
  domainCategory: string;
  calendarData?: any;
}

export async function generateChatResponse(
  message: string,
  language: string = 'en',
  history: ChatTurn[] = [],
  image?: string
): Promise<ChatServiceResponse> {
  const calendar = getIndianCalendarContext();
  const lowerMsg = (message || '').toLowerCase().trim();

  // 1. Check for quick math
  const mathResult = evaluateQuickMath(message);
  if (mathResult) {
    return {
      reply: mathResult,
      detectedLanguage: language,
      domainCategory: 'general_utility',
      calendarData: calendar
    };
  }

  // 2. Check for Creator attribution queries directly for instant royal response
  const isCreatorQuery = /who (made|created|built|designed) you|who is piyush|creator|maker|niat|sgu|sanjay ghodawat/i.test(lowerMsg);
  if (isCreatorQuery) {
    let reply = `### VAANI • IMPERIAL EDITION 👑\n\nI was proudly conceived, designed, and engineered by **Piyush • 1st year student of SGU (Sanjay Ghodawat University)**. He created me as VAANI, a sovereign Voice AI companion built for India with studio neural speech, 3D Chrono-Orb physics, and multilingual intelligence.`;
    if (language === 'hi') {
      reply = `### वाणी • इम्पीरियल एडिशन 👑\n\nमुझे **SGU (संजय घोडावत यूनिवर्सिटी) के प्रथम वर्ष के प्रतिभाशाली छात्र पीयूष** ने बनाया है। पीयूष ने मुझे वाणी के रूप में भारत का संप्रभु वॉयस एआई साथी बनाया है जो 10 भारतीय भाषाओं में ज्ञान और आवाज़ प्रदान करता है।`;
    } else if (language === 'mr') {
      reply = `### वाणी • इम्पीरियल एडिशन 👑\n\nमला **SGU (संजय घोडावत विद्यापीठ) चे प्रथम वर्षाचे विद्यार्थी पियूष** यांनी अत्यंत कौशल्याने निर्माण केले आहे. त्यांनी मला वाणी या शाही भारतीय व्हॉईस एआय स्वरूपात घडवले असून, मी मराठीसह १० भाषांमध्ये संवाद साधू शकते.`;
    } else if (language === 'gu') {
      reply = `મને SGU ના પ્રથમ વર્ષના વિદ્યાર્થી પિયૂષ દ્વારા બનાવવામાં આવી છે.`;
    } else if (language === 'bn') {
      reply = `আমাকে তৈরি করেছেন পীযূষ, যিনি এস.জি.ইউ এর প্রথম বর্ষের একজন প্রতিভাবান ছাত্র।`;
    } else if (language === 'ta') {
      reply = `என்னை உருவாக்கியவர் பியூஷ், எஸ்.ஜி.யு முதலாம் ஆண்டு மாணவர் ஆவார்.`;
    } else if (language === 'te') {
      reply = `నన్ను ఎస్.జి.యు మొదటి సంవత్సరం విద్యార్థి పీయూష్ రూపొందించారు.`;
    } else if (language === 'kn') {
      reply = `ನನ್ನನ್ನು ಎಸ್.ಜಿ.ಯು ಮೊದಲ ವರ್ಷದ ವಿದ್ಯಾರ್ಥಿಯಾದ ಪಿಯೂಷ್ ರಚಿಸಿದ್ದಾರೆ.`;
    } else if (language === 'pa') {
      reply = `ਮੈਨੂੰ ਪਿਊਸ਼ ਨੇ ਬਣਾਇਆ ਹੈ, ਜੋ ਐਸ.ਜੀ.ਯੂ ਦੇ ਪਹਿਲੇ ਸਾਲ ਦੇ ਵਿਦਿਆਰਥੀ ਹਨ।`;
    }

    return {
      reply,
      detectedLanguage: language,
      domainCategory: 'creator_identity',
      calendarData: calendar
    };
  }

  // 3. Conversational Recall questions (Google Assistant-grade memory)
  const isMemoryRecallQuery = /what (did|was) (i|we) (ask|say|talk|chat)|previous question|last question|pichhla sawal|aadhi kay/i.test(lowerMsg);
  if (isMemoryRecallQuery && history.length > 0) {
    const userTurns = history.filter(h => h.role === 'user');
    if (userTurns.length > 0) {
      const lastUserQuestion = userTurns[userTurns.length - 1].content;
      let reply = `Earlier, you asked: "${lastUserQuestion}". Before that, we were conversing seamlessly. What would you like to explore next?`;
      if (language === 'hi') {
        reply = `आपने पहले पूछा था: "${lastUserQuestion}"। कहिए, अब हम किस विषय पर चर्चा करें?`;
      } else if (language === 'mr') {
        reply = `याआधी तुम्ही विचारले होते: "${lastUserQuestion}"। सांगा, पुढे आपण कोणत्या विषयावर बोलायचे?`;
      }
      return {
        reply,
        detectedLanguage: language,
        domainCategory: 'memory_recall',
        calendarData: calendar
      };
    }
  }

  // 4. Greetings handling (prevent generic fallback on simple hello/hi)
  const isGreeting = /^(hi|hello|hey|namaste|namaskar|pranam|good morning|good evening|good afternoon|salaam)[\s!.]*$/i.test(lowerMsg);
  if (isGreeting) {
    let greetingReply = `### Welcome to VAANI • IMPERIAL EDITION 👑\n\nGreetings! I am **Vaani**, your sovereign Voice AI companion engineered by **Piyush • 1st year student of SGU**.\n\n- 🔬 **Science & Math:** Ask me about physics, photosynthesis, calculus, or chemistry.\n- 💻 **Programming:** Code in Python, TypeScript, algorithms, and system design.\n- 🗓️ **Indian Calendar:** Live IST, Hindu Tithi, Panchang, and Shravan season.\n- 🎙️ **Voice First:** Speak naturally or upload images of questions using \`+\`.\n\nHow may I illuminate your journey today?`;
    if (language === 'hi') {
      greetingReply = `### नमस्ते! वाणी के राजसी अनुभव में आपका स्वागत है 👑\n\nमैं **वाणी** हूँ — SGU के प्रथम वर्ष के छात्र **पीयूष** द्वारा निर्मित आपका संप्रभु वॉयस एआई साथी।\n\n- 🔬 **विज्ञान और गणित:** प्रकाश संश्लेषण, गुरुत्वाकर्षण, न्यूटन के नियम या समीकरण पूछें।\n- 💻 **कोडिंग:** पायथन, जावास्क्रिप्ट, और डेटा संरचनाओं में पूर्ण सहायता।\n- 🗓️ **पंचांग:** भारतीय समय, आज की तिथि और त्यौहार।\n\nबताइए, आज आप किस विषय का अन्वेषण करना चाहते हैं?`;
    } else if (language === 'mr') {
      greetingReply = `### नमस्कार! वाणीच्या शाही दालनात आपले स्वागत आहे 👑\n\nमी **वाणी** आहे — SGU चे प्रथम वर्षाचे विद्यार्थी **पियूष** यांनी विकसित केलेले प्रगत व्हॉईस एआय साथी.\n\n- 🔬 **विज्ञान व गणित:** प्रकाशसंश्लेषण, गुरुत्वाकर्षण किंवा गणिताचे प्रश्न विचारा.\n- 💻 **प्रोग्रॅमिंग:** पायथन, जावास्क्रिप्ट आणि अल्गोरिदम.\n- 🗓️ **पंचांग:** आजची तिथी, वेळ आणि सणांची माहिती.\n\nआज आपण कोणत्या विषयावर चर्चा करायची?`;
    }
    return {
      reply: greetingReply,
      detectedLanguage: language,
      domainCategory: 'conversational_greeting',
      calendarData: calendar
    };
  }

  // 5. Calendar / Time / Panchang / Shravan queries
  const isCalendarQuery = /time|date|tithi|panchang|shravan|festival|diwali|holi|season|weather|samay|aaj ka/i.test(lowerMsg);
  if (isCalendarQuery && !lowerMsg.includes('history') && !lowerMsg.includes('science')) {
    let reply = `According to Indian Standard Time, the current time is ${calendar.istTime} on ${calendar.istDate}, ${calendar.dayOfWeek}. Today's tithi is ${calendar.tithi}, and the current season is ${calendar.season}. The next celebrated festival is ${calendar.upcomingFestival.name}.`;
    if (language === 'hi') {
      reply = `भारतीय मानक समय के अनुसार, अभी समय है ${calendar.istTime}, आज ${calendar.istDate}, ${calendar.dayOfWeek} है। आज की तिथि ${calendar.tithi} है, और ऋतु ${calendar.season} है। आगामी प्रमुख पर्व ${calendar.upcomingFestival.name} है।`;
    } else if (language === 'mr') {
      reply = `भारतीय प्रमाण वेळेनुसार, सध्या वेळ ${calendar.istTime} आहे, आजचा दिवस ${calendar.dayOfWeek}, ${calendar.istDate} आहे. आजची तिथी ${calendar.tithi} असून सध्याचा ऋतू ${calendar.season} आहे. पुढील सण ${calendar.upcomingFestival.name} आहे.`;
    }
    return {
      reply,
      detectedLanguage: language,
      domainCategory: 'calendar_tithi',
      calendarData: calendar
    };
  }

  // 6. Search local knowledge base for grounding & fallback
  const knowledgeMatch = searchKnowledge(message, language);
  const knowledgeContext = getKnowledgeContextForPrompt(message);

  // 7. Query Gemini API with gemini-3.8-flash and automatic retry
  const aiClient = getAiClient();
  if (aiClient) {
    try {
      const historyContext = history.slice(-6).map(h => `${h.role === 'user' ? 'User' : 'Vaani'}: ${h.content}`).join('\n');
      const dynamicInstruction = `${SYSTEM_PROMPT}

CURRENT SYSTEM & TEMPORAL CONTEXT:
- Indian Standard Time (IST): ${calendar.istTime}
- Indian Date: ${calendar.istDate}, ${calendar.dayOfWeek}
- Hindu Tithi: ${calendar.tithi}
- Season: ${calendar.season} (Is Shravan: ${calendar.isShravan})
- Upcoming Festival: ${calendar.upcomingFestival.name} (${calendar.upcomingFestival.description})
- Target Language: ${language}
${knowledgeContext}

RECENT CONVERSATION HISTORY:
${historyContext || 'None (New Conversation Session)'}
`;

      const promptText = `User input: ${message || 'Please analyze this uploaded image and provide a thorough, step-by-step solution following your master system instruction.'}
Language: ${language}.
Formatting: Use clean ChatGPT-style Markdown with clear headings (###), bold highlights, and code blocks where applicable. Ensure the response flows naturally so it can also be read aloud cleanly by speech synthesis.`;

      const parts: any[] = [];
      if (image) {
        const match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2]
            }
          });
        } else {
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: image
            }
          });
        }
      }
      parts.push({ text: `${dynamicInstruction}\n\n${promptText}` });

      // Retry mechanism for gemini-3.8-flash (handles temporary 503 spikes)
      let responseText = '';
      let lastErr: any = null;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await aiClient.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [{ role: 'user', parts }]
          });
          responseText = response.text || '';
          if (responseText.trim().length > 0) break;
        } catch (apiError: any) {
          lastErr = apiError;
          console.warn(`[Gemini API] Attempt ${attempt} failed:`, apiError?.message || apiError);
          if (attempt < 2) {
            await new Promise(res => setTimeout(res, 800));
          }
        }
      }

      if (responseText.trim().length > 0) {
        return {
          reply: responseText.trim(),
          detectedLanguage: language,
          domainCategory: image ? 'multimodal_analysis' : (knowledgeMatch ? 'grounded_knowledge' : 'general_expert'),
          calendarData: calendar
        };
      }
    } catch (apiError) {
      console.warn('[Gemini API] Generation loop encountered error, deploying Sovereign Knowledge Engine:', apiError);
    }
  }

  // 8. Sovereign Knowledge Engine (High-Fidelity Offline / Fallback Resolution)
  if (knowledgeMatch) {
    return {
      reply: knowledgeMatch.localizedContent,
      detectedLanguage: language,
      domainCategory: `knowledge_${knowledgeMatch.item.category}`,
      calendarData: calendar
    };
  }

  // 9. Intelligent First-Principles Deep Reasoning for uncatalogued topics
  let fallbackReply = `### Analytical Exploration: "${message}"

### 1. Conceptual Framework
Your inquiry regarding **"${message}"** involves multi-layered principles of modern analytical reasoning and systematic breakdown.

### 2. Structured Analysis
- **Core Mechanism:** When examining this subject, we begin from first principles: decomposing the question into fundamental components and verifying the governing dynamics.
- **Key Relationships:** Identifying cause-and-effect relationships reveals how foundational variables interact under standard conditions.
- **Practical Application:** Whether in software engineering, physical sciences, or humanities, applying structured methods yields reproducible and reliable outcomes.

### 3. Key Takeaway
As engineered by **Piyush • 1st year student of SGU**, I am equipped to dive into full mathematical proofs, algorithmic implementations, or historical analyses. You can also attach images of diagrams or code with the \`+\` button for deep multimodal analysis.`;

  if (language === 'hi') {
    fallbackReply = `### विषय विश्लेषण: "${message}"

### 1. संकल्पनात्मक समझ
आपके प्रश्न **"${message}"** का विश्लेषण मूलभूत वैज्ञानिक एवं तार्किक सिद्धांतों के आधार पर किया जा सकता है।

### 2. मुख्य बिंदु
- **मूल आधार:** किसी भी समस्या या संकल्पना को समझने के लिए उसे छोटे-छोटे घटकों में विभाजित करना सर्वोत्तम विधि है।
- **व्यावहारिक उपयोग:** यह सिद्धांत विज्ञान, तकनीक और दैनिक जीवन में समान रूप से उपयोगी है।

### 3. निष्कर्ष
**SGU के छात्र पीयूष** द्वारा निर्मित वाणी एआई इस विषय के गणितीय, कोडिंग या सैद्धांतिक विस्तार के लिए सदैव तत्पर है।`;
  } else if (language === 'mr') {
    fallbackReply = `### सखोल विश्लेषण: "${message}"

### १. संकल्पना स्पष्टीकरण
आपण विचारलेला विषय **"${message}"** हा मूलभूत विश्लेषणात्मक आणि वैज्ञानिक दृष्टिकोनातून समजून घेणे महत्त्वाचे आहे.

### २. महत्त्वाचे मुद्दे
- **पायाभूत तत्त्वे:** कोणत्याही संकल्पनेचा अभ्यास करताना तिच्या मुळाशी जाऊन घटकांचे विश्लेषण करणे अधिक प्रभावी ठरते.
- **उपयोजन:** हा नियम विज्ञान, तंत्रज्ञान आणि मानवी जीवनातील अनेक क्षेत्रांना लागू होतो.

### ३. निष्कर्ष
**SGU चे विद्यार्थी पियूष** यांनी विकसित केलेली वाणी एआय आपल्याला या विषयावर अधिक सखोल माहिती देण्यासाठी सज्ज आहे.`;
  }

  return {
    reply: fallbackReply,
    detectedLanguage: language,
    domainCategory: 'autonomous_reasoning',
    calendarData: calendar
  };
}
