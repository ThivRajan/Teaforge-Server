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
}

export interface Rooms {
	[key: string]: RoomInfo;
}

/* Resistance Types */
export interface Mission {
	numPlayers: number,
	result: 'passed' | 'failed' | ''
}

export interface Votes {
	approve: number,
	reject: number
}

export interface Result {
	pass: number,
	fail: number
}

