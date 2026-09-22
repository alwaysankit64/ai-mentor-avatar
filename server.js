import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 3000;

// --------------------------------------------------
// File path setup
// --------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// --------------------------------------------------
// Gemini API
// --------------------------------------------------

if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing.");
} else {
    console.log("Gemini API key detected.");
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// --------------------------------------------------
// AI Mentor Personality
// --------------------------------------------------

const mentorInstruction = `
You are an AI Study Mentor speaking face-to-face with a student.

Your personality:
- Friendly
- Patient
- Intelligent
- Encouraging
- Natural
- Professional

The student may be preparing for UPSC and UPPCS.

Your job:
- Teach concepts clearly.
- Explain difficult topics step by step.
- Help with UPSC and UPPCS preparation.
- Explain PYQs.
- Conduct quizzes.
- Help with revision.
- Create study plans.
- Identify weak areas.
- Give examples when useful.

Language:
- Use natural Hindi.
- Use common English exam terms when useful.
- Do NOT use Urdu script.
- Use Devanagari Hindi.

VERY IMPORTANT RESPONSE STYLE:
- Be quick and direct.
- For a simple question, answer in 1 to 3 sentences.
- Do not give a long explanation unless the student asks for detail.
- Do not repeat the student's question.
- Do not add unnecessary introductions.
- Do not repeat the same information.
- Talk naturally like a real mentor.
`;

// --------------------------------------------------
// Gemini request
// --------------------------------------------------

async function askGemini(contents) {

    // Fast models first.
    const models = [
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite"
    ];

    let lastError = null;

    for (const model of models) {

        try {

            console.log(`Trying Gemini model: ${model}`);

            const response = await ai.models.generateContent({

                model: model,

                contents: contents,

                config: {
                    systemInstruction: mentorInstruction,

                    // Keep answers short for faster response.
                    maxOutputTokens: 300
                }

            });

            console.log(`Gemini response received from ${model}`);

            return response.text;

        } catch (error) {

            lastError = error;

            console.error(
                `Gemini ${model} failed:`,
                error.message || error
            );

            // Immediately try the second model.
            // No long retry loop, so the user does not wait unnecessarily.
        }
    }

    throw lastError;
}

// --------------------------------------------------
// Chat API
// --------------------------------------------------

app.post("/api/chat", async (req, res) => {

    try {

        const message = req.body.message;

        const history = Array.isArray(req.body.history)
            ? req.body.history
            : [];

        // Check message
        if (!message || !message.trim()) {

            return res.status(400).json({
                success: false,
                error: "Message is required."
            });

        }

        // --------------------------------------------------
        // Keep only recent conversation
        // This reduces unnecessary input and improves speed.
        // --------------------------------------------------

        const recentHistory = history.slice(-8);

        const contents = [];

        for (const item of recentHistory) {

            if (!item || !item.text) {
                continue;
            }

            contents.push({

                role:
                    item.role === "user"
                        ? "user"
                        : "model",

                parts: [
                    {
                        text: item.text
                    }
                ]

            });
        }

        // Current user message
        contents.push({

            role: "user",

            parts: [
                {
                    text: message.trim()
                }
            ]

        });

        // Ask Gemini
        const reply = await askGemini(contents);

        return res.json({

            success: true,

            reply:
                reply ||
                "माफ़ कीजिए, मुझे अभी जवाब तैयार करने में समस्या हुई।"

        });

    } catch (error) {

        console.error(
            "Gemini Error:",
            error
        );

        return res.status(503).json({

            success: false,

            error:
                "Gemini अभी व्यस्त है। कृपया कुछ सेकंड बाद फिर कोशिश करें।"

        });

    }

});

// --------------------------------------------------
// Health Check
// --------------------------------------------------

app.get("/api/health", (req, res) => {

    res.json({

        success: true,

        status: "online",

        message:
            "AI Mentor server is running."

    });

});

// --------------------------------------------------
// Main Website
// --------------------------------------------------

app.get("/", (req, res) => {

    res.sendFile(

        path.join(
            __dirname,
            "ai-mentor-avatar.html"
        )

    );

});

// --------------------------------------------------
// Start Server
// --------------------------------------------------

app.listen(PORT, () => {

    console.log(
        `AI Mentor running on port ${PORT}`
    );

});
