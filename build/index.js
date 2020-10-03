"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = __importDefault(require("socket.io"));
const types_1 = require("./types");
const app = express_1.default();
const PORT = 3001;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
app.get('/', (_req, res) => {
    res.send('server is running');
});
const io = socket_io_1.default(server);
let players = [];
io.of(`/${types_1.Games.Resistance}`).on('connection', (socket) => {
    socket.on('create', (name) => {
        players = players.concat({ id: socket.id, name });
        socket.emit('roomKey', 'key'); //generate unique key here
    });
    socket.on('joinRoom', (key) => {
        socket.join(`${key}`, () => {
            const playerNames = players.map(p => p.name);
            io.of(`/${types_1.Games.Resistance}`).in(`${key}`).emit('players', playerNames);
        });
    });
});
