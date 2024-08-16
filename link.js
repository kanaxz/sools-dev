const { execSync } = require('node:child_process')
const { readdir, writeFile } = require('fs/promises')
const { existsSync } = require('fs')
const { join } = require('node:path')
const { getPackagesInfos } = require('./utils')

const incrementVersion = (version) => {
  const [major, minor, patch] = version.split('.')
  return `${major}.${parseInt(minor) + 1}.${patch}`
}

const execMany = (folder, commands) => {
  for (const command of commands) {
    execSync(`cd ${folder} && ${command}`)
  }
}

const processDependencies = async (package, packagesInfos) => {
  if (!package.dependencies) { return false }

  let hasChanged = false
  for (const dependencyName of Object.keys(package.dependencies)) {
    const dependency = packagesInfos.find(({ package: p }) => p.name === dependencyName)
    if (!dependency) { continue }

    if (await processPackageInfos(dependency, packagesInfos)) {
      hasChanged = true
      package.dependencies[dependencyName] = dependency.version
    }
  }

  return hasChanged
}

const processPackageInfos = async (packageInfos, packagesInfos) => {

  const { package, path, processed } = packageInfos
  if (processed) { return }

  console.log(package.name)
  const dependencyChanged = await processDependencies(package, packagesInfos)

  const result = execSync(`cd ${path} && git status .`, {
    encoding: 'utf-8',
  })
  console.log(result)
  const match = result.match('Untracked files:')
  if (dependencyChanged || match) {
    package.version = incrementVersion(package.version)
    await writeFile(join(path, 'package.json'), JSON.stringify(package, null, ' '))
    execMany(path, [
      'npm i',
      'git add .',
      `git commit -m "${package.version}"`,
      'npm publish'
    ])
  }
  packageInfos.processed = true
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