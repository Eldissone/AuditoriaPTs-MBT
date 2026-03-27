-- DropForeignKey
ALTER TABLE "baixa_tensao" DROP CONSTRAINT "baixa_tensao_id_pt_fkey";

-- DropForeignKey
ALTER TABLE "conformidade" DROP CONSTRAINT "conformidade_id_pt_fkey";

-- DropForeignKey
ALTER TABLE "identificacao" DROP CONSTRAINT "identificacao_id_subestacao_fkey";

-- DropForeignKey
ALTER TABLE "infraestrutura" DROP CONSTRAINT "infraestrutura_id_pt_fkey";

-- DropForeignKey
ALTER TABLE "inspecao" DROP CONSTRAINT "inspecao_id_pt_fkey";

-- DropForeignKey
ALTER TABLE "manutencao" DROP CONSTRAINT "manutencao_id_pt_fkey";

-- DropForeignKey
ALTER TABLE "media_tensao" DROP CONSTRAINT "media_tensao_id_pt_fkey";

-- DropForeignKey
ALTER TABLE "monitorizacao" DROP CONSTRAINT "monitorizacao_id_pt_fkey";

-- DropForeignKey
ALTER TABLE "risco" DROP CONSTRAINT "risco_id_pt_fkey";

-- DropForeignKey
ALTER TABLE "seguranca" DROP CONSTRAINT "seguranca_id_pt_fkey";

-- DropForeignKey
ALTER TABLE "transformador" DROP CONSTRAINT "transformador_id_pt_fkey";

-- AddForeignKey
ALTER TABLE "identificacao" ADD CONSTRAINT "identificacao_id_subestacao_fkey" FOREIGN KEY ("id_subestacao") REFERENCES "subestacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecao" ADD CONSTRAINT "inspecao_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conformidade" ADD CONSTRAINT "conformidade_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transformador" ADD CONSTRAINT "transformador_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_tensao" ADD CONSTRAINT "media_tensao_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baixa_tensao" ADD CONSTRAINT "baixa_tensao_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca" ADD CONSTRAINT "seguranca_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infraestrutura" ADD CONSTRAINT "infraestrutura_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitorizacao" ADD CONSTRAINT "monitorizacao_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencao" ADD CONSTRAINT "manutencao_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risco" ADD CONSTRAINT "risco_id_pt_fkey" FOREIGN KEY ("id_pt") REFERENCES "identificacao"("id_pt") ON DELETE CASCADE ON UPDATE CASCADE;
