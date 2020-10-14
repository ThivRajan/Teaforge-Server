import { io } from '../index';
import { Mission, Votes, Result } from '../types';
import { generateRoles, MISSION_TEAMS } from './gameUtils';

//TODO: make constants for players per mission based on room size
//TODO: make constant for 'invalid'
class Resistance {
	key: string;

	roles: string[];
	sockets: SocketIO.Socket[];
	players: string[];
	team: string[];

	missionIdx: number;
	missions: Mission[];

	leaderIdx: number;
	votes: Votes;
	missionResult: Result
	//TODO: maybe have room size class variable

	constructor(key: string, players: string[]) {
		this.key = key;
		this.players = players;
		this.missions = [];
		this.team = [];
		this.leaderIdx = 0; //TODO: randomize this in constructor

		const playerObjects = io.sockets.adapter.rooms[this.key];
		const playerIds = Object.keys(playerObjects.sockets);
		this.sockets = playerIds.map(id => io.sockets.connected[id]);

		//TODO: change these to accommodate room size when done
		this.roles = generateRoles(5);
		MISSION_TEAMS[5].forEach((numPlayers, index) =>
			this.missions[index] = { numPlayers, result: '' }
		);

		this.votes = { approve: 0, reject: 0 };
		this.missionResult = { pass: 0, fail: 0 };
		this.missionIdx = 0;
	}

	//TODO: maybe split this method into several methods, so the nesting isn't so ugly
	//TODO: prevent players from entering room with game started
	start = (): void => {
		io.of('/').in(`${this.key}`).emit('missions', this.missions);
		this.sockets.forEach(socket => {
			socket.on('ready', () => {
				if (this.roles.length) {
					socket.emit('role', this.roles.pop());
					socket.emit('teamCreation');
					socket.emit('teamLeader', this.players[this.leaderIdx]);
				}
			});

			socket.on('teamUpdate', (type, player) => {
				if (type === 'choose') this.team = this.team.concat(player);
				else this.team = this.team.filter(p => p !== player);
				io.of('/').in(`${this.key}`).emit('teamUpdate', this.team);
			});

			socket.on('teamConfirm', () => {
				if (this.team.length === this.missions[this.missionIdx].numPlayers) {
					io.of('/').in(`${this.key}`).emit('teamConfirm', this.team);
				} else {
					socket.emit('invalid', 'Not enough players');
				}
			});

			socket.on('vote', (vote) => {
				vote === 'approve' ? this.votes.approve += 1 : this.votes.reject += 1;
				const roomSize = this.players.length;
				if (this.votes.approve + this.votes.reject === roomSize) {
					this.leaderIdx = (this.leaderIdx + 1) % roomSize;
					this.team = [];
					if (this.votes.approve > this.votes.reject) {
						io.of('/').in(`${this.key}`).emit('teamApproved');
					} else {
						io.of('/').in(`${this.key}`)
							.emit('teamRejected', this.players[this.leaderIdx]);
					}
					this.votes = { approve: 0, reject: 0 };
				}
			});

			socket.on('mission', (result) => {
				result === 'pass'
					? this.missionResult.pass += 1
					: this.missionResult.fail += 1;

				const roomSize = this.players.length;
				if (this.missionResult.pass + this.missionResult.fail === roomSize) {
					const result = this.missionResult.fail === 0 ? 'passed' : 'failed';
					io.of('/').in(`${this.key}`).emit(result);
					this.missionResult = { pass: 0, fail: 0 };
					this.missions[this.missionIdx].result = result;
					this.missionIdx++;

					let resistance = 0;
					let spies = 0;
					this.missions.forEach(
						mission =>
							mission.result === 'passed' ? resistance += 1 : spies += 1
					);

					if (resistance === 3) {
						io.of('/').in(`${this.key}`).emit('gameOver', 'resistance');
						return;
					}

					if (spies === 3) {
						io.of('/').in(`${this.key}`).emit('gameOver', 'spies');
						return;
					}
				}
			});
		});
	}

}

export default Resistance;
