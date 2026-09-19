import { Router } from 'express';
import { OrdersController } from '../../controllers/orders-controller';
import { validateSchema } from '../../../middlewares/validate-schema';
import {
	generateOrdersSchema,
	updateOrderSchema,
	updateOrderStatusBySellerSchema,
} from '../validators/order-validator';
import { authMiddleware } from '../../../middlewares/auth';

export function makeOrdersRoutes(ordersController: OrdersController) {
	const router = Router();

	/**
	 * @swagger
	 * /api/orders:
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
	 * /api/orders/generate:
	 *   post:
	 *     tags:
	 *       - Orders
	 *     summary: Gerar pedidos a partir das assinaturas ativas
	 *     description: Materializa um Order por assinatura ativa cujo template bate com a data informada (ou hoje, se omitida). Idempotente — reexecuções não duplicam pedidos já gerados (ADR-004).
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: false
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               date:
	 *                 type: string
	 *                 example: "23-09-2026"
	 *                 description: Formato dd-mm-yyyy; padrão hoje (UTC).
	 *     responses:
	 *       200:
	 *         description: Resultado da geração
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 created:
	 *                   type: integer
	 *                 skipped:
	 *                   type: integer
	 *       400:
	 *         description: Data em formato inválido
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.post(
		'/orders/generate',
		authMiddleware,
		validateSchema(generateOrdersSchema),
		(req, res) => ordersController.generateOrders(req, res),
	);

	/**
	 * @swagger
	 * /api/orders/bakery:
	 *   get:
	 *     tags:
	 *       - Orders
	 *     summary: Listar pedidos da padaria do lojista autenticado
	 *     description: Retorna os pedidos (com items) da padaria vinculada ao usuário autenticado, com filtros opcionais de status e data.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: query
	 *         name: status
	 *         required: false
	 *         schema:
	 *           type: string
	 *           enum: [PENDING, PREPARING, READY, ACCEPTED, PICKED_UP, DELIVERED, CANCELED]
	 *       - in: query
	 *         name: date
	 *         required: false
	 *         schema:
	 *           type: string
	 *         example: "23-09-2026"
	 *     responses:
	 *       200:
	 *         description: Lista de pedidos da padaria
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: array
	 *               items:
	 *                 type: object
	 *       400:
	 *         description: Filtros inválidos
	 *       403:
	 *         description: Usuário não está vinculado a uma padaria
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.get('/orders/bakery', authMiddleware, (req, res) =>
		ordersController.listBakeryOrders(req, res),
	);

	/**
	 * @swagger
	 * /api/orders/available:
	 *   get:
	 *     tags:
	 *       - Orders
	 *     summary: Listar pedidos disponíveis
	 *     description: Retorna os pedidos READY, de entrega (DELIVERY) e ainda não reivindicados, com data de atendimento entre hoje e os próximos 2 dias.
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
	 * /api/orders/{id}/accept:
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
	 * /api/orders/{id}/release:
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
	 * /api/orders/{id}/status:
	 *   patch:
	 *     tags:
	 *       - Orders
	 *     summary: Atualizar status do pedido (lojista)
	 *     description: Avança o pedido pelo ciclo de vida controlado pelo lojista (PENDING→PREPARING→READY), cancela antes da coleta/entrega, ou confirma a retirada de um pedido PICKUP (READY→PICKED_UP). READY em um pedido DELIVERY libera o pedido para o pool de entregadores via SSE (ADR-003).
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         example: "1"
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               status:
	 *                 type: string
	 *                 enum: [PREPARING, READY, CANCELED, PICKED_UP]
	 *     responses:
	 *       200:
	 *         description: Pedido atualizado com sucesso
	 *       400:
	 *         description: Dados inválidos
	 *       403:
	 *         description: Você não tem permissão para esta ação
	 *       404:
	 *         description: Pedido não encontrado
	 *       409:
	 *         description: Pedido já foi reivindicado por um entregador
	 *       422:
	 *         description: Transição de status inválida
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.patch(
		'/orders/:id/status',
		authMiddleware,
		validateSchema(updateOrderStatusBySellerSchema),
		(req, res) => ordersController.updateStatusBySeller(req, res),
	);

	/**
	 * @swagger
	 * /api/orders/{orderId}/{deliveryId}:
	 *   patch:
	 *     tags:
	 *       - Orders
	 *     summary: Atualizar status de entrega do pedido (entregador)
	 *     description: Avança um pedido de entrega já reivindicado pelo entregador autenticado (ACCEPTED→PICKED_UP→DELIVERED), operando sobre o Order via o módulo de transições (ADR-003). Reivindicar/liberar têm endpoints próprios (/accept, /release).
	 *     security:
	 *       - bearerAuth: []
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
	 *             properties:
	 *               status:
	 *                 type: string
	 *                 enum: [PICKED_UP, DELIVERED, CANCELED]
	 *     responses:
	 *       200:
	 *         description: Pedido atualizado com sucesso
	 *       400:
	 *         description: Dados inválidos
	 *       403:
	 *         description: Você não é o entregador responsável por este pedido
	 *       404:
	 *         description: Pedido não encontrado
	 *       422:
	 *         description: Transição de status inválida
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
