const { Router } = require('express');
const controller = require('./controller');
const authMiddleware = require('../../middlewares/auth');

const router = Router();

router.use(authMiddleware);

router.get('/stats', (req, res) => controller.getStats(req, res));
router.get('/map', (req, res) => controller.getMapData(req, res));

module.exports = router;
