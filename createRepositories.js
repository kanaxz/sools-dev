const { execSync } = require('node:child_process')
const { readdir, writeFile } = require('fs/promises')
const { existsSync } = require('fs')
const { join } = require('node:path')
const { getPackagesInfos, execMany } = require('./utils')

const incrementVersion = (version) => {
  const [major, minor, patch] = version.split('.')
  return `${major}.${parseInt(minor) + 1}.${patch}`
}


const processPackageInfos = async (packageInfos, packagesInfos) => {
  const { package, path } = packageInfos
  if (!existsSync(join(path, '.git'))) {
    return
  }
  console.log(path, existsSync(join(path, '.git')))
  execMany(path, [
    'git init',
    'git add .',
    'git commit -m "first commit"',
    `git remote add origin https://github.com/kanaxz/${package.name}`,
    'git push -u origin master'
  ])

  process.exit()
}


const execute = async () => {
  const [, , path] = process.argv
  const root = join(process.cwd(), path)
  const packagesInfos = await getPackagesInfos(root)
  for (const packageInfos of packagesInfos) {
    await processPackageInfos(packageInfos, packagesInfos)
  }
}

execute()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })