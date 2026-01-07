// app/api/reportes/cierre-caja/route.ts

import { NextResponse } from 'next/server';
import { MetodoPago, PrismaClient } from '@prisma/client';
import { toZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const timeZone = 'America/La_Paz';
    const ahora = toZonedTime(new Date(), timeZone);
    const inicioDelDia = startOfDay(ahora);
    const finDelDia = endOfDay(ahora);

    // Obtener totales de ventas desde PagoDetalle (nueva forma)
    const totalesVentasPorMetodo = await prisma.pagoDetalle.groupBy({
      by: ['metodoPago'],
      where: {
        venta: {
          creadoEn: {
            gte: inicioDelDia, 
            lte: finDelDia,     
          },
        },
      },
      _sum: {
        monto: true, 
      },
    });

    const anticiposPorMetodo = await prisma.pedido.groupBy({
      by: ['metodoPagoAnticipo'],
      where: {
        creadoEn: {
          gte: inicioDelDia,
          lte: finDelDia,
        },
        anticipo: {
          gt: 0,
        },
      },
      _sum: {
        anticipo: true,
      },
    });

    const reporteFinal = new Map<MetodoPago, number>();
    reporteFinal.set(MetodoPago.EFECTIVO, 0);
    reporteFinal.set(MetodoPago.QR, 0);

    for (const item of totalesVentasPorMetodo) {
      const montoActual = reporteFinal.get(item.metodoPago) || 0;
      reporteFinal.set(item.metodoPago, montoActual + (item._sum.monto || 0));
    }
    
    for (const item of anticiposPorMetodo) {
      const metodo = item.metodoPagoAnticipo;
      const totalAnticipo = item._sum.anticipo || 0;
      reporteFinal.set(metodo, (reporteFinal.get(metodo) || 0) + totalAnticipo);
    }
    
    // Obtener pagos delSaldo de pedidos completados hoy
    const pagosSaldoPedidos = await prisma.pagoPedido.groupBy({
      by: ['metodoPago'],
      where: {
        creadoEn: {
          gte: inicioDelDia,
          lte: finDelDia,
        },
        esSaldo: true,
      },
      _sum: {
        monto: true,
      },
    });

    // Agregar pagos de saldo de pedidos al reporte
    for (const item of pagosSaldoPedidos) {
      const montoActual = reporteFinal.get(item.metodoPago) || 0;
      reporteFinal.set(item.metodoPago, montoActual + (item._sum.monto || 0));
    }
    
    const reporteFormateado = Array.from(reporteFinal.entries()).map(([metodoPago, total]) => ({
      metodoPago,
      total,
    })).sort((a, b) => a.metodoPago.localeCompare(b.metodoPago));

    const totalGeneralVentas = totalesVentasPorMetodo.reduce((acc, item) => acc + (item._sum.monto || 0), 0);
    const totalAnticipos = anticiposPorMetodo.reduce((acc, item) => acc + (item._sum.anticipo || 0), 0);
    const totalPagosSaldo = pagosSaldoPedidos.reduce((acc, item) => acc + (item._sum.monto || 0), 0);
    const totalGeneral = totalGeneralVentas + totalAnticipos + totalPagosSaldo;
    
    // Obtener total de descuentos aplicados hoy (ventas + pedidos)
    const descuentosHoy = await prisma.venta.aggregate({
      where: {
        creadoEn: {
          gte: inicioDelDia,
          lte: finDelDia,
        },
      },
      _sum: {
        descuento: true,
      },
    });

    const descuentosPedidos = await prisma.pedido.aggregate({
      where: {
        creadoEn: {
          gte: inicioDelDia,
          lte: finDelDia,
        },
        estado: "COMPLETADO",
      },
      _sum: {
        descuentoSaldo: true,
      },
    });

    const totalDescuentos = (descuentosHoy._sum.descuento || 0) + (descuentosPedidos._sum.descuentoSaldo || 0);
    
    // Get products sold today with breakdown
    const productosVendidosHoy = await prisma.ventaProducto.groupBy({
      by: ['productoId'],
      where: {
        venta: {
          creadoEn: {
            gte: inicioDelDia,
            lte: finDelDia,
          },
        },
      },
      _sum: {
        cantidad: true,
      },
    });

    // Get product names and prices
    const productosInfo = await prisma.producto.findMany({
      where: {
        id: {
          in: productosVendidosHoy.map(p => p.productoId),
        },
      },
      select: {
        id: true,
        nombre: true,
        precio: true,
      },
    });

    const productosMap = new Map(productosInfo.map(p => [p.id, p]));

    const productosVendidos = productosVendidosHoy.map(pv => {
      const info = productosMap.get(pv.productoId);
      const cantidadVendida = pv._sum.cantidad || 0;
      const ingresoGenerado = (info?.precio || 0) * cantidadVendida;
      
      return {
        nombre: info?.nombre || 'Producto desconocido',
        cantidadVendida,
        ingresoGenerado,
      };
    }).sort((a, b) => b.cantidadVendida - a.cantidadVendida);

    const totalUnidadesVendidas = productosVendidos.reduce((acc, p) => acc + p.cantidadVendida, 0);
    
    const respuesta = {
      totalesPorMetodo: reporteFormateado,
      totalGeneral: totalGeneral,
      fechaReporte: new Date().toLocaleDateString('es-BO', { timeZone }),
      desglose: {
        totalVentas: totalGeneralVentas,
        totalAnticipos: totalAnticipos,
      },
      totalDescuentos: totalDescuentos,
      productosVendidos,
      totalUnidadesVendidas,
    };

    return NextResponse.json(respuesta, { status: 200 });

  } catch (error) {
    console.error("Error al generar el cierre de caja:", error);
    let errorMessage = "Error al generar el reporte";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
