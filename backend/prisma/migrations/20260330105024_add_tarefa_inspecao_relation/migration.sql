-- AlterTable
ALTER TABLE "inspecao" ADD COLUMN     "id_tarefa" INTEGER;

-- AddForeignKey
ALTER TABLE "inspecao" ADD CONSTRAINT "inspecao_id_tarefa_fkey" FOREIGN KEY ("id_tarefa") REFERENCES "tarefa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
