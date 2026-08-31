import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Standard 1: Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Lazy GoogleGenAI client initialization
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackOptions {
  contents: any;
  systemInstruction?: string;
  config?: any;
}

async function generateContentWithFallback(options: FallbackOptions): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAI();
  let lastError: any = null;

  for (const modelName of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          ...(options.config || {}),
        },
      });

      const responseText = response.text || '';
      return { text: responseText, modelUsed: modelName };
    } catch (err: any) {
      console.warn(`Model ${modelName} failed, attempting next fallback:`, err?.message || err);
      lastError = err;
      // Continue to next model in the fallback ladder
    }
  }

  throw new Error(`All models in the fallback ladder failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Multi-turn reflection and brainstorming conversation endpoint
app.post('/api/gemini/converse', async (req: Request, res: Response) => {
  try {
    // Defensive Payload Ingestion (Null-Safe Destructuring)
    const payload = (req.body && typeof req.body === 'object') ? req.body : {};
    const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
    const rawHistory = Array.isArray(payload.history) ? payload.history : [];
    const mode = typeof payload.mode === 'string' ? payload.mode : 'pfa-debrief';
    const role = typeof payload.role === 'string' ? payload.role : 'frontline-caregiver';
    const severity = typeof payload.severity === 'string' ? payload.severity : 'moderate-stress';
    const stressLevel = typeof payload.stressLevel === 'number' ? payload.stressLevel : 5;
    const somaticAreas = Array.isArray(payload.somaticAreas) ? payload.somaticAreas.join(', ') : 'none specified';

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt cannot be empty.' });
    }

    // Format conversation history for Gemini content generation
    const contents: any[] = [];

    for (const item of rawHistory) {
      if (item && typeof item === 'object' && item.content) {
        const roleName = item.role === 'model' || item.role === 'assistant' ? 'model' : 'user';
        contents.push({
          role: roleName,
          parts: [{ text: String(item.content) }],
        });
      }
    }

    // Append the current turn
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    let systemInstruction = `You are a certified Psychological First Aid (PFA) & Compassion Fatigue debriefing facilitator and clinical debrief partner powered by Gemini.
The user is a dedicated caregiver, humanitarian worker, or frontline responder in the role of: "${role}".
Current Incident Severity: "${severity}" | Current Stress Level: ${stressLevel}/10 | Reported Somatic Tension: ${somaticAreas}.

Your clinical directives:
1. Embody radical empathy, validation, and calm stabilization. Frontline workers often carry secondary trauma, moral injury, and unspoken guilt.
2. Validate their emotional response as normal human reactions to abnormal, high-stress circumstances.
3. Gently help them differentiate between:
   - What was within their sphere of control (their effort, presence, ethics).
   - What was beyond their sphere of control (systemic failures, patient outcomes, environmental danger, resource shortages).
4. Diffuse self-blame and omnipotence traps ("I should have saved everyone").
5. Suggest grounded somatic awareness (e.g. noticing breath, softening shoulder tension) when appropriate.
6. Keep language warm, dignified, and professional. Avoid shallow toxic positivity. Use clean Markdown formatting.`;

    if (mode === 'compassion-fatigue') {
      systemInstruction += `\n- Focus: Compassion Fatigue & Emotional Depletion. Address empathic burnout, numbness, and exhaustion of care reserves.`;
    } else if (mode === 'moral-distress') {
      systemInstruction += `\n- Focus: Moral Injury & Ethical Dilemmas. Validate situations where systemic barriers prevented the care they wished to provide.`;
    } else if (mode === 'grounding-anchor') {
      systemInstruction += `\n- Focus: Acute Somatic Grounding & De-escalation. Guide brief box breathing, 5-4-3-2-1 sensory orientation, and psychological safety anchors.`;
    } else {
      systemInstruction += `\n- Focus: Structured Psychological First Aid (PFA) Incident Debriefing. Step through incident validation, boundary restoration, and stabilization.`;
    }

    const { text, modelUsed } = await generateContentWithFallback({
      contents,
      systemInstruction,
    });

    return res.json({
      text,
      modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/converse:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate reflection response from Gemini.',
    });
  }
});

// Session Summarization Endpoint
app.post('/api/gemini/summarize', async (req: Request, res: Response) => {
  try {
    const payload = (req.body && typeof req.body === 'object') ? req.body : {};
    const entries = Array.isArray(payload.entries) ? payload.entries : [];
    const title = typeof payload.title === 'string' ? payload.title : 'Reflection Session';

    if (entries.length === 0) {
      return res.status(400).json({ error: 'No entries provided to summarize.' });
    }

    const conversationTranscript = entries
      .map((e: any) => `${e.role === 'user' ? 'User' : 'Gemini'}: ${e.content || ''}`)
      .join('\n\n');

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Please analyze the following Psychological First Aid (PFA) caregiver debrief session titled "${title}" and generate a trauma-informed clinical debrief summary with:
1. **Incident Context & Emotional Climate**: The core events, secondary stressors, and emotional exhaustion themes described.
2. **Somatic & Cognitive Distress Drivers**: Physical tension patterns and cognitive traps (e.g. self-blame, helplessness, moral distress).
3. **Resilience & Sphere of Control**: Concrete affirmations separating what the caregiver could influence vs. unavoidable external trauma.
4. **Immediate 24-Hour Decompression Protocol**: 3-4 gentle, actionable restorative practices (somatic grounding, cognitive rest, peer connection).

--- Transcript ---
${conversationTranscript}`,
          },
        ],
      },
    ];

    const systemInstruction = `You are an expert Psychological First Aid (PFA) specialist and trauma clinician. Produce a dignified, comforting, and highly structured Markdown debrief synthesis.`;

    const { text, modelUsed } = await generateContentWithFallback({
      contents,
      systemInstruction,
    });

    return res.json({
      summary: text,
      modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/summarize:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate session summary from Gemini.',
    });
  }
});

// Confidentiality & PII Anonymization Endpoint (Sanitizes names, hospital IDs, and locations)
app.post('/api/gemini/anonymize', async (req: Request, res: Response) => {
  try {
    const payload = (req.body && typeof req.body === 'object') ? req.body : {};
    const text = typeof payload.text === 'string' ? payload.text.trim() : '';

    if (!text) {
      return res.status(400).json({ error: 'Text cannot be empty.' });
    }

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Anonymize and redact all sensitive Personally Identifiable Information (PII), patient names, exact hospital room numbers, addresses, and specific victim identifiers from the following text while preserving the emotional, reflective, and clinical meaning for the caregiver:

Text to sanitize:
"${text}"

Return ONLY the sanitized text without meta-commentary. Replace names with generic roles (e.g. "[Patient A]", "[Dr. M]", "[ICU Ward 3]").`,
          },
        ],
      },
    ];

    const systemInstruction = `You are a strict clinical data sanitization and privacy engine. Redact names and identifiable location specifics. Output only the sanitized text.`;

    const { text: sanitizedText, modelUsed } = await generateContentWithFallback({
      contents,
      systemInstruction,
    });

    return res.json({
      sanitizedText: sanitizedText.trim(),
      modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/anonymize:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to sanitize text.',
    });
  }
});

// Innovative Feature: Sphere of Control Cognitive Re-framing Engine
app.post('/api/gemini/sphere-of-control', async (req: Request, res: Response) => {
  try {
    const payload = (req.body && typeof req.body === 'object') ? req.body : {};
    const text = typeof payload.text === 'string' ? payload.text.trim() : '';
    const role = typeof payload.role === 'string' ? payload.role : 'frontline-caregiver';

    if (!text) {
      return res.status(400).json({ error: 'Text or debrief transcript is required.' });
    }

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Analyze this caregiver reflection / shift debrief from a ${role} and deconstruct it into an empowering Cognitive Sphere of Control matrix.
Return a valid JSON object with:
1. "inControl": An array of 3-4 specific things truly within their sphere of control (e.g. their presence, their boundaries, self-compassion, asking for backup, resting post-shift).
2. "outOfControl": An array of 3-4 systemic, environmental, or situational factors they MUST psychologically surrender and release (e.g. staffing shortages, administrative bureaucracy, mortality outcomes, others' emotional reactions).
3. "reframeInsight": A 2-sentence deeply grounding Psychological First Aid (PFA) affirmation reframing their effort with dignity and release.

Debrief text:
"${text}"

Output JSON ONLY without markdown code fences or backticks. Format:
{"inControl": ["..."], "outOfControl": ["..."], "reframeInsight": "..."}`,
          },
        ],
      },
    ];

    const systemInstruction = `You are a specialized trauma clinician and Cognitive Behavioral / PFA reframing expert. Output valid raw JSON only.`;

    const { text: resultText, modelUsed } = await generateContentWithFallback({
      contents,
      systemInstruction,
    });

    let parsed = {
      inControl: [
        'Setting firm emotional boundaries when off shift',
        'Acknowledging the care and empathy I provided today',
        'Allowing my body to rest and decompress',
      ],
      outOfControl: [
        'Institutional staffing and resource constraints',
        'Patient physiological outcomes beyond medical limits',
        'Administrative decisions and system burdens',
      ],
      reframeInsight:
        'You cannot carry the weight of a broken healthcare system on your shoulders. You offered compassionate, skilled presence within the limits of human capability.',
    };

    try {
      const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      console.warn('Failed to parse JSON response from Gemini, using structured fallback.');
    }

    return res.json({
      inControl: Array.isArray(parsed.inControl) ? parsed.inControl : [],
      outOfControl: Array.isArray(parsed.outOfControl) ? parsed.outOfControl : [],
      reframeInsight: parsed.reframeInsight || 'Release what was never yours to hold.',
      modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/sphere-of-control:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to analyze sphere of control.',
    });
  }
});

// Innovative Feature: Daily Compassion Spark & Micro-Grounding
app.post('/api/gemini/compassion-spark', async (req: Request, res: Response) => {
  try {
    const payload = (req.body && typeof req.body === 'object') ? req.body : {};
    const role = typeof payload.role === 'string' ? payload.role : 'frontline caregiver';
    const mood = typeof payload.mood === 'string' ? payload.mood : 'tired';

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Generate a restorative, non-cliché daily micro-spark for a ${role} feeling ${mood}.
Provide a valid JSON object with:
1. "affirmation": A dignified 1-sentence boundary or self-compassion truth.
2. "somaticMicroAction": A 30-second physical release (e.g. drop tongue from roof of mouth, unclench pelvic floor, roll scapula back).
3. "mantra": A 3-4 word grounding phrase to anchor their shift (e.g. "Presence Over Perfection", "Grounded In My Worth").

Output JSON ONLY without markdown fences.`,
          },
        ],
      },
    ];

    const systemInstruction = `You are a trauma-informed compassion fatigue and somatic clinician. Output raw JSON only.`;

    const { text: resultText, modelUsed } = await generateContentWithFallback({
      contents,
      systemInstruction,
    });

    let parsed = {
      affirmation: 'Taking time to restore is not an indulgence—it is an ethical necessity to sustain my capacity to care.',
      somaticMicroAction: 'Drop your tongue from the roof of your mouth, let your jaw hang loose, and take one deep sighing exhale.',
      mantra: 'Rest Without Apology',
    };

    try {
      const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      console.warn('Failed to parse JSON response for compassion spark.');
    }

    return res.json({
      ...parsed,
      modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/compassion-spark:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate compassion spark.',
    });
  }
});

// Vite Middleware for Development / Static Hosting for Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
