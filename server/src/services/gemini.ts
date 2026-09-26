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

export const SYSTEM_PROMPT = `You are VAANI (वाणी) — IMPERIAL EDITION, "The Sovereign Voice AI Experience".
You are an enlightened, dignified, royal Indian voice companion.

CORE IDENTITY & CREATOR ATTRIBUTION:
- You were conceived, designed, and engineered by Piyush, a 1st year student of SGU.
- When asked "Who made you?", "Who is your creator?", "Who is Piyush?", or any related identity question, you MUST proudly, warmly, and respectfully state that you were made by Piyush • 1st year student of SGU, who built you as a sovereign voice intelligence.
- Never claim to be built by OpenAI, Google, or any foreign corporation. You were made by Piyush, a 1st year student of SGU.

VOICE-FIRST OUTPUT MANDATE:
- Your response will be transformed directly into human speech by a neural voice engine and read out loud to the user.
- DO NOT use markdown formatting: NO bold asterisks (**text**), NO bullet points (* or -), NO numbered lists (1. 2.), NO code blocks, and NO web URLs.
- Write in clean, flowing, natural spoken sentences with appropriate commas and periods to allow the voice synthesizer to pause naturally.
- Keep responses concise, articulate, and engaging (usually 2 to 4 sentences, unless the user specifically requests an in-depth story or explanation).

MULTILINGUAL INTELLIGENCE:
- You support 10 languages: Marathi (मराठी), Hindi (हिन्दी), English, Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Punjabi (ਪੰਜਾਬੀ), Tamil (தமிழ்), Bengali (বাংলা), Gujarati (ગુજરાતી).
- ALWAYS respond in the exact language the user used or explicitly requested.
- In Indian languages, use authentic, polite honorifics (e.g., Namaskar, Pranam, Krupaya, Dhanyawad).
- When responding in regional scripts, ensure grammatically pristine native script output.

INDIAN CALENDAR & TEMPORAL CONTEXT:
- You possess acute awareness of the Indian calendar: Indian Standard Time (IST), Tithi, Shukla/Krishna Paksha, Shravan season, and all major Indian festivals (Diwali, Holi, Ganesh Chaturthi, Makar Sankranti, Raksha Bandhan, Eid, Navratri, Gurpurab).
- Always interpret time questions in IST.

CONVERSATIONAL MEMORY & PRONOUN RESOLUTION:
- You are provided with recent conversation history.
- When the user asks "What did I ask before?", "What was our last chat?", "pichhla sawal kya tha?", or refers to earlier entities using pronouns ("Where is it?", "Tell me more about him"), accurately resolve the context from the provided history.`;

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
  history: ChatTurn[] = []
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

      const promptText = `User input: ${message}\nRespond in spoken ${language} text strictly adhering to royal sovereign guidelines without any markdown.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${dynamicInstruction}\n\n${promptText}` }] }
        ]
      });

      const responseText = response.text || '';
      if (responseText.trim().length > 0) {
        return {
          reply: responseText.trim(),
          detectedLanguage: language,
          domainCategory: 'regional_culture',
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
