const daysBetween = (dateOne, dateTwo) => {
  const diff = Math.abs(dateOne.getTime() - dateTwo.getTime());
  return diff / (1000 * 60 * 60 * 24);
};

module.exports = { daysBetween };
