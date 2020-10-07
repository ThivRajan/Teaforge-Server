export enum Games {
	Resistance = 'resistance'
}

export interface Players {
	[id: string]: { name: string, key: string };
}

export interface PlayerCounts {
	[game: string]: { min: number, max: number };
}

type RoomInfo = {
	name: Games;
	reqPlayers: number;
	host: string;
	players: string[];
}

export interface Rooms {
	[key: string]: RoomInfo;
}

