import { io, rooms, INVALID_ACTION } from '../index';
import { Mission, Votes, Result } from '../types/resistance';
import { generateRoles, MISSION_TEAMS } from './gameUtils';

class Resistance {
	key: string;
	roles: string[];
	sockets: SocketIO.Socket[];
	players: string[];

	team: string[];
	leaderIdx: number;
	votes: Votes;

	missionIdx: number;
	missions: Mission[];
	missionResult: Result;

	events: string[];

	constructor(key: string, players: string[]) {
		this.events = ['ready', 'teamUpdate', 'teamConfirm',
			'vote', 'mission', 'disconnect'];
		this.key = key;
		this.players = players;
		this.missions = [];
		this.team = [];
		this.leaderIdx = Math.floor(Math.random() * this.players.length);

		const playerObjects = io.sockets.adapter.rooms[this.key];
		const playerIds = Object.keys(playerObjects.sockets);
		this.sockets = playerIds.map(id => io.sockets.connected[id]);

		//TODO-DONE: change these to accommodate room size
		this.roles = generateRoles(5);
		MISSION_TEAMS[5].forEach((numPlayers, index) =>
			this.missions[index] = { numPlayers, result: '' }
		);

		this.votes = { approve: [], reject: [] };
		this.missionResult = { pass: 0, fail: 0 };
		this.missionIdx = 0;
	}

	start = (): void => {
		io.of('/').in(`${this.key}`).emit('missions', this.missions);
		this.sockets.forEach(socket => {

			socket.on('disconnect', () => {
				io.of('/').in(`${this.key}`).emit('playerDisconnected');
				this.sockets.forEach(s => {
					this.events.forEach(event => s.removeAllListeners(event));
				});
				if (rooms[this.key]) rooms[this.key].gameStarted = false;
				else throw new Error('Room does not exist');
			});

			socket.on('ready', () => {
				/* Ensures number of players <= number of roles generated */
				if (this.roles.length) {
					const role = this.roles.pop();
					if (!role) throw new Error('Missing role');

					socket.emit('role', role);
					socket.emit('transition', `Your are a ${role} member`);
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
				const reqTeamSize = this.missions[this.missionIdx].numPlayers;
				if (this.team.length === reqTeamSize) {
					io.of('/').in(`${this.key}`).emit('teamConfirm', this.team);
				} else if (this.team.length > reqTeamSize) {
					socket.emit(
						INVALID_ACTION,
						`Too many players: mission needs ${reqTeamSize} players`
					);
				} else {
					socket.emit(
						INVALID_ACTION,
						`Not enough players: mission needs ${reqTeamSize} players`
					);
				}
			});

			socket.on('vote', (vote, name) => {
				if (vote === 'approve') this.votes.approve.push(name);
				else this.votes.reject.push(name);

				const roomSize = this.players.length;
				if (this.votes.approve.length + this.votes.reject.length === roomSize) {
					this.leaderIdx = (this.leaderIdx + 1) % roomSize;
					this.team = [];
					if (this.votes.approve.length > this.votes.reject.length) {
						io.of('/').in(`${this.key}`).emit('teamApproved');
						io.of('/').in(`${this.key}`)
							.emit(
								'transition',
								'Team has been approved, mission will begin shortly.'
							);
					} else {
						io.of('/').in(`${this.key}`)
							.emit(
								'transition',
								'Team has been rejected, new leader will selected.'
							);
						io.of('/').in(`${this.key}`)
							.emit('teamRejected', this.players[this.leaderIdx], this.votes);
					}
					this.votes = { approve: [], reject: [] };
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
						if (!mission.result) return;
						mission.result === 'passed' ? resistance += 1 : spies += 1;
					});

					if (resistance === 3) {
						io.of('/').in(`${this.key}`).emit('gameOver', 'resistance');
						return;
					}

					if (spies === 3) {
						io.of('/').in(`${this.key}`).emit('gameOver', 'spies');
						return;
					}

					io.of('/').in(`${this.key}`)
						.emit(
							'transition',
							`The mission has ${result}. New team leader will
							be chosen for the next mission. `
						);

					io.of('/').in(`${this.key}`).emit('teamCreation');
					io.of('/').in(`${this.key}`).emit('teamUpdate', this.team);
					io.of('/').in(`${this.key}`).emit(
						'teamLeader',
						this.players[this.leaderIdx]
					);
					io.of('/').in(`${this.key}`).emit(
						'teamLeader',
						this.players[this.leaderIdx]
					);
					io.of('/').in(`${this.key}`).emit('missions', this.missions);
				}
			});
		});
	}

}

export default Resistance;
