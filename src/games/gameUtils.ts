/* eslint-disable indent */

//TODO: tsconfig issue
// const resistanceRoles = ['Resistance', 'Spy'];
export const generateRoles = (roomSize: number): void => {
	const resistance = [...Array(roomSize).keys()];
	const spies: number[] = [];

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

	console.log('spies', spies);
	console.log('resistance', resistance);
};