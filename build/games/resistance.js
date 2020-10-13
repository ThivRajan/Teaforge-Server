"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const gameUtils_1 = require("./gameUtils");
//TODO: make constants for players per mission based on room size
class Resistance {
    constructor(key) {
        this.missions = [];
        this.leaderIndex = 0;
        this.start = () => {
            this.sockets.forEach(socket => {
                socket.on('ready', () => {
                    if (this.roles.length) {
                        socket.emit('role', this.roles.pop());
                        socket.emit('missions', this.missions);
                        socket.emit('teamCreation');
                        socket.emit('teamLeader', 'thiv'); //TODO: generate a leader
                    }
                });
            });
        };
        this.key = key;
        const roomPlayers = index_1.io.sockets.adapter.rooms[this.key];
        const playerIds = Object.keys(roomPlayers.sockets);
        this.sockets = playerIds.map(id => index_1.io.sockets.connected[id]);
        //TODO: change these to accommodate room size
        this.roles = gameUtils_1.generateRoles(5);
        gameUtils_1.MISSION_TEAMS[5].forEach((players, index) => this.missions[index] = { players, result: '' });
        this.start();
    }
}
exports.default = Resistance;
