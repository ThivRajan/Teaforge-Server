import express from 'express';
import socket from 'socket.io';

import { Games } from './types';
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

interface Players {
	[key: string]: { name: string, key: string };
}
const players: Players = {};

//TODO: delete room if 0 players left in room
//TODO: remove player or delete room on disconnect if host  
//TODO: make max capacity for room

//TODO: Error handling
//TODO: check if name is unique in room (part of error handling)
io.of(`/${Games.Resistance}`).on('connection', (socket) => {
	socket.on('create', (name: string) => {
		const key = generateKey();
		if (io.nsps[`/${Games.Resistance}`].adapter.rooms[key]) {
			console.log('ERROR');
			// TODO: throw error or something
		}
		players[socket.id] = { name, key };
		socket.join(`${key}`);
		socket.emit('roomKey', key);
	});

	socket.on('join', (name: string, key: string) => {
		players[socket.id] = { name, key };
		if (io.nsps[`/${Games.Resistance}`].adapter.rooms[key]) {
			socket.emit('validKey');
			socket.join(`${key}`, () => {
				const roomSockets = io.nsps[`/${Games.Resistance}`].adapter.rooms[key].sockets;
				const playerIds = Object.keys(roomSockets);
				const playerNames = playerIds.map((id): string => players[id].name);

				io.of(`/${Games.Resistance}`).in(`${key}`).emit('players', playerNames);
			});
		} else {
			socket.emit('invalidKey');
		}
	});

	socket.on('getPlayers', (key: string) => {
		const roomSockets = io.nsps[`/${Games.Resistance}`].adapter.rooms[key].sockets;
		const playerIds = Object.keys(roomSockets);
		const playerNames = playerIds.map((id): string => players[id].name);

		socket.emit('players', playerNames);
	});

	socket.on('disconnect', () => {
		console.log('disconnect');
		const key = players[socket.id].key;
		delete players[socket.id];

		const roomSockets = io.nsps[`/${Games.Resistance}`].adapter.rooms[key].sockets;
		const playerIds = Object.keys(roomSockets);
		const playerNames = playerIds.map((id): string => players[id].name);

		io.of(`/${Games.Resistance}`).in(`${key}`).emit('players', playerNames);
	});
});

