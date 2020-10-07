import express from 'express';
import socket from 'socket.io';

import { Games, Players, PlayerCounts, Rooms } from './types';
import { generateKey } from './utils';

const app = express();
const PORT = 3001;

const server = app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
const io = socket(server);

const players: Players = {};
const rooms: Rooms = {};
const playerCounts: PlayerCounts = {};
playerCounts[Games.Resistance] = { min: 5, max: 10 };

//TODO: deal with type error when client leaves room (prob has to do with socket.onclose)
// i think this error has to do with the server disconnecting & reconnecting
io.on('connection', (socket) => {
	socket.on('create', (name: string, game: Games) => {
		if (!name) {
			socket.emit('invalid', 'Please enter a name');
			return;
		}

		/* Generate unique key */
		let key = generateKey();
		while (io.sockets.adapter.rooms[key]) key = generateKey();

		players[socket.id] = { name: name.trim(), key };
		rooms[key] = {
			name: game,
			reqPlayers: playerCounts[game].min,
			players: [name], host: name
		};

		socket.join(`${key}`);
		socket.emit('valid', key, rooms[key]);
	});

	socket.on('join', (name: string, key: string) => {
		players[socket.id] = { name, key };
		if (!name) {
			socket.emit('invalid', 'Please enter a name');
			return;
		}

		const room = io.sockets.adapter.rooms[key];
		if (!room) {
			socket.emit('invalid', 'Key is invalid');
			return;
		}

		const game: Games = rooms[key].name;
		if (room.length > playerCounts[game].max) {
			socket.emit('invalid', 'Room is full, please join another room');
			return;
		}

		const playerNames = rooms[key].players;
		name = name.trim();
		if (!playerNames.find(n => n.toLowerCase() === name.toLowerCase())) {
			rooms[key].players = [...playerNames, name];
			socket.emit('valid', rooms[key]);
			socket.join(`${key}`);
			io.of('/').in(`${key}`).emit('update', rooms[key]);
		} else {
			socket.emit('invalid', 'Name is already taken');
		}
	});

	socket.on('start', () => {
		const key = players[socket.id].key;
		const roomSize = rooms[key].players.length;
		const game = rooms[key].name;

		if (roomSize >= playerCounts[game].min) io.of('/').in(`${key}`).emit('start');
		else socket.emit('invalid', 'Not enough players');
	});

	//TODO: delete room if 0 players left in room
	//TODO: remove player or delete room on disconnect if host 
	socket.on('disconnect', () => {
		const key = players[socket.id].key;
		rooms[key].players = rooms[key]
			.players
			.filter(p => p !== players[socket.id].name);
		delete players[socket.id];

		io.of('/').in(`${key}`).emit('update', rooms[key]);
	});
});



