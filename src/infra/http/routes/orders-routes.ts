import { Router } from 'express';
import { OrdersController } from '../../controllers/orders-controller';
import { validateSchema } from '../../../middlewares/validate-schema';
import { updateOrderSchema } from '../validators/order-validator';

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
	router.route('/orders').get((req, res) => ordersController.list(req, res));
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
	 *       404:
	 *         description: Pedido não encontrado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.patch(
		'/orders/:orderId/:deliveryId',
		validateSchema(updateOrderSchema),
		(req, res) => ordersController.updateOrder(req, res),
	);

	return router;
}
