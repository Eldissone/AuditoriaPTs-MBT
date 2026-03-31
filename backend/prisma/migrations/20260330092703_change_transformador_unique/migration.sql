/*
  Warnings:

  - A unique constraint covering the columns `[id_inspecao,num_transformador]` on the table `transformador` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "transformador_id_pt_num_transformador_key";

-- AlterTable
ALTER TABLE "utilizador" ADD COLUMN     "permissoes" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "tarefa" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "id_auditor" INTEGER NOT NULL,
    "id_pt" VARCHAR(50),
    "data_prevista" DATE NOT NULL,
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),
    "status" VARCHAR(50) NOT NULL DEFAULT 'Pendente',
    "checklist" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transformador_id_inspecao_num_transformador_key" ON "transformador"("id_inspecao", "num_transformador");

-- AddForeignKey
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_id_auditor_fkey" FOREIGN KEY ("id_auditor") REFERENCES "utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE CASCADE ON UPDATE CASCADE;
