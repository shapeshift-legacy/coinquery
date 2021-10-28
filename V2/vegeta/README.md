# API HTTP LOAD TESTING WITH VEGETA
#### see: https://github.com/tsenart/vegeta for options 


### REQUIREMENTS
-  `brew install vegeta` 
- 🐧 `go get -u github.com/tsenart/vegeta`
- optionally: increase your system's file descriptor limit `ulimit -n {new-limit}` and threads limit `ulimit -u {new-limit}` to be able to run more tests concurrently
 
### RUNNING
- `HOST=local make attack`
- `HOST=stage make attack`
- `HOST=prod make attack`

