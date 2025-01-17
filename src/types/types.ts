import {
  Comment,
  Department,
  Division,
  Project,
  Task,
  User,
  Work,
} from '@prisma/client';

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

type CreateTask = CreateBase;

type FindTasks = {
  message: string;
  count: number;
  tasks: Task[];
};

type FindTask = {
  message: string;
  task: Task;
};

type FindTaskSubtasks = {
  message: string;
  count: number;
  subTasks: Task[];
};

type FindTaskSubtask = {
  message: string;
  subTask: Task;
};

type FindTaskUsers = {
  message: string;
  count: number;
  users: User[];
};

type FindTaskUser = {
  message: string;
  user: User;
};

type FindTaskComments = {
  message: string;
  count: number;
  comments: Comment[];
};

type FindTaskComment = {
  message: string;
  comment: Comment;
};

type UpdateTask = UpdateBase;

type RemoveTask = RemoveBase;

type CreateComment = CreateBase;

type FindComments = {
  message: string;
  count: number;
  comments: Comment[];
};

type FindComment = {
  message: string;
  comment: Comment;
};

type FindCommentMentionedUsers = {
  message: string;
  count: number;
  users: User[];
};

type FindCommentMentionedUser = {
  message: string;
  user: User;
};

type UpdateComment = UpdateBase;

type RemoveComment = RemoveBase;

type CreateDepartment = CreateBase;

type FindDepartments = {
  message: string;
  count: number;
  departments: Department[];
};

type FindDepartment = {
  message: string;
  department: Department;
};

type FindDepartmentUsers = {
  message: string;
  count: number;
  users: User[];
};

type FindDepartmentUser = {
  message: string;
  user: User;
};

type UpdateDepartment = UpdateBase;

type RemoveDepartment = RemoveBase;

type CreateDivision = CreateBase;

type FindDivisions = {
  message: string;
  count: number;
  divisions: Division[];
};

type FindDivision = {
  message: string;
  division: Division;
};

type FindDivisionUsers = {
  message: string;
  count: number;
  users: User[];
};

type FindDivisionUser = {
  message: string;
  user: User;
};

type FindDivisionDepartments = {
  message: string;
  count: number;
  departments: Department[];
};

type FindDivisionDepartment = {
  message: string;
  department: Department;
};

type UpdateDivision = UpdateBase;

type RemoveDivision = RemoveBase;

type CreateUser = CreateBase;

type FindUsers = {
  message: string;
  count: number;
  users: User[];
};

type FindUser = {
  message: string;
  user: User;
};

type FindUserComments = {
  message: string;
  count: number;
  comments: Comment[];
};

type FindUserComment = {
  message: string;
  comment: Comment;
};

type FindUserWorks = {
  message: string;
  count: number;
  works: Work[];
};

type FindUserWork = {
  message: string;
  work: Work;
};

type FindUserTasks = {
  message: string;
  count: number;
  tasks: Task[];
};

type FindUserTask = {
  message: string;
  task: Task;
};

type FindUserProjects = {
  message: string;
  count: number;
  projects: Project[];
};

type FindUserProject = {
  message: string;
  project: Project;
};

type UpdateUser = UpdateBase;

type RemoveUser = RemoveBase;

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
  CreateTask,
  FindTasks,
  FindTask,
  FindTaskSubtasks,
  FindTaskSubtask,
  FindTaskUsers,
  FindTaskUser,
  FindTaskComments,
  FindTaskComment,
  UpdateTask,
  RemoveTask,
  CreateComment,
  FindComments,
  FindComment,
  FindCommentMentionedUsers,
  FindCommentMentionedUser,
  UpdateComment,
  RemoveComment,
  CreateDepartment,
  FindDepartments,
  FindDepartment,
  FindDepartmentUsers,
  FindDepartmentUser,
  UpdateDepartment,
  RemoveDepartment,
  CreateDivision,
  FindDivisions,
  FindDivision,
  FindDivisionUsers,
  FindDivisionUser,
  FindDivisionDepartments,
  FindDivisionDepartment,
  UpdateDivision,
  RemoveDivision,
  CreateUser,
  FindUsers,
  FindUser,
  FindUserComments,
  FindUserComment,
  FindUserWorks,
  FindUserWork,
  FindUserTasks,
  FindUserTask,
  FindUserProjects,
  FindUserProject,
  UpdateUser,
  RemoveUser,
};
