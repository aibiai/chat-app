import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const pub = path.join(root, 'public')
const srcPath = path.join(pub, 'bg-sakura-source.jpg')
const outPath = path.join(pub, 'bg-sakura.jpg')

async function main() {
  if (!fs.existsSync(srcPath)) {
    console.error(`[compress-bg] 未找到源图: ${srcPath}\n请将原图保存为 bg-sakura-source.jpg 后再运行。`)
    process.exit(1)
  }
  const image = sharp(srcPath)
  const metadata = await image.metadata()

  // 目标尺寸 1920x1080，保持覆盖裁剪
  const resized = image.resize({ width: 1920, height: 1080, fit: 'cover', position: 'centre' })

  // 先尝试质量 70，若仍 > 320KB 则降到 60，再不行 50
  const qualities = [70, 60, 50]
  for (const q of qualities) {
    const buf = await resized.jpeg({ quality: q, chromaSubsampling: '4:4:4', mozjpeg: true }).toBuffer()
    if (buf.length <= 330 * 1024 || q === qualities[qualities.length - 1]) {
      await fs.promises.writeFile(outPath, buf)
      console.log(`[compress-bg] 输出 ${outPath} 质量=${q} 大小=${(buf.length/1024).toFixed(1)}KB (源 ${metadata.width}x${metadata.height})`)
      return
    }
  }
}

main().catch(err => { console.error(err); process.exit(1) })
