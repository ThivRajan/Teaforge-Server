import express from 'express';
import socket from 'socket.io';

import { Games, Player } from './types';

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

io.of(`/${Games.Resistance}`).on('connection', (socket) => {
	socket.on('create', (name: string) => {
		players = players.concat({ id: socket.id, name });
		socket.emit('roomKey', 'key'); //generate unique key 
	});

	socket.on('getPlayers', () => {
		const playerNames = players.map(p => p.name);
		socket.emit('players', playerNames);
	});

	socket.on('join', (key: string) => {
		players = players.concat({ id: socket.id, name });
		socket.join(`${key}`, () => {
			const playerNames = players.map(p => p.name);
			io.of(`/${Games.Resistance}`).in(`${key}`).emit('players', playerNames);
		});
	});
});

