import { Router } from 'express';
import { OrdersController } from '../../controllers/orders-controller';
import { validateSchema } from '../../../middlewares/validate-schema';
import { updateOrderSchema } from '../validators/order-validator';
import { authMiddleware } from '../../../middlewares/auth';

export function makeOrdersRoutes(ordersController: OrdersController) {
	const router = Router();

	/**
	 * @swagger
	 * /orders:
	 *   get:
	 *     tags:
	 *       - Orders
	 *     summary: Listar pedidos
	 *     description: Retorna a lista de pedidos cadastrados.
	 *     responses:
	 *       200:
	 *         description: Lista de pedidos retornada com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: array
	 *               items:
	 *                 type: object
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router
		.route('/orders')
		.get(authMiddleware, (req, res) => ordersController.list(req, res));

	/**
	 * @swagger
	 * /orders/available:
	 *   get:
	 *     tags:
	 *       - Orders
	 *     summary: Listar pedidos disponíveis
	 *     description: Retorna os pedidos ainda não reivindicados com data de atendimento entre hoje e os próximos 2 dias.
	 *     responses:
	 *       200:
	 *         description: Lista de pedidos disponíveis retornada com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: array
	 *               items:
	 *                 type: object
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.get('/orders/available', authMiddleware, (req, res) =>
		ordersController.listAvailable(req, res),
	);

	/**
	 * @swagger
	 * /orders/{id}/accept:
	 *   post:
	 *     tags:
	 *       - Orders
	 *     summary: Aceitar um pedido disponível
	 *     description: Reivindica um pedido ainda não atribuído para o entregador autenticado.
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         example: "1"
	 *     responses:
	 *       200:
	 *         description: Pedido aceito com sucesso
	 *       404:
	 *         description: Entregador não encontrado
	 *       409:
	 *         description: Pedido já foi reivindicado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.post('/orders/:id/accept', authMiddleware, (req, res) =>
		ordersController.acceptOrder(req, res),
	);

	/**
	 * @swagger
	 * /orders/{id}/release:
	 *   post:
	 *     tags:
	 *       - Orders
	 *     summary: Liberar um pedido reivindicado
	 *     description: Libera um pedido reivindicado (status ACCEPTED) de volta para o pool de pedidos disponíveis.
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         example: "1"
	 *     responses:
	 *       200:
	 *         description: Pedido liberado com sucesso
	 *       403:
	 *         description: Você não tem permissão para esta ação
	 *       409:
	 *         description: Pedido não está mais aceito
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.post('/orders/:id/release', authMiddleware, (req, res) =>
		ordersController.releaseOrder(req, res),
	);

	/**
	 * @swagger
	 * /orders/{orderId}/{deliveryId}:
	 *   patch:
	 *     tags:
	 *       - Orders
	 *     summary: Atualizar status de entrega do pedido
	 *     description: Atualiza um pedido específico através do ID do pedido e do ID da entrega.
	 *     parameters:
	 *       - in: path
	 *         name: orderId
	 *         required: true
	 *         schema:
	 *           type: string
	 *         example: "order_123"
	 *       - in: path
	 *         name: deliveryId
	 *         required: true
	 *         schema:
	 *           type: string
	 *         example: "delivery_456"
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *     responses:
	 *       200:
	 *         description: Pedido atualizado com sucesso
	 *       400:
	 *         description: Dados inválidos
	 *       403:
	 *         description: Você não é o entregador responsável por este pedido
	 *       404:
	 *         description: Pedido não encontrado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.patch(
		'/orders/:orderId/:deliveryId',
		authMiddleware,
		validateSchema(updateOrderSchema),
		(req, res) => ordersController.updateOrder(req, res),
	);

	return router;
}
