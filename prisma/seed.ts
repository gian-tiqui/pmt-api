import { PrismaClient } from '@prisma/client';
import * as argon from 'argon2';

const prismaClient = new PrismaClient();

type UserInfo = {
  firstName: string;
  middleName?: string;
  lastName: string;
  deptId: number;
};

const seedEditTypesAndMethod = async () => {
  const logTypes: string[] = [
    'comment',
    'department',
    'project',
    'subtask',
    'task',
    'user',
    'work',
  ];

  for (const logType of logTypes) {
    await prismaClient.logType.upsert({
      where: { type: logType },
      update: {},
      create: { type: logType },
    });
  }

  console.log('Log Types Seeded.');

  const logMethods: string[] = ['create', 'update', 'delete'];

  for (const logMethod of logMethods) {
    await prismaClient.logMethod.upsert({
      where: { method: logMethod },
      update: {},
      create: { method: logMethod },
    });
  }

  console.log('Log Method Seeded.');
};

const seedDepartments = async () => {
  const departments = [
    { description: 'Human Resource', code: 'HR' },
    { description: 'Quality Management', code: 'QM' },
    { description: 'Information Technology', code: 'IT' },
    { description: 'Marketing', code: 'MRKT' },
    { description: 'Accounting', code: 'ACNT' },
    { description: 'Ancillary', code: 'ANC' },
    { description: 'Nursing Services Department', code: 'NSD' },
    { description: 'Supply Chain', code: 'SC' },
    { description: 'Support Services', code: 'SSD' },
    { description: 'Customer Experience', code: 'CED' },
    { description: 'Executive', code: 'EXEC' },
  ];

  for (const department of departments) {
    await prismaClient.department.upsert({
      where: { code: department.code },
      update: {},
      create: department,
    });
  }

  console.log('Department seeded.');
};

const seedUsers = async () => {
  const users: UserInfo[] = [
    {
      firstName: 'Jose Mari',
      lastName: 'Prats',
      deptId: 9,
    },
    {
      firstName: 'Abet',
      lastName: 'Yaunario',
      deptId: 9,
    },
    {
      firstName: 'Catherine',
      lastName: 'Carparas',
      deptId: 9,
    },
    {
      firstName: 'Jona',
      lastName: 'Yapchionco',
      deptId: 3,
    },
    {
      firstName: 'Marie Ana',
      lastName: 'Alvarez',
      deptId: 1,
    },
    {
      firstName: 'Andy',
      lastName: 'Pagasa',
      deptId: 8,
    },
    {
      firstName: 'Jason',
      lastName: 'Abarca',
      deptId: 5,
    },
    {
      firstName: 'Sam',
      lastName: 'Timtiman',
      deptId: 4,
    },
    {
      firstName: 'Ivy',
      lastName: 'Tanamal-Perez',
      deptId: 9,
    },
    {
      firstName: 'Cathy',
      lastName: 'Espinosa',
      deptId: 2,
    },
    {
      firstName: 'Jorrel',
      lastName: 'Torres',
      deptId: 8,
    },
    {
      firstName: 'Armalyn',
      lastName: 'Mariano',
      deptId: 6,
    },
    {
      firstName: 'Herbert',
      lastName: 'Aquino',
      deptId: 7,
    },
  ];

  await prismaClient.user.deleteMany();

  for (const user of users) {
    const hashedPassword = await argon.hash('password1');

    await prismaClient.user.create({
      data: {
        email: `${user.firstName.toLowerCase()}${user.lastName.toLowerCase()}@westlakemed.com.ph`,
        firstName: user.firstName.toLowerCase(),
        lastName: user.lastName.toLowerCase(),
        departmentId: user.deptId,
        password: hashedPassword,
      },
    });
  }

  console.log('User Seeded.');
};

const main = async () => {
  seedEditTypesAndMethod();
  seedDepartments();
  seedUsers();
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
