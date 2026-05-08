import { Router } from 'express';
import { UserController } from '../../controllers/user-controller';

export function makeUserRoutes(userController: UserController) {
	const router = Router();

	/**
	 * @swagger
	 * /api/users:
	 *   get:
	 *     summary: Lista usuários
	 *     tags:
	 *       - Users
	 *     responses:
	 *       200:
	 *         description: Lista de usuários retornada com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: array
	 *               items:
	 *                 $ref: '#/components/schemas/User'
	 *       400:
	 *         description: Erro ao listar usuários
	 *
	 *   post:
	 *     summary: Cria um usuário
	 *     tags:
	 *       - Users
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - name
	 *               - email
	 *             properties:
	 *               name:
	 *                 type: string
	 *                 example: Murilo
	 *               email:
	 *                 type: string
	 *                 format: email
	 *                 example: murilo@email.com
	 *     responses:
	 *       201:
	 *         description: Usuário criado com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/User'
	 *       400:
	 *         description: Erro ao criar usuário
	 */
	router
		.route('/users')
		.get((req, res) => userController.list(req, res))
		.post((req, res) => userController.create(req, res));

	/**
	 * @swagger
	 * /api/users/{id}:
	 *   patch:
	 *     summary: Atualiza um usuário
	 *     tags:
	 *       - Users
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *           format: uuid
	 *         description: ID do usuário
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/UpdateUser'
	 *           examples:
	 *             updateName:
	 *               summary: Atualizar nome
	 *               value:
	 *                 name: Murilo Silva
	 *             updateAddress:
	 *               summary: Atualizar endereço
	 *               value:
	 *                 phone: '11999999999'
	 *                 zipCode: '01001000'
	 *                 street: Rua das Flores
	 *                 number: '123'
	 *                 district: Centro
	 *                 city: São Paulo
	 *                 state: SP
	 *     responses:
	 *       200:
	 *         description: Usuário atualizado com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/User'
	 *       400:
	 *         description: Erro ao atualizar usuário
	 */
	router
		.route('/users/:id')
		.patch((req, res) => userController.update(req, res));

	return router;
}
