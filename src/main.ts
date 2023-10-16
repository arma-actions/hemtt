import * as core from '@actions/core'
import {downloadRelease} from '@terascope/fetch-github-release'
import {exec} from 'child_process'

const isWin = process.platform === 'win32'

const tag: string = core.getInput('version')

async function run(): Promise<void> {
  await downloadRelease(
    'BrettMayson',
    'HEMTT',
    'hemtt',
    release => {
      if (tag === 'latest') return release.prerelease === false
      return release.tag_name === tag
    },
    asset => {
      return isWin
        ? asset.name === 'windows-x64.zip'
        : asset.name === 'linux-x64.zip'
    },
    false,
    false
  )
  if (!isWin) {
    exec('chmod +x hemtt/hemtt', (error, stdout, stderr) => {
      if (error) {
        core.setFailed(error.message)
      }
      if (stderr) {
        core.setFailed(stderr)
      }
      core.info(stdout)
    })
  }
  core.addPath(`${process.cwd()}/hemtt`)
}

run()
