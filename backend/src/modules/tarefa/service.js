const TarefaRepository = require('./repository');

class TarefaService {
  async createTarefa(dados) {
    // Validação básica
    if (!dados.titulo || !dados.id_auditor || !dados.data_prevista) {
      throw new Error('Título, Auditor e Data Prevista são obrigatórios');
    }
    
    // Normalizar a data_prevista para incluir o inicio do dia
    dados.data_prevista = new Date(dados.data_prevista);
    
    // Garantir formato base do checklist se existir
    if (dados.checklist && typeof dados.checklist !== 'string') {
       // Se o frontend enviar como Array de objetos, transformamos para ser compativel com Prisma JSON, o Prisma aceita diretamente o Array
    } else {
       dados.checklist = [];
    }

    return await TarefaRepository.create(dados);
  }

  async getTarefas(usuarioLogado) {
    if (usuarioLogado.role === 'admin') {
      return await TarefaRepository.findAll();
    } else {
      return await TarefaRepository.findByAuditorId(usuarioLogado.id);
    }
  }

  async iniciarTarefa(id, auditorId, role) {
    const tarefa = await TarefaRepository.findById(id);
    if (!tarefa) throw new Error('Tarefa não encontrada');
    
    if (role !== 'admin' && tarefa.id_auditor !== auditorId) {
      throw new Error('Sem permissão para alterar esta tarefa');
    }
    
    if (tarefa.status !== 'Pendente') {
      throw new Error('Apenas tarefas pendentes podem ser iniciadas');
    }

    return await TarefaRepository.update(id, {
      status: 'Em Andamento',
      data_inicio: new Date()
    });
  }

  async concluirTarefa(id, auditorId, role, checklistSalvo) {
    const tarefa = await TarefaRepository.findById(id);
    if (!tarefa) throw new Error('Tarefa não encontrada');
    
    if (role !== 'admin' && tarefa.id_auditor !== auditorId) {
      throw new Error('Sem permissão para concluir esta tarefa');
    }
    
    if (tarefa.status !== 'Em Andamento') {
      throw new Error('Não é possível concluir uma tarefa que não está Em Andamento');
    }

    return await TarefaRepository.update(id, {
      status: 'Concluída',
      data_fim: new Date(),
      checklist: checklistSalvo || tarefa.checklist
    });
  }

  async updateTarefa(id, dados) {
    // Normalizações para evitar erro de tipos no Prisma (ex.: data_prevista como string vazia)
    const payload = { ...dados };

    if (Object.prototype.hasOwnProperty.call(payload, 'id_auditor')) {
      const auditorNum = Number(payload.id_auditor);
      if (!auditorNum) throw new Error('Auditor inválido');
      payload.id_auditor = auditorNum;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'data_prevista')) {
      const dt = new Date(payload.data_prevista);
      if (Number.isNaN(dt.getTime())) throw new Error('Data Prevista inválida');
      payload.data_prevista = dt;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'id_pt') && payload.id_pt === '') {
      payload.id_pt = null;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'checklist')) {
      // Aceita Array/Objeto (Prisma Json). Se vier string/vazio, normaliza.
      if (payload.checklist == null) payload.checklist = [];
      else if (typeof payload.checklist === 'string') payload.checklist = [];
    }

    // Permitir "reabrir" tarefa concluída via edição (admin)
    if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
      if (payload.status === 'Pendente') {
        payload.data_inicio = null;
        payload.data_fim = null;
      }
    }

    return await TarefaRepository.update(id, payload);
  }

  async deleteTarefa(id) {
    return await TarefaRepository.delete(id);
  }
}

module.exports = new TarefaService();
