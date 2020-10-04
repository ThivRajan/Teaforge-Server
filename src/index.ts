import express from 'express';
import socket from 'socket.io';

import { Games, Player } from './types';
import { generateKey } from './utils';

const app = express();

const PORT = 3001;
const server = app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

app.get('/', (_req, res) => {
	res.send('server is running');
});

const io = socket(server);
let players: Array<Player> = [];

//TODO: remove room on disconnect
//TODO: Error handling
//TODO: check if name is unique in room
io.of(`/${Games.Resistance}`).on('connection', (socket) => {
	socket.on('create', (name: string) => {
		players = players.concat({ id: socket.id, name });
		//TODO: check key is unique
		const key = generateKey();
		if (io.nsps[`/${Games.Resistance}`].adapter.rooms[key]) {
			console.log('ERROR');
		}
		socket.emit('roomKey', key);
	});

	socket.on('join', (name: string, key: string) => {
		players = players.concat({ id: socket.id, name });
		socket.join(`${key}`, () => {
			const playerNames = players.map(p => p.name);
			io.of(`/${Games.Resistance}`).in(`${key}`).emit('players', playerNames);
		});
	});

	//TODO: return players by key instead of all players
	socket.on('getPlayers', () => {
		const playerNames = players.map(p => p.name);
		socket.emit('players', playerNames);
	});
});

