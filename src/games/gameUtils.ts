/* eslint-disable indent */

//TODO: tsconfig issue
export const generateRoles = (roomSize: number): string[] => {
	const resistance = [...Array(roomSize).keys()];
	const spies: number[] = [];
	const roles: string[] = [];

	let numSpies: number;
	switch (roomSize) {
		case 5:
		case 6:
			numSpies = 2;
			break;
		case 7:
		case 8:
		case 9:
			numSpies = 3;
			break;
		case 10:
			numSpies = 4;
			break;
		default:
			throw Error('Invalid room size');
	}

	let maxNumbers = roomSize;
	let randIdx;
	for (let i = 0; i < numSpies; i++) {
		randIdx = Math.floor(Math.random() * maxNumbers);
		spies.push(...resistance.splice(randIdx, 1));
		maxNumbers--;
	}

	//TODO: consider making these roles into constants
	spies.forEach(idx => roles[idx] = 'spy');
	resistance.forEach(idx => roles[idx] = 'resistance');

	return roles;
};