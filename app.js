// ==========================================
// AI MENTOR - app.js
// JSON API + VOICE + PHOTO AVATAR EXPRESSIONS
// ==========================================

const mentor = document.getElementById("character");
const mentorStatus = document.getElementById("status");
const chatBox = document.getElementById("chat");
const userInput = document.getElementById("input");
const sendButton = document.getElementById("send");
const micButton = document.getElementById("mic");

let isThinking = false;
let conversationHistory = [];

// ==========================================
// AVATAR EXPRESSIONS
// ==========================================

function mentorExpression(expression, message) {
    if (!mentor) return;

    mentor.className = "character " + expression;

    if (mentorStatus && message) {
        mentorStatus.textContent = message;
    }
}

function mentorListening() {
    mentorExpression(
        "listening",
        "👂 मैं आपकी बात ध्यान से सुन रही हूँ..."
    );
}

function mentorThinking() {
    mentorExpression(
        "thinking",
        "🤔 सोच रही हूँ..."
    );
}

function mentorTalking() {
    mentorExpression(
        "talking",
        "🗣️ Mentor बोल रही है..."
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
        "normal",
        "👋 मैं आपकी मदद के लिए तैयार हूँ।"
    );
}

// ==========================================
// USER MESSAGE
// ==========================================

function addUserMessage(text) {

    if (!chatBox) return;

    const message =
        document.createElement("div");

    message.className = "msg user";

    message.textContent = text;

    chatBox.appendChild(message);

    chatBox.scrollTop =
        chatBox.scrollHeight;
}

// ==========================================
// MENTOR MESSAGE
// ==========================================

function addMentorMessage(text) {

    if (!chatBox) return null;

    const message =
        document.createElement("div");

    message.className = "msg mentor";

    message.textContent = text;

    chatBox.appendChild(message);

    chatBox.scrollTop =
        chatBox.scrollHeight;

    return message;
}

// ==========================================
// TEXT TO SPEECH
// ==========================================

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
        new SpeechSynthesisUtterance(text);

    voice.lang = "hi-IN";

    voice.rate = 0.98;

    voice.pitch = 1.0;

    voice.volume = 1.0;

    voice.onstart = function() {

        mentorTalking();

    };

    voice.onend = function() {

        mentorHappy();

        setTimeout(function() {

            mentorNormal();

        }, 800);

    };

    voice.onerror = function() {

        mentorNormal();

    };

    speechSynthesis.speak(voice);
}

// ==========================================
// GEMINI JSON API
// ==========================================

async function getGeminiAnswer(question) {

    const response =
        await fetch("/api/chat", {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({

                message: question,

                history:
                    conversationHistory

            })

        });


    if (!response.ok) {

        throw new Error(
            "Gemini server error: " +
            response.status
        );

    }


    const data =
        await response.json();


    if (!data.success) {

        throw new Error(
            data.error ||
            "Gemini error"
        );

    }


    return (
        data.reply || ""
    ).trim();

}

// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMentorMessage() {

    if (!userInput || isThinking) {
        return;
    }


    const question =
        userInput.value.trim();


    if (!question) {
        return;
    }


    // USER MESSAGE

    addUserMessage(question);


    userInput.value = "";


    // LOCK

    isThinking = true;


    if (sendButton) {
        sendButton.disabled = true;
    }


    if (micButton) {
        micButton.disabled = true;
    }


    // THINKING

    mentorThinking();


    try {

        // GEMINI

        const answer =
            await getGeminiAnswer(question);


        if (!answer) {

            throw new Error(
                "Empty Gemini response"
            );

        }


        // MENTOR MESSAGE

        addMentorMessage(answer);


        // HISTORY

        conversationHistory.push({

            role: "user",

            text: question

        });


        conversationHistory.push({

            role: "model",

            text: answer

        });


        // KEEP LAST 6 MESSAGES

        if (
            conversationHistory.length > 6
        ) {

            conversationHistory =
                conversationHistory.slice(-6);

        }


        // SPEAK

        mentorSpeak(answer);


    } catch (error) {

        console.error(
            "AI Mentor error:",
            error
        );


        addMentorMessage(
            "माफ़ कीजिए, अभी AI Mentor से connection नहीं हो पाया। कृपया फिर कोशिश करें।"
        );


        mentorNormal();

    } finally {

        isThinking = false;


        if (sendButton) {
            sendButton.disabled = false;
        }


        if (micButton) {
            micButton.disabled = false;
        }


        if (userInput) {
            userInput.focus();
        }

    }

}

// ==========================================
// SEND BUTTON
// ==========================================

if (sendButton) {

    sendButton.addEventListener(
        "click",
        sendMentorMessage
    );

}

// ==========================================
// ENTER KEY
// ==========================================

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

// ==========================================
// MICROPHONE
// ==========================================

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

                console.error(error);

                mentorNormal();

                return;

            }


            recognition.onresult =
                function(event) {

                    const text =
                        event.results[0][0]
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

// ==========================================
// PHOTO AVATAR IDLE MOVEMENT
// ==========================================

function photoIdleMovement() {

    if (!mentor || isThinking) {
        return;
    }


    const photoWrap =
        mentor.querySelector(
            ".mentor-photo-wrap"
        );


    if (!photoWrap) {
        return;
    }


    const direction =
        Math.random() > 0.5
            ? 1
            : -1;


    photoWrap.animate(

        [

            {
                transform:
                    "translateX(0) rotate(0deg) scale(1)"
            },

            {
                transform:
                    `translateX(${direction * 2}px) rotate(${direction * 0.5}deg) scale(1.006)`
            },

            {
                transform:
                    "translateX(0) rotate(0deg) scale(1)"
            }

        ],

        {

            duration: 2200,

            easing: "ease-in-out"

        }

    );

}


setInterval(
    photoIdleMovement,
    4500
);

// ==========================================
// INITIAL STATUS
// ==========================================

setTimeout(function() {

    mentorNormal();

}, 500);


// ==========================================
// START
// ==========================================

console.log(
    "AI Mentor JSON + Voice + Photo Avatar system loaded."
);
