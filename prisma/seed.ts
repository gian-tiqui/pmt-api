import { PrismaClient } from '@prisma/client';
import * as argon from 'argon2';

const prismaClient = new PrismaClient();

const MAX_PROJECTS_COUNT = 59;
const MAX_WORK_COUNT = 5;
const MAX_TASK_COUNT = 10;
const MAX_SUB_TASK_COUNT = 10;
const MAX_COMMENT_COUNT = 10;

type UserInfo = {
  firstName: string;
  middleName?: string;
  lastName: string;
  departmentId: number;
  divisionId: number;
  employeeId: number;
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
    'division',
    'deadline-extension',
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

const seedDivision = async () => {
  const divisions = [
    { code: 'ADM', description: 'Admin Division' },
    { code: 'ANC', description: 'Ancillary Division' },
    { code: 'NSD', description: 'Nursing Services Division' },
  ];

  for (const division of divisions) {
    await prismaClient.division.upsert({
      where: { code: division.code },
      update: {},
      create: division,
    });
  }
};

const seedDepartments = async () => {
  const departments = [
    { description: 'Human Resource', code: 'HR', divisionId: 1 },
    {
      description: 'Quality Management',
      code: 'QM',
      divisionId: 1,
    },
    {
      description: 'Information Technology',
      code: 'IT',
      divisionId: 1,
    },
    { description: 'Marketing', code: 'MRKT', divisionId: 1 },
    { description: 'Accounting', code: 'ACNT', divisionId: 1 },
    { description: 'Ancillary', code: 'ANC', divisionId: 1 },
    {
      description: 'Nursing Services Department',
      code: 'NSD',
      divisionId: 3,
    },
    { description: 'Supply Chain', code: 'SC', divisionId: 1 },
    {
      description: 'Support Services',
      code: 'SSD',
      divisionId: 1,
    },
    {
      description: 'Customer Experience',
      code: 'CED',
      divisionId: 1,
    },
    { code: 'OR', description: 'Operating Room', divisionId: 3 },
    { code: 'ER', description: 'Emergency Room', divisionId: 3 },
    { code: 'NICU', description: 'Nicu', divisionId: 3 },
    { code: 'DIA', description: 'Dialysis', divisionId: 3 },
    { code: 'ICU', description: 'Icu', divisionId: 3 },
    { code: 'ACU', description: 'Acu', divisionId: 3 },
    {
      code: 'GNU4F',
      description: '4th Floor Ward',
      divisionId: 3,
    },
    {
      code: 'GNU5F',
      description: '5th Floor Ward',
      divisionId: 3,
    },
    { code: 'IMGN', description: 'Imaging', divisionId: 2 },
    { code: 'CRD', description: 'Cardiology', divisionId: 2 },
    { code: 'PULM', description: 'Pulmonary', divisionId: 2 },
    {
      code: 'PMR',
      description: 'Physical, Medicine, and Rehab',
      divisionId: 2,
    },
    { code: 'LAB', description: 'Laboratory', divisionId: 2 },
    { code: 'DIET', description: 'Dietary', divisionId: 2 },
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
      departmentId: 9,
      divisionId: 1,
      employeeId: 1010,
    },
    {
      firstName: 'Abet',
      lastName: 'Yaunario',
      departmentId: 9,
      divisionId: 1,
      employeeId: 1011,
    },
    {
      firstName: 'Catherine',
      lastName: 'Caparas',
      departmentId: 9,
      divisionId: 1,
      employeeId: 1012,
    },
    {
      firstName: 'Jessa',
      lastName: 'Reforma',
      departmentId: 9,
      divisionId: 1,
      employeeId: 1013,
    },
    {
      firstName: 'Jona',
      lastName: 'Yapchionco',
      departmentId: 3,
      divisionId: 1,
      employeeId: 1014,
    },
    {
      firstName: 'Marie Ana',
      lastName: 'Alvarez',
      departmentId: 1,
      divisionId: 1,
      employeeId: 1015,
    },
    {
      firstName: 'Andy',
      lastName: 'Pagasa',
      departmentId: 8,
      divisionId: 1,
      employeeId: 1016,
    },
    {
      firstName: 'Jason',
      lastName: 'Abarca',
      departmentId: 5,
      divisionId: 1,
      employeeId: 1017,
    },
    {
      firstName: 'Sam',
      lastName: 'Timtiman',
      departmentId: 4,
      divisionId: 1,
      employeeId: 1018,
    },
    {
      firstName: 'Ivy',
      lastName: 'Tanamal-Perez',
      departmentId: 9,
      divisionId: 2,
      employeeId: 1019,
    },
    {
      firstName: 'Cathy',
      lastName: 'Espinosa',
      departmentId: 2,
      divisionId: 1,
      employeeId: 1020,
    },
    {
      firstName: 'Jorrel',
      lastName: 'Torres',
      departmentId: 8,
      divisionId: 1,
      employeeId: 1021,
    },
    {
      firstName: 'Armalyn',
      lastName: 'Mariano',
      departmentId: 6,
      divisionId: 2,
      employeeId: 1022,
    },
    {
      firstName: 'Herbert',
      lastName: 'Aquino',
      departmentId: 7,
      divisionId: 3,
      employeeId: 1023,
    },
  ];

  await prismaClient.user.deleteMany();

  for (const user of users) {
    const hashedPassword = await argon.hash('abcd_123');

    await prismaClient.user.create({
      data: {
        email: `${user.firstName.toLowerCase()}${user.lastName.toLowerCase()}@westlakemed.com.ph`,
        firstName: user.firstName,
        lastName: user.lastName,
        departmentId: user.departmentId,
        divisionId: user.divisionId,
        password: hashedPassword,
        employeeId: user.employeeId,
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
        const task = await prismaClient.task.create({
          data: {
            title: `Task ${taskIndex}`,
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

        for (
          let commentIndex = 1;
          commentIndex <= MAX_COMMENT_COUNT;
          commentIndex++
        ) {
          await prismaClient.comment.create({
            data: {
              message: `Comment #${commentIndex} for task ${taskIndex} in work ${workIndex}`,
              mentions: {
                create: [
                  { userId: 1 },
                  { userId: 2 },
                  { userId: 3 },
                  { userId: 5 },
                ],
              },
              userId: 4,
              taskId: taskIndex,
            },
          });
        }

        for (
          let subTaskIndex = 1;
          subTaskIndex <= MAX_SUB_TASK_COUNT;
          subTaskIndex++
        ) {
          await prismaClient.task.create({
            data: {
              title: `Task ${taskIndex}`,
              description: `Task ${taskIndex} description`,
              type: 'task',
              assignedToId: 5,
              current: false,
              workId: work.id,
              startDate: new Date(),
              endDate: new Date(),
              status: 'todo',
              parentId: task.id,
            },
          });
        }
      }
    }
  }
  console.log('Projects, Works, Tasks, and Comments seeded.');
};

const main = async () => {
  seedEditTypesAndMethod();
  seedDivision().then(() =>
    seedDepartments().then(seedUsers).then(seedProjectsAndWorks),
  );
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
