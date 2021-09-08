const { expect } = require('chai');
const Ajv = require('ajv');
const fs = require('fs');
const jsonSchemaDraft6Definition = require('ajv/lib/refs/json-schema-draft-06.json');
// Add endpoint name as key and JSON schema filename prefix as value
const index = {
  createBoard: 'trelloBoard',
  getBoard: 'trelloBoard',
  createList: 'trelloList',
  createCard: 'trelloCard',
  getCard: 'trelloCard',
  updateCard: 'trelloCard',
};

/**
 * validateSchema Function that validates response object against JSON schema
 * @param {String} requestName - Target endpoint name corresponding to a schema as a string
 * @param {Object} response - Response object to validate
 */
const validateSchema = (requestName, response) => {
  const ajv = new Ajv({
    schemaId: 'auto', // draft-04+ support requirement.
    allErrors: true,
    jsonPointers: true,
  });
  ajv.addMetaSchema(jsonSchemaDraft6Definition);
  const path = './utils/json-schema/schemas/';
  let filePath;
  fs.readdirSync(path).forEach((file) => {
    if (file.split('.')[0] === index[requestName]) {
      filePath = `${path}${file}`;
    }
  });
  if (!filePath) {
    throw new Error(`"${requestName}" schema not found`);
  }
  const buffer = fs.readFileSync(filePath);
  const schema = JSON.parse(buffer);
  const validate = ajv.validate(schema, response);
  if (ajv.errorsText() !== 'No errors') {
    console.log(
      'JSON SCHEMA VALIDATION ERROR, GOT RESPONSE: ',
      JSON.stringify(response),
    );
  }
  expect(
    validate,
    `JSON Schema Validation Error: ${ajv.errorsText()}`,
  ).to.equal(true);
  return true;
};
module.exports = { validateSchema };
