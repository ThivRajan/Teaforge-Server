"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const gameUtils_1 = require("./gameUtils");
class Resistance {
    constructor(key, players) {
        this.start = () => {
            index_1.io.of('/').in(`${this.key}`).emit('missions', this.missions);
            this.sockets.forEach(socket => {
                socket.on('ready', () => {
                    /* Ensures number of players <= number of roles generated */
                    if (this.roles.length) {
                        socket.emit('role', this.roles.pop());
                        socket.emit('teamCreation');
                        socket.emit('teamLeader', this.players[this.leaderIdx]);
                    }
                });
                socket.on('teamUpdate', (type, player) => {
                    if (type === 'choose')
                        this.team = this.team.concat(player);
                    else
                        this.team = this.team.filter(p => p !== player);
                    index_1.io.of('/').in(`${this.key}`).emit('teamUpdate', this.team);
                });
                socket.on('teamConfirm', () => {
                    const reqTeamSize = this.missions[this.missionIdx].numPlayers;
                    if (this.team.length === reqTeamSize) {
                        index_1.io.of('/').in(`${this.key}`).emit('teamConfirm', this.team);
                    }
                    else if (this.team.length > reqTeamSize) {
                        socket.emit(index_1.INVALID_ACTION, `Too many players: mission needs ${reqTeamSize} players`);
                    }
                    else {
                        socket.emit(index_1.INVALID_ACTION, `Not enough players: mission needs ${reqTeamSize} players`);
                    }
                });
                socket.on('vote', (vote) => {
                    vote === 'approve' ? this.votes.approve += 1 : this.votes.reject += 1;
                    const roomSize = this.players.length;
                    if (this.votes.approve + this.votes.reject === roomSize) {
                        this.leaderIdx = (this.leaderIdx + 1) % roomSize;
                        this.team = [];
                        if (this.votes.approve > this.votes.reject) {
                            index_1.io.of('/').in(`${this.key}`).emit('teamApproved');
                        }
                        else {
                            index_1.io.of('/').in(`${this.key}`)
                                .emit('teamRejected', this.players[this.leaderIdx]);
                        }
                        this.votes = { approve: 0, reject: 0 };
                    }
                });
                socket.on('mission', (result) => {
                    result === 'pass'
                        ? this.missionResult.pass += 1
                        : this.missionResult.fail += 1;
                    const teamSize = this.missions[this.missionIdx].numPlayers;
                    if (this.missionResult.pass + this.missionResult.fail === teamSize) {
                        const result = this.missionResult.fail === 0 ? 'passed' : 'failed';
                        this.missionResult = { pass: 0, fail: 0 };
                        this.missions[this.missionIdx].result = result;
                        this.missionIdx++;
                        let resistance = 0;
                        let spies = 0;
                        this.missions.forEach(mission => {
                            if (!mission.result)
                                return;
                            mission.result === 'passed' ? resistance += 1 : spies += 1;
                        });
                        if (resistance === 3) {
                            index_1.io.of('/').in(`${this.key}`).emit('gameOver', 'resistance');
                            return;
                        }
                        if (spies === 3) {
                            index_1.io.of('/').in(`${this.key}`).emit('gameOver', 'spies');
                            return;
                        }
                        index_1.io.of('/').in(`${this.key}`).emit('teamCreation');
                        index_1.io.of('/').in(`${this.key}`).emit('teamUpdate', this.team);
                        index_1.io.of('/').in(`${this.key}`).emit('teamLeader', this.players[this.leaderIdx]);
                        index_1.io.of('/').in(`${this.key}`).emit('teamLeader', this.players[this.leaderIdx]);
                        index_1.io.of('/').in(`${this.key}`).emit('missions', this.missions);
                    }
                });
            });
        };
        this.key = key;
        this.players = players;
        this.missions = [];
        this.team = [];
        this.leaderIdx = Math.floor(Math.random() * this.players.length);
        const playerObjects = index_1.io.sockets.adapter.rooms[this.key];
        const playerIds = Object.keys(playerObjects.sockets);
        this.sockets = playerIds.map(id => index_1.io.sockets.connected[id]);
        //TODO: figure out a way to handle players leaving in the middle of game
        //TODO-DONE: change these to accommodate room size
        this.roles = gameUtils_1.generateRoles(5);
        gameUtils_1.MISSION_TEAMS[5].forEach((numPlayers, index) => this.missions[index] = { numPlayers, result: '' });
        this.votes = { approve: 0, reject: 0 };
        this.missionResult = { pass: 0, fail: 0 };
        this.missionIdx = 0;
    }
}
exports.default = Resistance;
