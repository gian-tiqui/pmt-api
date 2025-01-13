import { Project, Task, Work } from '@prisma/client';

type CreateBase = {
  message: string;
};

type UpdateBase = {
  message: string;
};

type RemoveBase = {
  message: string;
};

type CreateProject = CreateBase;

type FindProjects = {
  message: string;
  count: number;
  projects: Project[];
};

type FindProject = {
  message: string;
  project: Project;
};

type FindProjectWorks = {
  message: string;
  count: number;
  works: Work[];
};

type FindProjectWork = {
  message: string;
  work: Work;
};

type UpdateProject = UpdateBase;

type RemoveProject = RemoveBase;

type CreateWork = CreateBase;

type FindWorks = {
  message: string;
  count: number;
  works: Work[];
};

type FindWork = {
  message: string;
  work: Work;
};

type FindWorkTasks = {
  message: string;
  count: number;
  tasks: Task[];
};

type FindWorkTask = {
  message: string;
  task: Task;
};

type UpdateWork = UpdateBase;

type RemoveWork = RemoveBase;

export type {
  CreateProject,
  FindProjects,
  FindProject,
  FindProjectWorks,
  FindProjectWork,
  UpdateProject,
  RemoveProject,
  CreateWork,
  FindWorks,
  FindWork,
  FindWorkTasks,
  FindWorkTask,
  UpdateWork,
  RemoveWork,
};
