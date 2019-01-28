const { reduce } = require('lodash');
const fs = require('fs');
const refParser = require('json-schema-ref-parser');
const jsf = require('json-schema-faker');
const jayson = require('jayson');

let schemaFile;
try {
  schemaFile = fs.readFileSync(`${process.cwd()}/openrpc.json`, 'utf8');
} catch (e) {
  console.error(new Error(`Could not find openrpc.json file in ${process.cwd()}`));
  process.exit(1);
}

const rawSchema = JSON.parse(schemaFile);

refParser.dereference(rawSchema).then((schema) => {
  const server = jayson.server(reduce(schema.methods, (result, methodObject, methodName) => {
    result[methodName] = (args, cb) => {
      return cb(null, generateResponse(schema, methodName));
    };
    return result;
  }, {}));

  server.http().listen(3000);
  console.log('service is listening on port 3000');
});

function generateResponse(schema, methodName) {
  const method = schema.methods[methodName];

  if (method === undefined) { return 'method not found: ' + methodName; }

  const schemaForResponse = method.results.schema;

  const generatedValue = jsf.generate(schemaForResponse);

  return generatedValue;
}
