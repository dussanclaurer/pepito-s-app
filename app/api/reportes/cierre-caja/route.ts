// app/api/reportes/cierre-caja/route.ts

import { NextResponse } from 'next/server';
import { MetodoPago, Prisma, PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Obtener el usuario autenticado
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const userName = session.user.name;
    
    // Calcular inicio y fin del día en zona horaria local
    const timeZone = 'America/La_Paz';
    const ahoraLocal = toZonedTime(new Date(), timeZone);
    const inicioDelDiaLocal = startOfDay(ahoraLocal);
    const finDelDiaLocal = endOfDay(ahoraLocal);
    
    // Convertir a UTC para consultas a la base de datos
    const inicioDelDia = fromZonedTime(inicioDelDiaLocal, timeZone);
    const finDelDia = fromZonedTime(finDelDiaLocal, timeZone);

    // Determinar filtro según rol
    const ventaFilter: Prisma.VentaWhereInput = {
      creadoEn: {
        gte: inicioDelDia, 
        lte: finDelDia,     
      },
    };

    // Si es cajero, filtrar solo sus ventas
    if (userRole === 'CAJERO') {
      ventaFilter.vendedorId = userId;
    }
    // Si es ADMIN, no agregar filtro adicional (todas las ventas)

    const totalesVentasPorMetodo = await prisma.venta.groupBy({
      by: ['metodoPago'],
      where: ventaFilter,
      _sum: {
        total: true, 
      },
    });

    // Filtro para pedidos (anticipos)
    const pedidoFilter: Prisma.PedidoWhereInput = {
      creadoEn: {
        gte: inicioDelDia,
        lte: finDelDia,
      },
      anticipo: {
        gt: 0,
      },
    };

    // Si es cajero, filtrar solo sus pedidos
    if (userRole === 'CAJERO') {
      pedidoFilter.vendedorId = userId;
    }

    const anticiposPorMetodo = await prisma.pedido.groupBy({
      by: ['metodoPagoAnticipo'],
      where: pedidoFilter,
      _sum: {
        anticipo: true,
      },
    });
    
    const reporteFinal = new Map<MetodoPago, number>();
    reporteFinal.set(MetodoPago.EFECTIVO, 0);
    reporteFinal.set(MetodoPago.QR, 0);

    for (const item of totalesVentasPorMetodo) {
      const montoActual = reporteFinal.get(item.metodoPago) || 0;
      reporteFinal.set(item.metodoPago, montoActual + (item._sum.total || 0));
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

    const totalGeneralVentas = totalesVentasPorMetodo.reduce((acc, item) => acc + (item._sum.total || 0), 0);
    const totalAnticipos = anticiposPorMetodo.reduce((acc, item) => acc + (item._sum.anticipo || 0), 0);
    const totalPagosSaldo = pagosSaldoPedidos.reduce((acc, item) => acc + (item._sum.monto || 0), 0);
    const totalGeneral = totalGeneralVentas + totalAnticipos + totalPagosSaldo;
    
    // Obtener total de descuentos aplicados hoy (ventas + pedidos)
    const descuentosHoy = await prisma.venta.aggregate({
      where: ventaFilter,
      _sum: {
        descuento: true,
      },
    });

    const descuentosPedidos = await prisma.pedido.aggregate({
      where: {
        ...pedidoFilter,
        estado: "COMPLETADO",
      },
      _sum: {
        descuentoSaldo: true,
      },
    });

    const totalDescuentos = (descuentosHoy._sum.descuento || 0) + (descuentosPedidos._sum.descuentoSaldo || 0);
    
    // Get products sold today with breakdown (filtrado por usuario)
    const productosVendidosHoy = await prisma.ventaProducto.groupBy({
      by: ['productoId'],
      where: {
        venta: ventaFilter,
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
      usuario: {
        nombre: userName,
        rol: userRole,
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
