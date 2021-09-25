const faker = require('faker');

const QA_PREFIX = 'QATest';

const randomString = (length = 8) => {
  return faker.random.alphaNumeric(length);
};

const board = () => {
  return {
    name: `Test Board (${QA_PREFIX}) ${randomString()}`,
    desc: faker.lorem.paragraph(),
  };
};

const list = () => {
  return {
  // idBoard: undefined,
    name: `Test List (${QA_PREFIX}) ${randomString(5)}`,
  };
};

const card = () => {
  return {
    idList: undefined,
    name: `Test Card (${QA_PREFIX}) ${randomString()}`,
    desc: faker.lorem.paragraph(),
  };
};

module.exports = {
  board, list, card, randomString, QA_PREFIX,
};
