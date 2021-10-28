#!/usr/bin/env node

const { spawn } = require('child_process')
const { coinInstances, loadBalancer } = require('../../handlers')

const spawnServerless = (...args) => {
  const serverless = spawn('serverless', args, {stdio: 'inherit'});

  process.on('SIGINT', () => {
    process.stdout.write('\n')
    serverless.kill('SIGINT')
    process.exit()
  })
}

require('yargs')
  .command('run [handler]', 'execute a specified handler locally', (yargs) => {
    yargs
      .positional('handler', {
        choices: ['coinInstances', 'loadBalancer', 'all'],
        default: 'all'
      })
  }, async (argv) => {
    switch (argv.handler) {
      case 'coinInstances':
        await coinInstances.checkHealth()
        break
      case 'loadBalancer':
        await loadBalancer.checkHealth()
        break
      default:
        await coinInstances.checkHealth()
        await loadBalancer.checkHealth()
        break
    }
  })
  .command('deploy', 'deploy new stack to AWS', (yargs) => {}, async (argv) => {
    spawnServerless('deploy', '-v')
  })
  .command('deploy-function <function>', 'deploy function to existing stack', (yargs) => {
    yargs
      .positional('function', {})
  }, async (argv) => {
    spawnServerless('deploy', 'function', '-f', argv.function)
  })
  .command('invoke <function>', 'invoke deployed function once', (yargs) => {
    yargs
      .positional('function', {})
  }, async (argv) => {
    spawnServerless('invoke', '-f', argv.function, '-l')
  })
  .command('logs <function>', 'tail the logs of a deployed function', (yargs) => {
    yargs
      .positional('function', {})
  }, async (argv) => {
    spawnServerless('logs', '-f', argv.function, '-t', '--startTime 10m')
  })
  .command('clean', 'tear down the stack on AWS', (yargs) => {}, async (argv) => {
    spawnServerless('remove')
  })
  .demandCommand()
  .parse()
