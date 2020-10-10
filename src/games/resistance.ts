import { io, players } from '../index';
import { generateRoles } from './gameUtils';

class Resistance {
	key: string;
	playerNames: string[];

	//TODO: maybe change playerNames to players (which is now a dictionary)
	// keyed by socket ids, or maybe it's not needed, not sure
	constructor(key: string) {
		this.key = key;

		const roomPlayers = io.sockets.adapter.rooms[this.key];
		const playerIds = Object.keys(roomPlayers.sockets);
		this.playerNames = playerIds.map(id => players[id].name);
		generateRoles(5);
	}

	start = (): void => {
		io.on('ready', () => {
			console.log('generating roles');
		});
	}

}

export default Resistance;
