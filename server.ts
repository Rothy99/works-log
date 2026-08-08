import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Helper to lazily initialize Gemini Client
  const getAi = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set in environment variables");
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // AI Standup Generator
  app.post("/api/ai/standup", async (req, res) => {
    try {
      const ai = getAi();
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is missing in server environment." });
      }

      const { logs, dateLabel = "Today" } = req.body;

      if (!logs || !Array.isArray(logs)) {
        return res.status(400).json({ error: "Invalid logs array provided" });
      }

      const prompt = `You are a professional Agile Standup Assistant. Analyze the following work log entries for ${dateLabel} and format them into an executive daily standup report:

Log Entries:
${JSON.stringify(logs, null, 2)}

Provide a structured, clean standup report with concise, professional action-oriented bullet points.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              yesterdaySummary: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Completed tasks and accomplishments from yesterday/prior session",
              },
              todayPlan: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Planned or in-progress tasks for today",
              },
              blockers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Current blocking items or dependencies needing attention",
              },
              keyHighlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Major technical highlights, metric gains, or PR approvals",
              },
            },
            required: ["yesterdaySummary", "todayPlan", "blockers", "keyHighlights"],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response text returned from Gemini API");
      }

      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (err: any) {
      console.error("Error in /api/ai/standup:", err);
      res.status(500).json({ error: err.message || "Failed to generate standup report" });
    }
  });

  // AI Work Log Refine & Polish
  app.post("/api/ai/enhance-log", async (req, res) => {
    try {
      const ai = getAi();
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is missing in server environment." });
      }

      const { rawInput } = req.body;

      if (!rawInput || typeof rawInput !== "string") {
        return res.status(400).json({ error: "rawInput string is required" });
      }

      const prompt = `You are an expert engineering & product manager assistant. Turn this quick, rough daily work note into a clear, professional work log entry:

Raw Note: "${rawInput}"

Map it to one of these exact categories: 'Frontend', 'Backend', 'Database', 'Design/UI', 'Bug Fix', 'Code Review', 'Meeting/Sync', 'DevOps/CI-CD', 'Documentation', 'Other'.
Select priority: 'high', 'medium', or 'low'.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "Clear, action-oriented title summarizing the work done",
              },
              category: {
                type: Type.STRING,
                description: "Category matching one of the exact specified list",
              },
              estimatedMinutes: {
                type: Type.NUMBER,
                description: "Estimated duration spent in minutes (e.g. 30, 60, 120)",
              },
              priority: {
                type: Type.STRING,
                description: "high, medium, or low",
              },
              suggestedTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2 to 4 concise lowercase tags (e.g. react, postgres, bugfix)",
              },
              notes: {
                type: Type.STRING,
                description: "Polished multi-line bullet point explanation of key technical work done, outcome, or impact",
              },
            },
            required: ["title", "category", "estimatedMinutes", "priority", "suggestedTags", "notes"],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response text returned from Gemini API");
      }

      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (err: any) {
      console.error("Error in /api/ai/enhance-log:", err);
      res.status(500).json({ error: err.message || "Failed to refine log entry" });
    }
  });

  // AI Weekly Executive Digest
  app.post("/api/ai/weekly-summary", async (req, res) => {
    try {
      const ai = getAi();
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is missing in server environment." });
      }

      const { logs, periodLabel = "This Week" } = req.body;

      const prompt = `You are a Lead Product Manager. Synthesize these work log entries for ${periodLabel} into a high-level executive accomplishments summary suitable for 1-on-1s, client updates, or weekly status reports:

Logs Data:
${JSON.stringify(logs, null, 2)}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: {
                type: Type.STRING,
                description: "2-3 sentence high level paragraph summarizing overall progress",
              },
              keyDeliverables: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of top key features, bug fixes, or milestones delivered",
              },
              highlightsAndImpact: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key performance or technical impact metrics achieved",
              },
              nextFocusAreas: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Suggested priority focus areas for the upcoming sprint or week",
              },
            },
            required: ["executiveSummary", "keyDeliverables", "highlightsAndImpact", "nextFocusAreas"],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("No text returned from Gemini API");
      }

      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (err: any) {
      console.error("Error in /api/ai/weekly-summary:", err);
      res.status(500).json({ error: err.message || "Failed to generate weekly summary" });
    }
  });

  // Vite development middleware vs Static Production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
