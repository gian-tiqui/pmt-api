import { PrismaClient } from '@prisma/client';
import * as argon from 'argon2';

const prismaClient = new PrismaClient();

const MAX_PROJECTS_COUNT = 59;
const MAX_WORK_COUNT = 5;
const MAX_TASK_COUNT = 10;

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
      firstName: 'Jessa',
      lastName: 'Reforma',
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

const seedProjectsAndWorks = async () => {
  const projectTitles: string[] = [
    'IT Project',
    'HR Project',
    'QM Project',
    'NSD Project',
    'ACC Project',
  ];

  const workTypes = ['epic', 'story', 'bug', 'task', 'subtask'];

  for (
    let projectIndex = 10;
    projectIndex <= MAX_PROJECTS_COUNT;
    projectIndex++
  ) {
    const project = await prismaClient.project.create({
      data: {
        name: `${projectTitles[parseInt(String(projectIndex)[0], 10) - 1]} ${projectIndex}`,
        authorId: 4,
        startDate: new Date(),
        endDate: new Date(),
        description: `Project ${projectIndex} description,`,
      },
    });

    for (let workIndex = 1; workIndex <= MAX_WORK_COUNT; workIndex++) {
      const work = await prismaClient.work.create({
        data: {
          name: `${workTypes[workIndex - 1]} ${workIndex}`,
          description: `${workTypes[workIndex - 1]} ${workIndex} description.`,
          startDate: new Date(),
          endDate: new Date(),
          type: workTypes[workIndex - 1],
          projectId: project.id,
          authorId: 4,
        },
      });

      for (let taskIndex = 1; taskIndex <= MAX_TASK_COUNT; taskIndex++) {
        await prismaClient.task.create({
          data: {
            name: `Task ${taskIndex}`,
            description: `Task ${taskIndex} description`,
            type: 'task',
            assignedToId: 5,
            current: false,
            workId: work.id,
            startDate: new Date(),
            endDate: new Date(),
            status: 'todo',
          },
        });
      }
    }
  }
  console.log('Projects, Works, and Tasks seeded.');
};

const main = async () => {
  seedEditTypesAndMethod();
  seedDepartments().then(seedUsers).then(seedProjectsAndWorks);
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
