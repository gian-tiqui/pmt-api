const getPreviousValues = (original, updates) => {
  const changes = {};
  for (const key in updates) {
    if (original[key] !== undefined && original[key] !== updates[key]) {
      changes[key] = original[key];
    }
  }
  return changes;
};

export { getPreviousValues };
