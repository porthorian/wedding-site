#!/usr/bin/env node

import { mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const sourceDir = path.join(projectRoot, 'public', 'images', 'gallery')
const optimizedRootDir = path.join(sourceDir, 'optimized')

const tiers = [
  { name: 'thumb', width: 256, webpQuality: 64, jpgQuality: 70 },
  { name: 'mosaic', width: 1280, webpQuality: 74, jpgQuality: 80 },
  { name: 'lightbox', width: 2200, webpQuality: 82, jpgQuality: 86 },
]

function isJpegFile(fileName) {
  return /\.(jpe?g)$/i.test(fileName)
}

async function ensureOutputDirectories() {
  await mkdir(optimizedRootDir, { recursive: true })
  for (const tier of tiers) {
    await mkdir(path.join(optimizedRootDir, tier.name), { recursive: true })
  }
}

async function optimizeTier(inputPath, baseName, tier) {
  const tierOutputDir = path.join(optimizedRootDir, tier.name)
  const webpOutputPath = path.join(tierOutputDir, `${baseName}.webp`)
  const jpgOutputPath = path.join(tierOutputDir, `${baseName}.jpg`)

  const resized = sharp(inputPath)
    .rotate()
    .resize({
      width: tier.width,
      fit: 'inside',
      withoutEnlargement: true,
    })

  await resized
    .clone()
    .webp({
      quality: tier.webpQuality,
      effort: 4,
    })
    .toFile(webpOutputPath)

  await resized
    .clone()
    .jpeg({
      quality: tier.jpgQuality,
      progressive: true,
      mozjpeg: true,
    })
    .toFile(jpgOutputPath)
}

async function main() {
  await ensureOutputDirectories()

  const sourceEntries = await readdir(sourceDir, { withFileTypes: true })
  const sourceFiles = sourceEntries
    .filter((entry) => entry.isFile() && isJpegFile(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))

  if (!sourceFiles.length) {
    console.log('No JPEG files found in public/images/gallery.')
    return
  }

  let outputCount = 0
  for (const fileName of sourceFiles) {
    const inputPath = path.join(sourceDir, fileName)
    const baseName = path.parse(fileName).name
    for (const tier of tiers) {
      await optimizeTier(inputPath, baseName, tier)
      outputCount += 2
    }
  }

  console.log(
    `Optimized ${sourceFiles.length} source image(s) into ${outputCount} derivative file(s) at ${optimizedRootDir}.`,
  )
}

main().catch((error) => {
  console.error('Failed to optimize gallery images.')
  console.error(error)
  process.exitCode = 1
})
