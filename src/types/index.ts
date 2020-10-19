export enum Game {
	Resistance = 'resistance'
}

export interface Players {
	[id: string]: { name: string, key: string };
}

export interface PlayerCounts {
	[game: string]: { min: number, max: number };
}

type RoomInfo = {
	name: Game;
	reqPlayers: number;
	host: string;
	players: string[];
	gameStarted: boolean;
}

export interface Rooms {
	[key: string]: RoomInfo;
}