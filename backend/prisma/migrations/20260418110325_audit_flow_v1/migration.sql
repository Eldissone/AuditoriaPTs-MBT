-- Migração: audit_flow_v1
-- Motor de Incongruências + Tipo de Tarefa + Campos Comerciais do Cliente
-- Sistema de Auditoria de PTs - MBT Energia

-- AlterTable: Novos campos comerciais no Cliente (recolhidos em campo durante auditoria)
ALTER TABLE "cliente" ADD COLUMN     "canal_faturacao" VARCHAR(50),
ADD COLUMN     "contacto_resp_financeiro" VARCHAR(200),
ADD COLUMN     "contacto_resp_tecnico" VARCHAR(200),
ADD COLUMN     "data_ultima_manutencao" DATE,
ADD COLUMN     "empresa_manutencao" VARCHAR(200),
ADD COLUMN     "fornece_terceiros" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "responsavel_financeiro" VARCHAR(200),
ADD COLUMN     "responsavel_tecnico_cliente" VARCHAR(200);

-- AlterTable: Medições de terra, tensão e dados cliente em campo na Inspeção
ALTER TABLE "inspecao" ADD COLUMN     "dados_cliente_campo" JSONB,
ADD COLUMN     "medicao_tensao" JSONB,
ADD COLUMN     "terra_protecao" DOUBLE PRECISION,
ADD COLUMN     "terra_servico" DOUBLE PRECISION,
ALTER COLUMN "tipo" SET DEFAULT 'Auditoria PTA';

-- AlterTable: Tipo e Prioridade da Tarefa
ALTER TABLE "tarefa" ADD COLUMN     "prioridade" VARCHAR(20) NOT NULL DEFAULT 'Normal',
ADD COLUMN     "tipo_tarefa" VARCHAR(50) NOT NULL DEFAULT 'Auditoria';

-- CreateTable: Motor de Incongruências
CREATE TABLE "incongruencia" (
    "id" SERIAL NOT NULL,
    "id_inspecao" INTEGER NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "descricao" TEXT,
    "valor_cadastro" VARCHAR(200),
    "valor_apurado" VARCHAR(200),
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "confirmado_por" INTEGER,
    "resolvido" BOOLEAN NOT NULL DEFAULT false,
    "notificou_comercial" BOOLEAN NOT NULL DEFAULT false,
    "nivel_urgencia" VARCHAR(20),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incongruencia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: Incongruência → Inspeção (cascade delete)
ALTER TABLE "incongruencia" ADD CONSTRAINT "incongruencia_id_inspecao_fkey" FOREIGN KEY ("id_inspecao") REFERENCES "inspecao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
