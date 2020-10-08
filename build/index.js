"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = __importDefault(require("socket.io"));
const types_1 = require("./types");
const utils_1 = require("./utils");
const app = express_1.default();
const PORT = 3001;
const server = app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
const io = socket_io_1.default(server);
const players = {};
const rooms = {};
const playerCounts = {};
playerCounts[types_1.Games.Resistance] = { min: 5, max: 10 };
io.on('connection', (socket) => {
    socket.on('create', (name, game) => {
        if (!name) {
            socket.emit('invalid', 'Please enter a name');
            return;
        }
        /* Generate unique key */
        let key = utils_1.generateKey();
        while (io.sockets.adapter.rooms[key])
            key = utils_1.generateKey();
        players[socket.id] = { name: name.trim(), key };
        rooms[key] = {
            name: game,
            reqPlayers: playerCounts[game].min,
            players: [name], host: name
        };
        socket.join(`${key}`);
        socket.emit('valid', key, rooms[key]);
    });
    socket.on('join', (name, key) => {
        players[socket.id] = { name, key };
        if (!name) {
            socket.emit('invalid', 'Please enter a name');
            return;
        }
        const room = io.sockets.adapter.rooms[key];
        if (!room) {
            socket.emit('invalid', 'Key is invalid');
            return;
        }
        const game = rooms[key].name;
        if (room.length > playerCounts[game].max) {
            socket.emit('invalid', 'Room is full, please join another room');
            return;
        }
        const playerNames = rooms[key].players;
        name = name.trim();
        if (!playerNames.find(n => n.toLowerCase() === name.toLowerCase())) {
            rooms[key].players = [...playerNames, name];
            socket.emit('valid', rooms[key]);
            socket.join(`${key}`);
            io.of('/').in(`${key}`).emit('update', rooms[key]);
        }
        else {
            socket.emit('invalid', 'Name is already taken');
        }
    });
    socket.on('start', () => {
        const key = players[socket.id].key;
        const roomSize = rooms[key].players.length;
        const game = rooms[key].name;
        if (roomSize >= playerCounts[game].min)
            io.of('/').in(`${key}`).emit('start');
        else
            socket.emit('invalid', 'Not enough players');
    });
    socket.on('disconnect', () => {
        const key = players[socket.id].key;
        const name = players[socket.id].name;
        rooms[key].players = rooms[key]
            .players
            .filter(p => p !== name);
        delete players[socket.id];
        if (!io.sockets.adapter.rooms[key])
            delete rooms[key];
        else {
            if (rooms[key].host === name)
                rooms[key].host = rooms[key].players[0];
            io.of('/').in(`${key}`).emit('update', rooms[key]);
        }
    });
});
