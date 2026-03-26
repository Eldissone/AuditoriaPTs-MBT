# AUDMBT / PTAS (Precision Transformer Analysis System)

O **AUDMBT / PTAS** é uma plataforma industrial robusta para a auditoria e gestão de **Postos de Transformação (PTs)** e **Subestações**. Esta solução full-stack foi desenhada para facilitar o registo técnico, a conformidade normativa e a monitorização de activos críticos na rede eléctrica.

## 🚀 Funcionalidades Principais

- **Gestão de Activos:** Registo detalhado de PTs e Subestações, incluindo parâmetros de identificação, localização e transformadores.
- **Auditorias de Conformidade:** Módulos para inspeção técnica e verificação de conformidade industrial.
- **Dashboards Industriais:** Visualização analítica com gráficos de desempenho (Recharts) e geolocalização de activos em mapas interactivos (Leaflet).
- **Relatórios Técnicos:** Geração automatizada de fichas técnicas e relatórios em PDF.
- **Autenticação Segura:** Sistema de login com permissões para utilizadores e gestores.

## 🛠️ Stack Tecnológica

### Backend
- **Framework:** Node.js com Express.js
- **ORM:** Prisma
- **Base de Dados:** PostgreSQL
- **Segurança:** JSON Web Tokens (JWT) e Bcrypt
- **Especialidades:** Multer (uploads) e PDFKit (exportação PDF)

### Frontend
- **Framework:** React.js (Vite)
- **Gestão de Estado:** Zustand
- **Mapas:** React Leaflet
- **Gráficos:** Recharts
- **Iconografia:** Lucide React
- **Estilo:** CSS Moderno e Responsivo

## 📂 Estrutura do Projecto

```text
AUDMBT/
├── backend/            # API e Lógica de Negócio
│   ├── prisma/         # Schema da Base de Dados
│   ├── src/            # Código Fonte Express
│   └── tests/          # Testes Unitários/Integração
├── frontend/           # Interface do Utilizador
│   ├── public/         # Recursos Estáticos
│   └── src/            # Componentes, Páginas e Hooks React
└── README.md           # Documentação do Projecto
```

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js (v18 ou superior)
- PostgreSQL

### 1. Configuração do Backend
1. Aceda à pasta: `cd backend`
2. Instale as dependências: `npm install`
3. Configure o ficheiro `.env` com a sua URL da base de dados e JWT Secret:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/pt_audit"
   JWT_SECRET="sua_chave_secreta"
   ```
4. Execute as migrações Prisma: `npx prisma migrate dev`
5. Inicie o servidor: `npm run dev`

### 2. Configuração do Frontend
1. Aceda à pasta: `cd frontend`
2. Instale as dependências: `npm install`
3. Configure o ficheiro `.env` para apontar para o backend:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```
4. Inicie a aplicação: `npm run dev`

## 👨‍💻 Contribuição

Os contributos são bem-vindos! Sinta-se à vontade para abrir Issues ou enviar Pull Requests.

---
*Projecto desenvolvido para Auditoria de Sistemas Críticos de Energia.*
