const { join } = require('node:path')
const { existsSync } = require('fs')
const { readdir, writeFile } = require('fs/promises')
const { execSync } = require('node:child_process')

const getPackagesInfos = async (path) => {
  const packagePath = join(path, 'package.json')
  if (existsSync(packagePath)) {
    const package = require(packagePath)
    return [{ package, path }]
  } else {
    const packages = []
    const items = await readdir(path, { withFileTypes: true })
    for (const item of items) {
      if (item.isFile()) { continue }
      const folderPackages = await getPackagesInfos(join(path, item.name))
      packages.push(...folderPackages)
    }
    return packages
  }
}

const execMany = (folder, commands) => {
  for (const command of commands) {
    execSync(`cd ${folder} && ${command}`)
  }
}


module.exports = {
  getPackagesInfos,
  execMany
}