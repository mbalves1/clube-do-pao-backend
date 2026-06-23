import { Router } from 'express';
import { randomUUID } from 'crypto';
import { sseService } from '../../sse/sse-service';
import { authMiddleware } from '../../../middlewares/auth';

/**
 * @swagger
 * /events:
 *   get:
 *     tags:
 *       - SSE
 *     summary: Conectar ao stream de eventos
 *     description: >
 *       Abre uma conexão Server-Sent Events (SSE). Mantenha a conexão aberta para
 *       receber notificações em tempo real. O evento `order-status-updated` é emitido
 *       sempre que o status de um pedido é atualizado.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stream SSE aberto com sucesso
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *             example: |
 *               event: order-status-updated
 *               data: {"orderId":"123","deliveryId":"delivery_456","status":"PICKED_UP"}
 *       401:
 *         description: Não autorizado
 */
export function makeSSERoutes() {
	const router = Router();

	router.get('/events', authMiddleware, (req, res) => {
		const clientId = randomUUID();
		sseService.addClient(clientId, res);
	});

	return router;
}
