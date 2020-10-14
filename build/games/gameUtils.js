"use strict";
/* eslint-disable indent */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRoles = exports.MISSION_TEAMS = void 0;
// export const MISSION_TEAMS = {
// 	5: [2, 3, 2, 3, 3],
// 	6: [2, 3, 4, 3, 4],
// 	7: [2, 3, 3, 4, 4],
// 	8: [3, 4, 4, 5, 5],
// 	9: [3, 4, 4, 5, 5],
// 	10: [3, 4, 4, 5, 5]
// };
//TODO-DONE: remove
exports.MISSION_TEAMS = {
    5: [2, 2, 2, 2, 2],
    6: [2, 3, 4, 3, 4],
    7: [2, 3, 3, 4, 4],
    8: [3, 4, 4, 5, 5],
    9: [3, 4, 4, 5, 5],
    10: [3, 4, 4, 5, 5]
};
exports.generateRoles = (roomSize) => {
    const resistance = [...Array(roomSize).keys()];
    const spies = [];
    const roles = [];
    let numSpies;
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
    spies.forEach(idx => roles[idx] = 'spy');
    resistance.forEach(idx => roles[idx] = 'resistance');
    return roles;
};
