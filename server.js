// ==========================================
// AI MENTOR - server.js
// FAST STREAMING GEMINI BACKEND
// ==========================================

import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const app = express();

const PORT = process.env.PORT || 3000;


// ------------------------------------------
// FILE PATH
// ------------------------------------------

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);


// ------------------------------------------
// MIDDLEWARE
// ------------------------------------------

app.use(cors());

app.use(express.json());

app.use(express.static(__dirname));


// ------------------------------------------
// GEMINI
// ------------------------------------------

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


// ------------------------------------------
// AI MENTOR INSTRUCTION
// ------------------------------------------

const mentorInstruction = `

You are an AI Study Mentor speaking directly with a student.

Personality:
- Friendly
- Patient
- Intelligent
- Encouraging
- Natural
- Professional

The student may be preparing for UPSC and UPPCS.

Help with:
- Concepts
- PYQs
- Revision
- Quizzes
- Study plans
- History
- Geography
- Polity
- Economy
- Environment
- Science
- Current affairs

Language:
- Natural Hindi.
- Use common English exam terms when useful.
- Use Devanagari Hindi.
- Do NOT use Urdu script.

VERY IMPORTANT:

- Answer quickly.
- For simple questions use 1-3 sentences.
- Do not repeat the question.
- Do not give unnecessary introduction.
- Do not make simple answers long.
- Give detailed answers only when the student asks for detail.
- Talk naturally like a real face-to-face mentor.

`;


// ------------------------------------------
// FAST STREAMING GEMINI
// ------------------------------------------

async function streamGemini(
    contents,
    res
) {

    const models = [

        "gemini-3.5-flash-lite",

        "gemini-3.1-flash-lite"

    ];


    let lastError = null;


    for (const model of models) {

        let receivedText = false;


        try {

            console.log(
                `Trying streaming model: ${model}`
            );


            const stream =
                await ai.models.generateContentStream({

                    model: model,

                    contents: contents,

                    config: {

                        systemInstruction:
                            mentorInstruction,

                        maxOutputTokens: 250,

                        thinkingConfig: {

                            thinkingLevel:
                                "minimal"

                        }

                    }

                });


            console.log(
                `Streaming started: ${model}`
            );


            for await (
                const chunk of stream
            ) {

                const text =
                    chunk.text || "";


                if (!text) {
                    continue;
                }


                receivedText = true;


                // Send immediately to browser
                res.write(

                    JSON.stringify({

                        type: "chunk",

                        text: text

                    }) + "\n"

                );

            }


            // Successful stream
            res.write(

                JSON.stringify({

                    type: "done"

                }) + "\n"

            );


            res.end();


            console.log(
                `Streaming completed: ${model}`
            );


            return;


        } catch (error) {

            lastError = error;


            console.error(

                `Streaming error from ${model}:`,

                error.message || error

            );


            // If response has already started,
            // don't try to start another model.
            if (receivedText) {

                try {

                    res.write(

                        JSON.stringify({

                            type: "error",

                            error:
                                "उत्तर के दौरान connection में समस्या हुई।"

                        }) + "\n"

                    );

                    res.end();

                } catch (_) {}

                return;

            }


            // Otherwise try next model
        }

    }


    console.error(
        "All Gemini models failed:",
        lastError
    );


    try {

        res.write(

            JSON.stringify({

                type: "error",

                error:
                    "Gemini अभी व्यस्त है। कृपया कुछ सेकंड बाद फिर कोशिश करें।"

            }) + "\n"

        );

        res.end();

    } catch (_) {}

}


// ------------------------------------------
// CHAT API
// ------------------------------------------

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


            // ----------------------------------
            // RECENT HISTORY ONLY
            // ----------------------------------

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
                            text: item.text
                        }

                    ]

                });

            }


            // ----------------------------------
            // CURRENT QUESTION
            // ----------------------------------

            contents.push({

                role: "user",

                parts: [

                    {
                        text:
                            message.trim()
                    }

                ]

            });


            // ----------------------------------
            // STREAM HEADERS
            // ----------------------------------

            res.status(200);


            res.setHeader(
                "Content-Type",
                "application/x-ndjson; charset=utf-8"
            );


            res.setHeader(
                "Cache-Control",
                "no-cache"
            );


            res.setHeader(
                "Connection",
                "keep-alive"
            );


            // ----------------------------------
            // START GEMINI STREAM
            // ----------------------------------

            await streamGemini(
                contents,
                res
            );


        } catch (error) {

            console.error(
                "Chat API error:",
                error
            );


            if (!res.headersSent) {

                return res.status(503).json({

                    success: false,

                    error:
                        "AI Mentor अभी उपलब्ध नहीं है।"

                });

            }


            try {

                res.end();

            } catch (_) {}

        }

    }
);


// ------------------------------------------
// HEALTH CHECK
// ------------------------------------------

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


// ------------------------------------------
// MAIN WEBSITE
// ------------------------------------------

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


// ------------------------------------------
// START SERVER
// ------------------------------------------

app.listen(
    PORT,
    () => {

        console.log(

            `AI Mentor running on port ${PORT}`

        );

    }
);
