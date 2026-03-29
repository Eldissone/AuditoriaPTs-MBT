const { Router } = require('express');
const controller = require('./controller');
const authMiddleware = require('../../middlewares/auth');
const { requireAdmin } = require('../../middlewares/roleAuth');

const router = Router();

// Rotas públicas ou do utilizador atual
router.post('/registo', (req, res) => controller.register(req, res));
router.post('/login', (req, res) => controller.login(req, res));
router.get('/perfil', authMiddleware, (req, res) => controller.profile(req, res));

// Rotas exclusivas de Administração (CRUD completo)
router.get('/', authMiddleware, requireAdmin, (req, res) => controller.getAll(req, res));
router.post('/', authMiddleware, requireAdmin, (req, res) => controller.create(req, res));
router.put('/:id', authMiddleware, requireAdmin, (req, res) => controller.update(req, res));
router.delete('/:id', authMiddleware, requireAdmin, (req, res) => controller.delete(req, res));

module.exports = router;
