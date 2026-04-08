const { Router } = require('express');
const utilizadorRoutes = require('../modules/utilizador/routes');
const subestacaoRoutes = require('../modules/subestacao/routes');
const clienteRoutes = require('../modules/cliente/routes');
const inspecaoRoutes = require('../modules/inspecao/routes');
const tarefaRoutes = require('../modules/tarefa/routes');
const dashboardRoutes = require('../modules/dashboard/routes');

const router = Router();

router.use('/utilizadores', utilizadorRoutes);
router.use('/subestacoes', subestacaoRoutes);
router.use('/clientes', clienteRoutes);
router.use('/inspecoes', inspecaoRoutes);
router.use('/tarefas', tarefaRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
