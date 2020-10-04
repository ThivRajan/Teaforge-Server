"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = __importDefault(require("socket.io"));
// import { Games } from './types';
const utils_1 = require("./utils");
const app = express_1.default();
const PORT = 3001;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
app.get('/', (_req, res) => {
    res.send('server is running');
});
const io = socket_io_1.default(server);
const players = {};
//TODO: deal with type error when client leaves room (prob has to do with socket.onclose)
// i think this error has to do with the server disconnecting & reconnecting
//TODO: delete room if 0 players left in room
//TODO: remove player or delete room on disconnect if host  
//TODO: make max capacity for room
io.on('connection', (socket) => {
    socket.on('create', (name) => {
        let key = utils_1.generateKey();
        /* Generate unique key */
        while (io.sockets.adapter.rooms[key]) {
            key = utils_1.generateKey();
        }
        players[socket.id] = { name: name.trim(), key };
        socket.join(`${key}`);
        socket.emit('roomKey', key);
        socket.emit('players', [name]);
    });
    socket.on('join', (name, key) => {
        players[socket.id] = { name, key };
        if (io.sockets.adapter.rooms[key]) {
            const roomSockets = io.sockets.adapter.rooms[key].sockets;
            const playerIds = Object.keys(roomSockets);
            const playerNames = playerIds.map((id) => players[id].name);
            name = name.trim();
            if (!playerNames.find(n => n.toLowerCase() === name.toLowerCase())) {
                socket.emit('valid');
                socket.join(`${key}`);
                playerNames.push(name);
                io.of('/').in(`${key}`).emit('players', playerNames);
            }
            else {
                socket.emit('invalid', 'Name is already taken');
            }
        }
        else {
            socket.emit('invalid', 'Key is invalid');
        }
    });
    socket.on('getPlayers', (key) => {
        const roomSockets = io.sockets.adapter.rooms[key].sockets;
        const playerIds = Object.keys(roomSockets);
        const playerNames = playerIds.map((id) => players[id].name);
        socket.emit('players', playerNames);
    });
    socket.on('disconnect', () => {
        const key = players[socket.id].key;
        delete players[socket.id];
        const roomSockets = io.sockets.adapter.rooms[key].sockets;
        const playerIds = Object.keys(roomSockets);
        const playerNames = playerIds.map((id) => players[id].name);
        io.of('/').in(`${key}`).emit('players', playerNames);
    });
});
