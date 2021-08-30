const faker = require('faker');
const moment = require('moment');

const USER_GENDERS = ['male', 'female'];
const qaPrefix = 'QATest';

const randomString = (length = 8) => faker.random.alphaNumeric(length);

/// ////////////// Date Time
const today = moment().format('YYYY-MM-DD');
const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');

const board = () => {
  return {
    name: `${faker.company.companyName()}`,
  };
};

module.exports = {
  board, randomString, today, tomorrow, qaPrefix,
};
