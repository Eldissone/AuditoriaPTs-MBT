-- CreateTable
CREATE TABLE "subestacao" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "localizacao" TEXT NOT NULL,
    "gps" TEXT,
    "morada" TEXT,
    "municipio" TEXT,
    "provincia" TEXT,
    "pais" VARCHAR(100) NOT NULL DEFAULT 'Angola',
    "tensao_alimentacao" VARCHAR(50),
    "potencia_total_kva" DOUBLE PRECISION,
    "concessionaria" VARCHAR(200),
    "zona" VARCHAR(100),
    "tipo" VARCHAR(100),
    "proprietario" VARCHAR(200),
    "operador" VARCHAR(200),
    "ano_construcao" DATE,
    "entrada_operacao" DATE,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'Ativa',
    "conta_contrato" VARCHAR(50),
    "instalacao" VARCHAR(100),
    "equipamento" VARCHAR(100),
    "parceiro_negocios" VARCHAR(100),
    "categoria_tarifa" VARCHAR(50),
    "txt_categoria_tarifa" VARCHAR(100),
    "distrito_comuna" VARCHAR(150),
    "bairro" VARCHAR(150),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subestacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilizador" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'auditor',
    "telefone" VARCHAR(30),
    "localizacao" TEXT,
    "gps" TEXT,
    "municipio" VARCHAR(150),
    "provincia" VARCHAR(150),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acesso" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilizador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identificacao" (
    "id" SERIAL NOT NULL,
    "id_pt" VARCHAR(50) NOT NULL,
    "id_subestacao" INTEGER NOT NULL,
    "id_responsavel" INTEGER,
    "localizacao" TEXT NOT NULL,
    "gps" TEXT,
    "morada" TEXT,
    "municipio" VARCHAR(150),
    "provincia" VARCHAR(150),
    "tipo_instalacao" VARCHAR(100) NOT NULL,
    "nivel_tensao" VARCHAR(50) NOT NULL,
    "potencia_kva" DOUBLE PRECISION NOT NULL,
    "ano_instalacao" SMALLINT NOT NULL,
    "fabricante" VARCHAR(150),
    "num_transformadores" SMALLINT NOT NULL DEFAULT 1,
    "regime_exploracao" VARCHAR(100),
    "estado_operacional" VARCHAR(50) NOT NULL DEFAULT 'Operacional',
    "conta_contrato" VARCHAR(50),
    "instalacao" VARCHAR(100),
    "equipamento" VARCHAR(100),
    "parceiro_negocios" VARCHAR(100),
    "categoria_tarifa" VARCHAR(50),
    "txt_categoria_tarifa" VARCHAR(100),
    "distrito_comuna" VARCHAR(150),
    "bairro" VARCHAR(150),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspecao" (
    "id" SERIAL NOT NULL,
    "id_pt" VARCHAR(50) NOT NULL,
    "id_auditor" INTEGER NOT NULL,
    "data_inspecao" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" VARCHAR(50) NOT NULL DEFAULT 'Preventiva',
    "resultado" VARCHAR(50),
    "nivel_urgencia" VARCHAR(20),
    "observacoes" TEXT,
    "proxima_inspecao" DATE,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspecao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conformidade" (
    "id" SERIAL NOT NULL,
    "id_pt" VARCHAR(50) NOT NULL,
    "id_inspecao" INTEGER,
    "licenciamento" BOOLEAN NOT NULL DEFAULT false,
    "projeto_aprovado" BOOLEAN NOT NULL DEFAULT false,
    "diagramas_unifilares" BOOLEAN NOT NULL DEFAULT false,
    "plano_manutencao" BOOLEAN NOT NULL DEFAULT false,
    "registos_inspecao" BOOLEAN NOT NULL DEFAULT false,
    "normas_iec" BOOLEAN NOT NULL DEFAULT false,
    "normas_ieee" BOOLEAN NOT NULL DEFAULT false,
    "normas_locais" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conformidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transformador" (
    "id" SERIAL NOT NULL,
    "id_pt" VARCHAR(50) NOT NULL,
    "id_inspecao" INTEGER,
    "num_transformador" SMALLINT NOT NULL DEFAULT 1,
    "potencia_kva" DOUBLE PRECISION NOT NULL,
    "tensao_primaria" DOUBLE PRECISION NOT NULL,
    "tensao_secundaria" DOUBLE PRECISION NOT NULL,
    "tipo_isolamento" VARCHAR(100) NOT NULL,
    "classe_termica" VARCHAR(20),
    "estado_oleo" VARCHAR(50),
    "fugas" BOOLEAN NOT NULL DEFAULT false,
    "estado_buchas" VARCHAR(100),
    "temperatura_operacao" DOUBLE PRECISION,
    "resistencia_isolamento" DOUBLE PRECISION,
    "ttr" DOUBLE PRECISION,
    "dga" TEXT,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transformador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_tensao" (
    "id" SERIAL NOT NULL,
    "id_pt" VARCHAR(50) NOT NULL,
    "id_inspecao" INTEGER,
    "tipo_celas" VARCHAR(150),
    "estado_disjuntores" VARCHAR(100),
    "estado_seccionadores" VARCHAR(100),
    "reles_protecao" VARCHAR(150),
    "coordenacao_protecoes" BOOLEAN NOT NULL DEFAULT false,
    "aterramento_mt" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_tensao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baixa_tensao" (
    "id" SERIAL NOT NULL,
    "id_pt" VARCHAR(50) NOT NULL,
    "id_inspecao" INTEGER,
    "estado_qgbt" VARCHAR(100),
    "barramentos" VARCHAR(100),
    "disjuntores" VARCHAR(100),
    "balanceamento_cargas" BOOLEAN NOT NULL DEFAULT false,
    "corrente_fase_a" DOUBLE PRECISION,
    "corrente_fase_b" DOUBLE PRECISION,
    "corrente_fase_c" DOUBLE PRECISION,
    "tensao" DOUBLE PRECISION,
    "fator_potencia" DOUBLE PRECISION,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "baixa_tensao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguranca" (
    "id" SERIAL NOT NULL,
    "id_pt" VARCHAR(50) NOT NULL,
    "id_inspecao" INTEGER,
    "resistencia_terra" DOUBLE PRECISION,
    "protecao_raios" BOOLEAN NOT NULL DEFAULT false,
    "spd" BOOLEAN NOT NULL DEFAULT false,
    "sinalizacao" BOOLEAN NOT NULL DEFAULT false,
    "combate_incendio" BOOLEAN NOT NULL DEFAULT false,
    "distancias_seguranca" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seguranca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infraestrutura" (
    "id" SERIAL NOT NULL,
    "id_pt" VARCHAR(50) NOT NULL,
    "id_inspecao" INTEGER,
    "estado_cabine" VARCHAR(100),
    "ventilacao" BOOLEAN NOT NULL DEFAULT false,
    "drenagem" BOOLEAN NOT NULL DEFAULT false,
    "iluminacao" BOOLEAN NOT NULL DEFAULT false,
    "controlo_acesso" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "infraestrutura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitorizacao" (
    "id" SERIAL NOT NULL,
    "id_pt" VARCHAR(50) NOT NULL,
    "id_inspecao" INTEGER,
    "scada" BOOLEAN NOT NULL DEFAULT false,
    "sensores_temperatura" BOOLEAN NOT NULL DEFAULT false,
    "sensores_corrente" BOOLEAN NOT NULL DEFAULT false,
    "sensores_vibracao" BOOLEAN NOT NULL DEFAULT false,
    "registo_eventos" BOOLEAN NOT NULL DEFAULT false,
    "comunicacao" VARCHAR(150),
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitorizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manutencao" (
    "id" SERIAL NOT NULL,
    "id_pt" VARCHAR(50) NOT NULL,
    "id_inspecao" INTEGER,
    "historico_falhas" TEXT,
    "mtbf" DOUBLE PRECISION,
    "mttr" DOUBLE PRECISION,
    "plano_preventivo" BOOLEAN NOT NULL DEFAULT false,
    "plano_preditivo" BOOLEAN NOT NULL DEFAULT false,
    "sobressalentes" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manutencao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risco" (
    "id" SERIAL NOT NULL,
    "id_pt" VARCHAR(50) NOT NULL,
    "id_inspecao" INTEGER,
    "sobrecarga" BOOLEAN NOT NULL DEFAULT false,
    "desequilibrio_fases" BOOLEAN NOT NULL DEFAULT false,
    "falhas_isolamento" BOOLEAN NOT NULL DEFAULT false,
    "redundancia" BOOLEAN NOT NULL DEFAULT false,
    "acesso_nao_controlado" BOOLEAN NOT NULL DEFAULT false,
    "acesso_remoto" BOOLEAN NOT NULL DEFAULT false,
    "segmentacao_ot_it" BOOLEAN NOT NULL DEFAULT false,
    "logs_siem" BOOLEAN NOT NULL DEFAULT false,
    "nivel_risco_geral" VARCHAR(20),
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risco_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subestacao_codigo_key" ON "subestacao"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "utilizador_email_key" ON "utilizador"("email");

-- CreateIndex
CREATE UNIQUE INDEX "identificacao_id_pt_key" ON "identificacao"("id_pt");

-- CreateIndex
CREATE UNIQUE INDEX "conformidade_id_pt_key" ON "conformidade"("id_pt");

-- CreateIndex
CREATE UNIQUE INDEX "transformador_id_pt_num_transformador_key" ON "transformador"("id_pt", "num_transformador");

-- CreateIndex
CREATE UNIQUE INDEX "media_tensao_id_pt_key" ON "media_tensao"("id_pt");

-- CreateIndex
CREATE UNIQUE INDEX "baixa_tensao_id_pt_key" ON "baixa_tensao"("id_pt");

-- CreateIndex
CREATE UNIQUE INDEX "seguranca_id_pt_key" ON "seguranca"("id_pt");

-- CreateIndex
CREATE UNIQUE INDEX "infraestrutura_id_pt_key" ON "infraestrutura"("id_pt");

-- CreateIndex
CREATE UNIQUE INDEX "monitorizacao_id_pt_key" ON "monitorizacao"("id_pt");

-- CreateIndex
CREATE UNIQUE INDEX "manutencao_id_pt_key" ON "manutencao"("id_pt");

-- AddForeignKey
ALTER TABLE "identificacao" ADD CONSTRAINT "identificacao_id_subestacao_fkey" FOREIGN KEY ("id_subestacao") REFERENCES "subestacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identificacao" ADD CONSTRAINT "identificacao_id_responsavel_fkey" FOREIGN KEY ("id_responsavel") REFERENCES "utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecao" ADD CONSTRAINT "inspecao_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecao" ADD CONSTRAINT "inspecao_id_auditor_fkey" FOREIGN KEY ("id_auditor") REFERENCES "utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conformidade" ADD CONSTRAINT "conformidade_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conformidade" ADD CONSTRAINT "conformidade_id_inspecao_fkey" FOREIGN KEY ("id_inspecao") REFERENCES "inspecao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transformador" ADD CONSTRAINT "transformador_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transformador" ADD CONSTRAINT "transformador_id_inspecao_fkey" FOREIGN KEY ("id_inspecao") REFERENCES "inspecao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_tensao" ADD CONSTRAINT "media_tensao_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_tensao" ADD CONSTRAINT "media_tensao_id_inspecao_fkey" FOREIGN KEY ("id_inspecao") REFERENCES "inspecao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baixa_tensao" ADD CONSTRAINT "baixa_tensao_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baixa_tensao" ADD CONSTRAINT "baixa_tensao_id_inspecao_fkey" FOREIGN KEY ("id_inspecao") REFERENCES "inspecao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca" ADD CONSTRAINT "seguranca_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca" ADD CONSTRAINT "seguranca_id_inspecao_fkey" FOREIGN KEY ("id_inspecao") REFERENCES "inspecao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infraestrutura" ADD CONSTRAINT "infraestrutura_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infraestrutura" ADD CONSTRAINT "infraestrutura_id_inspecao_fkey" FOREIGN KEY ("id_inspecao") REFERENCES "inspecao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitorizacao" ADD CONSTRAINT "monitorizacao_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitorizacao" ADD CONSTRAINT "monitorizacao_id_inspecao_fkey" FOREIGN KEY ("id_inspecao") REFERENCES "inspecao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencao" ADD CONSTRAINT "manutencao_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencao" ADD CONSTRAINT "manutencao_id_inspecao_fkey" FOREIGN KEY ("id_inspecao") REFERENCES "inspecao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risco" ADD CONSTRAINT "risco_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risco" ADD CONSTRAINT "risco_id_inspecao_fkey" FOREIGN KEY ("id_inspecao") REFERENCES "inspecao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
