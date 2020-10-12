"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const gameUtils_1 = require("./gameUtils");
//TODO: make constants for players per mission based on room size
class Resistance {
    constructor(key) {
        this.missions = [];
        //TODO: add key checks but for now don't bother
        //TODO: figure out issue on the first connection
        this.start = () => {
            index_1.io.on('connection', (socket) => {
                socket.on('ready', () => {
                    if (this.roles.length) {
                        socket.emit('role', this.roles.pop());
                        socket.emit('missions', this.missions);
                        socket.emit('teamCreation');
                        socket.emit('teamLeader', 'thiv');
                    }
                });
            });
        };
        this.key = key;
        const roomPlayers = index_1.io.sockets.adapter.rooms[this.key];
        const playerIds = Object.keys(roomPlayers.sockets);
        this.playerNames = playerIds.map(id => index_1.players[id].name);
        //TODO: change these to accommodate room size
        this.roles = gameUtils_1.generateRoles(5);
        gameUtils_1.MISSION_TEAMS[5].forEach((players, index) => this.missions[index] = { players, result: '' });
    }
}
exports.default = Resistance;
