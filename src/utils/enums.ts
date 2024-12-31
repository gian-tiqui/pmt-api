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

export { LogMethod, PaginationDefault, Status };
