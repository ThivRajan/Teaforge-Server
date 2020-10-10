import { io, players } from '../index';
import { generateRoles } from './gameUtils';

//TODO: make constants for players per mission based on room size
class Resistance {
	key: string;
	playerNames: string[];
	roles: string[];

	constructor(key: string) {
		this.key = key;
		const roomPlayers = io.sockets.adapter.rooms[this.key];
		const playerIds = Object.keys(roomPlayers.sockets);
		this.playerNames = playerIds.map(id => players[id].name);
		this.roles = generateRoles(5); //TODO: change this to accommodate player size
	}

	//TODO: add key checks but for now don't bother
	//TODO: figure out issue on the first connection
	start = (): void => {
		io.on('connection', (socket) => {
			socket.on('ready', () => {
				if (this.roles.length) socket.emit('role', this.roles.pop());
			});
		});
	}

}

export default Resistance;
