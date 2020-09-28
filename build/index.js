"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = __importDefault(require("socket.io"));
const app = express_1.default();
const PORT = 3001;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
const io = socket_io_1.default(server);
io.on('connection', () => {
    console.log('connection made');
});
app.get('/', (_req, res) => {
    res.send('server is running');
});
