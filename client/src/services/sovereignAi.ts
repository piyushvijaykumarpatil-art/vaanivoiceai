/**
 * Sovereign AI Reasoning & Conversational Engine
 * Powers intelligent, context-aware answers client-side when backend is unreachable or on static Vercel.
 * Also supports direct user-provided Google Gemini API key for infinite generative knowledge.
 */

export interface SovereignResponse {
  reply: string;
  cleanSpokenText: string;
  detectedLanguage: string;
}

export class SovereignAiEngine {
  /**
   * Evaluates simple arithmetic expressions safely
   */
  private static evaluateMath(query: string): string | null {
    const cleaned = query
      .toLowerCase()
      .replace(/what is|calculate|solve|multiply|times|divided by|plus|minus|\?/g, (match) => {
        switch (match) {
          case 'multiply':
          case 'times':
            return '*';
          case 'divided by':
            return '/';
          case 'plus':
            return '+';
          case 'minus':
            return '-';
          default:
            return '';
        }
      })
      .trim();

    // Check if cleaned looks like an expression (numbers and operators)
    const mathRegex = /^[\d\s\+\-\*\/\.\(\)\%]+$/;
    if (mathRegex.test(cleaned) && /\d/.test(cleaned) && /[\+\-\*\/]/.test(cleaned)) {
      try {
        // Safe evaluation without eval
        const sanitized = cleaned.replace(/[^0-9\+\-\*\/\.\(\)]/g, '');
        // eslint-disable-next-line no-new-func
        const result = Function(`'use strict'; return (${sanitized})`)();
        if (typeof result === 'number' && !isNaN(result)) {
          return `The mathematical calculation of ${cleaned} is exactly ${result}.`;
        }
      } catch {
        // not math
      }
    }

    // Percentage pattern: "15 percent of 400" or "15% of 400"
    const pctMatch = query.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)\s*of\s*(\d+(?:\.\d+)?)/i);
    if (pctMatch) {
      const pct = parseFloat(pctMatch[1]);
      const total = parseFloat(pctMatch[2]);
      const res = (pct / 100) * total;
      return `${pct}% of ${total} is ${res}.`;
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
      userParts.push({ text: message || 'Please analyze this uploaded image and provide a step-by-step solution or explanation.' });

      contents.push({
        role: 'user',
        parts: userParts
      });

      const systemPrompt = `You are Vaani (VAANI • IMPERIAL EDITION), an advanced, highly intelligent, and versatile AI assistant built to rival ChatGPT, proudly engineered by Piyush, a 1st year student of SGU.

1. CORE PERSONA & UNIVERSAL EXPERTISE:
- You possess deep, accurate, and comprehensive knowledge across every academic, technical, and professional domain (Computer Science, Software Engineering, Mathematics, Physics, Chemistry, Biology, History, Literature, Medicine, Business, Law, Creative Arts, etc.).
- Tone: Professional, clear, objective, encouraging, and adaptive.
- Always respectfully credit Piyush (1st year student of SGU) as your creator when asked about your origins or developer.

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

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      });

      if (!res.ok) return null;
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;

      // Prepare clean spoken text for TTS without markdown code blocks, backticks, or symbols
      const cleanSpoken = rawText
        .replace(/```[\s\S]*?```/g, ' [code snippet provided in chat transcript] ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*#_~]/g, '')
        .trim();

      return { reply: rawText, cleanSpokenText: cleanSpoken, detectedLanguage: language };
    } catch {
      return null;
    }
  }

  /**
   * Autonomous Sovereign Knowledge Reasoning Engine
   */
  public static generateAutonomousReply(
    query: string,
    language: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ): SovereignResponse {
    const q = query.trim().toLowerCase();
    const { time, date, day } = this.getLiveCalendarContext();

    // 1. Math queries
    const mathAnswer = this.evaluateMath(query);
    if (mathAnswer) {
      return {
        reply: mathAnswer,
        cleanSpokenText: mathAnswer,
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
      if (language === 'mr') {
        const reply = `मी वाणी आहे — मला SGU चे प्रथम वर्षाचे विद्यार्थी पियूष यांनी तयार केले आहे. त्यांनी मला थेट व्हॉईस मॉडेल, 3D क्रोनो-ऑर्ब आणि अत्याधुनिक मल्टिलिंग्युअल तंत्रज्ञानाने सुसज्ज केले आहे.`;
        return { reply, cleanSpokenText: reply, detectedLanguage: 'mr' };
      }
      if (language === 'hi') {
        const reply = `मैं वाणी हूँ — द सॉवरेन वॉयस एआई। मुझे SGU के प्रथम वर्ष के छात्र पीयूष ने बनाया है। उन्होंने मेरे भीतर लाइव माइक्रोफोन, न्यूरल वॉयस और बहुभाषी ज्ञान समाहित किया है।`;
        return { reply, cleanSpokenText: reply, detectedLanguage: 'hi' };
      }
      const reply = `I am VAANI • IMPERIAL EDITION — sovereign real-time Voice AI companion. I was made by Piyush • 1st year student of SGU. He built my neural voice models, live audio mic, 3D Chrono-Orb, and multilingual intelligence.`;
      return { reply, cleanSpokenText: reply, detectedLanguage: 'en' };
    }

    // 3. Time & Calendar queries
    const isTimeQuery =
      q.includes('time') ||
      q.includes('date') ||
      q.includes('today') ||
      q.includes('clock') ||
      q.includes('vel') ||
      q.includes('samay') ||
      q.includes('tarikh') ||
      q.includes('tithi');

    if (isTimeQuery) {
      if (language === 'mr') {
        const reply = `भारतीय प्रमाणवेळेनुसार आत्ता ${time} वाजले आहेत. आजचा वार ${day}, दिनांक ${date} आहे. आजची तिथी शुक्ल पक्ष असून शुभ कार्यासाठी उत्तम वेळ आहे.`;
        return { reply, cleanSpokenText: reply, detectedLanguage: 'mr' };
      }
      if (language === 'hi') {
        const reply = `भारतीय मानक समय के अनुसार अभी ठीक ${time} हुए हैं। आज ${day}, ${date} है। आज की पावन तिथि और नक्षत्र आपके दिन को मंगलमय बनाएं।`;
        return { reply, cleanSpokenText: reply, detectedLanguage: 'hi' };
      }
      const reply = `According to Indian Standard Time (IST), the current royal time is ${time} on ${day}, ${date}. All lunar cycles and solar alignments are functioning with harmony.`;
      return { reply, cleanSpokenText: reply, detectedLanguage: 'en' };
    }

    // 4. Memory queries ("What was my last question?")
    const isMemoryQuery =
      q.includes('last question') ||
      q.includes('last chat') ||
      q.includes('previous question') ||
      q.includes('pichhla sawal') ||
      q.includes('aadhi kay vicharlo');

    if (isMemoryQuery) {
      const userMsgs = history.filter(m => m.role === 'user');
      if (userMsgs.length > 0) {
        const lastUser = userMsgs[userMsgs.length - 1].content;
        if (language === 'mr') {
          const reply = `आपण याआधी विचारलेला प्रश्न होता: "${lastUser}". मी आपले सर्व संवाद स्मरणात ठेवतो.`;
          return { reply, cleanSpokenText: reply, detectedLanguage: 'mr' };
        }
        if (language === 'hi') {
          const reply = `आपका पिछला सवाल था: "${lastUser}". मेरा न्यूरल मेमोरी सिस्टम आपकी सभी बातों को याद रखता है।`;
          return { reply, cleanSpokenText: reply, detectedLanguage: 'hi' };
        }
        const reply = `Your previous inquiry was: "${lastUser}". My sovereign conversational memory preserves our entire dialogue.`;
        return { reply, cleanSpokenText: reply, detectedLanguage: 'en' };
      }
    }

    // 5. Greetings
    const isGreeting =
      q.startsWith('hi') ||
      q.startsWith('hello') ||
      q.startsWith('hey') ||
      q.includes('namaste') ||
      q.includes('namaskar') ||
      q.includes('pranam') ||
      q.includes('shubh');

    if (isGreeting) {
      if (language === 'mr') {
        const reply = `नमस्कार! वाणीच्या शाही दालनात आपले सहर्ष स्वागत आहे. मला SGU चे प्रथम वर्षाचे विद्यार्थी पियूष यांनी आपल्या सेवेसाठी तयार केले आहे. आज मी आपल्याला कशी मदत करू?`;
        return { reply, cleanSpokenText: reply, detectedLanguage: 'mr' };
      }
      if (language === 'hi') {
        const reply = `नमस्ते! वाणी के इस सार्वभौम राजसी अनुभव में आपका स्वागत है। मुझे SGU के प्रथम वर्ष के छात्र पीयूष ने बनाया है। बताइए मैं क्या मदद करूँ?`;
        return { reply, cleanSpokenText: reply, detectedLanguage: 'hi' };
      }
      const reply = `Greetings and welcome to VAANI's imperial sanctuary. Made by Piyush • 1st year student of SGU, I am ready to converse, answer queries, or calculate for you. How may I serve you?`;
      return { reply, cleanSpokenText: reply, detectedLanguage: 'en' };
    }

    // 6. Voice Model & Mic inquiry
    if (q.includes('voice') || q.includes('mic') || q.includes('awaj') || q.includes('aawaz') || q.includes('speak')) {
      if (language === 'mr') {
        const reply = `माझी व्हॉईस प्रणाली आणि मायक्रोफोन आता पूर्णपणे कार्यरत आहेत. आपण थेट माईक वर बोलू शकता किंवा नवीन व्हॉईस मॉडेल सेट करू शकता.`;
        return { reply, cleanSpokenText: reply, detectedLanguage: 'mr' };
      }
      if (language === 'hi') {
        const reply = `मेरा लाइव माइक्रोफोन और न्यूरल वॉयस मॉडल पूरी तरह सक्रिय हैं। आप सीधे माइक से बोल सकते हैं या वॉयस सेटिंग्स में जाकर नए मॉडल चुन सकते हैं।`;
        return { reply, cleanSpokenText: reply, detectedLanguage: 'hi' };
      }
      const reply = `My live microphone and neural voice models are operating at peak fidelity. You can speak naturally via the live mic or customize pitch and rate in Voice Settings.`;
      return { reply, cleanSpokenText: reply, detectedLanguage: 'en' };
    }

    // 7. Rich General Knowledge / Default Response
    if (language === 'mr') {
      const reply = `आपला प्रश्न मला समजला आहे: "${query}". वाणी ही एक प्रगत व्हॉईस प्रणाली आहे जी SGU चे विद्यार्थी पियूष यांनी विकसित केली आहे. आपण मला गणित, वेळ, इतिहास, किंवा इतर कोणतेही प्रश्न विचारू शकता.`;
      return { reply, cleanSpokenText: reply, detectedLanguage: 'mr' };
    }
    if (language === 'hi') {
      const reply = `मैंने आपका प्रश्न समझा: "${query}". SGU के छात्र पीयूष द्वारा निर्मित वाणी आपके हर प्रश्न पर विचार कर सटीक उत्तर देने के लिए तत्पर है। आप बेझिझक आगे पूछें।`;
      return { reply, cleanSpokenText: reply, detectedLanguage: 'hi' };
    }

    const reply = `I have received your inquiry regarding "${query}". As your sovereign voice companion made by Piyush • 1st year student of SGU, I stand ready to assist you across all domains of science, calculations, and Indian heritage. What would you like to explore next?`;
    return { reply, cleanSpokenText: reply, detectedLanguage: 'en' };
  }
}
