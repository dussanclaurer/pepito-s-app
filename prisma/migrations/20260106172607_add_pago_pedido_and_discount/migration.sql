-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "descuentoSaldo" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PagoPedido" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "cambio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "esSaldo" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoPedido_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PagoPedido" ADD CONSTRAINT "PagoPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;
