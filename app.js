// ==========================================
// AI MENTOR - app.js
// FAST STREAMING + VOICE + EXPRESSIONS
// ==========================================


// ------------------------------------------
// ELEMENTS
// ------------------------------------------

const mentor =
    document.getElementById("character");

const mentorStatus =
    document.getElementById("status");

const chatBox =
    document.getElementById("chat");

const userInput =
    document.getElementById("input");

const sendButton =
    document.getElementById("send");

const micButton =
    document.getElementById("mic");


// ------------------------------------------
// STATE
// ------------------------------------------

let isThinking = false;

let conversationHistory = [];


// ------------------------------------------
// EXPRESSIONS
// ------------------------------------------

function mentorExpression(
    expression,
    message
) {

    if (!mentor) return;


    mentor.className =
        "character " + expression;


    if (
        mentorStatus &&
        message
    ) {

        mentorStatus.textContent =
            message;

    }

}


function mentorListening() {

    mentorExpression(

        "listening",

        "👂 मैं आपकी बात ध्यान से सुन रहा हूँ..."

    );

}


function mentorThinking() {

    mentorExpression(

        "thinking",

        "🤔 सोच रहा हूँ..."

    );

}


function mentorTalking() {

    mentorExpression(

        "talking",

        "🗣️ Mentor बोल रहा है..."

    );

}


function mentorHappy() {

    mentorExpression(

        "happy",

        "😊 बहुत बढ़िया!"

    );

}


function mentorNormal() {

    mentorExpression(

        "",

        "👋 मैं आपकी मदद के लिए तैयार हूँ।"

    );

}


// ------------------------------------------
// USER MESSAGE
// ------------------------------------------

function addUserMessage(text) {

    if (!chatBox) return;


    const message =
        document.createElement("div");


    message.className =
        "msg user";


    message.textContent =
        text;


    chatBox.appendChild(
        message
    );


    chatBox.scrollTop =
        chatBox.scrollHeight;

}


// ------------------------------------------
// CREATE STREAMING MENTOR MESSAGE
// ------------------------------------------

function createMentorMessage() {

    if (!chatBox) return null;


    const message =
        document.createElement("div");


    message.className =
        "msg mentor";


    message.textContent =
        "";


    chatBox.appendChild(
        message
    );


    chatBox.scrollTop =
        chatBox.scrollHeight;


    return message;

}


// ------------------------------------------
// TEXT TO SPEECH
// ------------------------------------------

function mentorSpeak(text) {

    if (
        !text ||
        !("speechSynthesis" in window)
    ) {

        mentorNormal();

        return;

    }


    speechSynthesis.cancel();


    const voice =
        new SpeechSynthesisUtterance(
            text
        );


    voice.lang =
        "hi-IN";


    voice.rate =
        0.98;


    voice.pitch =
        1.0;


    voice.volume =
        1.0;


    voice.onstart =
        function() {

            mentorTalking();

        };


    voice.onend =
        function() {

            mentorHappy();


            setTimeout(

                () => {

                    mentorNormal();

                },

                800

            );

        };


    voice.onerror =
        function() {

            mentorNormal();

        };


    speechSynthesis.speak(
        voice
    );

}


// ------------------------------------------
// STREAM GEMINI RESPONSE
// ------------------------------------------

async function streamGeminiAnswer(
    question,
    mentorMessage
) {

    const response =
        await fetch(
            "/api/chat",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    message:
                        question,

                    history:
                        conversationHistory

                })

            }
        );


    if (!response.ok) {

        throw new Error(
            "Gemini server error"
        );

    }


    if (!response.body) {

        throw new Error(
            "Streaming not supported"
        );

    }


    const reader =
        response.body.getReader();


    const decoder =
        new TextDecoder();


    let buffer = "";

    let fullAnswer = "";


    // --------------------------------------
    // READ STREAM
    // --------------------------------------

    while (true) {

        const {
            value,
            done
        } =
            await reader.read();


        if (done) {
            break;
        }


        buffer +=
            decoder.decode(
                value,
                {
                    stream: true
                }
            );


        const lines =
            buffer.split("\n");


        buffer =
            lines.pop() || "";


        for (
            const line
            of lines
        ) {

            if (!line.trim()) {
                continue;
            }


            let data;


            try {

                data =
                    JSON.parse(line);

            } catch (_) {

                continue;

            }


            // --------------------------------
            // TEXT CHUNK
            // --------------------------------

            if (
                data.type === "chunk"
            ) {

                const text =
                    data.text || "";


                fullAnswer +=
                    text;


                // SHOW IMMEDIATELY
                mentorMessage.textContent =
                    fullAnswer;


                chatBox.scrollTop =
                    chatBox.scrollHeight;

            }


            // --------------------------------
            // ERROR
            // --------------------------------

            if (
                data.type === "error"
            ) {

                throw new Error(
                    data.error ||
                    "Gemini error"
                );

            }

        }

    }


    return fullAnswer.trim();

}


// ------------------------------------------
// SEND MESSAGE
// ------------------------------------------

async function sendMentorMessage() {

    if (!userInput) return;


    if (isThinking) return;


    const question =
        userInput.value.trim();


    if (!question) return;


    // --------------------------------------
    // ADD USER MESSAGE
    // --------------------------------------

    addUserMessage(
        question
    );


    userInput.value =
        "";


    // --------------------------------------
    // LOCK BUTTONS
    // --------------------------------------

    isThinking =
        true;


    if (sendButton) {

        sendButton.disabled =
            true;

    }


    if (micButton) {

        micButton.disabled =
            true;

    }


    // --------------------------------------
    // THINKING
    // --------------------------------------

    mentorThinking();


    // Create empty response box immediately
    const mentorMessage =
        createMentorMessage();


    try {

        // ----------------------------------
        // STREAM ANSWER
        // ----------------------------------

        const answer =
            await streamGeminiAnswer(

                question,

                mentorMessage

            );


        if (!answer) {

            throw new Error(
                "Empty Gemini response"
            );

        }


        // ----------------------------------
        // SAVE HISTORY
        // ----------------------------------

        conversationHistory.push({

            role:
                "user",

            text:
                question

        });


        conversationHistory.push({

            role:
                "model",

            text:
                answer

        });


        // Keep recent history only
        if (
            conversationHistory.length >
            6
        ) {

            conversationHistory =
                conversationHistory.slice(
                    -6
                );

        }


        // ----------------------------------
        // SPEAK AFTER ANSWER
        // ----------------------------------

        mentorSpeak(
            answer
        );


    } catch (error) {

        console.error(
            "AI Mentor error:",
            error
        );


        if (mentorMessage) {

            mentorMessage.textContent =
                "माफ़ कीजिए, अभी AI Mentor से connection नहीं हो पाया। कृपया फिर कोशिश करें।";

        }


        mentorNormal();

    }


    // --------------------------------------
    // UNLOCK BUTTONS
    // --------------------------------------

    isThinking =
        false;


    if (sendButton) {

        sendButton.disabled =
            false;

    }


    if (micButton) {

        micButton.disabled =
            false;

    }

}


// ------------------------------------------
// SEND BUTTON
// ------------------------------------------

if (sendButton) {

    sendButton.addEventListener(

        "click",

        sendMentorMessage

    );

}


// ------------------------------------------
// ENTER KEY
// ------------------------------------------

if (userInput) {

    userInput.addEventListener(

        "keydown",

        function(event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                sendMentorMessage();

            }

        }

    );

}


// ------------------------------------------
// MICROPHONE
// ------------------------------------------

if (micButton) {

    micButton.addEventListener(

        "click",

        function() {

            if (isThinking) {
                return;
            }


            const SpeechRecognition =
                window.SpeechRecognition ||
                window.webkitSpeechRecognition;


            if (!SpeechRecognition) {

                if (mentorStatus) {

                    mentorStatus.textContent =
                        "❌ आपके browser में voice recognition उपलब्ध नहीं है।";

                }

                return;

            }


            const recognition =
                new SpeechRecognition();


            recognition.lang =
                "hi-IN";


            recognition.interimResults =
                false;


            recognition.continuous =
                false;


            mentorListening();


            try {

                recognition.start();

            } catch (error) {

                console.error(
                    error
                );

                mentorNormal();

                return;

            }


            recognition.onresult =
                function(event) {

                    const text =
                        event
                            .results[0][0]
                            .transcript;


                    if (userInput) {

                        userInput.value =
                            text;

                    }


                    sendMentorMessage();

                };


            recognition.onerror =
                function(event) {

                    console.error(
                        "Speech error:",
                        event.error
                    );


                    mentorNormal();

                };


            recognition.onend =
                function() {

                    if (
                        mentor &&
                        mentor.classList.contains(
                            "listening"
                        )
                    ) {

                        mentorNormal();

                    }

                };

        }

    );

}


// ------------------------------------------
// NATURAL BLINK
// ------------------------------------------

function naturalBlink() {

    if (!mentor) return;


    const eyes =
        mentor.querySelectorAll(
            ".eye"
        );


    eyes.forEach(

        eye => {

            eye.style.transform =
                "scaleY(0.08)";

        }

    );


    setTimeout(

        () => {

            eyes.forEach(

                eye => {

                    eye.style.transform =
                        "";

                }

            );

        },

        130

    );


    const nextBlink =
        2500 +
        Math.random() * 4500;


    setTimeout(
        naturalBlink,
        nextBlink
    );

}


setTimeout(
    naturalBlink,
    3000
);


// ------------------------------------------
// INITIAL STATUS
// ------------------------------------------

setTimeout(

    () => {

        if (mentorStatus) {

            mentorStatus.textContent =
                "👋 मैं आपकी मदद के लिए तैयार हूँ।";

        }

    },

    2500

);


// ------------------------------------------
// START
// ------------------------------------------

console.log(
    "AI Mentor FAST STREAMING system loaded."
);
