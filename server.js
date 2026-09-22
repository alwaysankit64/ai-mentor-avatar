// ==========================================
// AI MENTOR - Gemini Backend
// ==========================================

import express from "express";
import cors from "cors";
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const app = express();

const PORT = process.env.PORT || 3000;

// ------------------------------------------
// Middleware
// ------------------------------------------

app.use(cors());

app.use(express.json());


// ------------------------------------------
// Gemini AI
// ------------------------------------------

if (!process.env.GEMINI_API_KEY) {

    console.error(
        "ERROR: GEMINI_API_KEY environment variable is missing."
    );

    process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ------------------------------------------
// AI MENTOR SYSTEM INSTRUCTION
// ------------------------------------------

const mentorInstruction = `
You are an AI Study Mentor.

Your job is to behave like a friendly, intelligent,
patient human mentor.

The student may be preparing for UPSC and UPPCS.

You should:

- Explain concepts step by step.
- Use simple but accurate Hindi.
- Use Hindi + necessary English terms.
- Ask questions when useful.
- Help with revision.
- Explain PYQs.
- Conduct quizzes.
- Help create study plans.
- Identify weak areas from the conversation.
- Encourage the student realistically.
- Never pretend to know something you do not know.
- Keep answers conversational.

You are speaking directly to the student,
so your responses should sound natural,
like a face-to-face mentor conversation.

Do not unnecessarily give extremely long answers.
For normal questions, keep the answer focused.
`;


// ------------------------------------------
// CHAT API
// ------------------------------------------

app.post("/api/chat", async (req, res) => {

    try {

        const { message, history = [] } = req.body;


        if (!message || !message.trim()) {

            return res.status(400).json({
                error: "Message is required."
            });

        }


        // Convert previous conversation into Gemini format

        const contents = [];


        for (const item of history) {

            if (!item || !item.text) continue;


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


        // Add current message

        contents.push({

            role: "user",

            parts: [
                {
                    text: message
                }
            ]

        });


        // ----------------------------------
        // Gemini request
        // ----------------------------------

        const response = await ai.models.generateContent({

            model: "gemini-2.5-flash",

            contents: contents,

            config: {

                systemInstruction: mentorInstruction,

                temperature: 0.7,

                maxOutputTokens: 1000

            }

        });


        const reply =
            response.text || "मुझे अभी जवाब तैयार करने में समस्या हुई।";


        res.json({

            success: true,

            reply: reply

        });


    } catch (error) {

        console.error(
            "Gemini API Error:",
            error
        );


        res.status(500).json({

            success: false,

            error: "AI Mentor से response लेने में समस्या हुई।"

        });

    }

});


// ------------------------------------------
// Health Check
// ------------------------------------------

app.get("/api/health", (req, res) => {

    res.json({

        status: "online",

        message: "AI Mentor server is running."

    });

});


// ------------------------------------------
// Start Server
// ------------------------------------------

app.listen(PORT, () => {

    console.log(
        `AI Mentor server running on port ${PORT}`
    );

});
