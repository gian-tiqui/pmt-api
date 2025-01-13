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
}

enum CacheConfig {
  TTL = 1000000000,
  MAX = 500,
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
  DEADLINE_EXTENSIONS = 'single-deadline-extensions',
  LOG = 'single-log',
}

enum Namespace {
  GENERAL = 'GENERAL:',
}

export {
  Namespace,
  LogMethod,
  PaginationDefault,
  Status,
  LogType,
  CacheConfig,
  Identifier,
};
