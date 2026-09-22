// ==========================================
// AI MENTOR - SERVER
// Gemini API + Website Backend
// ==========================================

import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const app = express();

const PORT = process.env.PORT || 3000;


// ==========================================
// FILE PATH SETUP
// ==========================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());


// ==========================================
// FRONTEND FILES
// ==========================================

app.use(express.static(__dirname));


// ==========================================
// GEMINI API
// ==========================================

if (!process.env.GEMINI_API_KEY) {

    console.error(
        "GEMINI_API_KEY is missing."
    );

} else {

    console.log(
        "Gemini API key detected."
    );

}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ==========================================
// AI MENTOR PERSONALITY
// ==========================================

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

Use natural Hindi.

Use English terms where they are commonly used
in competitive-exam preparation.

Do not use Urdu script.

Keep normal answers concise and conversational.

Talk like a real mentor sitting in front of the student.

Never claim that you have done something if you have not.
`;


// ==========================================
// GEMINI CHAT API
// ==========================================

app.post("/api/chat", async (req, res) => {

    try {

        const message = req.body.message;

        const history = Array.isArray(req.body.history)
            ? req.body.history
            : [];


        // --------------------------------------
        // Check message
        // --------------------------------------

        if (!message || !message.trim()) {

            return res.status(400).json({

                success: false,

                error: "Message is required."

            });

        }


        // --------------------------------------
        // Conversation history
        // --------------------------------------

        const contents = [];


        for (const item of history) {

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


        // --------------------------------------
        // Current user message
        // --------------------------------------

        contents.push({

            role: "user",

            parts: [

                {
                    text: message.trim()
                }

            ]

        });


        // --------------------------------------
        // Gemini request
        // --------------------------------------

        const response =
            await ai.models.generateContent({

                model: "gemini-3.8-flash",

                contents: contents,

                config: {

                    systemInstruction:
                        mentorInstruction,

                    temperature: 0.7,

                    maxOutputTokens: 1200

                }

            });


        // --------------------------------------
        // Get AI response
        // --------------------------------------

        const reply =
            response.text ||
            "माफ कीजिए, मुझे अभी जवाब तैयार करने में समस्या हुई।";


        // --------------------------------------
        // Send response to website
        // --------------------------------------

        res.json({

            success: true,

            reply: reply

        });


    } catch (error) {

        console.error(
            "Gemini Error:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                "AI Mentor server में समस्या हुई।"

        });

    }

});


// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {

    res.json({

        success: true,

        status: "online",

        message:
            "AI Mentor server is running."

    });

});


// ==========================================
// OPEN AI MENTOR WEBSITE
// ==========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "ai-mentor-avatar.html"
        )
    );

});


// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {

    console.log(
        `AI Mentor running on port ${PORT}`
    );

});
