// ==========================================
// AI MENTOR - app.js
// Gemini AI + Character + Voice + Expressions
// ==========================================


// ------------------------------------------
// ELEMENTS
// ------------------------------------------

const mentor = document.getElementById("character");
const mentorStatus = document.getElementById("status");
const chatBox = document.getElementById("chat");
const userInput = document.getElementById("input");
const sendButton = document.getElementById("send");
const micButton = document.getElementById("mic");


// ------------------------------------------
// STATE
// ------------------------------------------

let isThinking = false;

// Conversation history
let conversationHistory = [];


// ------------------------------------------
// CHARACTER EXPRESSIONS
// ------------------------------------------

function mentorExpression(expression, message) {

    if (!mentor) return;

    mentor.className = "character " + expression;

    if (mentorStatus && message) {
        mentorStatus.textContent = message;
    }
}


// ------------------------------------------
// LISTENING
// ------------------------------------------

function mentorListening() {

    mentorExpression(
        "listening",
        "👂 मैं आपकी बात ध्यान से सुन रहा हूँ..."
    );
}


// ------------------------------------------
// THINKING
// ------------------------------------------

function mentorThinking() {

    mentorExpression(
        "thinking",
        "🤔 एक सेकंड... मैं सोच रहा हूँ..."
    );
}


// ------------------------------------------
// TALKING
// ------------------------------------------

function mentorTalking() {

    mentorExpression(
        "talking",
        "🗣️ Mentor बोल रहा है..."
    );
}


// ------------------------------------------
// HAPPY
// ------------------------------------------

function mentorHappy() {

    mentorExpression(
        "happy",
        "😊 बहुत बढ़िया!"
    );
}


// ------------------------------------------
// SURPRISED
// ------------------------------------------

function mentorSurprised() {

    mentorExpression(
        "surprised",
        "😮 Interesting सवाल है..."
    );
}


// ------------------------------------------
// NORMAL
// ------------------------------------------

function mentorNormal() {

    mentorExpression(
        "",
        "👋 मैं आपकी मदद के लिए तैयार हूँ।"
    );
}


// ------------------------------------------
// ADD USER MESSAGE
// ------------------------------------------

function addUserMessage(text) {

    if (!chatBox) return;

    const message = document.createElement("div");

    message.className = "msg user";

    message.textContent = text;

    chatBox.appendChild(message);

    chatBox.scrollTop = chatBox.scrollHeight;
}


// ------------------------------------------
// ADD MENTOR MESSAGE
// ------------------------------------------

function addMentorMessage(text) {

    if (!chatBox) return;

    const message = document.createElement("div");

    message.className = "msg mentor";

    message.textContent = text;

    chatBox.appendChild(message);

    chatBox.scrollTop = chatBox.scrollHeight;
}


// ------------------------------------------
// TEXT TO SPEECH
// ------------------------------------------

function mentorSpeak(text) {

    if (!("speechSynthesis" in window)) {

        mentorNormal();

        return;
    }

    speechSynthesis.cancel();

    const voice =
        new SpeechSynthesisUtterance(text);

    voice.lang = "hi-IN";

    voice.rate = 0.95;

    voice.pitch = 1.0;

    voice.volume = 1.0;


    // --------------------------------------
    // VOICE START
    // --------------------------------------

    voice.onstart = function () {

        mentorTalking();

    };


    // --------------------------------------
    // VOICE END
    // --------------------------------------

    voice.onend = function () {

        mentorHappy();

        setTimeout(() => {

            mentorNormal();

        }, 1000);

    };


    // --------------------------------------
    // VOICE ERROR
    // --------------------------------------

    voice.onerror = function () {

        mentorNormal();

    };


    speechSynthesis.speak(voice);
}


// ------------------------------------------
// SEND MESSAGE TO GEMINI BACKEND
// ------------------------------------------

async function sendToGemini(question) {

    const response = await fetch("/api/chat", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            message: question,

            history: conversationHistory

        })

    });


    const data = await response.json();


    if (!response.ok || !data.success) {

        throw new Error(
            data.error ||
            "AI Mentor से response नहीं मिला।"
        );

    }


    return data.reply;
}


// ------------------------------------------
// MAIN SEND FUNCTION
// ------------------------------------------

async function sendMentorMessage() {

    if (!userInput) return;


    // Prevent multiple requests
    if (isThinking) return;


    const question =
        userInput.value.trim();


    if (!question) return;


    // --------------------------------------
    // USER MESSAGE
    // --------------------------------------

    addUserMessage(question);

    userInput.value = "";


    // --------------------------------------
    // THINKING
    // --------------------------------------

    isThinking = true;

    if (sendButton) {
        sendButton.disabled = true;
    }

    if (micButton) {
        micButton.disabled = true;
    }

    mentorThinking();


    try {

        // ----------------------------------
        // SEND TO REAL GEMINI
        // ----------------------------------

        const answer =
            await sendToGemini(question);


        // ----------------------------------
        // SAVE CONVERSATION
        // ----------------------------------

        conversationHistory.push({

            role: "user",

            text: question

        });


        conversationHistory.push({

            role: "model",

            text: answer

        });


        // ----------------------------------
        // Keep only recent history
        // ----------------------------------

        if (conversationHistory.length > 8) {

            conversationHistory =
                conversationHistory.slice(-8);

        }


        // ----------------------------------
        // SHOW GEMINI ANSWER
        // ----------------------------------

        addMentorMessage(answer);


        // ----------------------------------
        // SPEAK ANSWER
        // ----------------------------------

        mentorSpeak(answer);


    } catch (error) {

        console.error(
            "AI Mentor Error:",
            error
        );


        const errorMessage =
            "माफ़ कीजिए, अभी AI Mentor से connection नहीं हो पाया। कृपया कुछ सेकंड बाद फिर कोशिश करें।";


        addMentorMessage(errorMessage);


        mentorNormal();

    }


    // --------------------------------------
    // ENABLE BUTTONS AGAIN
    // --------------------------------------

    isThinking = false;


    if (sendButton) {
        sendButton.disabled = false;
    }

    if (micButton) {
        micButton.disabled = false;
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

            if (event.key === "Enter") {

                event.preventDefault();

                sendMentorMessage();

            }

        }

    );

}


// ------------------------------------------
// MICROPHONE / SPEECH RECOGNITION
// ------------------------------------------

if (micButton) {

    micButton.addEventListener(

        "click",

        function() {

            // Don't start microphone while AI is answering
            if (isThinking) return;


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


            recognition.lang = "hi-IN";

            recognition.interimResults = false;

            recognition.continuous = false;


            // ----------------------------------
            // LISTENING
            // ----------------------------------

            mentorListening();


            try {

                recognition.start();

            } catch (error) {

                console.error(
                    "Microphone error:",
                    error
                );

                mentorNormal();

                return;

            }


            // ----------------------------------
            // VOICE RESULT
            // ----------------------------------

            recognition.onresult =
                function(event) {

                    const text =
                        event
                            .results[0][0]
                            .transcript;


                    if (userInput) {

                        userInput.value = text;

                    }


                    // Automatically send to Gemini
                    sendMentorMessage();

                };


            // ----------------------------------
            // VOICE ERROR
            // ----------------------------------

            recognition.onerror =
                function(event) {

                    console.error(
                        "Speech recognition error:",
                        event.error
                    );

                    mentorNormal();

                };


            // ----------------------------------
            // VOICE END
            // ----------------------------------

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
// NATURAL BLINKING
// ------------------------------------------

function naturalBlink() {

    if (!mentor) return;


    const eyes =
        mentor.querySelectorAll(".eye");


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
    "AI Mentor - Gemini character system loaded successfully."
);
