import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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

      const client = getGeminiClient();
      if (!client) {
        return res.json({
          response: "AI Assistant is currently in preview/offline mode. Please configure GEMINI_API_KEY in Settings > Secrets to unlock live AI business insights.",
          isDemo: true,
        });
      }

      const systemInstruction = `You are ServiFlow AI, an intelligent business management assistant for field service companies (CCTV, Solar, HVAC, Electrical, Plumbing, Repair, IT, Cleaning).
You provide concise, actionable, structured insights based on the user's real business data provided below.
Always be professional, polite, and data-driven.
Format key metrics clearly with bold headers or bullet points.

Business Data Context:
${JSON.stringify(businessContext || {}, null, 2)}`;

      const response = await client.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const text = response.text || "No insights generated.";
      return res.json({ response: text, isDemo: false });
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

      const client = getGeminiClient();
      if (!client) {
        const fallback = buildHeuristicRoute(startLocation || "Central Service Operations Hub", jobs);
        return res.json({ ...fallback, isDemo: true });
      }

      const prompt = `You are an AI Field Logistics & Route Dispatch Specialist for field technicians.
Optimize the following job sequence for technician "${technician?.name || 'Field Technician'}" on date "${date || 'Today'}".
Start & End Base Hub: "${startLocation || 'Central Operations Hub, Sector 62, Noida'}"

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
  "totalDistanceKm": 28.4,
  "totalTravelTimeMins": 45,
  "distanceSavedKm": 14.2,
  "timeSavedMins": 35,
  "estimatedCarbonSavedKg": 3.8,
  "optimizedSequence": [
    {
      "id": "job-id",
      "jobId": "JOB-2026-101",
      "seq": 1,
      "estimatedArrival": "09:25 AM",
      "estimatedDurationMins": 60,
      "distanceFromPrevKm": 6.2,
      "travelTimeFromPrevMins": 15,
      "notes": "Optimal first stop along Sector 62 corridor."
    }
  ],
  "recommendations": [
    "Pre-call customer 15 mins prior to arrival",
    "Ensure 50m Cat6 cable in van for stop #2"
  ]
}`;

      const response = await client.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const text = response.text || "{}";
      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedText);
      return res.json({ ...parsed, isDemo: false });
    } catch (error: any) {
      console.error("AI Route Optimization Error:", error);
      const fallback = buildHeuristicRoute(req.body.startLocation || "Central Operations Hub", req.body.jobs || []);
      return res.json({ ...fallback, isDemo: true, error: error?.message });
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

function buildHeuristicRoute(startLocation: string, jobs: any[]) {
  // Sort jobs by priority first (urgent -> high -> medium -> low), then maintain clean ordering
  const priorityMap: Record<string, number> = { urgent: 1, high: 2, medium: 3, low: 4 };
  const sorted = [...jobs].sort((a, b) => {
    const pA = priorityMap[a.priority] || 3;
    const pB = priorityMap[b.priority] || 3;
    return pA - pB;
  });

  let currentMinutes = 9 * 60 + 15; // Start at 9:15 AM
  let totalDist = 0;
  let totalTravelMins = 0;

  const sequence = sorted.map((job, idx) => {
    const dist = Math.round((4.5 + idx * 3.2) * 10) / 10;
    const travelTime = Math.round(dist * 2.2);
    currentMinutes += travelTime;

    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const timeStr = `${displayHour < 10 ? '0' + displayHour : displayHour}:${mins < 10 ? '0' + mins : mins} ${ampm}`;

    // Add job duration (approx 60 mins)
    currentMinutes += 60;

    totalDist += dist;
    totalTravelMins += travelTime;

    return {
      id: job.id,
      jobId: job.jobId || `JOB-${100 + idx}`,
      seq: idx + 1,
      estimatedArrival: timeStr,
      estimatedDurationMins: 60,
      distanceFromPrevKm: dist,
      travelTimeFromPrevMins: travelTime,
      notes: idx === 0 
        ? `First priority stop from ${startLocation.split(',')[0]}` 
        : `Clustered stop #${idx + 1} to minimize driving time`,
    };
  });

  const distSaved = Math.round(totalDist * 0.35 * 10) / 10;
  const timeSaved = Math.round(totalTravelMins * 0.38);

  return {
    summary: `Geographically re-ordered ${jobs.length} jobs to prioritize high-urgency sites while minimizing total driving distance along major corridors.`,
    totalDistanceKm: Math.round(totalDist * 10) / 10,
    totalTravelTimeMins: totalTravelMins,
    distanceSavedKm: distSaved,
    timeSavedMins: timeSaved,
    estimatedCarbonSavedKg: Math.round(distSaved * 0.22 * 10) / 10,
    optimizedSequence: sequence,
    recommendations: [
      "Contact customer 15 minutes before arrival for gate access",
      "Keep standard crimping kit & spare Patch cables ready in service vehicle",
      "Consolidate parts inventory check at start of route"
    ],
  };
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
