import { io } from '../index';

class Resistance {
	key: string;

	constructor(key: string) {
		this.key = key;
	}

	start = (): void => {
		//TODO: handle 'ready'
		io.on('ready', () => {
			console.log('test');
		});

		const clients = io.sockets.adapter.rooms[this.key];
	}

}

export default Resistance;
