import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Sahayak DPI" });
  });

  // AI Grievance Draft Endpoint
  app.post("/api/generate-draft", async (req, res) => {
    try {
      const { complaintText, schemeName, language, citizenName } = req.body;
      const ai = getGenAI();

      if (!ai) {
        // Fallback generator if API key is not present
        const subject = schemeName ? `Grievance regarding ${schemeName} benefit delay/issue` : "Grievance regarding Civic Benefit Disbursement";
        const fallbackDraft = `Subject: ${subject}

To the Grievance Redressal Officer,

I am writing to formally lodge a complaint regarding ${complaintText || "the non-receipt of my scheme installment for the current cycle"}. My application status shows active and my documentation/e-KYC is complete, yet the issue remains unresolved.

I request you to kindly investigate this matter and expedite the necessary resolution and release of pending entitlements.

Sincerely,
${citizenName || "[Your Name]"}`;
        return res.json({ draft: fallbackDraft, subject });
      }

      const prompt = `You are a formal civic grievance drafting assistant for the Sahayak Indian Digital Public Infrastructure (DPI) platform.
The citizen provided the following informal issue description: "${complaintText || "PM-KISAN payment not received"}"
Relevant Scheme: ${schemeName || "PM-KISAN"}
Citizen Name: ${citizenName || "[Your Name]"}
Target Language: ${language || "English"}

Generate a concise, highly professional, polite, and legally standard formal complaint letter suitable for submission to CPGRAMS (Centralized Public Grievance Redress and Monitoring System - pgportal.gov.in) or State Grievance Nodal Officers.
Output format:
Subject: <Formal clear subject line>

To the Grievance Redressal Officer,

<Body paragraphs explaining the facts clearly, citing registered records, asking for verification and resolution>

Sincerely,
${citizenName || "[Your Name]"}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
      });

      const draftText = response.text || "";
      const subjectMatch = draftText.match(/Subject:\s*([^\n]+)/i);
      const subject = subjectMatch ? subjectMatch[1] : `Grievance regarding ${schemeName || "Government Scheme"}`;

      res.json({ draft: draftText, subject });
    } catch (err: any) {
      console.error("AI Draft Error:", err);
      res.status(500).json({ error: "Failed to generate draft", message: err.message });
    }
  });

  // AI Scheme Advisor / Assistant
  app.post("/api/ask-assistant", async (req, res) => {
    try {
      const { question, userContext, language } = req.body;
      const ai = getGenAI();

      if (!ai) {
        return res.json({
          answer: "You can check your eligibility across PM-KISAN, Ayushman Bharat, PMAY-G, and NSAP schemes using the Schemes tab. All applications are verified via Aadhaar & DBT bank accounts.",
        });
      }

      const prompt = `You are Sahayak, an official Indian Digital Public Infrastructure (DPI) conversational citizen guide.
Citizen query: "${question}"
Citizen context: ${JSON.stringify(userContext || {})}
Language preference: ${language || "English / Bengali / Hindi"}

Provide an empathetic, plain-language, accurate answer about Indian central & state welfare schemes, required documents (Aadhaar, Land records, Bank passbook, Ration card), grievance filing on CPGRAMS, or eligibility steps. Keep it under 3-4 concise sentences.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
      });

      res.json({ answer: response.text });
    } catch (err: any) {
      console.error("AI Assist Error:", err);
      res.status(500).json({ error: "Failed to query assistant" });
    }
  });

  // Vite middleware for dev or static serving for prod
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
    console.log(`Sahayak DPI platform running on http://localhost:${PORT}`);
  });
}

startServer();
