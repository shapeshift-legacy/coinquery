## SanitizeAWS

- Every night find and remove all volumes that are "available" and not "in-use".
- Every night find and remove all snapshots that are older than x days.

### Deploy - Serverless CLI
1. Install Serverless Framework:
https://serverless.com/

2. Set up your env.yml based on the env.example file in this project.

### Note
- There are 2 files shared between all lambdas in this project: `constants.js` & `utils.js`.
You'll notice the path to require them from `handler.js` doesn't look accurate and it wouldn't
run correctly if ran locally inside a local node repl. This is because we included them
in the `serverless.yml` to be packaged with our lambda and when packaged and deployed,
it puts these files at the same level as `handler.js`.

### Linting
- `npm run linter [file]` to check errors
- `npm run linter [file] --fix` to fix any that can be auto-fixed
