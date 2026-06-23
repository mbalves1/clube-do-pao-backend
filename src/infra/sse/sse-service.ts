import { Response } from 'express';

type SSEClient = {
	id: string;
	res: Response;
};

class SSEService {
	private clients: SSEClient[] = [];

	addClient(id: string, res: Response) {
		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Connection', 'keep-alive');
		res.flushHeaders();

		this.clients.push({ id, res });

		res.on('close', () => {
			this.removeClient(id);
		});
	}

	removeClient(id: string) {
		this.clients = this.clients.filter((client) => client.id !== id);
	}

	emit(event: string, data: unknown) {
		const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
		this.clients.forEach((client) => client.res.write(payload));
	}
}

export const sseService = new SSEService();
