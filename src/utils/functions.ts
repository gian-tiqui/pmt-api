const getPreviousValues = (original, updates) => {
  const changes = {};

  for (const key in updates) {
    if (original.hasOwnProperty(key) && updates[key] !== original[key]) {
      changes[key] = original[key];
    }
  }

  return changes;
};

export { getPreviousValues };
