const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const rooms = {};

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('createRoom', (roomCode) => {
        rooms[roomCode] = { red: socket.id, black: null, turn: 'red' };
        socket.join(roomCode);
        socket.emit('roomCreated', { roomCode, player: 'red' });
    });

    socket.on('joinRoom', (roomCode) => {
        if (rooms[roomCode] && !rooms[roomCode].black) {
            rooms[roomCode].black = socket.id;
            socket.join(roomCode);
            io.to(roomCode).emit('startGame', rooms[roomCode]);
        } else {
            socket.emit('errorMsg', 'Room is full or does not exist.');
        }
    });

    socket.on('makeMove', ({ roomCode, boardState, nextTurn, forcedPiece }) => {
        io.to(roomCode).emit('updateBoard', { boardState, nextTurn, forcedPiece });
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
