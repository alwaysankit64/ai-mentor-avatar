import express from "express";
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


// ==========================================
// GEMINI
// ==========================================

if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing.");
} else {
    console.log("Gemini API key detected.");
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ==========================================
// AI MENTOR
// ==========================================

const mentorInstruction = `
You are an AI Study Mentor.

Speak naturally with the student.

Personality:
- Friendly
- Patient
- Intelligent
- Encouraging
- Natural
- Professional

Help with:
- UPSC
- UPPCS
- History
- Geography
- Polity
- Economy
- Environment
- Science
- PYQs
- Revision
- Study planning

Language:
- Natural Hindi.
- Use common English exam terms when useful.
- Use Devanagari Hindi.
- Never use Urdu script.

IMPORTANT:
- Be very fast and direct.
- Simple questions: answer in 1-2 sentences.
- Do not repeat the question.
- Do not add unnecessary introduction.
- Do not make simple answers long.
- Give detailed answers only when specifically requested.
`;


// ==========================================
// FAST GEMINI REQUEST
// ==========================================

async function askGemini(contents) {

    const models = [
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite"
    ];

    let lastError = null;

    for (const model of models) {

        try {

            console.log(
                "Trying model:",
                model
            );

            const response =
                await ai.models.generateContent({

                    model: model,

                    contents: contents,

                    config: {

                        systemInstruction:
                            mentorInstruction,

                        maxOutputTokens: 220,

                        thinkingConfig: {
                            thinkingLevel: "minimal"
                        }

                    }

                });

            console.log(
                "Response received:",
                model
            );

            return response.text;

        } catch (error) {

            lastError = error;

            console.error(
                `${model} failed:`,
                error.message || error
            );

        }

    }

    throw lastError;
}


// ==========================================
// CHAT
// ==========================================

app.post(
    "/api/chat",
    async (req, res) => {

        try {

            const message =
                req.body.message;

            const history =
                Array.isArray(req.body.history)
                    ? req.body.history
                    : [];


            if (
                !message ||
                !message.trim()
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Message is required."

                });

            }


            // Only recent messages
            const recentHistory =
                history.slice(-6);


            const contents = [];


            for (
                const item
                of recentHistory
            ) {

                if (
                    !item ||
                    !item.text
                ) {
                    continue;
                }


                contents.push({

                    role:
                        item.role === "user"
                            ? "user"
                            : "model",

                    parts: [

                        {
                            text:
                                item.text
                        }

                    ]

                });

            }


            // Current question
            contents.push({

                role: "user",

                parts: [

                    {
                        text:
                            message.trim()
                    }

                ]

            });


            const reply =
                await askGemini(contents);


            return res.json({

                success: true,

                reply:
                    reply ||
                    "माफ़ कीजिए, अभी जवाब तैयार नहीं हो पाया।"

            });


        } catch (error) {

            console.error(
                "Gemini Error:",
                error
            );


            return res.status(503).json({

                success: false,

                error:
                    "Gemini अभी व्यस्त है। कुछ सेकंड बाद फिर कोशिश करें।"

            });

        }

    }
);


// ==========================================
// HEALTH
// ==========================================

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            success: true,

            status: "online",

            message:
                "AI Mentor server is running."

        });

    }
);


// ==========================================
// WEBSITE
// ==========================================

app.get(
    "/",
    (req, res) => {

        res.sendFile(

            path.join(
                __dirname,
                "ai-mentor-avatar.html"
            )

        );

    }
);


// ==========================================
// START
// ==========================================

app.listen(
    PORT,
    () => {

        console.log(
            `AI Mentor running on port ${PORT}`
        );

    }
);
