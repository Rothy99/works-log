import { Hono } from 'hono';
import { api } from './api/routes';
import { GoogleGenAI, Type } from '@google/genai';

const app = new Hono<{
  Bindings: {
    DB: any;
    R2_BUCKET?: any;
    GEMINI_API_KEY?: string;
  };
}>();

// Mount main API
app.route('/api/v1', api);

// AI helpers
const getAi = (apiKey?: string) => {
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

app.get('/api/health', (c) => c.json({ status: 'ok', time: new Date().toISOString() }));

app.post('/api/ai/standup', async (c) => {
  try {
    const ai = getAi(c.env.GEMINI_API_KEY);
    if (!ai) {
      return c.json({ error: 'Gemini API key is missing in server environment.' }, 500);
    }
    const body = await c.req.json();
    const { logs, dateLabel = 'Today' } = body;
    if (!logs || !Array.isArray(logs)) {
      return c.json({ error: 'Invalid logs array provided' }, 400);
    }

    const prompt = `You are a professional Agile Standup Assistant. Analyze the following work log entries for ${dateLabel} and format them into an executive daily standup report:\n\nLog Entries:\n${JSON.stringify(logs, null, 2)}\n\nProvide a structured, clean standup report with concise, professional action-oriented bullet points.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            yesterdaySummary: { type: Type.ARRAY, items: { type: Type.STRING } },
            todayPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
            blockers: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['yesterdaySummary', 'todayPlan', 'blockers', 'keyHighlights'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('No response text returned from Gemini API');
    return c.json(JSON.parse(text));
  } catch (err: any) {
    console.error('Error in /api/ai/standup:', err);
    return c.json({ error: err.message || 'Failed to generate standup report' }, 500);
  }
});

// Enhance log
app.post('/api/ai/enhance-log', async (c) => {
  try {
    const ai = getAi(c.env.GEMINI_API_KEY);
    if (!ai) {
      return c.json({ error: 'Gemini API key is missing in server environment.' }, 500);
    }
    const body = await c.req.json();
    const { rawInput } = body;
    if (!rawInput || typeof rawInput !== 'string') {
      return c.json({ error: 'rawInput string is required' }, 400);
    }

    const prompt = `You are an expert engineering & product manager assistant. Turn this quick, rough daily work note into a clear, professional work log entry:\n\nRaw Note: "${rawInput}"\n\nMap it to one of these exact categories: 'Frontend', 'Backend', 'Database', 'Design/UI', 'Bug Fix', 'Code Review', 'Meeting/Sync', 'DevOps/CI-CD', 'Documentation', 'Other'.\nSelect priority: 'high', 'medium', or 'low'.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: { type: Type.STRING },
            estimatedMinutes: { type: Type.NUMBER },
            priority: { type: Type.STRING },
            suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
            notes: { type: Type.STRING },
          },
          required: ['title', 'category', 'estimatedMinutes', 'priority', 'suggestedTags', 'notes'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('No response text returned from Gemini API');
    return c.json(JSON.parse(text));
  } catch (err: any) {
    console.error('Error in /api/ai/enhance-log:', err);
    return c.json({ error: err.message || 'Failed to refine log entry' }, 500);
  }
});

// Weekly Summary
app.post('/api/ai/weekly-summary', async (c) => {
  try {
    const ai = getAi(c.env.GEMINI_API_KEY);
    if (!ai) {
      return c.json({ error: 'Gemini API key is missing in server environment.' }, 500);
    }
    const body = await c.req.json();
    const { logs, periodLabel = 'This Week' } = body;

    const prompt = `You are a Lead Product Manager. Synthesize these work log entries for ${periodLabel} into a high-level executive accomplishments summary suitable for 1-on-1s, client updates, or weekly status reports:\n\nLogs Data:\n${JSON.stringify(logs, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            keyDeliverables: { type: Type.ARRAY, items: { type: Type.STRING } },
            highlightsAndImpact: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextFocusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['executiveSummary', 'keyDeliverables', 'highlightsAndImpact', 'nextFocusAreas'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('No text returned from Gemini API');
    return c.json(JSON.parse(text));
  } catch (err: any) {
    console.error('Error in /api/ai/weekly-summary:', err);
    return c.json({ error: err.message || 'Failed to generate weekly summary' }, 500);
  }
});

export default app;
