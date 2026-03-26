const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const repository = require('./repository');
const config = require('../../config');

class UtilizadorService {
  async register(userData) {
    const existingUser = await repository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Utilizador já existe com este email.');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await repository.create({
      nome: userData.nome,
      email: userData.email,
      password_hash: hashedPassword,
      role: userData.role || 'auditor',
    });

    return this.generateToken(user);
  }

  async login(email, password) {
    const user = await repository.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new Error('Credenciais inválidas.');
    }

    await repository.updateLastAccess(user.id);
    return this.generateToken(user);
  }

  generateToken(user) {
    const token = jwt.sign(
      { id: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: '1d' }
    );

    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async getProfile(id) {
    const user = await repository.findById(id);
    if (!user) throw new Error('Utilizador não encontrado.');
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = new UtilizadorService();
