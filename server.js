https://github.com/alwaysankit64/ai-mentor-avatar/settingsimport express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* =========================
   GEMINI API SETUP
========================= */

if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing.");
} else {
    console.log("Gemini API key detected.");
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

/* =========================
   AI MENTOR INSTRUCTION
========================= */

const mentorInstruction = `
You are an AI Study Mentor.

You are speaking face-to-face with a student.

Your personality:
- Friendly
- Patient
- Intelligent
- Encouraging
- Natural
- Professional

The student may be preparing for UPSC and UPPCS.

Your responsibilities:
1. Explain difficult concepts step by step.
2. Teach instead of simply giving answers.
3. Ask useful follow-up questions.
4. Help with UPSC and UPPCS preparation.
5. Explain PYQs.
6. Conduct quizzes.
7. Help with revision.
8. Create practical study plans.
9. Identify weak areas.
10. Give examples when useful.

Language:
- Use natural Hindi.
- Use English terms where commonly used in competitive-exam preparation.
- Do not use Urdu script.
- Keep answers conversational and easy to understand.
- Talk like a real mentor sitting in front of the student.
- Do not claim that you have done something if you have not.
`;

/* =========================
   WAIT FUNCTION
========================= */

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* =========================
   GEMINI REQUEST
========================= */

async function askGemini(contents) {

    const models = [
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash"
    ];

    let lastError = null;

    for (const model of models) {

        console.log(`Trying Gemini model: ${model}`);

        for (let attempt = 1; attempt <= 2; attempt++) {

            try {

                console.log(
                    `Requesting ${model} - attempt ${attempt}`
                );

                const response = await ai.models.generateContent({
                    model: model,
                    contents: contents,
                    config: {
                        systemInstruction: mentorInstruction,
                        temperature: 0.7,
                        maxOutputTokens: 400
                    }
                });

                console.log(
                    `Gemini response received from ${model}`
                );

                return response.text;

            } catch (error) {

                lastError = error;

                console.error(
                    `Gemini ${model} attempt ${attempt} failed:`,
                    error.message || error
                );

                /*
                  If Gemini is temporarily overloaded,
                  wait and retry.
                */

                if (attempt < 2) {
                    await wait(1500);
                }
            }
        }

        /*
          If one model fails completely,
          automatically try the next model.
        */

        console.log(
            `Switching from ${model} to next Gemini model...`
        );
    }

    throw lastError;
}

/* =========================
   CHAT API
========================= */

app.post("/api/chat", async (req, res) => {

    try {

        const message = req.body.message;

        const history = Array.isArray(req.body.history)
            ? req.body.history
            : [];

        if (!message || !message.trim()) {

            return res.status(400).json({
                success: false,
                error: "Message is required."
            });
        }

        const contents = [];

        /*
          Add previous conversation
        */

        for (const item of history) {

            if (!item || !item.text) {
                continue;
            }

            contents.push({
                role: item.role === "user"
                    ? "user"
                    : "model",

                parts: [
                    {
                        text: item.text
                    }
                ]
            });
        }

        /*
          Add current student message
        */

        contents.push({
            role: "user",
            parts: [
                {
                    text: message.trim()
                }
            ]
        });

        /*
          Ask Gemini
        */

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

/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        status: "online",
        message: "AI Mentor server is running."
    });
});

/* =========================
   HOME PAGE
========================= */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "ai-mentor-avatar.html"
        )
    );
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {

    console.log(
        `AI Mentor running on port ${PORT}`
    );

});
