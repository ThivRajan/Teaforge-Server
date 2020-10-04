const alphabet = [
	'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
	'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

export const generateKey = (): string => {
	return 'xxxx'.replace(/x/g, () => {
		const randIdx = Math.floor(Math.random() * alphabet.length);
		return alphabet[randIdx];
	});
};