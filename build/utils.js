"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateKey = void 0;
const alphabet = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];
exports.generateKey = () => {
    return 'xxxx'.replace(/x/g, () => {
        const randIdx = Math.floor(Math.random() * alphabet.length);
        return alphabet[randIdx];
    });
};
