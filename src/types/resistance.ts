export interface Mission {
	numPlayers: number,
	result: 'passed' | 'failed' | ''
}

export interface Votes {
	approve: string[],
	reject: string[]
}

export interface Result {
	pass: number,
	fail: number
}
