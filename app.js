// ==========================================
// AI MENTOR - app.js
// Character Control + Voice + Expressions
// ==========================================

const mentor = document.getElementById("character");
const mentorStatus = document.getElementById("status");
const chatBox = document.getElementById("chat");
const userInput = document.getElementById("input");
const sendButton = document.getElementById("send");
const micButton = document.getElementById("mic");


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
        "😮 ओह! यह interesting सवाल है..."
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
// ADD MESSAGE TO CHAT
// ------------------------------------------

function addMentorMessage(text) {

    if (!chatBox) return;

    const message = document.createElement("div");

    message.className = "msg mentor";

    message.textContent = text;

    chatBox.appendChild(message);

    chatBox.scrollTop = chatBox.scrollHeight;
}


function addUserMessage(text) {

    if (!chatBox) return;

    const message = document.createElement("div");

    message.className = "msg user";

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

    const voice = new SpeechSynthesisUtterance(text);

    voice.lang = "hi-IN";

    voice.rate = 0.92;

    voice.pitch = 1.0;

    voice.volume = 1.0;


    voice.onstart = function () {

        mentorTalking();

    };


    voice.onend = function () {

        mentorHappy();

        setTimeout(() => {

            mentorNormal();

        }, 1200);

    };


    voice.onerror = function () {

        mentorNormal();

    };


    speechSynthesis.speak(voice);
}


// ------------------------------------------
// BASIC DEMO RESPONSE
// ------------------------------------------
// Gemini connect होने के बाद यह हिस्सा
// Gemini API से आने वाले response से replace होगा.

function demoMentorResponse(question) {

    const q = question.toLowerCase();


    if (
        q.includes("hello") ||
        q.includes("hi") ||
        q.includes("नमस्ते")
    ) {

        mentorHappy();

        return "नमस्ते! मैं आपका AI Mentor हूँ। बताइए, आज हम क्या पढ़ना शुरू करें?";

    }


    if (
        q.includes("upsc") ||
        q.includes("uppcs")
    ) {

        return "बिल्कुल। मैं आपकी UPSC और UPPCS preparation में मदद कर सकता हूँ। हम concept, PYQ, revision और test practice step by step कर सकते हैं।";

    }


    if (
        q.includes("history") ||
        q.includes("इतिहास")
    ) {

        return "इतिहास पढ़ते समय केवल घटनाएँ याद करने के बजाय timeline, कारण, घटनाक्रम और परिणाम को जोड़कर समझना ज्यादा उपयोगी होता है।";

    }


    if (
        q.includes("geography") ||
        q.includes("भूगोल")
    ) {

        return "भूगोल में हम concepts के साथ maps और examples का इस्तेमाल करेंगे, ताकि चीजें लंबे समय तक याद रहें।";

    }


    if (
        q.includes("polity") ||
        q.includes("पॉलिटी") ||
        q.includes("राजव्यवस्था")
    ) {

        return "Polity में Constitution के Articles को isolated facts की तरह याद करने के बजाय उनके concept और application को समझना ज्यादा उपयोगी रहेगा।";

    }


    return "अच्छा सवाल है। मैं इसे step by step समझाने की कोशिश करूँगा। अगले चरण में Gemini API connect होने के बाद मैं आपके सवाल का वास्तविक AI-generated answer दूँगा।";
}


// ------------------------------------------
// SEND MESSAGE
// ------------------------------------------

function sendMentorMessage() {

    if (!userInput) return;


    const question = userInput.value.trim();


    if (!question) return;


    addUserMessage(question);


    userInput.value = "";


    mentorThinking();


    setTimeout(() => {

        const response = demoMentorResponse(question);

        addMentorMessage(response);

        mentorSpeak(response);

    }, 800);
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

            const SpeechRecognition =
                window.SpeechRecognition ||
                window.webkitSpeechRecognition;


            if (!SpeechRecognition) {

                mentorStatus.textContent =
                    "❌ आपके browser में voice recognition उपलब्ध नहीं है।";

                return;

            }


            const recognition =
                new SpeechRecognition();


            recognition.lang = "hi-IN";

            recognition.interimResults = false;

            recognition.continuous = false;


            mentorListening();


            recognition.start();


            recognition.onresult =
                function(event) {

                    const text =
                        event.results[0][0].transcript;


                    if (userInput) {

                        userInput.value = text;

                    }


                    sendMentorMessage();

                };


            recognition.onerror =
                function() {

                    mentorNormal();

                };


            recognition.onend =
                function() {

                    if (
                        mentor &&
                        mentor.classList.contains("listening")
                    ) {

                        mentorNormal();

                    }

                };

        }
    );

}


// ------------------------------------------
// RANDOM NATURAL BLINKING
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


    setTimeout(() => {

        eyes.forEach(
            eye => {

                eye.style.transform =
                    "";

            }
        );

    }, 130);


    const nextBlink =
        2500 + Math.random() * 4500;


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
// NATURAL IDLE STATUS
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
    "AI Mentor character system loaded successfully."
);
