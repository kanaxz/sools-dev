const { execSync } = require('node:child_process')
const { readdir } = require('fs/promises')
const { existsSync } = require('fs')
const { join } = require('node:path')

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

const processPackageInfos = async (packageInfos, packagesInfos) => {

  const { package, path, processed } = packageInfos
  if (processed) { return }

  if (package.dependencies) {
    for (const dependencyName of Object.keys(package.dependencies)) {
      const dependency = packagesInfos.find(({ package }) => package.name === dependencyName)
      if (!dependency) { continue }

      await processPackageInfos(dependency, packagesInfos)
    }
  }
  console.log(path)
  const result = await execSync(`cd ${path} && git status`)
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