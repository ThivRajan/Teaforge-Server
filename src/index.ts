import express from 'express';
import socket from 'socket.io';

const app = express();

const PORT = 3001;
const server = app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

const io = socket(server);
io.on('connection', () => {
	console.log('connection made');
});

app.get('/', (_req, res) => {
	res.send('server is running');
});