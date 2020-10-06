import express from 'express';
import socket from 'socket.io';

import { Games, Players, PlayerCounts, RoomGames } from './types';
import { generateKey } from './utils';

const app = express();
const PORT = 3001;

const server = app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
const io = socket(server);

const players: Players = {};
const roomGames: RoomGames = {};
const playerCounts: PlayerCounts = {};
playerCounts[Games.Resistance] = { min: 5, max: 10 };

//TODO: deal with type error when client leaves room (prob has to do with socket.onclose)
// i think this error has to do with the server disconnecting & reconnecting

//TODO: delete room if 0 players left in room
//TODO: remove player or delete room on disconnect if host 
io.on('connection', (socket) => {
	socket.on('create', (name: string, game: Games) => {
		if (!name) {
			socket.emit('invalid', 'Please enter a name');
			return;
		}

		let key = generateKey();
		/* Generate unique key */
		while (io.sockets.adapter.rooms[key]) {
			key = generateKey();
		}

		players[socket.id] = { name: name.trim(), key };
		roomGames[key] = game;

		socket.join(`${key}`);
		socket.emit('roomKey', key);
		socket.emit('players', [name]);
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

		const game: Games = roomGames[key];
		if (room.length > playerCounts[game].max) {
			socket.emit('invalid', 'Room is full, please join another room');
			return;
		}

		const roomSockets = room.sockets;
		const playerIds = Object.keys(roomSockets);
		const playerNames = playerIds.map((id): string => players[id].name);

		name = name.trim();
		if (!playerNames.find(n => n.toLowerCase() === name.toLowerCase())) {
			socket.emit('valid', roomGames[key]);
			socket.join(`${key}`);
			playerNames.push(name);
			io.of('/').in(`${key}`).emit('players', playerNames);
		} else {
			socket.emit('invalid', 'Name is already taken');
		}
	});

	socket.on('getPlayers', (key: string) => {
		const roomSockets = io.sockets.adapter.rooms[key].sockets;
		const playerIds = Object.keys(roomSockets);
		const playerNames = playerIds.map((id): string => players[id].name);

		socket.emit('players', playerNames);
	});

	socket.on('start', () => {
		const key = players[socket.id].key;
		const roomSize = io.sockets.adapter.rooms[key].length;
		const game = roomGames[key];

		if (roomSize >= playerCounts[game].min) io.of('/').in(`${key}`).emit('start');
		else socket.emit('invalid', 'Not enough players');
	});

	socket.on('disconnect', () => {
		const key = players[socket.id].key;
		delete players[socket.id];

		const roomSockets = io.sockets.adapter.rooms[key].sockets;
		const playerIds = Object.keys(roomSockets);
		const playerNames = playerIds.map((id): string => players[id].name);

		io.of('/').in(`${key}`).emit('players', playerNames);
	});
});



