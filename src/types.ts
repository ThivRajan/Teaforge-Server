export enum Games {
	Resistance = 'resistance'
}

export interface PlayerCounts {
	[game: string]: { min: number, max: number };
}

export interface Players {
	[id: string]: { name: string, key: string };
}

export interface RoomGames {
	[key: string]: Games;
}