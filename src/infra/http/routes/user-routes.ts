import { Router } from 'express';
import { UserController } from '../../controllers/user-controller';
import { authMiddleware } from '../../../middlewares/auth';

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
	 *     summary: Cria um usuário (customer, company ou delivery)
	 *     description: >
	 *       Rota única de cadastro. O campo `role` determina quais campos
	 *       adicionais são obrigatórios e o que é criado além do registro em `User`:
	 *       `company` também cria a padaria (`Bakery`) e o vínculo em `bakery_people`;
	 *       `delivery` também cria o registro em `delivery_people`.
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
	 *               - password
	 *               - role
	 *             properties:
	 *               name:
	 *                 type: string
	 *                 example: Murilo
	 *               email:
	 *                 type: string
	 *                 format: email
	 *                 example: murilo@email.com
	 *               password:
	 *                 type: string
	 *                 example: senha12345
	 *               role:
	 *                 type: string
	 *                 enum: [customer, company, delivery]
	 *           examples:
	 *             customer:
	 *               summary: Cliente
	 *               value:
	 *                 name: Murilo
	 *                 email: murilo@email.com
	 *                 password: senha12345
	 *                 role: customer
	 *             company:
	 *               summary: Padaria
	 *               value:
	 *                 name: Vanessa R
	 *                 email: vanessa@email.com
	 *                 password: senha12345
	 *                 role: company
	 *                 businessName: Padaria da Vanessa
	 *                 cnpj: '12345678000199'
	 *                 phone: '11999999999'
	 *                 whatsapp: '11999999999'
	 *                 serviceStartAt: '08:00'
	 *                 serviceEndAt: '18:00'
	 *             delivery:
	 *               summary: Entregador
	 *               value:
	 *                 name: Aragorn
	 *                 email: aragorn@email.com
	 *                 password: senha12345
	 *                 role: delivery
	 *                 document: '55566644489'
	 *                 phone: '44999885566'
	 *                 modal: MOTORCYCLE
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
	router.get('/users', authMiddleware, (req, res) =>
		userController.list(req, res),
	);
	router.post('/users', (req, res) => userController.create(req, res));

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
		.patch(authMiddleware, (req, res) => userController.update(req, res));

	return router;
}
