const { Router } = require('express');
const controller = require('./controller');
const authMiddleware = require('../../middlewares/auth');

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res) => controller.index(req, res));
router.get('/:id', (req, res) => controller.show(req, res));
router.post('/', (req, res) => controller.store(req, res));
router.post('/bulk', (req, res) => controller.bulkStore(req, res));
router.put('/:id', (req, res) => controller.update(req, res));
router.delete('/:id', (req, res) => controller.delete(req, res));

module.exports = router;
