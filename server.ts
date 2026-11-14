import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

let firebaseApiKey = "";
try {
  const cfgPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(cfgPath)) {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
    firebaseApiKey = cfg.apiKey || "";
  }
} catch {}

async function verifyFirebaseBearerToken(authHeader?: string): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  const idToken = authHeader.slice(7).trim();
  if (!idToken) return false;
  if (!firebaseApiKey) return true;
  try {
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    return verifyRes.ok;
  } catch {
    return false;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Initialize Gemini AI Client lazy/server-side
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
        aiClient = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      }
    }
    return aiClient;
  }

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "ServiFlow SaaS", timestamp: new Date().toISOString() });
  });

  // Gemini AI Assistant Endpoint
  app.post("/api/ai/assistant", async (req, res) => {
    try {
      const { prompt, businessContext } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const isAuthorized = await verifyFirebaseBearerToken(req.headers.authorization);
      if (!isAuthorized) {
        return res.status(401).json({ error: "Unauthorized: Valid user session required." });
      }

      const client = getGeminiClient();
      if (!client) {
        return res.status(503).json({
          error: "AI Assistant requires GEMINI_API_KEY to be configured on the server.",
        });
      }

      const systemInstruction = `You are ServiFlow AI, an intelligent business management assistant for field service companies (CCTV, Solar, HVAC, Electrical, Plumbing, Repair, IT, Cleaning).
You provide concise, actionable, structured insights based on the user's real business data provided below.
Always be professional, polite, and data-driven.
Format key metrics clearly with bold headers or bullet points.

Business Data Context:
${JSON.stringify(businessContext || {}, null, 2)}`;

      const response = await client.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const text = response.text || "No insights generated.";
      return res.json({ response: text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return res.status(500).json({
        error: "Failed to generate AI response",
        details: error?.message || String(error),
      });
    }
  });

  // AI Route Optimization Endpoint
  app.post("/api/ai/optimize-route", async (req, res) => {
    try {
      const { technician, startLocation, jobs, date } = req.body;
      if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
        return res.status(400).json({ error: "Jobs list is required for route optimization" });
      }

      const isAuthorized = await verifyFirebaseBearerToken(req.headers.authorization);
      if (!isAuthorized) {
        return res.status(401).json({ error: "Unauthorized: Valid user session required." });
      }

      const client = getGeminiClient();
      if (!client) {
        return res.status(503).json({
          error: "Route Optimization AI requires GEMINI_API_KEY to be configured on the server.",
        });
      }

      const prompt = `You are an AI Field Logistics & Route Dispatch Specialist for field technicians.
Optimize the following job sequence for technician "${technician?.name || 'Field Technician'}" on date "${date || 'Today'}".
Start & End Base Hub: "${startLocation || ''}"

Assigned Jobs to optimize:
${JSON.stringify(jobs, null, 2)}

Instructions:
1. Sequence jobs geographically to minimize unnecessary driving and avoid backtracking.
2. Prioritize urgent and high-priority jobs earlier unless doing so creates severe detour delays.
3. Calculate realistic travel times, distances, and estimated arrival times (assuming workday starts at 09:00 AM).
4. Provide structured output containing time/distance savings and actionable field suggestions.

Return ONLY a strictly valid JSON object (no markdown code blocks, no backticks, no wrapper text):
{
  "summary": "Short 2-sentence explanation of why this sequence is optimal and how much fuel/time it saves.",
  "totalDistanceKm": 0,
  "totalTravelTimeMins": 0,
  "distanceSavedKm": 0,
  "timeSavedMins": 0,
  "estimatedCarbonSavedKg": 0,
  "optimizedSequence": [
    {
      "id": "job-id",
      "jobId": "JOB-ID",
      "seq": 1,
      "estimatedArrival": "09:25 AM",
      "estimatedDurationMins": 60,
      "distanceFromPrevKm": 0,
      "travelTimeFromPrevMins": 0,
      "notes": "Priority dispatch note"
    }
  ],
  "recommendations": []
}`;

      const response = await client.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const text = response.text || "{}";
      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedText);
      return res.json(parsed);
    } catch (error: any) {
      console.error("AI Route Optimization Error:", error);
      return res.status(500).json({
        error: "Failed to optimize route",
        details: error?.message || String(error),
      });
    }
  });

  // Vite middleware for development vs static for production
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
    console.log(`ServiFlow SaaS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
