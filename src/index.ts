/* eslint-disable indent */
import express from 'express';
import socket from 'socket.io';

import { Game, Players, PlayerCounts, Rooms } from './types';
import { generateKey } from './utils';

import Resistance from './games/resistance';

const app = express();
const PORT = 3001;

const server = app.listen(process.env.PORT || PORT, () => {
	console.log(`Listening on port ${PORT}`);
});

app.get('/', (_req, res) => res.send('Server running'));

export const io = socket(server);

export const INVALID_ACTION = 'invalid';
const VALID_ACTION = 'valid';

export const players: Players = {};

export const rooms: Rooms = {};
const playerCounts: PlayerCounts = {};
//TODO-DONE: change min to 5
//TODO-DONE: README.md
//TODO: voting and mission results not adding up, fix it
//TODO: check that events are really getting removed
// (use logs)
playerCounts[Game.Resistance] = { min: 2, max: 10 };

io.on('connection', (socket) => {
	socket.on('create', (name: string, game: Game) => {
		if (!name) {
			socket.emit(INVALID_ACTION, 'Please enter a name');
			return;
		}

		/* Generate unique key */
		let key = generateKey();
		while (io.sockets.adapter.rooms[key]) key = generateKey();

		name = name.trim();
		players[socket.id] = { name, key };
		rooms[key] = {
			name: game,
			reqPlayers: playerCounts[game].min,
			players: [name],
			host: name,
			gameStarted: false
		};

		socket.join(`${key}`);
		socket.emit(VALID_ACTION, name, key, rooms[key]);
	});

	socket.on('join', (name: string, key: string) => {
		if (!name) {
			socket.emit(INVALID_ACTION, 'Please enter a name');
			return;
		}

		const room = io.sockets.adapter.rooms[key];
		if (!room) {
			socket.emit(INVALID_ACTION, 'Key is invalid');
			return;
		}

		if (rooms[key].gameStarted) {
			socket.emit(
				INVALID_ACTION,
				'Game already started, please join another room '
			);
			return;
		}

		const game: Game = rooms[key].name;
		if (room.length > playerCounts[game].max) {
			socket.emit(INVALID_ACTION, 'Room is full, please join another room');
			return;
		}

		players[socket.id] = { name, key };
		const playerNames = rooms[key].players;
		name = name.trim();
		if (!playerNames.find(n => n.toLowerCase() === name.toLowerCase())) {
			rooms[key].players = [...playerNames, name];
			socket.emit(VALID_ACTION, name, key, rooms[key]);
			socket.join(`${key}`);
			io.of('/').in(`${key}`).emit('update', rooms[key]);
		} else {
			socket.emit(INVALID_ACTION, 'Name is already taken');
		}
	});

	socket.on('start', () => {
		const key = players[socket.id].key;
		const roomSize = rooms[key].players.length;
		const game = rooms[key].name;

		if (roomSize >= playerCounts[game].min) {
			io.of('/').in(`${key}`).emit('start');
			rooms[key].gameStarted = true;
			startGame(game, key, rooms[key].players);
		} else {
			socket.emit(INVALID_ACTION, 'Not enough players');
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

		if (!io.sockets.adapter.rooms[key]) {
			delete rooms[key];
		} else {
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
			throw new Error('Invalid game');
	}

	game.start();
};
