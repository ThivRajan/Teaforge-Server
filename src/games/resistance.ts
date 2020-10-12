import { io, players } from '../index';
import { Mission } from '../types';
import { generateRoles, MISSION_TEAMS } from './gameUtils';

//TODO: make constants for players per mission based on room size
class Resistance {
	key: string;
	playerNames: string[]; //not sure if needed?
	roles: string[];
	missions: Mission[] = [];

	constructor(key: string) {
		this.key = key;
		const roomPlayers = io.sockets.adapter.rooms[this.key];
		const playerIds = Object.keys(roomPlayers.sockets);
		this.playerNames = playerIds.map(id => players[id].name);

		//TODO: change these to accommodate room size
		this.roles = generateRoles(5);
		MISSION_TEAMS[5].forEach((players, index) =>
			this.missions[index] = { players, result: '' }
		);
	}

	//TODO: add key checks but for now don't bother
	//TODO: figure out issue on the first connection
	start = (): void => {
		io.on('connection', (socket) => {
			socket.on('ready', () => {
				if (this.roles.length) {
					socket.emit('role', this.roles.pop());
					socket.emit('missions', this.missions);
					socket.emit('teamCreation');
					socket.emit('teamLeader', 'thiv');
				}
			});
		});
	}

}

export default Resistance;
