import { io } from '../index';
import { Mission } from '../types';
import { generateRoles, MISSION_TEAMS } from './gameUtils';

//TODO: make constants for players per mission based on room size
class Resistance {
	key: string;
	roles: string[];
	missions: Mission[] = [];
	sockets: SocketIO.Socket[];

	leaderIndex = 0;

	constructor(key: string) {
		this.key = key;
		const roomPlayers = io.sockets.adapter.rooms[this.key];
		const playerIds = Object.keys(roomPlayers.sockets);
		this.sockets = playerIds.map(id => io.sockets.connected[id]);

		//TODO: change these to accommodate room size
		this.roles = generateRoles(5);
		MISSION_TEAMS[5].forEach((players, index) =>
			this.missions[index] = { players, result: '' }
		);

		this.start();
	}

	start = (): void => {
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
	}

}

export default Resistance;
