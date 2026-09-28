import { GoogleGenAI } from '@google/genai';
import { getIndianCalendarContext, evaluateQuickMath } from './calendarService.js';
import { localDb } from '../db/acidEngine.js';

const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey.length > 5) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI with provided key:', err);
  }
}

export const SYSTEM_PROMPT = `# VAANI AI - MASTER SYSTEM INSTRUCTION & CONFIGURATION

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
  const lowerMsg = message.toLowerCase().trim();
  const isCreatorQuery = /who (made|created|built|designed) you|who is piyush|creator|maker|niat|sgu/i.test(lowerMsg);

  if (isCreatorQuery) {
    let reply = `I was made by Piyush • 1st year student of SGU. He created me as VAANI • IMPERIAL EDITION, the sovereign voice AI companion for India.`;
    if (language === 'hi') {
      reply = `मुझे SGU के प्रथम वर्ष के छात्र पीयूष ने बनाया है। पीयूष ने मुझे वाणी के रूप में एक संपूर्ण भारतीय आवाज साथी के रूप में विकसित किया है।`;
    } else if (language === 'mr') {
      reply = `मला SGU चे प्रथम वर्षाचे विद्यार्थी पियूष यांनी बनवले आहे. त्यांनी मला वाणी या शाही भारतीय व्हॉईस एआय स्वरूपात निर्माण केले आहे।`;
    } else if (language === 'gu') {
      reply = `મને SGU ના પ્રથમ વર્ષના વિદ્યાર્થી પિયૂષ દ્વારા બનાવવામાં આવી છે.`;
    } else if (language === 'bn') {
      reply = `আমাকে তৈরি করেছেন পীযূষ, যিনি এন.আই.এ.টি পুনের প্রথম বর্ষের একজন প্রতিভাবান ইঞ্জিনিয়ারিং ছাত্র।`;
    } else if (language === 'ta') {
      reply = `என்னை உருவாக்கியவர் பியூஷ், என்.ஐ.ஏ.டி புனேவின் முதலாம் ஆண்டு பொறியியல் மாணவர் ஆவார்.`;
    } else if (language === 'te') {
      reply = `నన్ను ఎన్.ఐ.ఏ.టి పూణేలో మొదటి సంవత్సరం ఇంజనీరింగ్ చదువుతున్న పీయూష్ రూపొందించారు.`;
    } else if (language === 'kn') {
      reply = `ನన్ను ಎನ್.ಐ.ಎ.ಟಿ ಪುಣೆಯ ಮೊದಲ ವರ್ಷದ ಇಂಜಿನಿಯರಿಂಗ್ ವಿದ್ಯಾರ್ಥಿಯಾದ ಪಿಯೂಷ್ ರಚಿಸಿದ್ದಾರೆ.`;
    } else if (language === 'pa') {
      reply = `ਮੈਨੂੰ ਪਿਊਸ਼ ਨੇ ਬਣਾਇਆ ਹੈ, ਜੋ ਐਨ.ਆਈ.ਏ.ਟੀ ਪੁਣੇ ਦੇ ਪਹਿਲੇ ਸਾਲ ਦੇ ਪ੍ਰਤਿਭਾਸ਼ਾਲੀ ਇੰਜੀਨੀਅਰਿੰਗ ਵਿਦਿਆਰਥੀ ਹਨ।`;
    }

    return {
      reply,
      detectedLanguage: language,
      domainCategory: 'creator_identity',
      calendarData: calendar
    };
  }

  // 3. Check for Conversational Recall questions (Google Assistant-grade memory)
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

  // 4. Check for Calendar / Time / Panchang / Shravan queries
  const isCalendarQuery = /time|date|tithi|panchang|shravan|festival|diwali|holi|season|weather|samay|aaj ka/i.test(lowerMsg);
  if (isCalendarQuery && (!aiClient)) {
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

  // 5. Query Gemini API if client is available
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

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts }
        ]
      });

      const responseText = response.text || '';
      if (responseText.trim().length > 0) {
        return {
          reply: responseText.trim(),
          detectedLanguage: language,
          domainCategory: image ? 'multimodal_analysis' : 'general_expert',
          calendarData: calendar
        };
      }
    } catch (apiError) {
      console.warn('[Gemini API] Request failed or rate limited, activating built-in sovereign intelligence:', apiError);
    }
  }

  // 6. Built-in Sovereign Intelligence Engine (Zero-Failure Fallback)
  let fallbackReply = `I hear your query regarding ${message}. As your sovereign voice companion, I am at your service. You can ask me about the Indian calendar, Tithis, mathematical calculations, or Indian cultural heritage.`;

  if (language === 'hi') {
    fallbackReply = `मैंने आपकी बात सुनी: "${message}"। मैं वाणी हूँ, आपकी सेवा में उपस्थित। आप मुझसे भारतीय पंचांग, तिथि, समय, त्यौहार अथवा किसी भी विषय पर पूछ सकते हैं।`;
  } else if (language === 'mr') {
    fallbackReply = `मी आपले म्हणणे ऐकले: "${message}"। मी वाणी आहे, आपल्या सेवेत तत्पर। आपण मला पंचांग, तिथी, सण किंवा कोणत्याही विषयावर विचारू शकता।`;
  } else if (language === 'gu') {
    fallbackReply = `હું તમારી વાત સમજી શકું છું. હું વાણી છું, તમારી સેવામાં હાજર. તમે મને ભારતીય કેલેન્ડર, તિથિ અથવા કોઈપણ વિષય પૂછી શકો છો.`;
  } else if (language === 'bn') {
    fallbackReply = `আমি আপনার কথা বুঝতে পেরেছি। আমি বাণী, আপনার সেবায় সর্বদা প্রস্তুত। আপনি আমাকে ভারতীয় পঞ্জিকা, তিথি বা যেকোনো বিষয়ে জিজ্ঞাসা করতে পারেন।`;
  } else if (language === 'ta') {
    fallbackReply = `உங்கள் கேள்வியை நான் புரிந்து கொண்டேன். நான் வாணி, உங்கள் சேவையில் இருக்கிறேன். இந்திய பஞ்சாங்கம், திதி அல்லது எந்த தலைப்பிலும் என்னிடம் கேட்கலாம்.`;
  } else if (language === 'te') {
    fallbackReply = `నేను మీ విషయాన్ని అర్థం చేసుకున్నాను. నేను వాణిని, మీ సేవలో ఉన్నాను. మీరు నన్ను పంచాంగం, తిథి లేదా ఏ విషయమైనా అడగవచ్చు.`;
  } else if (language === 'kn') {
    fallbackReply = `ನಿಮ್ಮ ಮಾತನ್ನು ನಾನು ಆಲಿಸಿದ್ದೇನೆ. ನಾನು ವಾಣಿ, ನಿಮ್ಮ ಸೇವೆಯಲ್ಲಿದ್ದೇನೆ. ನೀವು ನನ್ನನ್ನು ಪಂಚಾಂಗ, ತಿಥಿ ಅಥವಾ ಯಾವುದೇ ವಿಷಯದ ಬಗ್ಗೆ ಕೇಳಬಹುದು.`;
  } else if (language === 'pa') {
    fallbackReply = `ਮੈਂ ਤੁਹਾਡੀ ਗੱਲ ਸੁਣ ਲਈ ਹੈ। ਮੈਂ ਵਾਣੀ ਹਾਂ, ਤੁਹਾਡੀ ਸੇਵਾ ਵਿੱਚ ਹਾਜ਼ਰ। ਤੁਸੀਂ ਮੈਨੂੰ ਪੰਚਾਂਗ, ਤਿਥੀ ਜਾਂ ਕਿਸੇ ਵੀ ਵਿਸ਼ੇ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ।`;
  }

  return {
    reply: fallbackReply,
    detectedLanguage: language,
    domainCategory: 'general_utility',
    calendarData: calendar
  };
}
