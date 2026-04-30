const { Router } = require('express');
const controller = require('./controller');

const router = Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.store);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.get('/:id/pdf', controller.generatePDF);

module.exports = router;
