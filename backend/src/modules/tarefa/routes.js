const { Router } = require('express');
const controller = require('./controller');
const authMiddleware = require('../../middlewares/auth');
const roleAuth = require('../../middlewares/roleAuth');

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rota para auditores e admins consultarem tarefas
router.get('/', (req, res) => controller.index(req, res));

// Rotas exclusivas de Admin
router.post('/', roleAuth.requireAdmin, (req, res) => controller.store(req, res));
router.put('/:id', roleAuth.requireAdmin, (req, res) => controller.update(req, res));
router.delete('/:id', roleAuth.requireAdmin, (req, res) => controller.delete(req, res));

// Rotas de execução das tarefas
router.put('/:id/iniciar', (req, res) => controller.iniciar(req, res));
router.put('/:id/concluir', (req, res) => controller.concluir(req, res));

module.exports = router;
