const socket = io();

const totalUsers = document.querySelector("#total-users");

socket.on("totalUsers", (usersConnected) => {
    totalUsers.innerText = `Connected Users: ${usersConnected}`;
});

const inputForm = document.querySelector("#message-form");
const sendButton = document.querySelector(".send-button");
const messageInput = document.querySelector("#message-input");
const messageContainer = document.querySelector("#message-container");
const userJoinedElement = document.querySelector("#user-connected");
const notification = new Audio("/message.mp3")

const autoScroll = () => {
    const visibleHeight = messageContainer.offsetHeight;

    const containerHeight = messageContainer.scrollHeight;

    const scrollOffset = messageContainer.scrollTop + visibleHeight;

    if (containerHeight - visibleHeight <= scrollOffset + 10) {
        messageContainer.scrollTo(0, containerHeight);
    }
}


const createMessage = (location, message) => {
    const newMessage = document.createElement('li');
    newMessage.classList.add(location);

    const messageContent = document.createElement("p");
    messageContent.innerText = message.body;

    const messageInfo = document.createElement("span");
    messageInfo.classList.add("message-info");

    const user = document.createElement("span");
    user.innerText = message.owner;
    user.classList.add("user-message-name");

    const time = document.createElement("span");
    time.classList.add("user-message-date");

    const createdAtMoment = moment(message.createdAt);
    const formattedTime = createdAtMoment.format('h:mm A');
    time.innerText = formattedTime;

    messageInfo.appendChild(user);
    messageInfo.appendChild(time);
    newMessage.appendChild(messageContent);
    newMessage.appendChild(messageInfo);

    messageContainer.appendChild(newMessage);
    autoScroll()
};

const queryString = window.location.search.slice(1); // Removes the '?' at the start
const parsedQuery = Qs.parse(queryString);
const nameInput = document.querySelector("#name-input");
nameInput.innerText = parsedQuery.username;

inputForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendButton.disabled = true;

    const text = e.target.elements[0].value;
    messageInput.value = "";
    messageInput.focus();

    if (text) {
        const message = {
            body: text,
            owner: parsedQuery.username,
        };

        socket.emit("newMessage", message, (response) => {
            if (response.acknowledge) {
                createMessage("message-right", message);
                autoScroll()
            } else {
                console.log("Message did not reach the server");
            }
        });
    }

    sendButton.disabled = false;
});


socket.on("newMessage", (message) => {
    notification.play()
    clearFeedback()
    createMessage("message-left", message);
});

socket.emit("join", parsedQuery);

socket.on("userJoined", (username) => {
    const newListItem = document.createElement('li');
    newListItem.className = 'user-feedback';
    const newFeedback = document.createElement('p');
    newFeedback.className = 'feedback';
    const newUserConnected = document.createElement('span');
    newUserConnected.id = 'user-connected';
    newUserConnected.textContent = username;
    newFeedback.textContent = ' has joined the room..';
    newFeedback.insertBefore(newUserConnected, newFeedback.firstChild);
    newListItem.appendChild(newFeedback);
    messageContainer.appendChild(newListItem);
    autoScroll()
});

socket.on("userDisconnected", (username) => {
    const newListItem = document.createElement('li');
    newListItem.className = 'user-feedback';
    const newFeedback = document.createElement('p');
    newFeedback.className = 'feedback';
    const newUserConnected = document.createElement('span');
    newUserConnected.id = 'user-connected';
    newUserConnected.textContent = username;
    newFeedback.textContent = ' has left the room..';
    newFeedback.insertBefore(newUserConnected, newFeedback.firstChild);
    newListItem.appendChild(newFeedback);
    messageContainer.appendChild(newListItem);
    autoScroll()
});

const user = document.querySelector("#name-input")

let typingTimeout;

messageInput.addEventListener("focus", () => {
    socket.emit("feedback", {
        feedback: `${user.innerText} is typing...`
    });
});

// messageInput.addEventListener("keypress", () => {
//     clearTimeout(typingTimeout);
//     socket.emit("feedback", {
//         feedback: `${user.innerText} is typing...`
//     });
//     typingTimeout = setTimeout(() => {
//         socket.emit("feedback", {
//             feedback: ``
//         });
//         clearFeedback()
//     }, 1500);
// });

messageInput.addEventListener("blur", () => {
    socket.emit("feedback", {
        feedback: ``
    });
});

socket.on("feedback", (data) => {
    clearFeedback()
    const newListItem = document.createElement('li');
    newListItem.className = 'message-feedback';
    const newFeedback = document.createElement('p');
    newFeedback.className = 'feedback';
    const newUserConnected = document.createElement('span');
    newUserConnected.id = 'user-typing';
    newUserConnected.textContent = data.feedback;
    newFeedback.insertBefore(newUserConnected, newFeedback.firstChild);
    newListItem.appendChild(newFeedback);
    messageContainer.appendChild(newListItem);
    autoScroll()
});

const clearFeedback = () => {
    document.querySelectorAll("li.message-feedback").forEach((element) => {
        element.parentNode.removeChild(element)
    })
}