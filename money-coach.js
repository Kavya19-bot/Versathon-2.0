const input = document.getElementById("coachInput");
const sendButton = document.getElementById("sendMessage");
const chatMessages = document.getElementById("chatMessages");


sendButton.addEventListener("click", sendMessage);


input.addEventListener("keypress", (event) => {

    if (event.key === "Enter") {
        sendMessage();
    }

});


function sendMessage() {

    const message = input.value.trim();

    if (message === "") {
        return;
    }



    const userMessage = document.createElement("div");

    userMessage.className = "message user-message";

    userMessage.innerHTML = `
        <strong>You</strong>
        <p>${message}</p>
    `;

    chatMessages.appendChild(userMessage);


    input.value = "";



    setTimeout(() => {

        const botMessage = document.createElement("div");

        botMessage.className = "message bot-message";

        botMessage.innerHTML = `
            <strong>Money Coach</strong>
            <p>
                I'm analyzing your financial information.
                I'll help you with your question shortly.
            </p>
        `;

        chatMessages.appendChild(botMessage);

        chatMessages.scrollTop = chatMessages.scrollHeight;

    }, 500);

}