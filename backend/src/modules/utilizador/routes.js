const { Router } = require('express');
const controller = require('./controller');
const authMiddleware = require('../../middlewares/auth');

const router = Router();

router.post('/registo', (req, res) => controller.register(req, res));
router.post('/login', (req, res) => controller.login(req, res));
router.get('/perfil', authMiddleware, (req, res) => controller.profile(req, res));

module.exports = router;
