import { readFileSync } from 'node:fs'

const file = process.argv[2]
if (!file) {
  process.exit(0)
}

const message = readFileSync(file, 'utf8').trim()
const firstLine = message.split('\n')[0] ?? ''
const conventional = /^(feat|fix|docs|chore|refactor|test|ops|data|security)(\([a-z0-9-]+\))?!?: .+/

if (firstLine.startsWith('Merge ') || conventional.test(firstLine)) {
  process.exit(0)
}

console.error(`Commit message must use Conventional Commits. Got: ${firstLine}`)
process.exit(1)
