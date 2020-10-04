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
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
app.get('/', (_req, res) => {
    res.send('server is running');
});
const io = socket_io_1.default(server);
const players = {};
//TODO: delete room if 0 players left in room
//TODO: remove player or delete room on disconnect if host  
//TODO: make max capacity for room
//TODO: Error handling
//TODO: check if name is unique in room (part of error handling)
io.of(`/${types_1.Games.Resistance}`).on('connection', (socket) => {
    socket.on('create', (name) => {
        const key = utils_1.generateKey();
        if (io.nsps[`/${types_1.Games.Resistance}`].adapter.rooms[key]) {
            console.log('ERROR');
            // TODO: throw error or something
        }
        players[socket.id] = { name, key };
        socket.join(`${key}`);
        socket.emit('roomKey', key);
    });
    socket.on('join', (name, key) => {
        players[socket.id] = { name, key };
        if (io.nsps[`/${types_1.Games.Resistance}`].adapter.rooms[key]) {
            socket.emit('validKey');
            socket.join(`${key}`, () => {
                const roomSockets = io.nsps[`/${types_1.Games.Resistance}`].adapter.rooms[key].sockets;
                const playerIds = Object.keys(roomSockets);
                const playerNames = playerIds.map((id) => players[id].name);
                io.of(`/${types_1.Games.Resistance}`).in(`${key}`).emit('players', playerNames);
            });
        }
        else {
            socket.emit('invalidKey');
        }
    });
    socket.on('getPlayers', (key) => {
        const roomSockets = io.nsps[`/${types_1.Games.Resistance}`].adapter.rooms[key].sockets;
        const playerIds = Object.keys(roomSockets);
        const playerNames = playerIds.map((id) => players[id].name);
        socket.emit('players', playerNames);
    });
    socket.on('disconnect', () => {
        console.log('disconnect');
        const key = players[socket.id].key;
        delete players[socket.id];
        const roomSockets = io.nsps[`/${types_1.Games.Resistance}`].adapter.rooms[key].sockets;
        const playerIds = Object.keys(roomSockets);
        const playerNames = playerIds.map((id) => players[id].name);
        io.of(`/${types_1.Games.Resistance}`).in(`${key}`).emit('players', playerNames);
    });
});
