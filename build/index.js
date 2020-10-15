"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.players = exports.INVALID_ACTION = exports.io = void 0;
/* eslint-disable indent */
const express_1 = __importDefault(require("express"));
const socket_io_1 = __importDefault(require("socket.io"));
const types_1 = require("./types");
const utils_1 = require("./utils");
const resistance_1 = __importDefault(require("./games/resistance"));
const app = express_1.default();
const PORT = 3001;
const server = app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
exports.io = socket_io_1.default(server);
exports.INVALID_ACTION = 'invalid';
const VALID_ACTION = 'valid';
exports.players = {};
const rooms = {};
const playerCounts = {};
//TODO-DONE: change min to 5
playerCounts[types_1.Game.Resistance] = { min: 2, max: 10 };
exports.io.on('connection', (socket) => {
    socket.on('create', (name, game) => {
        if (!name) {
            socket.emit(exports.INVALID_ACTION, 'Please enter a name');
            return;
        }
        /* Generate unique key */
        let key = utils_1.generateKey();
        while (exports.io.sockets.adapter.rooms[key])
            key = utils_1.generateKey();
        name = name.trim();
        exports.players[socket.id] = { name, key };
        rooms[key] = {
            name: game,
            reqPlayers: playerCounts[game].min,
            players: [name],
            host: name,
            gameStarted: false
        };
        socket.join(`${key}`);
        socket.emit(VALID_ACTION, name, key, rooms[key]);
    });
    socket.on('join', (name, key) => {
        if (!name) {
            socket.emit(exports.INVALID_ACTION, 'Please enter a name');
            return;
        }
        key = key.toUpperCase();
        const room = exports.io.sockets.adapter.rooms[key];
        if (!room) {
            socket.emit(exports.INVALID_ACTION, 'Key is invalid');
            return;
        }
        if (rooms[key].gameStarted) {
            socket.emit(exports.INVALID_ACTION, 'Game already started, please join another room ');
            return;
        }
        const game = rooms[key].name;
        if (room.length > playerCounts[game].max) {
            socket.emit(exports.INVALID_ACTION, 'Room is full, please join another room');
            return;
        }
        exports.players[socket.id] = { name, key };
        const playerNames = rooms[key].players;
        name = name.trim();
        if (!playerNames.find(n => n.toLowerCase() === name.toLowerCase())) {
            rooms[key].players = [...playerNames, name];
            socket.emit(VALID_ACTION, name, key, rooms[key]);
            socket.join(`${key}`);
            exports.io.of('/').in(`${key}`).emit('update', rooms[key]);
        }
        else {
            socket.emit(exports.INVALID_ACTION, 'Name is already taken');
        }
    });
    socket.on('start', () => {
        const key = exports.players[socket.id].key;
        const roomSize = rooms[key].players.length;
        const game = rooms[key].name;
        if (roomSize >= playerCounts[game].min) {
            exports.io.of('/').in(`${key}`).emit('start');
            rooms[key].gameStarted = true;
            startGame(game, key, rooms[key].players);
        }
        else {
            socket.emit(exports.INVALID_ACTION, 'Not enough players');
        }
    });
    socket.on('disconnect', () => {
        if (!exports.players[socket.id])
            return;
        const key = exports.players[socket.id].key;
        const name = exports.players[socket.id].name;
        rooms[key].players = rooms[key]
            .players
            .filter(p => p !== name);
        delete exports.players[socket.id];
        if (!exports.io.sockets.adapter.rooms[key])
            delete rooms[key];
        else {
            if (rooms[key].host === name)
                rooms[key].host = rooms[key].players[0];
            exports.io.of('/').in(`${key}`).emit('update', rooms[key]);
        }
    });
});
const startGame = (name, key, players) => {
    let game;
    switch (name) {
        case types_1.Game.Resistance:
            game = new resistance_1.default(key, players);
            break;
        default:
            throw new Error('Invalid game');
    }
    game.start();
};
