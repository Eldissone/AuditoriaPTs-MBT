const { Router } = require('express');
const controller = require('./controller');
const authMiddleware = require('../../middlewares/auth');
const roleAuth = require('../../middlewares/roleAuth');

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res) => controller.index(req, res));
router.get('/:id', (req, res) => controller.show(req, res));
router.get('/:id/pdf', (req, res) => controller.generatePDF(req, res));
router.post('/', (req, res) => controller.store(req, res));
router.put('/:id', roleAuth.requireAdmin, (req, res) => controller.update(req, res));
router.delete('/:id', roleAuth.requireAdmin, (req, res) => controller.delete(req, res));

module.exports = router;
