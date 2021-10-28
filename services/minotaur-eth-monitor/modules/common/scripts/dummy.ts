// This script is used to temporarily disable an ecosystem process without removing the process entry
// In order to disable a process just point its script to this file.

const second = 1000
const minute = 60 * second
const hour = minute * 60

function log() {
  console.log('Doing nothing')
}

log()

setInterval(log, hour)