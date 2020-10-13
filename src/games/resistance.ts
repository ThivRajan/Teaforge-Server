import { io } from '../index';
import { Mission, Votes, Result } from '../types';
import { generateRoles, MISSION_TEAMS } from './gameUtils';

//TODO: make constants for players per mission based on room size
class Resistance {
	key: string;
	roles: string[];
	missionIdx: number;
	missions: Mission[] = [];
	sockets: SocketIO.Socket[];
	leaderIndex = 0; //TODO: randomize this in constructor
	votes: Votes;
	missionResult: Result
	//TODO: maybe have room size class variable

	constructor(key: string) {
		this.key = key;
		const roomPlayers = io.sockets.adapter.rooms[this.key];
		const playerIds = Object.keys(roomPlayers.sockets);
		this.sockets = playerIds.map(id => io.sockets.connected[id]);

		//TODO: change these to accommodate room size
		this.roles = generateRoles(5);
		MISSION_TEAMS[5].forEach((numPlayers, index) =>
			this.missions[index] = { numPlayers, result: '' }
		);

		this.votes = { approve: 0, reject: 0 };
		this.missionResult = { pass: 0, fail: 0 };
		this.missionIdx = 0;

		this.start();
	}

	//TODO: maybe split this method into several methods, so the nesting isn't so ugly
	start = (): void => {
		this.sockets.forEach(socket => {
			socket.on('ready', () => {
				if (this.roles.length) {
					socket.emit('role', this.roles.pop());
					socket.emit('missions', this.missions);
					socket.emit('teamCreation');
					socket.emit('teamLeader', 'thiv'); //TODO: get leader from players
				}
			});

			socket.on('vote', (vote) => {
				vote === 'approve' ? this.votes.approve += 1 : this.votes.reject += 1;

				const roomSize = io.sockets.adapter.rooms[this.key].length;
				if (this.votes.approve + this.votes.reject === roomSize) {
					if (this.votes.approve > this.votes.reject) {
						this.leaderIndex = (this.leaderIndex + 1) % roomSize;
						io.of('/').in(`${this.key}`).emit('approved');
					} else {
						io.of('/').in(`${this.key}`).emit('rejected');
					}
					this.votes = { approve: 0, reject: 0 };
				}
			});

			socket.on('mission', (result) => {
				result === 'pass'
					? this.missionResult.pass += 1
					: this.missionResult.fail += 1;

				const roomSize = io.sockets.adapter.rooms[this.key].length;
				if (this.missionResult.pass + this.missionResult.fail === roomSize) {
					const result = this.missionResult.fail === 0 ? 'passed' : 'failed';
					io.of('/').in(`${this.key}`).emit(result);
					this.missionResult = { pass: 0, fail: 0 };
					this.missions[this.missionIdx].result = result;
					this.missionIdx += 1;

					let resistance = 0;
					let spies = 0;
					this.missions.forEach(
						mission =>
							mission.result === 'passed' ? resistance += 1 : spies += 1
					);

					if (resistance > spies)
						io.of('/').in(`${this.key}`).emit('gameOver', 'spies');
					if (spies > resistance)
						io.of('/').in(`${this.key}`).emit('gameOver', 'resistance');
				}
			});
		});
	}

}

export default Resistance;
