enum LogMethod {
  CREATE = 1,
  UPDATE = 2,
  DELETE = 3,
}

enum PaginationDefault {
  OFFSET = 0,
  LIMIT = 10,
}

enum Status {
  PENDING = 'pending',
}

enum LogType {
  COMMENT = 1,
  DEPARTMENT = 2,
  PROJECT = 3,
  SUBTASK = 4,
  TASK = 5,
  USER = 6,
  WORK = 7,
  DIVISION = 8,
  DEADLINE_EXTENSTION = 9,
}

enum EntityType {
  COMMENT = 1,
  DEPARTMENT = 2,
  PROJECT = 3,
  SUBTASK = 4,
  TASK = 5,
  USER = 6,
  WORK = 7,
  DIVISION = 8,
  DEADLINE_EXTENSTION = 9,
}

enum CacheConfig {
  TTL = 1000000,
  MAX = 100,
}

enum Identifier {
  PROJECT = 'single-project',
  WORK = 'single-work',
  TASK = 'single-task',
  SUBTASK = 'single-subtask',
  COMMENT = 'single-comment',
  DEPARTMENT = 'single-department',
  DIVISION = 'single-division',
  MENTION = 'single-mention',
  USER = 'single-user',
  LOG = 'single-log',

  // BATCH

  PROJECTS = 'projects',
  WORKS = 'works',
  TASKS = 'tasks',
  SUBTASKS = 'subtasks',
  COMMENTS = 'comments',
  DEPARTMENTS = 'departments',
  DIVISIONS = 'divisions',
  MENTIONS = 'mentions',
  USERS = 'users',
  LOGS = 'logs',
}

enum Namespace {
  GENERAL = 'GENERAL:',
}

export {
  EntityType,
  Namespace,
  LogMethod,
  PaginationDefault,
  Status,
  LogType,
  CacheConfig,
  Identifier,
};
