/* eslint-disable indent */
import express from 'express';
import socket from 'socket.io';

import { Game, Players, PlayerCounts, Rooms } from './types';
import { generateKey } from './utils';

import Resistance from './games/resistance';

const app = express();
const PORT = 3001;

const server = app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
export const io = socket(server);

export const players: Players = {};

const rooms: Rooms = {};
const playerCounts: PlayerCounts = {};
//TODO: change min to 5 when finished
playerCounts[Game.Resistance] = { min: 2, max: 10 };

//TODO: throw more errors on invalid cases
io.on('connection', (socket) => {
	socket.on('create', (name: string, game: Game) => {
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
		if (!name) {
			socket.emit('invalid', 'Please enter a name');
			return;
		}

		key = key.toUpperCase();
		const room = io.sockets.adapter.rooms[key];
		if (!room) {
			socket.emit('invalid', 'Key is invalid');
			return;
		}

		const game: Game = rooms[key].name;
		if (room.length > playerCounts[game].max) {
			socket.emit('invalid', 'Room is full, please join another room');
			return;
		}

		players[socket.id] = { name, key };
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

	//TODO: min player count check not working
	socket.on('start', () => {
		const key = players[socket.id].key;
		const roomSize = rooms[key].players.length;
		const game = rooms[key].name;

		if (roomSize >= playerCounts[game].min) {
			io.of('/').in(`${key}`).emit('start');
			startGame(game, key, rooms[key].players);
		} else {
			socket.emit('invalid', 'Not enough players');
		}
	});

	socket.on('disconnect', () => {
		if (!players[socket.id]) return;

		const key = players[socket.id].key;
		const name = players[socket.id].name;
		rooms[key].players = rooms[key]
			.players
			.filter(p => p !== name);
		delete players[socket.id];

		if (!io.sockets.adapter.rooms[key]) delete rooms[key];
		else {
			if (rooms[key].host === name) rooms[key].host = rooms[key].players[0];
			io.of('/').in(`${key}`).emit('update', rooms[key]);
		}
	});
});

const startGame = (name: Game, key: string, players: string[]) => {
	let game;
	switch (name) {
		case Game.Resistance:
			game = new Resistance(key, players);
			break;
		default:
			return;
	}

	game.start();
};
