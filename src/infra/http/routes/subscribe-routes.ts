import { Router } from 'express';
import { SubscribeController } from '../../controllers/subscribe-controller';

export function makeSubscribeRoutes(subscribeController: SubscribeController) {
	const router = Router();

	/**
	 * @swagger
	 * /subscribe:
	 *   post:
	 *     tags:
	 *       - Subscribe
	 *     summary: Criar assinatura
	 *     description: Cria uma nova assinatura para um usuário em uma padaria.
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - userId
	 *               - bakeryId
	 *               - subscribe
	 *             properties:
	 *               userId:
	 *                 type: string
	 *                 example: "usr_123"
	 *               bakeryId:
	 *                 type: string
	 *                 example: "bakery_456"
	 *               subscribe:
	 *                 type: object
	 *                 required:
	 *                   - serviceStartAt
	 *                   - serviceEndAt
	 *                   - notes
	 *                   - frequency
	 *                   - deliveryStartAt
	 *                   - deliveryEndAt
	 *                 properties:
	 *                   serviceStartAt:
	 *                     type: string
	 *                     format: date
	 *                     example: "2026-06-01"
	 *                   serviceEndAt:
	 *                     type: string
	 *                     format: date
	 *                     example: "2026-12-31"
	 *                   notes:
	 *                     type: string
	 *                     example: "Pão francês e integral diariamente"
	 *                   frequency:
	 *                     type: string
	 *                     enum:
	 *                       - daily
	 *                       - weekly
	 *                       - monthly
	 *                     example: daily
	 *                   daysWeek:
	 *                     type: array
	 *                     items:
	 *                       type: string
	 *                     example:
	 *                       - monday
	 *                       - wednesday
	 *                       - friday
	 *                   deliveryStartAt:
	 *                     type: string
	 *                     example: "08:00"
	 *                   deliveryEndAt:
	 *                     type: string
	 *                     example: "10:00"
	 *     responses:
	 *       201:
	 *         description: Assinatura criada com sucesso
	 *       400:
	 *         description: Dados inválidos
	 */
	router
		.route('/subscribe')
		.post((req, res) => subscribeController.create(req, res));

	/**
	 * @swagger
	 * /subscribe/{id}:
	 *   get:
	 *     tags:
	 *       - Subscribe
	 *     summary: Buscar assinatura
	 *     description: Retorna os dados de uma assinatura pelo ID.
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         example: "sub_123"
	 *     responses:
	 *       200:
	 *         description: Assinatura encontrada
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *       404:
	 *         description: Assinatura não encontrada
	 */
	router
		.route('/subscribe/:id')
		.get((req, res) => subscribeController.list(req, res));

	/**
	 * @swagger
	 * /subscribe:
	 *   get:
	 *     tags:
	 *       - Subscribe
	 *     summary: Listar assinaturas
	 *     description: Retorna uma lista paginada de assinaturas.
	 *     parameters:
	 *       - in: query
	 *         name: page
	 *         required: false
	 *         schema:
	 *           type: integer
	 *           default: 1
	 *         description: Número da página.
	 *       - in: query
	 *         name: limit
	 *         required: false
	 *         schema:
	 *           type: integer
	 *           default: 10
	 *         description: Quantidade de registros por página.
	 *     responses:
	 *       200:
	 *         description: Lista de assinaturas retornada com sucesso.
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 data:
	 *                   type: array
	 *                   items:
	 *                     type: object
	 *                     properties:
	 *                       id:
	 *                         type: string
	 *                         example: "clx123456789"
	 *                       userId:
	 *                         type: string
	 *                         example: "usr_123"
	 *                       bakeryId:
	 *                         type: string
	 *                         example: "bakery_456"
	 *                       frequency:
	 *                         type: string
	 *                         enum:
	 *                           - daily
	 *                           - weekly
	 *                           - monthly
	 *                       createdAt:
	 *                         type: string
	 *                         format: date-time
	 *                 page:
	 *                   type: integer
	 *                   example: 1
	 *                 limit:
	 *                   type: integer
	 *                   example: 10
	 *                 total:
	 *                   type: integer
	 *                   example: 125
	 *                 totalPages:
	 *                   type: integer
	 *                   example: 13
	 *       400:
	 *         description: Erro ao listar assinaturas.
	 */
	router
		.route('/subscribe')
		.get((req, res) => subscribeController.listAll(req, res));

	return router;
}
