import express from 'express';
import socket from 'socket.io';

// import { Games } from './types';
import { generateKey } from './utils';

const app = express();

const PORT = 3001;
const server = app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

app.get('/', (_req, res) => {
	res.send('server is running');
});

interface Players {
	[id: string]: { name: string, key: string };
}
const players: Players = {};

interface Rooms {
	[key: string]: string;
}
const rooms: Rooms = {};

const io = socket(server);
//TODO: deal with type error when client leaves room (prob has to do with socket.onclose)
// i think this error has to do with the server disconnecting & reconnecting

//TODO: delete room if 0 players left in room
//TODO: remove player or delete room on disconnect if host  
//TODO: make max capacity for room
io.on('connection', (socket) => {
	//TODO: check the game and names are valid
	socket.on('create', (name: string, game: string) => {
		let key = generateKey();
		/* Generate unique key */
		while (io.sockets.adapter.rooms[key]) {
			key = generateKey();
		}

		players[socket.id] = { name: name.trim(), key };
		rooms[key] = game;

		socket.join(`${key}`);
		socket.emit('roomKey', key);
		socket.emit('players', [name]);
	});

	//TODO: check the name is non-empty
	socket.on('join', (name: string, key: string) => {
		players[socket.id] = { name, key };
		if (io.sockets.adapter.rooms[key]) {
			const roomSockets = io.sockets.adapter.rooms[key].sockets;
			const playerIds = Object.keys(roomSockets);
			const playerNames = playerIds.map((id): string => players[id].name);

			name = name.trim();
			if (!playerNames.find(n => n.toLowerCase() === name.toLowerCase())) {
				socket.emit('valid', rooms[key]);
				socket.join(`${key}`);
				playerNames.push(name);
				io.of('/').in(`${key}`).emit('players', playerNames);
			} else {
				socket.emit('invalid', 'Name is already taken');
			}
		} else {
			socket.emit('invalid', 'Key is invalid');
		}
	});

	socket.on('getPlayers', (key: string) => {
		const roomSockets = io.sockets.adapter.rooms[key].sockets;
		const playerIds = Object.keys(roomSockets);
		const playerNames = playerIds.map((id): string => players[id].name);

		socket.emit('players', playerNames);
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



