import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const emailAdmin = 'admin@pepitos.com';
  const passwordAdmin = 'hola123'; 

  const adminExists = await prisma.user.findUnique({
    where: { email: emailAdmin },
  });

  if (!adminExists) {
    console.log('Creando usuario ADMIN...');
    

    const hashedPassword = await bcrypt.hash(passwordAdmin, 10);


    await prisma.user.create({
      data: {
        email: emailAdmin,
        name: 'Administrador',
        password: hashedPassword,
        role: Role.ADMIN, 
      },
    });
    console.log('¡Usuario ADMIN creado con éxito!');
    console.log(`Email: ${emailAdmin}`);
    console.log(`Password: ${passwordAdmin}`);
  } else {
    console.log('El usuario ADMIN ya existe.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
