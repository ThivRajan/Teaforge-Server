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

		this.roles = generateRoles(this.players.length);
		MISSION_TEAMS[this.players.length].forEach((numPlayers: number, index: number) =>
			this.missions[index] = { numPlayers, result: '' }
		);

		this.votes = { approve: [], reject: [] };
		this.missionResult = { pass: 0, fail: 0 };
		this.missionIdx = 0;
	}

	disconnect = (): void => {
		io.of('/').in(`${this.key}`).emit('playerDisconnected');
		this.sockets.forEach(s => {
			this.events.forEach(event => {
				if (event === 'disconnect') s.removeListener(event, this.disconnect);
				else s.removeAllListeners(event);
			});

		});
		if (rooms[this.key]) rooms[this.key].gameStarted = false;
	}

	start = (): void => {
		this.sockets.forEach(socket => {
			socket.on('disconnect', this.disconnect);

			socket.on('ready', (): void => {
				if (this.roles.length) {
					const role = this.roles.pop();
					if (!role) throw new Error('Missing role');

					socket.emit('role', role);
					socket.emit('transition', `Your are a ${role} member`);
					socket.emit('missions', this.missions)
					socket.emit('teamCreation');
					socket.emit('teamLeader', this.players[this.leaderIdx]);
				}
			});

			socket.on('teamUpdate', (type: string, player: string): void => {
				if (type === 'choose') this.team = this.team.concat(player);
				else this.team = this.team.filter(p => p !== player);
				io.of('/').in(`${this.key}`).emit('teamUpdate', this.team);
			});

			socket.on('teamConfirm', (): void => {
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

			socket.on('vote', (vote: string, name: string): void => {
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

			socket.on('mission', (result: string): void => {
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

					let winner;
					if (resistance === 3) winner = 'resistance';
					if (spies === 3) winner = 'spies';
					if (winner) {
						io.of('/').in(`${this.key}`).emit('gameOver', winner);
						this.sockets.forEach(s => {
							this.events.forEach(event => {
								if (event === 'disconnect') s.removeListener(event, this.disconnect);
								else s.removeAllListeners(event);
							});

						});

						if (rooms[this.key]) rooms[this.key].gameStarted = false;
						else throw new Error('Room does not exist');

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
					io.of('/').in(`${this.key}`)
						.emit('teamLeader', this.players[this.leaderIdx]);
					io.of('/').in(`${this.key}`)
						.emit('teamLeader', this.players[this.leaderIdx]);
					io.of('/').in(`${this.key}`).emit('missions', this.missions);
				}
			});
		});
	}
}

export default Resistance;
