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
      permissoes: userData.permissoes || ["/pts", "/subestacoes", "/ficha-tecnica"],
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

  async getAllUsers() {
    return repository.findAll();
  }

  async updateUser(id, updateData) {
    const user = await repository.findById(id);
    if (!user) throw new Error('Utilizador não encontrado.');
    
    // Hash password se providenciada
    if (updateData.password) {
      updateData.password_hash = await bcrypt.hash(updateData.password, 10);
      delete updateData.password;
    }
    
    const updated = await repository.update(id, updateData);
    const { password_hash, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  async deleteUser(id) {
    const user = await repository.findById(id);
    if (!user) throw new Error('Utilizador não encontrado.');
    
    return repository.softDelete(id);
  }

  async getProfile(id) {
    const user = await repository.findById(id);
    if (!user) throw new Error('Utilizador não encontrado.');
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = new UtilizadorService();
