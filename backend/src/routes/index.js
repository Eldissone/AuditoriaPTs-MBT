const { Router } = require('express');
const utilizadorRoutes = require('../modules/utilizador/routes');
const subestacaoRoutes = require('../modules/subestacao/routes');
const identificacaoRoutes = require('../modules/identificacao/routes');
const inspecaoRoutes = require('../modules/inspecao/routes');

const router = Router();

router.use('/utilizadores', utilizadorRoutes);
router.use('/subestacoes', subestacaoRoutes);
router.use('/pts', identificacaoRoutes);
router.use('/inspecoes', inspecaoRoutes);

module.exports = router;
