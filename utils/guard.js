const guard = async (fn) => {
  try {
    return await fn();
  } catch (error) {
    return error;
  }
};

module.exports = guard;
