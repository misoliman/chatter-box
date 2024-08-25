const express = require('express');
const path = require('path');
const http = require('http');
const { createMessage } = require('./utils/createMessage');
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

const onConnection = (socket) => {

    socket.on("join", ({ username, room }) => {
        socket.join(room);

        if (!rooms[room]) {
            rooms[room] = new Set();
        }

        rooms[room].add({ socketId: socket.id, username: username });
        io.to(room).emit("totalUsers", rooms[room].size);

        socket.broadcast.to(room).emit("userJoined", username);
    });

    socket.on("disconnect", () => {

        for (let room in rooms) {
            const userSet = rooms[room];
            let disconnectedUser;

            for (let user of userSet) {
                if (user.socketId === socket.id) {
                    disconnectedUser = user.username;
                    userSet.delete(user);
                    break;
                }
            }

            if (disconnectedUser) {
                io.to(room).emit("totalUsers", userSet.size);
                io.to(room).emit("userDisconnected", disconnectedUser);

                // Clean up the room if it's empty
                if (userSet.size === 0) {
                    delete rooms[room];
                }
                break;
            }
        }
    });

    socket.on("newMessage", (message, callback) => {

        try {
            const roomsArray = Array.from(socket.rooms);
            const userRoom = roomsArray[1];
            socket.broadcast.to(userRoom).emit("newMessage", createMessage(message.body, message.owner));

            callback({ acknowledge: true });
        } catch (err) {
            callback({ acknowledge: false });
        }
    });

    socket.on("feedback", (feedback) => {
        const roomsArray = Array.from(socket.rooms);
        const userRoom = roomsArray[1];
        socket.broadcast.to(userRoom).emit("feedback", feedback);
    });
};

io.on("connection", onConnection);

server.listen(PORT, () => {
    console.log(`Chatter Box is running on port ${PORT}`);
});
