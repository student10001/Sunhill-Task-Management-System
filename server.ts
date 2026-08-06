import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Performance Summary Endpoint for Managers
app.post("/api/ai/analyze-performance", async (req, res) => {
  try {
    const { teamStats, tasks, projects } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !ai) {
      // Fallback mock executive summary if key is pending configuration
      return res.json({
        summary: "The engineering team is currently operating at a high completion velocity (68% overall workflow). Sarah Lin and Marcus Chen are on track with key architecture & UI milestones. Recommend reviewing urgent security rule task assignments to prevent capacity overload.",
        recommendations: [
          "Reallocate 1 backend task from Sarah Lin to Elena Rostova to equalize workload distribution.",
          "Prioritize final deployment of real-time Firestore security rules before Aug 2.",
          "Schedule Sprint 25 capacity sync for the upcoming mobile v2.0 redesign release."
        ],
        healthScore: 92
      });
    }

    const prompt = `You are an expert Engineering Director & Agile Operations Manager. Analyze the following team performance metrics and tasks to provide a concise executive summary and 3 key actionable recommendations for team managers:

Team Metrics:
- Total Personnel: ${teamStats?.totalMembers || 4}
- Active Tasks: ${teamStats?.activeTasksCount || 6}
- Overall Completion Rate: ${teamStats?.completionRate || '65'}%
- Urgent Priority Tasks: ${teamStats?.urgentCount || 2}

Task List:
${JSON.stringify(tasks?.slice(0, 8) || [], null, 2)}

Active Projects:
${JSON.stringify(projects || [], null, 2)}

Respond with a JSON object containing:
{
  "summary": "Short 2-3 sentence high-level executive progress update for managers.",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "healthScore": 90
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const textResult = response.text;
    if (textResult) {
      const parsed = JSON.parse(textResult);
      return res.json(parsed);
    }

    res.status(500).json({ error: "No response text generated" });
  } catch (error: any) {
    console.error("Error in AI performance analysis:", error);
    res.status(500).json({
      summary: "Team velocity remains steady. Ensure high priority tasks are reviewed daily.",
      recommendations: ["Review urgent tasks", "Balance team workload", "Verify project milestones"],
      healthScore: 88
    });
  }
});

// Start server with Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
