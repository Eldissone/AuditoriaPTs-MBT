const { Router } = require('express');
const controller = require('./controller');
const authMiddleware = require('../../middlewares/auth');

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res) => controller.index(req, res));
router.get('/:id_pt', (req, res) => controller.show(req, res));
router.post('/', (req, res) => controller.store(req, res));
router.put('/:id_pt', (req, res) => controller.update(req, res));
router.delete('/:id_pt', (req, res) => controller.delete(req, res));

module.exports = router;
