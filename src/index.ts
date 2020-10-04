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
	[key: string]: string;
}
const players: Players = {};

//TODO: remove room on disconnect if host or just remove player from room
//TODO: Error handling
//TODO: check if name is unique in room
io.of(`/${Games.Resistance}`).on('connection', (socket) => {
	socket.on('create', (name: string) => {
		players[socket.id] = name;
		const key = generateKey();
		if (io.nsps[`/${Games.Resistance}`].adapter.rooms[key]) {
			console.log('ERROR');
			// TODO: throw error or something
		}

		socket.join(`${key}`);
		socket.emit('roomKey', key);
	});

	socket.on('join', (name: string, key: string) => {
		// players = players.concat({ id: socket.id, name });
		players[socket.id] = name;

		socket.join(`${key}`, () => {
			const roomSockets = io.nsps[`/${Games.Resistance}`].adapter.rooms[key].sockets;
			const playerIds = Object.keys(roomSockets);
			const playerNames = playerIds.map((id): string => players[id]);

			io.of(`/${Games.Resistance}`).in(`${key}`).emit('players', playerNames);
		});
	});

	socket.on('getPlayers', (key: string) => {
		const roomSockets = io.nsps[`/${Games.Resistance}`].adapter.rooms[key].sockets;
		const playerIds = Object.keys(roomSockets);
		const playerNames = playerIds.map((id): string => players[id]);

		socket.emit('players', playerNames);
	});
});

