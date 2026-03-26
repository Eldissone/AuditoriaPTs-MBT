const path = require('path');
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const config = require('./config');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'Bem-vindo à API do Sistema de Auditoria PT' });
});

module.exports = app;
