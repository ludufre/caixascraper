const nconf = require('nconf')
const caixascraper = require('./caixascraper.js')

const argv = require('yargs')
  .env()
  .usage('Usage: node $0 [options]')
  .option('user', {
    alias: 'u',
    describe: 'Caixa Ecônomica username, format: AAAAXXXX',
    required: true,
    // type: 'string'
  })
  .option('password', {
    alias: 'p',
    describe: 'Caixa Econômica digital password (8 digits)',
    required: true,
    type: 'string'
  })
  .option('month', {
    alias: 'm',
    describe: 'Month to export (MMMM/YYYY, Ie. Janeiro/2024)',
    required: false,
    type: 'string',
  })
  .option('file_format', {
    alias: 'f',
    describe: 'File format to export',
    default: 'txt',
    choices: ['txt', 'ofx', 'ofc']
  })
  .option('node_env', {
    describe: 'Node environment',
    default: 'production',
    choices: ['development', 'production', 'docker']
  })

// Config
nconf.env().argv(argv)
const environment = nconf.get('node_env')
console.log(environment)
nconf.file(environment, './config/' + environment.toLowerCase() + '.json')
nconf.file('default', './config/default.json')

const options = nconf.get()

console.log('Starting using node environment: ' + environment)
// Run
caixascraper(options)
