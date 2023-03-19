import * as core from '@actions/core'
import {downloadRelease} from '@terascope/fetch-github-release'

const isWin = process.platform === 'win32'

const tag: string = core.getInput('version', {trimWhitespace: true})

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
  core.addPath('hemtt')
}

run()
