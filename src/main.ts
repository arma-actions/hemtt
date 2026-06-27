import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
// The following import cannot be resolved by eslint due to a bug:
// https://github.com/octokit/rest.js/issues/446
// eslint-disable-next-line import/no-unresolved
import {Octokit} from '@octokit/rest'
import type {Endpoints} from '@octokit/types'
import {execSync} from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

// Strongly-typed release / asset types via Endpoints
type ReleasesListResponse =
  Endpoints['GET /repos/{owner}/{repo}/releases']['response']
type Release = ReleasesListResponse['data'][number]
type Asset = Release['assets'][number]

const isWin = process.platform === 'win32'

async function downloadAndExtractRelease(
  owner: string,
  repo: string,
  tag: string,
  assetName: string,
  destDir: string,
  authToken = ''
): Promise<string> {
  const octokit = new Octokit({auth: authToken})
  core.info(`Listing releases for ${owner}/${repo}`)
  const releasesResp = await octokit.rest.repos.listReleases({
    owner,
    repo,
    per_page: 100
  })
  const releases: Release[] = releasesResp.data as Release[]

  const release =
    tag === 'latest'
      ? releases.find(r => !r.prerelease && !r.draft)
      : releases.find(r => r.tag_name === tag)

  if (!release) {
    throw new Error(`Release '${tag}' not found for ${owner}/${repo}`)
  }
  core.debug(`Using release: ${release.tag_name}`)

  const assets = release.assets ?? []
  const asset: Asset | undefined = assets.find(a => a.name === assetName)
  if (!asset || !asset.browser_download_url) {
    throw new Error(
      `Asset '${assetName}' not found in release ${release.tag_name}`
    )
  }
  core.debug(
    `Found asset: ${asset.name}, downloading from ${asset.browser_download_url}`
  )

  // Download to a temp file
  const downloadedPath = await tc.downloadTool(asset.browser_download_url)
  core.debug(`Downloaded asset to ${downloadedPath}`)

  // ensure destination dir exists
  const absoluteDest = path.resolve(destDir)
  if (!fs.existsSync(absoluteDest)) {
    fs.mkdirSync(absoluteDest, {recursive: true})
  }

  // extract zip into destDir
  // tool-cache.extractZip creates destination folder if it doesn't exist
  await tc.extractZip(downloadedPath, absoluteDest)
  core.debug(`Extracted asset into ${absoluteDest}`)

  return absoluteDest
}

async function run(): Promise<void> {
  try {
    const tag: string = core.getInput('version')

    if (!tag) {
      core.warning('HEMTT version is not set. Download will fail.')
    }

    core.info(`Start downloading hemtt ${tag}.`)

    // Pick asset by platform
    const assetName = isWin ? 'windows-x64.zip' : 'linux-x64.zip'

    // Download & extract GitHub release asset
    const hemttDir = await downloadAndExtractRelease(
      'BrettMayson',
      'HEMTT',
      tag,
      assetName,
      'hemtt',
      process.env.GITHUB_TOKEN
    )
    core.info(`Finished download and extraction to: ${hemttDir}`)

    if (!isWin) {
      core.info('Setting execution permissions.')
      // Adjust path to the binary as needed (here we assume hemtt/hemtt inside the zip)
      const binPath = path.join(hemttDir, 'hemtt')
      if (fs.existsSync(binPath)) {
        execSync(`chmod +x ${binPath}`)
      } else {
        core.warning(`Expected binary not found at ${binPath}; skipping chmod.`)
      }
    }

    const hemttPath = core.toPlatformPath(hemttDir)
    core.info(`Adding ${hemttPath} to Github system path.`)
    core.addPath(hemttPath)
    core.info('Done.')
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed(String(error))
    }
  }
}

run()
