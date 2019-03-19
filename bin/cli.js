#!/usr/bin/env node
const program = require('commander');
const server = require('../build/src/server');

program
  .version(require('./get-version'))
  .option('-s, --schema [schema]', 'JSON string or a Path/Url pointing to an OpenRPC Schema')
  .action(() => {
    server('http', 3333, program.schema)
      .catch((e) => {
        console.error(e);
        process.exit(1);
      });
  })
  .parse(process.argv);
