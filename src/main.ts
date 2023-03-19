import {Octokit} from '@octokit/rest'
import * as core from '@actions/core'
import * as fs from 'fs'
import * as https from 'https'
import extract from 'extract-zip'

const isWin = process.platform === 'win32'

const octokit = new Octokit()

const tag: string = core.getInput('version', {trimWhitespace: true})

async function run(): Promise<void> {
  const release =
    tag === 'latest'
      ? await octokit.rest.repos.getLatestRelease({
          owner: 'BrettMayson',
          repo: 'HEMTT'
        })
      : await octokit.rest.repos.getReleaseByTag({
          owner: 'BrettMayson',
          repo: 'HEMTT',
          tag
        })
  core.info(`HEMTT Version: ${release.data.tag_name}`)
  core.debug(`Release: ${JSON.stringify(release)}`)
  const assets = release.data.assets
  const asset = assets.find(a => {
    core.debug(`Asset: ${JSON.stringify(a)}`)
    return a.name === (isWin ? 'windows-x64.zip' : 'linux-x64.zip')
  })
  if (asset === undefined) {
    core.setFailed(
      `Could not find ${
        isWin ? 'windows-x64.zip' : 'linux-x64.zip'
      } in release ${tag}`
    )
    return
  }
  core.info(`Downloading ${asset.name} from ${asset.browser_download_url}`)
  // download the zip

  const file = fs.createWriteStream('hemtt.zip')
  https.get(asset.browser_download_url, response => {
    response.pipe(file)
    file.on('finish', () => {
      file.close()
      core.info('Download Completed')
    })
  })

  // extract the zip

  await extract('hemtt.zip', {dir: `${process.cwd()}/hemtt/`})

  // add to path

  core.addPath('hemtt')
  core.info('HEMTT added to path')
}

run()
