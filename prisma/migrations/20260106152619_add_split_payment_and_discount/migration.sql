/*
  Warnings:

  - Added the required column `subtotal` to the `Venta` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add new columns with temporary defaults for existing rows
ALTER TABLE "Venta" ADD COLUMN "subtotal" DOUBLE PRECISION;
ALTER TABLE "Venta" ADD COLUMN "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Step 2: Set subtotal = total for existing rows (since they don't have discounts)
UPDATE "Venta" SET "subtotal" = "total" WHERE "subtotal" IS NULL;

-- Step 3: Make subtotal NOT NULL now that all rows have values
ALTER TABLE "Venta" ALTER COLUMN "subtotal" SET NOT NULL;

-- Step 4: Create PagoDetalle table
CREATE TABLE "PagoDetalle" (
    "id" SERIAL NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "cambio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ventaId" INTEGER NOT NULL,

    CONSTRAINT "PagoDetalle_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create PagoDetalle records for existing sales (one payment per sale)
INSERT INTO "PagoDetalle" ("metodoPago", "monto", "cambio", "ventaId")
SELECT "metodoPago", "montoRecibido", "cambio", "id"
FROM "Venta"
WHERE "montoRecibido" > 0;

-- Step 6: Add foreign key constraint
ALTER TABLE "PagoDetalle" ADD CONSTRAINT "PagoDetalle_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

