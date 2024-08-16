const { existsSync } = require('fs')
const { join } = require('node:path')
const { getPackagesInfos, execMany } = require('./utils')
const axios = require('axios')

const createGithubRepo = async (repoName, token) => {
  await axios.post(
    'https://api.github.com/user/repos',
    {
      name: repoName,
      private: false,
      description: '',
    },
    {
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )
}

const processPackageInfos = async (packageInfos, token) => {
  const { package, path } = packageInfos
  if (existsSync(join(path, '.git'))) {
    return
  }

  await createGithubRepo(package.name, token)
  execMany(path, [
    'git init',
    'git add .',
    'git commit -m "first commit"',
    `git remote add origin https://github.com/kanaxz/${package.name}`,
    'git push -u origin master'
  ])
}


const execute = async () => {
  const [, , path, token] = process.argv
  const root = join(process.cwd(), path)
  const packagesInfos = await getPackagesInfos(root)
  for (const packageInfos of packagesInfos) {
    await processPackageInfos(packageInfos, token)
  }
}

execute()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })