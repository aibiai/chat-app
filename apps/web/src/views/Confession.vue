<template>
  <div ref="pageEl" class="confession-page container mx-auto px-3 py-2">
    <!-- 氛围背景（轻柔渐变 + 飘动爱心） -->
    <div class="romance-bg" aria-hidden="true"></div>

    <!-- 背景心形纹理（SVG pattern） -->
    <svg class="hearts-bg" aria-hidden>
      <defs>
        <pattern id="hearts" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M30 18c0-6 7-9 10-4 3-5 10-2 10 4 0 7-10 12-20 22C20 30 10 25 10 18c0-6 7-9 10-4 3-5 10-2 10 4z" fill="url(#g)" />
          <radialGradient id="g">
            <stop offset="0%" stop-color="#fecdd3" />
            <stop offset="100%" stop-color="#ffe4e6" />
          </radialGradient>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hearts)" />
    </svg>

    <!-- 页面级标题已移除以压缩高度，使得页面更易一屏呈现 -->

    <div class="grid grid-cols-12 gap-4 page-grid">
      <!-- 左：甜蜜时刻（3/4）-->
      <section class="col-span-12 lg:col-span-9 fill-col">
  <div class="sweet-card stretch-card sweet-bg">
          <div class="head">
            <div class="title-wrap">
              <h2>{{ t('confession.sweetMoments') }}</h2>
              <span class="badge">{{ posts.length }}</span>
            </div>
            <div class="actions"></div>
          </div>

          <div v-if="loading" class="loading">
            <span class="spinner" aria-hidden="true"></span>
            {{ t('confession.loading') }}
          </div>

          <!-- 散落照片画布（心形轮廓 + 白色圆角卡片云） -->
          <div v-else class="scatter-canvas" :class="{ mosaic: mosaic, 'tile-mode': tileMode }">
            <!-- 上升心形照片效果容器（仅实现排布与上升，不含其它装饰） -->
            <div v-if="hasContent" ref="floatLayer" class="floating-hearts" aria-hidden="true">
              <div
                v-for="h in floatHearts"
                :key="h.id"
                class="floating-heart"
                :style="{
                  left: h.left + 'px',
                  animationDuration: h.duration + 's',
                  animationDelay: h.delay + 's'
                }"
                @animationend="onFloatEnd(h.id)"
              >
                <img :src="h.img" alt="" loading="lazy" />
              </div>
            </div>
            <!-- 背景浮动爱心层（装饰）已移除 -->
            <!-- 大心形描边背景（已按需求移除） -->
            <svg v-if="false" class="heart-outline" viewBox="0 0 200 160" aria-hidden>
              <defs>
                <linearGradient id="outlineGrad" x1="0" x2="1">
                  <stop offset="0%" stop-color="#fecdd3"/>
                  <stop offset="100%" stop-color="#f8a3b6"/>
                </linearGradient>
              </defs>
              <path d="M100 30c-15-25-55-20-60 10-5 29 25 49 60 82 35-33 65-53 60-82-5-30-45-35-60-10z" fill="none" stroke="url(#outlineGrad)" stroke-width="8" stroke-linecap="round"/>
            </svg>
            <!-- 左下角心形装饰（与右侧宣言气泡风格一致，镜像） -->
            <div v-if="false" class="bg-heart-left" aria-hidden="true">
              <svg viewBox="0 0 200 160" class="bubble-svg left-svg">
                <defs>
                  <linearGradient id="bubbleL" x1="0" x2="1">
                    <stop offset="0%" :stop-color="cssVars.heart1" />
                    <stop offset="100%" :stop-color="cssVars.heart2" />
                  </linearGradient>
                </defs>
                <path d="M100 30c-15-25-55-20-60 10-5 29 25 49 60 82 35-33 65-53 60-82-5-30-45-35-60-10z" fill="url(#bubbleL)" stroke="#fb7185" stroke-width="2" opacity="0.9" />
                <path d="M95 116 L85 140 L112 122" fill="#fda4af" opacity="0.7" />
              </svg>
            </div>
            <!-- 主题装饰层已移除：不再渲染樱花/星空/落日装饰 -->
            <!-- 心形网格（心形遮空位布局，无额外容器） -->
            <template v-if="tileMode && hasContent">
              <div class="heart-grid-plain" role="grid" aria-label="sweet-moments-grid">
                <div
                  v-for="(cell, i) in heartCells"
                  :key="'hg-'+i"
                  class="hcell"
                  :class="[ !cell.show ? 'hidden' : '', cell.isPh ? 'placeholder' : '' ]"
                  :style="{ animationDelay: (i*0.03)+'s' }"
                >
                  <template v-if="cell.show">
                    <img v-if="!cell.isPh" :src="cell.img" alt="" loading="lazy" @error="onImgError" @click="openLightbox(cell.img)" />
                  </template>
                </div>
              </div>
            </template>

            <!-- 爱情宣言：右下角心形气泡（取最新一条或默认文案） -->
            <div v-if="false" class="bubble-wrap">
              <div class="heart-bubble">
                <svg viewBox="0 0 200 160" class="bubble-svg">
                  <defs>
                    <linearGradient id="bubble" x1="0" x2="1">
                      <stop offset="0%" :stop-color="cssVars.heart1" />
                      <stop offset="100%" :stop-color="cssVars.heart2" />
                    </linearGradient>
                  </defs>
                  <path d="M100 30c-15-25-55-20-60 10-5 29 25 49 60 82 35-33 65-53 60-82-5-30-45-35-60-10z" fill="url(#bubble)" stroke="#fb7185" stroke-width="2" />
                  <path d="M95 116 L85 140 L112 122" fill="#fda4af" opacity="0.8" />
                </svg>
                <div class="bubble-text">{{ bubbleText }}</div>
              </div>
              <p class="bubble-note">— {{ t('confession.bubbleNote') }}</p>
              <!-- 提交成功的小礼花（心形粒子） -->
              <div v-if="celebrate" class="hearts-burst" aria-hidden="true">
                <span v-for="n in 14" :key="'b-'+n" class="p" :style="{ '--tx': (n-7)*6+'px', '--d': (0.3 + n*0.05)+'s' }">❤</span>
              </div>
            </div>
          </div>

          <!-- 空态提示移除，避免占用额外高度；此时画布会显示图库或占位卡片 -->
        </div>
      </section>

      <!-- 右：我的告白（1/4）-->
      <aside class="col-span-12 lg:col-span-3">
  <div ref="formCard" class="my-card confess-bg">
          <div class="title-row">
            <h3 class="title">{{ t('confession.myConfession') }}</h3>
          </div>
          <p class="sub">{{ t('confession.formDesc') }}</p>

          <div class="field">
            <label>{{ t('confession.image') }}</label>
            <div class="dropzone heart" :class="{ dragging }" @click="triggerPick" @dragover.prevent="onDragOver" @dragleave.prevent="onDragLeave" @drop.prevent="onDrop">
              <input ref="fileEl" type="file" accept="image/*" @change="onPick" hidden />
              <svg class="heart-svg enlarge" viewBox="0 0 200 170" preserveAspectRatio="xMidYMid meet" aria-hidden>
                <defs>
                  <linearGradient id="dzGrad" x1="0" x2="1">
                    <stop offset="0%" stop-color="#fff5f7" />
                    <stop offset="100%" stop-color="#ffffff" />
                  </linearGradient>
                  <clipPath id="clip-heart">
                    <path d="M100 30c-15-25-55-20-60 10-5 29 25 49 60 82 35-33 65-53 60-82-5-30-45-35-60-10z" />
                  </clipPath>
                </defs>
                <g clip-path="url(#clip-heart)">
                  <rect x="0" y="0" width="200" height="170" fill="url(#dzGrad)" opacity="0.85" />
                  <image v-if="form.img" :href="form.img" x="0" y="0" width="200" height="170" preserveAspectRatio="xMidYMid slice" />
                </g>
                <path d="M100 30c-15-25-55-20-60 10-5 29 25 49 60 82 35-33 65-53 60-82-5-30-45-35-60-10z" fill="none" stroke="#e67a88" stroke-width="2.2" stroke-dasharray="6 6" :opacity="dragging?1:0.9" />
              </svg>
              <template v-if="!form.img">
                <div class="dz-inner heart-inner">
                  <div class="dz-text">{{ t('confession.dropHere') }}</div>
                </div>
              </template>
            </div>
            <div class="row gap">
              <button class="btn" type="button" :disabled="formDisabled || !file || uploading" @click="upload">
                {{ uploading ? t('confession.uploading') : (form.img ? t('confession.reupload') : t('confession.upload')) }}
              </button>
              <span v-if="uploadErr" class="err">{{ uploadErr }}</span>
              <span v-else-if="uploadedOk && !uploading" class="ok">{{ t('confession.uploaded') }}</span>
              <span v-else-if="form.img && !uploadedOk" class="err" style="color:#9333ea">{{ t('confession.chosenNotUploaded') }}</span>
            </div>
          </div>

          <button class="btn-primary w-full" :disabled="formDisabled || !canSubmit || submitting" @click="submit">
            {{ submitLabel }}
          </button>
          <div class="hint">{{ t('confession.reviewHint') }}</div>
          <div v-if="submitMsg" class="toast" :class="{ error: submitErr }" role="status" aria-live="polite">{{ submitMsg }}</div>
        </div>
      </aside>
    </div>
  </div>
  <!-- 预览大图弹层 -->
  <div v-if="lightbox" class="lightbox" @click.self="closeLightbox">
    <button class="lb-close" aria-label="close" @click="closeLightbox">×</button>
    <img :src="lightbox" alt="preview" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import { fetchHeartImages } from '../heartApi'
import { useAuth } from '../stores'
import { useI18n } from 'vue-i18n'
// 解构 locale 以确保依赖跟踪，语言切换时相关 computed 会自动更新
const { t, locale } = useI18n()

interface Post { id:string; img:string; text:string }
const posts = ref<Post[]>([])
type SweetItem = { img: string; text?: string }
const sweet = ref<SweetItem[]>([])
// tile 模式：启用心形轮廓 + 36 张白色圆角卡片
const tileMode = true
// 目标数量：40（可按需改为 30/36/40）
const TILE_COUNT = 40
// 全局占位图（轻柔渐变 + 1x1 占位像素），需在使用前声明
const placeholderPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
const softPlaceholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <defs>
      <linearGradient id="g" x1="0" x2="1">
        <stop offset="0%" stop-color="#ffe4ec"/>
        <stop offset="100%" stop-color="#fecdd3"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="120" height="120" fill="url(#g)"/>
  </svg>`)
// 心形填充的固定数量
const FILL_COUNT = 40
const galleryItems = computed(() => {
  const res: Array<{id?:string; img:string; text?:string}> = []
  for (const p of posts.value){ if (p?.img) res.push({ id:p.id, img:p.img, text:p.text }); if (res.length>=TILE_COUNT) break }
  if (res.length < TILE_COUNT){ for (const s of sweet.value){ if (s?.img) res.push({ img:s.img, text:s.text }); if (res.length>=TILE_COUNT) break } }
  // 没有任何真实数据时，不渲染占位卡片，避免出现一堆白色长方形
  if (res.length === 0) return []
  // 有真实数据时，可按需适度填充到目标数量以保证心形轮廓完整
  while (res.length < TILE_COUNT){ res.push({ img: placeholderPixel }) }
  return res.slice(0, TILE_COUNT)
})

// 心形填充网格：恰好 40 张

const fillItems = computed(() => {
  const res: Array<{id?:string; img:string; text?:string}> = []
  for (const p of posts.value){ if (p?.img) res.push({ id:p.id, img:p.img, text:p.text }); if (res.length>=FILL_COUNT) break }
  if (res.length < FILL_COUNT){ for (const s of sweet.value){ if (s?.img) res.push({ img:s.img, text:s.text }); if (res.length>=FILL_COUNT) break } }
  while (res.length < FILL_COUNT){ res.push({ img: softPlaceholder }) }
  return res.slice(0, FILL_COUNT)
})

// 心形网格（9列×8行）参考图案：1 表示显示图片，0 表示隐藏
const HEART_PATTERN: number[][] = [
  [0,0,1,1,0,1,1,0,0],
  [0,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1],
  [0,1,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,0,0],
  [0,0,0,1,1,1,0,0,0],
  [0,0,0,0,1,0,0,0,0],
]

// 演示模式：当没有真实数据时使用内置示例图
const demoMode = ref(false)
function makeDemoSvg(bg1: string, bg2: string, accent: string, glow: string){
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${bg1}"/>
          <stop offset="100%" stop-color="${bg2}"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="${glow}" stop-opacity="0.9"/>
          <stop offset="70%" stop-color="${glow}" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="${glow}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="120" height="120" rx="18" fill="url(#bg)"/>
      <circle cx="38" cy="42" r="26" fill="url(#glow)" opacity="0.55"/>
      <circle cx="82" cy="68" r="28" fill="url(#glow)" opacity="0.35"/>
      <path d="M60 48c-5-10-20-8-22 4-2 12 9 20 22 33 13-13 24-21 22-33-2-12-17-14-22-4z" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
      <g transform="translate(12 74)" fill="${accent}" opacity="0.65">
        <circle cx="8" cy="8" r="2.4"/>
        <circle cx="28" cy="14" r="1.8"/>
        <circle cx="18" cy="24" r="1.6"/>
      </g>
      <g transform="translate(70 20)" fill="${accent}" opacity="0.45">
        <circle cx="24" cy="10" r="3"/>
        <circle cx="8" cy="24" r="2.1"/>
      </g>
    </svg>
  `)
}
const DEMO_IMAGES = [
  makeDemoSvg('#fee2f2', '#fecdd3', '#f973b9', '#fde68a'),
  makeDemoSvg('#ffe4e6', '#fecaca', '#fb7185', '#fcd34d'),
  makeDemoSvg('#fbcfe8', '#e0f2fe', '#ec4899', '#fde68a'),
  makeDemoSvg('#ffe5f8', '#fef3c7', '#f472b6', '#fcd34d'),
  makeDemoSvg('#ede9fe', '#fce7f3', '#a855f7', '#c084fc'),
  makeDemoSvg('#e0f2fe', '#cffafe', '#38bdf8', '#bae6fd')
]

// Heart 图片池（来自统一API，兼容 posts/sweet 作为补充）
const heartPool = ref<string[]>([])
const heartImages = computed(() => {
  const imgs: string[] = []
  // 首选统一API返回
  for (const u of heartPool.value){ if (u) imgs.push(u) }
  // 兼容已有 posts/sweet
  if (!imgs.length){
    for (const p of posts.value){ if (p?.img) imgs.push(p.img) }
    for (const s of sweet.value){ if ((s as any)?.img) imgs.push((s as any).img) }
  }
  // 无内容时仍使用内置演示图占位（仅前端演示，后续可移除）
  if (!imgs.length){ return DEMO_IMAGES.slice() }
  return imgs
})
// 后端心形墙精确布局 cells（layout 接口返回）
const heartLayoutCells = ref<Array<{id:string; x:number; y:number; type?:string; img:string|null}>>([])

// 是否存在真实图片，用于决定是否渲染心形网格
const hasReal = computed(() => posts.value.some(p=>!!p?.img) || sweet.value.some(s=>!!s?.img))
const hasContent = computed(() => heartImages.value.length > 0)

watch(hasReal, (val) => {
  if (val && demoMode.value){
    demoMode.value = false
  }
})

// 心形上弹/上升效果
type FloatHeart = { id:number; img:string; left:number; duration:number; delay:number }
const floatHearts = ref<FloatHeart[]>([])
const floatLayer = ref<HTMLElement|null>(null)
let floatId = 1
let floatTimer: number | null = null
function pickImg(){
  const imgs = heartImages.value
  if (!imgs.length) return ''
  return imgs[Math.floor(Math.random()*imgs.length)]
}
function spawnFloat(){
  if (!floatLayer.value) return
  const rect = floatLayer.value.getBoundingClientRect()
  const HEART = 108
  const w = rect.width || 0
  const maxLeft = Math.max(0, w - HEART)
  const left = Math.random() * maxLeft
  const duration = 10 + Math.random() * 10
  const delay = Math.random() * 1.5
  const img = pickImg()
  if (!img) return
  floatHearts.value.push({ id: floatId++, img, left, duration, delay })
}
function onFloatEnd(id:number){
  const i = floatHearts.value.findIndex(x=>x.id===id)
  if (i>=0) floatHearts.value.splice(i,1)
}

// 心形网格单元：优先使用 heartLayoutCells 保持与后台一一对应；否则回退顺序填充（不重复，缺失隐藏）
const heartCells = computed(() => {
  if (heartLayoutCells.value.length){
    const out: Array<{ show:boolean; img:string; isPh:boolean; idx:number; id?:string }> = []
    let idx=0
    for (let r=0; r<HEART_PATTERN.length; r++){
      for (let c=0; c<HEART_PATTERN[r].length; c++){
        const show = HEART_PATTERN[r][c] === 1
        if (show){
          const cell = heartLayoutCells.value[idx]
          const img = cell?.img || ''
          out.push({ show:true, img, isPh: !img, idx: idx+1, id: cell?.id })
          idx++
        } else {
          out.push({ show:false, img:'', isPh:false, idx:0 })
        }
      }
    }
    return out
  }
  const imgs = heartImages.value
  const out: Array<{ show:boolean; img:string; isPh:boolean; idx:number }> = []
  let index=0
  for (let r=0; r<HEART_PATTERN.length; r++){
    for (let c=0; c<HEART_PATTERN[r].length; c++){
      const show = HEART_PATTERN[r][c] === 1
      if (show){
        if (index < imgs.length){
          out.push({ show:true, img: imgs[index], isPh:false, idx:index+1 })
        } else {
          out.push({ show:true, img:'', isPh:true, idx:index+1 })
        }
        index++
      } else {
        out.push({ show:false, img:'', isPh:false, idx:0 })
      }
    }
  }
  return out
})

function fillSize(i:number){
  // 根据索引分配大小，制造“大小不一”的感觉，但总数固定 40
  // 10 大 16 中 14 小，可按需调整
  const bigIdx = new Set([0,3,6,9,12,15,18,22,26,30])
  const midIdx = new Set([1,2,4,5,7,8,10,11,13,14,16,17,19,21,24,28])
  if (bigIdx.has(i)) return 'big'
  if (midIdx.has(i)) return 'mid'
  return 'small'
}

// 生成心形内的 40 个矩形块，绝对定位（百分比）
type Block = { left:number; top:number; w:number; h:number; img:string }
// 使用与背景相同的 SVG 心形路径进行命中检测与采样
const HEART_D = "M100 30c-15-25-55-20-60 10-5 29 25 49 60 82 35-33 65-53 60-82-5-30-45-35-60-10z"
let __heartCanvas: HTMLCanvasElement | null = null
let __heartCtx: CanvasRenderingContext2D | null = null
let __heartPath2D: Path2D | null = null
let __svgPath: SVGPathElement | null = null
let __svgLen = 0
function ensureHeartGeom(){
  if (!__heartCanvas){
    __heartCanvas = document.createElement('canvas')
    __heartCanvas.width = 200; __heartCanvas.height = 160
    __heartCtx = __heartCanvas.getContext('2d')
  }
  if (!__heartPath2D){
    __heartPath2D = new Path2D(HEART_D)
  }
  if (!__svgPath){
    const ns = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('viewBox','0 0 200 160')
    const p = document.createElementNS(ns, 'path') as SVGPathElement
    p.setAttribute('d', HEART_D)
    svg.appendChild(p)
    document.body.appendChild(svg)
    __svgPath = p
    __svgLen = (__svgPath as any).getTotalLength ? __svgPath.getTotalLength() : 800
    // 立即移除容器，仅保留元素也可工作
    svg.remove()
  }
}
function inHeart(nx:number, ny:number){
  if (typeof document === 'undefined') return true
  ensureHeartGeom()
  const ctx = __heartCtx!
  const path = __heartPath2D!
  const x = nx * 200
  const y = ny * 160
  return ctx.isPointInPath(path, x, y)
}
function sampleHeartPath(count:number){
  ensureHeartGeom()
  const pts: Array<{x:number;y:number}> = []
  const p = __svgPath!
  const len = __svgLen || 800
  for (let i=0;i<count;i++){
    const L = (i + 0.5) / count * len
    const pt = p.getPointAtLength(L)
    pts.push({ x: pt.x/200, y: pt.y/160 })
  }
  return pts
}
function distToPath(nx:number, ny:number, samples: Array<{x:number;y:number}>){
  let min = Infinity
  for (let i=0;i<samples.length;i++){
    const dx = nx - samples[i].x
    const dy = ny - samples[i].y
    const d = Math.hypot(dx, dy)
    if (d < min) min = d
  }
  return min
}
function estimateHeartAreaFrac(){
  // 采样估算心形在 0..1×0..1 中的面积占比
  const SX = 80, SY = 64
  let inside = 0
  for (let y=0;y<SY;y++){
    for (let x=0;x<SX;x++){
      const nx = (x+0.5)/SX
      const ny = (y+0.5)/SY
      if (inHeart(nx, ny)) inside++
    }
  }
  return inside / (SX*SY)
}
  const fillLayout = computed<Block[]>(() => {
    const items = fillItems.value
    if (!items.length) return []
    const N = FILL_COUNT
    // 使用心形路径样本用于距离计算
    const edgeSamples = sampleHeartPath(720)
    // 估算心形面积占比，用于推导单图目标面积与初始宽度
    const areaFrac = estimateHeartAreaFrac() // 相对 0..1×0..1 的比例
    // 网格分辨率（列×行），按容器百分比；行数依据 200:160 比例自适应
  const COLS = 24
    const ROWS = Math.round(COLS * 160 / 200)
    const cw = 100 / COLS
    const ch = 100 / ROWS
  const inner = 0.80 // 单元内部缩放，形成微间距（略小，提升可用密度）
  const EDGE_CLEAR = 1.6 // 更贴边但仍保留安全带，避免覆盖外轮廓
    // 收集所有“可用单元”（中心与四角均在心内，且距边大于清晰区）
    const cells: Array<{x:number;y:number;w:number;h:number}> = []
    for (let r=0;r<ROWS;r++){
      for (let c=0;c<COLS;c++){
        const x = (c + 0.5) / COLS
        const y = (r + 0.5) / ROWS
        if (!inHeart(x,y)) continue
        // 仅以中心点判断进入心形，后续放置时再做角点严格校验
        const d = distToPath(x,y, edgeSamples) * 100
        if (d < EDGE_CLEAR) continue
        cells.push({ x, y, w: cw*inner, h: ch*inner })
      }
    }
    // 从可用单元中挑选恰好 N 个：使用“蓝噪声”式最小间距策略
    const picked: typeof cells = []
    let minGap = Math.min(cw, ch) * 0.9
    // 若不够则逐步降低最小间距
    for (let relax=0; relax<6 && picked.length < N; relax++){
      picked.length = 0
      for (let i=0;i<cells.length;i++){
        const cand = cells[(i*37 + 13) % cells.length] // 打散顺序
        let ok = true
        for (const p of picked){
          const dx = (cand.x - p.x) * 100
          const dy = (cand.y - p.y) * 100
          if (Math.hypot(dx, dy) < minGap) { ok=false; break }
        }
        if (ok) picked.push(cand)
        if (picked.length >= N) break
      }
      minGap *= 0.84
    }
    // 如果仍不足，放宽边缘清晰区再追加
    if (picked.length < N){
      const more: typeof cells = []
      for (const c of cells){
        const d = distToPath(c.x, c.y, edgeSamples) * 100
        if (d >= Math.max(1.6, EDGE_CLEAR*0.7)) more.push(c)
      }
      for (const cand of more){
        let ok = true
        for (const p of picked){
          const dx = (cand.x - p.x) * 100
          const dy = (cand.y - p.y) * 100
          if (Math.hypot(dx, dy) < minGap*0.8) { ok=false; break }
        }
        if (ok) picked.push(cand)
        if (picked.length >= N) break
      }
    }
    // 将中心转换为竖向 3:4 矩形，逐个放置并做严格校验
    const placed: Block[] = []
    const ASPECT = 4/3 // 高:宽 = 4:3（竖向）
  const PAD = 0.05 // 更紧凑的最小间距，便于密排到 40 张
    function insideAndClear(x:number, y:number, w:number, h:number){
      const halfW = w/200, halfH = h/160
      const pts = [ [x-halfW, y-halfH], [x+halfW, y-halfH], [x-halfW, y+halfH], [x+halfW, y+halfH] ]
      for (const [px,py] of pts){ if (!inHeart(px,py)) return false }
      if (distToPath(x,y, edgeSamples)*100 < EDGE_CLEAR) return false
      const cornerClear = Math.max(1.2, EDGE_CLEAR*0.7)
      for (const [px,py] of pts){ if (distToPath(px,py, edgeSamples)*100 < cornerClear) return false }
      return true
    }
    function overlaps(a:Block, b:Block){
      return !(a.left + a.w + PAD <= b.left || b.left + b.w <= a.left - PAD || a.top + a.h + PAD <= b.top || b.top + b.h <= a.top - PAD)
    }
    function overlapsPad(a:Block, b:Block, pad:number){
      return !(a.left + a.w + pad <= b.left || b.left + b.w <= a.left - pad || a.top + a.h + pad <= b.top || b.top + b.h <= a.top - pad)
    }
    function canPlaceRect(left:number, top:number, w:number, h:number){
      const centerX = (left + w/2)/100
      const centerY = (top + h/2)/100
      if (!insideAndClear(centerX, centerY, w, h)) return false
      const temp: Block = { left, top, w, h, img: '' }
      for (const p of placed){ if (overlaps(temp, p)) return false }
      return true
    }
    function canPlaceRectPad(left:number, top:number, w:number, h:number, pad:number){
      const centerX = (left + w/2)/100
      const centerY = (top + h/2)/100
      if (!insideAndClear(centerX, centerY, w, h)) return false
      const temp: Block = { left, top, w, h, img: '' }
      for (const p of placed){ if (overlapsPad(temp, p, pad)) return false }
      return true
    }
    function tryPlaceAt(c:{x:number;y:number}, idx:number){
      // 以心形面积估算单图目标面积，结合网格宽度给出多档候选
  const targetArea = (areaFrac * 100 * 100) / N // 百分比面积
  const baseWByArea = Math.sqrt(targetArea / ASPECT) * 0.90
  const baseWByGrid = cw * 1.05
  const baseW = Math.min(baseWByArea, baseWByGrid)
  const minWAllowed = baseW * 0.88
  const maxWAllowed = baseW * 1.18
  const sizes = [ baseW*1.10, baseW*1.00, baseW*0.94, baseW*0.88 ]
      for (const w0 of sizes){
        let w = Math.min(w0, maxWAllowed), h = Math.min(w0, maxWAllowed) * ASPECT
        // 初始左上角（百分比）
        let left = c.x*100 - w/2
        let top = c.y*100 - h/2
        // 若越界或过近，则渐缩
        let tries=0
        while (tries++ < 18){
          if (canPlaceRect(left, top, w, h)){
            placed.push({ left, top, w, h, img: (items[idx]?.img) || softPlaceholder })
            return true
          }
          w *= 0.94; if (w < minWAllowed) break; h = w * ASPECT
          left = c.x*100 - w/2; top = c.y*100 - h/2
        }
      }
      return false
    }
    // 先用挑选的中心
    let idx=0
    while (placed.length < N && idx < picked.length){ tryPlaceAt(picked[idx], idx); idx++ }
    // 不足则从全部可用单元追加
    let j=0
    while (placed.length < N && j < cells.length){ tryPlaceAt(cells[j], placed.length); j++ }
    // 随机回填：在心形内做飞镖采样，使用“足够大”的最小尺寸直至凑满 N（避免小圆点）
    if (placed.length < N){
      const r = seededRng(20251010)
      const targetArea = (areaFrac * 100 * 100) / N
  const baseW = Math.min(Math.sqrt(targetArea / ASPECT) * 0.90, cw * 1.05)
  let w = baseW * 0.96
  const minW = Math.max(baseW * 0.88, cw * 0.90)
  const maxW = baseW * 1.18
      let guard = 0
      while (placed.length < N && guard++ < 4000){
        // 采样心形内部（拒绝采样确保中心与下半区得到更多点）
        let nx = r(), ny = r()
        for (let k=0;k<12;k++){ nx = r()*0.92 + 0.04; ny = r()*0.80 + 0.08; if (inHeart(nx, ny)) break }
        const x = nx, y = ny
        const left = x*100 - w/2
        const top = y*100 - w*ASPECT/2
        if (canPlaceRect(left, top, w, w*ASPECT)){
          const idx = placed.length
          placed.push({ left, top, w, h: w*ASPECT, img: (items[idx]?.img) || softPlaceholder })
        }
        if (guard % 40 === 0 && w > minW) w = Math.max(minW, w * 0.97)
        if (w > maxW) w = maxW
      }
    }
    // 二次“生长”循环：在不压线与不重叠的前提下，逐步放大，尽量铺满心形
    function currentCoverage(){
      let sum = 0
      for (const b of placed) sum += (b.w*b.h)
      const total = areaFrac * 100 * 100
      return sum / Math.max(1e-6, total)
    }
    function growAll(rounds=28, step=1.03, target=0.93){
      // 基于目标尺寸限制最大差异：不超过 ±30%
      const targetArea = (areaFrac * 100 * 100) / N
      const baseW = Math.sqrt(targetArea / ASPECT)
      const maxWAllowed = baseW * 1.30
      const minWAllowed = baseW * 0.90
      const order = placed.map((b, i) => ({ i, cx: b.left + b.w/2, cy: b.top + b.h/2 }))
        .sort((a,b) => {
          const da = Math.hypot(a.cx-50, a.cy-40) // 心形相对中心（50,40）
          const db = Math.hypot(b.cx-50, b.cy-40)
          return da - db
        })
      for (let r=0;r<rounds;r++){
        for (const o of order){
          const b = placed[o.i]
          if (!b) continue
          const cx = b.left + b.w/2
          const cy = b.top + b.h/2
          let nw = Math.min(b.w * step, maxWAllowed)
          const nh = nw * ASPECT
          const nl = cx - nw/2
          const nt = cy - nh/2
          if (canPlaceRect(nl, nt, nw, nh)){
            b.left = nl; b.top = nt; b.w = nw; b.h = nh
          } else if (b.w < minWAllowed) {
            // 对过小块给予轻微优先增长，改善差异
            nw = Math.min(minWAllowed, b.w * (step + 0.01))
            const nh2 = nw * ASPECT
            const nl2 = cx - nw/2
            const nt2 = cy - nh2/2
            if (canPlaceRect(nl2, nt2, nw, nh2)){
              b.left = nl2; b.top = nt2; b.w = nw; b.h = nh2
            }
          }
        }
        if (currentCoverage() >= target) break
      }
    }
    growAll()
    // 最终保证：若仍不足 40，使用受控尺寸在网格中心与随机心内点继续尝试，直到凑满 N
    if (placed.length < N){
  const targetArea2 = (areaFrac * 100 * 100) / N
  const baseW2 = Math.min(Math.sqrt(targetArea2 / ASPECT) * 0.88, cw * 0.98)
  let w = Math.max(baseW2 * 0.96, cw * 0.92, 2.6)
  const wFloor = Math.max(baseW2 * 0.86, cw * 0.86, 2.2)
      let rounds = 0
      const r2 = seededRng(20251011)
      while (placed.length < N && w >= wFloor && rounds++ < 36){
        // 先按网格中心顺序尝试
        for (let i=0;i<cells.length && placed.length < N;i++){
          const c = cells[i]
          const left = c.x*100 - w/2
          const top = c.y*100 - (w*ASPECT)/2
          if (canPlaceRectPad(left, top, w, w*ASPECT, Math.min(PAD, 0.045))){
            const idx2 = placed.length
            placed.push({ left, top, w, h: w*ASPECT, img: (items[idx2]?.img) || softPlaceholder })
          }
        }
        // 再用心内随机点兜底
        let guard=0
        while (placed.length < N && guard++ < 400){
          let nx = r2()*0.92 + 0.04
          let ny = r2()*0.80 + 0.08
          if (!inHeart(nx, ny)) continue
          const left = nx*100 - w/2
          const top = ny*100 - (w*ASPECT)/2
          if (canPlaceRectPad(left, top, w, w*ASPECT, Math.min(PAD, 0.045))){
            const idx2 = placed.length
            placed.push({ left, top, w, h: w*ASPECT, img: (items[idx2]?.img) || softPlaceholder })
          }
        }
        if (placed.length < N) w *= 0.97
      }
      // 轻微生长平滑
      growAll(10, 1.02, 0.92)
    }
    return placed.slice(0, N)
  })
function tileClass(i:number){
  const m = i % 10
  if (m===0 || m===6) return 'lg'
  if (m===1 || m===3 || m===7) return 'md'
  return 'sm'
}
const loading = ref(false)
const router = useRouter()
const auth = useAuth()
// 已移除主题切换，页面使用默认配色
// 仅使用心形 tile 展示
const mosaic = ref(false)
const pageEl = ref<HTMLElement | null>(null)
// 提供固定配色占位，避免模板中引用报错（即使相关片段已关闭）
const cssVars = { heart1: '#fecdd3', heart2: '#fbcfe8' }
const celebrate = ref(false)

function rand(n:number){ return Math.floor(Math.random()*n) }
function randomStyle(seed:string){
  // 伪随机：根据 id 稳定生成旋转与位移
  let h = 0; for (let i=0;i<seed.length;i++) h = (h*31 + seed.charCodeAt(i)) >>> 0
  const rot = (h % 21) - 10 // -10 ~ 10 度
  const shift = (h % 16) - 8 // -8 ~ 8 px
  const z = 1 + (h % 3) * 0.02
  return { transform: `rotate(${rot}deg) translate(${shift}px, ${-shift}px) scale(${z})` }
}

async function load(){
  loading.value = true
  try{
    const ctrl = new AbortController()
    const t = window.setTimeout(()=> ctrl.abort(), 6000)
    const { data } = await api.get('/api/confession/list', { signal: ctrl.signal });
    window.clearTimeout(t)
    posts.value = data?.list || []
    // 拉取 Heart 统一图片池
    heartPool.value = await fetchHeartImages(90)
    // 获取心形墙精确布局
    try {
      const lr = await api.get('/api/confession/heart/layout')
      if (lr?.data?.ok && Array.isArray(lr.data.cells)) {
        heartLayoutCells.value = lr.data.cells.map((c:any) => ({ id:String(c.id), x:Number(c.x), y:Number(c.y), type:String(c.type||'square'), img: c.img ? String(c.img) : null }))
      }
    } catch {}
  }catch{ posts.value = [] } finally { loading.value = false }
}

async function loadSweet(){
  try{
    const ctrl = new AbortController();
    const t = window.setTimeout(()=> ctrl.abort(), 6000)
    const { data } = await api.get('/api/confession/sweet/list', { signal: ctrl.signal })
    window.clearTimeout(t)
    const list = Array.isArray(data?.list) ? data.list : []
    sweet.value = list.map((it:any) => {
      if (typeof it === 'string') return { img: it }
      if (it && typeof it === 'object') return { img: it.url || it.img || '', text: it.text }
      return null
    }).filter(Boolean) as SweetItem[]
  }catch{ sweet.value = [] }
}

// 兼容变量保留但不再用于渲染
const displayPosts = computed(() => [])
// 心形拼图集合
type SimpleItem = { id?: string; img: string; text?: string }
// 限制展示数量为 36（30-40 范围内），更贴近心形轮廓的稀疏感
const mosaicCapacity = ref(36)
const allImages = computed<SimpleItem[]>(() => {
  const a: SimpleItem[] = []
  for (const p of posts.value) a.push({ id: p.id, img: p.img, text: p.text })
  for (const s of sweet.value) a.push({ img: s.img, text: s.text })
  while (a.length < mosaicCapacity.value) a.push({ img: placeholderPixel })
  return a
})
const mosaicItems = computed(() => allImages.value.slice(0, mosaicCapacity.value))
type LayoutItem = { top:string; left:string; rot:string; z:number; scale:number; delay:number }
function seededRng(seed:number){ return function(){ seed = (seed * 9301 + 49297) % 233280; return seed / 233280 } }
function makeLayout(count:number, dense=false, mode: 'heart'|'cloud'='heart'){
  // 自然云状分布：中心偏置 + 简化泊松采样，生成不规则云团点集（仅在 cloud 模式下使用）
  if (mode === 'cloud'){
    const r = seededRng(20251008)
    const LEFT_MIN = 6, LEFT_MAX = 94
    const TOP_MIN = 6, TOP_MAX = 72
    const RX = LEFT_MAX - LEFT_MIN
    const RY = TOP_MAX - TOP_MIN
    const area = RX * RY
    const base = Math.sqrt(area / Math.max(1, count))
    const minD = (dense ? 1.8 : 2.4) * base // 百分比单位的最小距离
    const tries = Math.min(2000, 600 + count * 30)

    // 以极坐标采样半径，r^(alpha) 使点更集中于中心；alpha 越小越集中
    const alpha = dense ? 0.55 : 0.65
    const spreadX = dense ? 0.78 : 0.86
    const spreadY = dense ? 0.82 : 0.92
    const pts: Array<{x:number;y:number}> = [] // 0..1 归一化

    function radialSample(){
      const theta = r() * Math.PI * 2
      const rad = Math.pow(r(), alpha) // [0,1)
      const x = 0.5 + Math.cos(theta) * rad * 0.5 * spreadX
      const y = 0.5 + Math.sin(theta) * rad * 0.5 * spreadY
      return { x, y }
    }
    function ok(p:{x:number;y:number}){
      for (let i=0;i<pts.length;i++){
        const dx = (p.x - pts[i].x) * RX
        const dy = (p.y - pts[i].y) * RY
        if (Math.hypot(dx, dy) < minD * (0.92 + r()*0.18)) return false
      }
      return true
    }
    let guard=0
    while (pts.length < count && guard++ < tries){
      const p = radialSample()
      if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) continue
      if (ok(p)) pts.push(p)
    }
    // 若点不足，用轻抖动补齐
    while (pts.length < count){
      const q = radialSample();
      pts.push({ x: Math.min(1, Math.max(0, q.x + (r()*0.06 - 0.03))), y: Math.min(1, Math.max(0, q.y + (r()*0.06 - 0.03))) })
    }

    // 映射到百分比并生成布局项
    const items: LayoutItem[] = pts.slice(0, count).map((p, i) => {
      const leftP = LEFT_MIN + p.x * RX
      const topP = TOP_MIN + p.y * RY
      const rot = (dense ? (r()*5 - 2.5) : (r()*9 - 4.5)).toFixed(1)
      const z = 10 + Math.floor(r()*20)
      const scale = dense ? 1 : (0.94 + r()*0.1)
      const delay = i * 0.05
      return {
        top: `${Math.max(TOP_MIN, Math.min(TOP_MAX, topP))}%`,
        left: `${Math.max(LEFT_MIN, Math.min(LEFT_MAX, leftP))}%`,
        rot, z, scale, delay
      }
    })
    return items
  }

  const r = seededRng(20251005)
  // 心形曲线布局 + 行带字幕避让
  const LEFT_MIN = 5, LEFT_MAX = 95
  // 为容纳 40 张，略增纵向高度范围
  const TOP_MIN = 2, TOP_MAX = 60
  const CAPTION_W = dense ? 3.2 : 9.8  // 密集模式缩小“占位宽度”
  const MIN_GAP = dense ? 0.4 : 1.4    // 密集模式减小间距
  const BAND_SIZE = dense ? 6 : 7      // 略微减小分桶
  // 记录边界点数量，便于后续对边界采用更小抖动
  let edgeN = 0

  function heart(t:number){
    let x = 16 * Math.pow(Math.sin(t), 3)
    let y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)
    if (dense){
      // 让外轮廓更饱满：横向/纵向进一步加强，顶部凹陷更明显，左右两侧更鼓，底部尖角更长
      const SX = 1.18, SY = 1.28
      x *= SX; y *= SY
      // 左右两侧微鼓（增宽上半部形体）
      const bulge = 1 + 0.12 * (Math.sin(t) * Math.sin(t))
      x *= bulge
      // 顶部 notch：在 t≈π 处向上拉（与装饰心形更贴合）
      const notch = 1.35, sigma = 0.44
      const d = t - Math.PI
      y += notch * Math.exp(-(d*d)/(2*sigma*sigma))
      // 底部尖角：在 t≈1.5π 处向下拉，形成更明显的尖角（与左下装饰心一致）
      const tipMag = 1.2, sigT = 0.45
      const db = t - 1.5*Math.PI
      y -= tipMag * Math.exp(-(db*db)/(2*sigT*sigT))
    }
    return { x, y }
  }
  // 基于装饰心形 SVG 路径精确取样（密集模式）；否则使用解析式心形
  const HEART_PATH = "M100 30c-15-25-55-20-60 10-5 29 25 49 60 82 35-33 65-53 60-82-5-30-45-35-60-10z"
  let norm: Array<{x:number;y:number}> = []
  if (dense && typeof document !== 'undefined'){
    const ns = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('viewBox', '0 0 200 160')
    svg.style.position = 'absolute'; svg.style.width = '0'; svg.style.height = '0'; svg.style.opacity = '0';
    const path = document.createElementNS(ns, 'path') as SVGPathElement
    path.setAttribute('d', HEART_PATH)
    svg.appendChild(path)
    document.body.appendChild(svg)
  const len = (path as any).getTotalLength ? path.getTotalLength() : 800
  // 提高边界占比（更接近外轮廓），减少内部点
  const EDGE_RATIO = 0.85
  const edgeCount = Math.max(40, Math.floor(count * EDGE_RATIO))
  const innerCount = Math.max(0, count - edgeCount)
  edgeN = edgeCount
    // 边界：按路径长度等距采样，加入极小抖动
    for (let i=0;i<edgeCount;i++){
      const l = (i + r()) / edgeCount * len
      const pt = path.getPointAtLength(l)
  norm.push({ x: (pt.x)/200, y: (pt.y)/160 })
    }
    // 内部：从边界向心生成若干层点
    // 计算质心（用边界点近似）
    let cx=0, cy=0; for (const p of norm){ cx+=p.x; cy+=p.y } cx/=Math.max(1,norm.length); cy/=Math.max(1,norm.length)
    for (let i=0;i<innerCount;i++){
      const bp = norm[Math.floor(r()*norm.length)]
      // 内点集中在中心区域，避免靠近外边形成“厚边”
      const rr = 0.05 + r()*0.45
      const x = cx + (bp.x - cx) * rr + (r()*2 - 1) * 0.0015
      const y = cy + (bp.y - cy) * rr + (r()*2 - 1) * 0.0015
      norm.push({ x, y })
    }
    // 清理临时 SVG
    svg.remove()
    // 对全部点做 0..1 的自适应归一化，避免使用绝对坐标导致纵向被压缩
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity
    for (const p of norm){ if (p.x<minX)minX=p.x; if (p.x>maxX)maxX=p.x; if (p.y<minY)minY=p.y; if (p.y>maxY)maxY=p.y }
    const dx = Math.max(1e-6, maxX-minX)
    const dy = Math.max(1e-6, maxY-minY)
    norm = norm.map(p => ({ x: (p.x - minX)/dx, y: (p.y - minY)/dy }))
  } else {
    const sampleN = Math.max(count * (dense ? 2 : 3), dense ? 200 : 120)
    const samples: Array<{x:number;y:number}> = []
    for (let i=0;i<sampleN;i++){
      const t = (Math.PI * 2) * (i / (sampleN - 1))
      samples.push(heart(t))
    }
    // 归一化
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity
    for (const p of samples){ if (p.x<minX)minX=p.x; if (p.x>maxX)maxX=p.x; if (p.y<minY)minY=p.y; if (p.y>maxY)maxY=p.y }
    norm = samples.map(p => ({ x: (p.x - minX) / (maxX - minX), y: (p.y - minY) / (maxY - minY) }))
  }

  // 仅沿外轮廓取点：避免中心区域的悬浮图片
  const picked: Array<{x:number;y:number}> = []
  const pickIdx: number[] = []
  if (!dense){
    const edgeCount = count
    const stepEdge = Math.max(1, Math.floor(norm.length / Math.max(1, edgeCount)))
    for (let i=0; i<edgeCount; i++){
      const base = i*stepEdge
      const idx = Math.min(norm.length-1, base + Math.floor(r()*Math.max(1, Math.floor(stepEdge*0.5))))
      picked.push(norm[idx])
      pickIdx.push(idx)
    }
  } else {
    picked.push(...norm.slice(0, count))
    for (let i=0;i<count;i++) pickIdx.push(i)
  }

  // 用于近似切线方向的步长（独立于选点步长）
  const step = Math.max(1, Math.floor(720 / Math.max(1, count)))

  // 映射到百分比坐标，并加少量随机扰动
  type Node = { left:number; top:number; rot:string; z:number; scale:number; delay:number }
  // 局部质心用于 dense 模式旋转角度微调
  let cxLocal=0, cyLocal=0; for (const p of norm){ cxLocal+=p.x; cyLocal+=p.y } cxLocal/=Math.max(1, norm.length); cyLocal/=Math.max(1, norm.length)
  const raw: Node[] = picked.map((p, i) => {
    // 抖动：边界更小，内部略大，保证外轮廓更干净
    const isEdge = dense && i < edgeN
  const jitterX = dense ? (isEdge ? 0.04 : 0.08) : 0.4
  const jitterY = dense ? (isEdge ? 0.04 : 0.08) : 0.3
  // 横向稍收、纵向略增，让心形更“高”，为 40 张留空间
  const SCALE_X = dense ? 0.66 : 0.94
  const SCALE_Y = dense ? 1.06 : 1.04
  const OFFSET_Y = dense ? -0.018 : -0.04
    const px = Math.min(1, Math.max(0, 0.5 + (p.x - 0.5) * SCALE_X))
    const py = Math.min(1, Math.max(0, 0.5 + (p.y - 0.5) * SCALE_Y + OFFSET_Y))
  let left = LEFT_MIN + px * (LEFT_MAX - LEFT_MIN) + (r()*2 - 1) * jitterX // 抖动
  let top = TOP_MIN + py * (TOP_MAX - TOP_MIN) + (r()*2 - 1) * jitterY // 抖动
  // 约束在可视区内，避免被裁掉
  left = Math.max(LEFT_MIN, Math.min(LEFT_MAX, left))
  top = Math.max(TOP_MIN, Math.min(TOP_MAX, top))
    // 旋转稍微跟随曲线方向（用邻近点近似切线），再加少量随机
    let rot: string
    if (dense){
      const angle = Math.atan2((cyLocal - p.y), (p.x - cxLocal)) * 180 / Math.PI
      rot = (angle * 0.15 + (r()*8 - 4)).toFixed(1)
    } else {
      // 使用邻近的已选路径索引计算切线，避免越界
      const idx = Math.max(0, Math.min(norm.length-1, pickIdx[i] ?? Math.round((i/Math.max(1, count-1))*(norm.length-1))))
      const i0 = Math.max(0, Math.min(norm.length-1, idx - 1))
      const j = Math.max(0, Math.min(norm.length-1, idx + 1))
      const dx = norm[j].x - norm[i0].x
      const dy = norm[j].y - norm[i0].y
      const angle = Math.atan2(dy, dx) * 180 / Math.PI
      rot = (angle * 0.4 + (r()*10 - 5)).toFixed(1) // 减弱对齐，保留散落感
    }
    const z = 10 + Math.floor(r()*20)
  const scale = 0.82 + r()*0.14
    const delay = i * 0.05
    return { left, top, rot, z, scale, delay }
  })

  // 行带内字幕水平避让（允许图片自身重叠，但文字不重叠）。
  // 密集拼图（mosaic）隐藏字幕，需保持形状精确，因此跳过该步骤。
  if (!dense){
    const bands: Record<number, Node[]> = {}
    for (const n of raw){
      const b = Math.floor(n.top / BAND_SIZE)
      ;(bands[b] ||= []).push(n)
    }
    function resolve(nodes: Node[]){
      nodes.sort((a,b)=>a.left-b.left)
      const inUse: Array<[number, number]> = []
      function canPlace(L:number){ const A=L, B=L+CAPTION_W; return inUse.every(([uA,uB]) => B <= uA || A >= uB || Math.min(Math.abs(A-uB), Math.abs(B-uA)) >= MIN_GAP) }
      for (const n of nodes){
        let L = Math.max(LEFT_MIN, Math.min(LEFT_MAX - CAPTION_W, n.left))
        if (!canPlace(L)){
          let found=false
          for (let step=0; step<=60 && !found; step++){
            const r1 = Math.min(LEFT_MAX - CAPTION_W, L + step)
            if (canPlace(r1)) { L=r1; found=true; break }
            const l1 = Math.max(LEFT_MIN, L - step)
            if (canPlace(l1)) { L=l1; found=true; break }
          }
        }
        // 极小抖动保证自然
        L = Math.max(LEFT_MIN, Math.min(LEFT_MAX - CAPTION_W, L + (r()*0.6 - 0.3)))
        inUse.push([L, L+CAPTION_W])
        n.left = L
      }
    }
    Object.values(bands).forEach(resolve)
  }

  const items: LayoutItem[] = raw.map(n => ({
    top: `${Math.max(TOP_MIN, Math.min(TOP_MAX, n.top))}%`,
    left: `${Math.max(LEFT_MIN, Math.min(LEFT_MAX, n.left))}%`,
    rot: n.rot, z: n.z, scale: n.scale, delay: n.delay
  }))
  return items
}
// 让占位标签随语言切换而更新
const placeholders = computed(() => [
  { id:1, label:t('confession.places.sea'), bg:'linear-gradient(135deg,#fecdd3,#fde1e8)' },
  { id:2, label:t('confession.places.cafe'), bg:'linear-gradient(135deg,#ffd1dc,#ffe4ec)' },
  { id:3, label:t('confession.places.park'), bg:'linear-gradient(135deg,#f5d0fe,#fee2ff)' },
  { id:4, label:t('confession.places.night'), bg:'linear-gradient(135deg,#fecaca,#fee2e2)' },
  { id:5, label:t('confession.places.hike'), bg:'linear-gradient(135deg,#f9a8d4,#fbcfe8)' },
  { id:6, label:t('confession.places.ticket'), bg:'linear-gradient(135deg,#e9d5ff,#f5d0fe)' },
  { id:7, label:t('confession.places.anniversary'), bg:'linear-gradient(135deg,#fecaca,#ffd1dc)' },
  { id:8, label:t('confession.places.surprise'), bg:'linear-gradient(135deg,#ffd1dc,#ffe4e6)' },
  { id:9, label:t('confession.places.travel'), bg:'linear-gradient(135deg,#fecdd3,#ffe4e6)' },
])
// 默认使用心形布局；如需自然云状可将 LAYOUT_MODE 改为 'cloud'
const LAYOUT_MODE: 'heart'|'cloud' = 'heart'
const layout = computed(() => {
  const n = tileMode ? galleryItems.value.length : (mosaic.value ? mosaicItems.value.length : (displayPosts.value.length || (sweet.value.length || placeholders.value.length)))
  // tile 模式下强制使用 outline-only（dense=false）来避免中心区域出现图片
  const dense = tileMode ? false : mosaic.value
  return makeLayout(n, dense, LAYOUT_MODE)
})
function scatterStyle(i:number){
  const L = layout.value[i] || { top: `${8 + (i%8)*6}%`, left: `${8 + ((i*11)%88)}%`, rot: '0', z: 1, scale: 1, delay: i*0.04 }
  return {
    top: L.top, left: L.left, 'z-index': String(L.z),
    '--rot': `${L.rot}deg`, '--scale': String(L.scale), '--delay': `${L.delay}s`
  } as any
}

const bubbleText = computed(() => {
  const txt = posts.value[0]?.text?.trim()
  return txt && txt.length ? txt : t('confession.defaultBubble')
})

function onImgError(e: Event){
  const el = e.target as HTMLImageElement
  if (el){ el.style.display = 'none' }
}

const fileEl = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const form = ref<{ img:string; text:string }>({ img:'', text:'' })
const formCard = ref<HTMLElement | null>(null)
const dragging = ref(false)
const uploading = ref(false)
const submitting = ref(false)
// 审核状态：与身份/头像一致，支持 none/pending/approved/rejected
const cStatus = ref<'none'|'pending'|'approved'|'rejected'>('none')
let cPollTimer: number | null = null
const uploadErr = ref('')
const submitMsg = ref('')
const submitErr = ref(false)

function focusForm(){ formCard.value?.scrollIntoView({ behavior:'smooth', block:'start' }) }
function triggerPick(){ if (formDisabled.value) return; fileEl.value?.click() }

function onPick(e: Event){
  if (formDisabled.value) return
  const t=e.target as HTMLInputElement; file.value = t.files?.[0] || null
  if (file.value) {
    try { form.value.img = URL.createObjectURL(file.value) } catch {}
    // 选择新图片后，若先前为“已通过/已驳回”，重置为可提交
    if (cStatus.value === 'approved' || cStatus.value === 'rejected') cStatus.value = 'none'
    submitMsg.value = ''
    submitErr.value = false
  }
}
async function upload(){
  uploadErr.value = ''
  if (!file.value) return
  if (formDisabled.value) return
  // 登录校验
  if (!auth.token) { router.push('/login'); return }
  // 基本校验
  const f = file.value
  if (!/^image\//i.test(f.type)) { uploadErr.value = t('confession.errOnlyImage'); return }
  const max = 8 * 1024 * 1024
  if (f.size > max) { uploadErr.value = t('confession.errTooLarge'); return }
  uploading.value = true
  try{
    const fd = new FormData(); fd.append('file', f)
    const { data } = await api.post('/api/confession/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    form.value.img = data?.url || form.value.img
    // 上传成功后允许重新提交
    if (cStatus.value === 'approved' || cStatus.value === 'rejected') cStatus.value = 'none'
  }catch(e:any){
    uploadErr.value = t('common.uploadFailedRetry')
  }finally{
    uploading.value = false
  }
}

const uploadedOk = computed(() => {
  const u = String(form.value.img || '')
  // 兼容相对路径 /static/...、协议化 http(s)://host/static/...、以及协议相对 //host/static/...
  return /^(?:\/static\/|https?:\/\/[^\s]+\/static\/|\/\/[^\s]+\/static\/)/i.test(u)
})
// 按钮可点条件：
// - 若已有通过/驳回的历史图片，则需要重新选择图片后才可提交
// - 若无历史状态（none），已选择文件或已上传至 /static/ 均可提交
const canSubmit = computed(() => {
  if (cStatus.value === 'pending') return false
  if (cStatus.value === 'approved' || cStatus.value === 'rejected') {
    return !!file.value // 仅当重新选择了图片时可提交
  }
  // none 状态
  return !!file.value || uploadedOk.value
})
// 审核中禁用所有表单交互；通过后允许重新选择并再次提交
const formDisabled = computed(() => cStatus.value === 'pending')
const submitLabel = computed(() => {
  // 读取 locale 以建立依赖，确保语言切换时文案更新
  void locale.value
  if (submitting.value) return t('common.submitting')
  if (cStatus.value === 'pending') return t('confession.status.pending')
  if (cStatus.value === 'approved') return t('confession.status.approved')
  if (cStatus.value === 'rejected') return t('confession.status.rejected')
  return t('confession.submit')
})

async function loadConfessionStatus(){
  try{
    const { data } = await api.get('/api/review/status', { params: { type: 'confession' } })
    const prev = cStatus.value
    const s = String(data?.status || 'none') as any
    if (s === 'rejected' && cStatus.value !== 'rejected'){
      // 被驳回后清空上次上传的预览
      file.value = null
      form.value.img = ''
    }
    if (s === 'pending' || s === 'approved' || s === 'rejected') cStatus.value = s
    else cStatus.value = 'none'
    // 审核通过后，主动刷新左侧“甜蜜时刻”和心形墙布局
    if (s === 'approved' && prev !== 'approved') {
      await load()
      if (cPollTimer) { window.clearInterval(cPollTimer as any); cPollTimer = null }
    }
    // 审核结束（通过/驳回）后停止轮询
    if ((s === 'approved' || s === 'rejected') && cPollTimer) {
      window.clearInterval(cPollTimer as any); cPollTimer = null
    }
  }catch{}
}
function startPoll(){
  if (cPollTimer) { window.clearInterval(cPollTimer as any); cPollTimer = null }
  if (cStatus.value === 'pending'){
    cPollTimer = window.setInterval(loadConfessionStatus, 15000) as unknown as number
  }
}
async function submit(){
  submitMsg.value = ''
  submitErr.value = false
  if (!canSubmit.value) return
  if (formDisabled.value) return
  // 需要登录
  if (!auth.token) { router.push('/login'); return }
  submitting.value = true
  try{
    // 若还未上传到服务器但已有本地文件，则先自动上传
    if (!uploadedOk.value && file.value){
      await upload()
    }
    // 确保拿到服务端可访问路径
    if (!uploadedOk.value){
      submitErr.value = true
      submitMsg.value = t('common.uploadFailedRetry')
      return
    }
    // 文本不再必填，兼容传空字符串
    const { data } = await api.post('/api/confession/submit', { img: form.value.img, text: '' })
    const s = String(data?.status || '')
    if (s === 'approved' || s === 'pending') cStatus.value = s as any
    submitMsg.value = t('confession.submitted')
    // 轻量刷新一次左侧统计与展示（即使未通过审核，也能保持计数与占位稳定）
    load()
    // 触发心形礼花
    celebrate.value = true; window.setTimeout(()=> celebrate.value = false, 1400)
  }catch(e:any){
    submitErr.value = true
    submitMsg.value = t('common.submitFailed')
  }finally{
    submitting.value = false
    startPoll()
  }
}

// Drag & Drop support for the dropzone
function onDragOver(){ if (formDisabled.value) return; dragging.value = true }
function onDragLeave(){ dragging.value = false }
function onDrop(e: DragEvent){
  dragging.value = false
  if (formDisabled.value) return
  const f = e.dataTransfer?.files?.[0]
  if (f) {
    file.value = f
    try { form.value.img = URL.createObjectURL(f) } catch {}
    // 拖拽选择后重置状态到可提交
    if (cStatus.value === 'approved' || cStatus.value === 'rejected') cStatus.value = 'none'
    submitMsg.value = ''
    submitErr.value = false
  }
}

onMounted(() => {
  load(); loadSweet();
  // 初始加载当前审核状态
  loadConfessionStatus().then(startPoll)
  // 初始生成几张
  const boot = () => { for (let i=0;i<4;i++) setTimeout(spawnFloat, i*700) }
  // 周期生成
  const start = () => { if (floatTimer) window.clearInterval(floatTimer); floatTimer = window.setInterval(spawnFloat, 2200) as unknown as number }
  // 仅有真实图片时再启动
  const stop = () => { if (floatTimer){ window.clearInterval(floatTimer); floatTimer=null } }
  const unwatchContent = watch(hasContent, (v: boolean) => { if (v){ boot(); start() } else { stop() } }, { immediate:true })
  onUnmounted(() => { stop(); unwatchContent(); if (cPollTimer){ window.clearInterval(cPollTimer as any); cPollTimer = null } })
})
// 灯箱预览
const lightbox = ref<string>('')
function openLightbox(src:string){ if (src) lightbox.value = src }
function closeLightbox(){ lightbox.value = '' }
</script>

<style scoped>
.confession-page{ min-height: calc(100vh - 64px); position:relative; background:#fff; display:flex; flex-direction:column; }
.page-grid{ flex:1 1 auto; min-height:0; }
.fill-col{ display:flex; flex-direction:column; min-height:0; }
.stretch-card{ display:flex; flex-direction:column; min-height:0; height:100%; }
.romance-bg{ position:absolute; inset:0; pointer-events:none; background:
  radial-gradient(1200px 600px at -10% -10%, rgba(255,192,203,.22), transparent 60%),
  radial-gradient(900px 500px at 110% 0%, rgba(255,182,193,.18), transparent 60%),
  linear-gradient(180deg, rgba(255,240,245,.45), transparent 35%);
  filter:saturate(1.05);
}
/* 主题化背景：切换时带来可感知的整体色调变化 */
/* 主题差异背景已移除，统一使用默认 .romance-bg 设置 */
/* 背景心形纹理 */
.hearts-bg{ position:absolute; inset:0; pointer-events:none; opacity:.18; z-index:0; }

/* 顶部标题 */
.hero{ position:relative; z-index:1; max-width:1120px; margin:0 auto 8px; padding:4px 6px; display:flex; align-items:flex-end; justify-content:space-between; gap:10px; }
.hero-left h1{ font-size:28px; font-weight:900; letter-spacing:.5px; }
.hero-left .sub{ margin-top:2px; color:#9f1239; opacity:.8; font-weight:700; }
.hero-right{ display:none; gap:8px; align-items:center; }
.chip{ padding:4px 10px; border-radius:999px; background:rgba(255,255,255,.6); border:1px solid #fce7f3; color:#9f1239; font-weight:800; box-shadow:0 6px 16px rgba(0,0,0,.06); }
@media (min-width: 900px){ .hero-right{ display:flex } }

.sweet-card{ position:relative; background:#fff; border:1px solid #f3e3e6; border-radius:18px; padding:10px; box-shadow:0 10px 28px rgba(230,122,136,.12); overflow:hidden; }
.sweet-card.sweet-bg{ background-image:url('/backgrounds/sweet-flowers.jpg'); background-size:cover; background-position:center; background-repeat:no-repeat; }
/* 轻薄的前景蒙层，避免背景过亮影响对比度 */
.sweet-card.sweet-bg::before{ content:""; position:absolute; inset:0; background:linear-gradient(180deg, rgba(255,255,255,.25), rgba(255,255,255,.05)); pointer-events:none; z-index:0; }
.sweet-card .head{ position:relative; z-index:1; }
.sweet-card .scatter-canvas{ position:relative; z-index:1; }
.sweet-card .head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.sweet-card .head + .scatter-canvas{ margin-top: 2px; }
.title-wrap{ display:flex; align-items:center; gap:10px; }
.title-wrap h2{ font-weight:900; letter-spacing:.5px; }
.badge{ background:rgba(230,122,136,.12); color:#e67a88; border:1px solid rgba(230,122,136,.3); padding:2px 8px; border-radius:999px; font-weight:800; font-size:12px; }
.actions{ display:flex; gap:8px; }

.loading{ display:flex; align-items:center; gap:8px; padding:22px 10px; color:#6b7280; }
.spinner{ width:16px; height:16px; border:2px solid #f3f4f6; border-top-color:#e67a88; border-radius:50%; animation:spin 1s linear infinite; display:inline-block; }
@keyframes spin{ to{ transform:rotate(360deg) } }

/* 散落照片画布 */
.scatter-canvas{ position:relative; flex:1 1 auto; min-height:420px; padding:2px 4px 16px; overflow:hidden; }
.scatter-canvas.sweet-bg{ background-image:url('/backgrounds/sweet-stage.jpg'); background-size:cover; background-position:center; background-repeat:no-repeat; }
/* 去除底部白色渐隐遮罩，避免出现一条明显的白带影响背景展示 */
.scatter-canvas::after{ display:none; }
.scatter-canvas .heart-outline{ position:absolute; inset:auto; left:4%; top:4%; width:92%; height:auto; opacity:.55; filter: drop-shadow(0 8px 18px rgba(230,122,136,.18)); z-index:0; transform: translateY(-8%); }
.bg-heart-left{ position:absolute; left:12px; bottom:16px; opacity:.96; transform: scale(1.15) rotateY(180deg); pointer-events:none; z-index:0; }
.bg-heart-left .left-svg{ width:300px; height:auto; filter: drop-shadow(0 12px 26px rgba(230,122,136,.16)); transform-origin:55% 65%; animation: heart-left 3.8s ease-in-out infinite; }
@keyframes heart-left{ 0%,20%,100%{ transform: translateY(0) scale(1) } 10%{ transform: translateY(-3px) scale(1.04) } 60%{ transform: translateY(2px) scale(1.02) } }
@media (prefers-reduced-motion: reduce){ .bg-heart-left .left-svg{ animation: none } }
.scatter-item{ position:absolute; width:clamp(98px, 10.5vw, 156px); user-select:none; animation:float-in .6s ease both; animation-delay: var(--delay, 0s); transform: translateY(-34px) rotate(var(--rot, 0deg)) scale(var(--scale, 1)); }
.scatter-item:hover{ z-index: 999; }
.tile-mode .scatter-item{ width:auto; transform: translateY(-10px) rotate(0deg) scale(1); }
.tile{ background:#fff; border-radius:14px; border:1px solid #f4e2e6; box-shadow:0 10px 26px rgba(230,122,136,.12); overflow:hidden; display:block; }
.tile img{ width:100%; height:100%; object-fit:cover; display:block; }
.tile.lg{ width: clamp(160px, 20vw, 220px); aspect-ratio: 4/3; }
.tile.md{ width: clamp(120px, 14vw, 180px); aspect-ratio: 4/3; }
.tile.sm{ width: clamp(80px, 10vw, 120px); aspect-ratio: 1 / 1; }
.tile-mode .scatter-item figcaption{ display:none; }
.polaroid{ aspect-ratio:3/4; background:#fff; border-radius:12px; box-shadow:0 10px 24px rgba(230,122,136,.14); border:1px solid #f7dfe4; display:block; overflow:hidden; }
.polaroid img{ width:100%; height:100%; object-fit:cover; display:block; }
.polaroid:hover{ box-shadow:0 16px 30px rgba(230,122,136,.20); transform: translateY(-2px); transition: transform .15s ease, box-shadow .15s ease; }
.polaroid.ph{ display:flex; align-items:center; justify-content:center; color:#7f1d1d; font-weight:700; }
.ph-label{ text-shadow:0 1px 0 rgba(255,255,255,.8); }
.polaroid .tape{ position:absolute; width:42px; height:16px; background:linear-gradient(180deg, rgba(255,255,255,.86), rgba(255,255,255,.66)); box-shadow:0 6px 10px rgba(0,0,0,.06); border-radius:3px; opacity:.85; }
.polaroid .tape.tl{ top:-6px; left:8px; transform: rotate(-6deg); }
.polaroid .tape.tr{ top:-6px; right:8px; transform: rotate(6deg); }
.scatter-item figcaption{ margin-top:4px; text-align:center; font-size:12px; color:#9f1239; opacity:.95; position:relative; z-index:5; pointer-events:none; }

@keyframes float-in{ from{ opacity:0; transform: translateY(16px) rotate(0) scale(.9); } to { opacity:1; transform: translateY(0) rotate(var(--rot, 0deg)) scale(var(--scale, 1)); } }

/* 右下角爱心宣言泡泡 */
.bubble-wrap{ position:absolute; right:12px; bottom:10px; max-width:56%; }
.heart-bubble{ position:relative; animation: heartbeat 3.6s ease-in-out infinite; }
.bubble-svg{ width:320px; max-width:100%; height:auto; display:block; }
.bubble-text{ position:absolute; inset:0; padding:18px; display:flex; align-items:center; justify-content:center; text-align:center; color:#7a0932; font-weight:800; line-height:1.6; text-shadow:0 1px 1px rgba(255,255,255,.6); white-space:pre-line; }
.bubble-note{ margin-top:4px; font-size:11px; color:#fb7185; text-align:right; }
.empty{ text-align:center; color:#6b7280; padding:30px 10px; display:grid; place-items:center; gap:10px; }

@keyframes heartbeat{ 0%, 20%, 100% { transform: scale(1) } 10% { transform: scale(1.02) } }

.my-card{ background:#fff; border:1px solid #f3e3e6; border-radius:18px; padding:12px; box-shadow:0 10px 28px rgba(230,122,136,.12); position:relative; height:100%; }
/* 让右侧栅格项充满当前行高（与左侧相同） */
.page-grid > aside{ display:flex; }
.page-grid > aside > .my-card{ flex:1 1 auto; }
.my-card.confess-bg{ background-image:url('/backgrounds/confess-bg.jpg'); background-size:cover; background-position:center 20%; background-repeat:no-repeat; }
.my-card.confess-bg::before{ content:""; position:absolute; inset:0; background:linear-gradient(180deg, rgba(255,255,255,.70), rgba(255,255,255,.30)); pointer-events:none; border-radius:18px; }
.my-card.confess-bg .title-row, .my-card.confess-bg .sub, .my-card.confess-bg .field, .my-card.confess-bg .hint, .my-card.confess-bg .row, .my-card.confess-bg .toast{ position:relative; z-index:1; }
.title-row{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
.my-card .title{ font-weight:900; }
.mini-hint{ font-size:12px; color:#9ca3af; }
.my-card .sub{ color:#6b7280; font-size:12px; margin:6px 0 12px; }
.field{ margin:10px 0; }
.field label{ display:block; font-weight:800; margin-bottom:8px; }

.dropzone{ border:2px dashed rgba(230,122,136,.45); border-radius:14px; padding:12px; background:linear-gradient(180deg, rgba(255,240,245,.6), rgba(255,255,255,.7)); cursor:pointer; transition:border-color .18s ease, background .18s ease; }
.dropzone.dragging{ border-color:#e67a88; background:linear-gradient(180deg, rgba(255,240,245,.8), rgba(255,255,255,.9)); }
.dz-inner{ display:grid; place-items:center; gap:6px; color:#a1a1aa; font-weight:700; }
.dz-text{ font-size:12px; }

/* 心形上传框 */
.dropzone.heart{ padding:0; border-radius:16px; background:transparent; border-color: transparent; position:relative; overflow:visible; }
.heart-svg{ display:block; width:100%; max-width:100%; margin:0 auto; }
.heart-svg.enlarge{ transform: scale(1.2) translateY(20px); transform-origin: 50% 50%; }
.heart-inner{ position:absolute; inset:0; display:grid; place-items:center; color:#a1a1aa; font-weight:800; pointer-events:none; }

.preview{ background:#fff; border:1px solid #f1f5f9; border-radius:12px; padding:8px; display:grid; place-items:center; }
.preview img{ max-width:100%; max-height:260px; object-fit:contain; border-radius:8px; }

textarea{ width:100%; border:1px solid #e5e7eb; border-radius:12px; padding:10px 12px; font-size:14px; transition:border-color .15s ease, box-shadow .15s ease; }
textarea:focus{ outline:none; border-color:#e67a88; box-shadow:0 0 0 3px rgba(230,122,136,.18); }
.counter{ text-align:right; font-size:12px; color:#9ca3af; margin-top:6px; }
.counter.warn{ color:#ef6a7f; }

.row.gap{ display:flex; align-items:center; gap:10px; margin-top:8px; }
.ok{ color:#16a34a; font-weight:700; font-size:12px; }
.err{ color:#dc2626; font-weight:700; font-size:12px; }

.btn{ padding:8px 12px; border-radius:12px; background:#fff; border:1px solid #e5e7eb; font-weight:800; }
.btn-primary{ padding:10px 16px; border-radius:14px; background: var(--brand-navbar-bg); color:#fff; font-weight:900; box-shadow:0 8px 16px rgba(230,122,136,.26); border:0; }
.btn-primary:not(:disabled):hover{ background: var(--brand-navbar-bg); filter: brightness(1.06); box-shadow:0 10px 18px rgba(230,122,136,.32); }
.btn-primary:disabled{ filter:grayscale(.2); opacity:.8; }
.btn-ghost{ padding:8px 12px; border-radius:12px; background:#fff; border:1px solid #e5e7eb; font-weight:800; }

.hint{ color:#9ca3af; font-size:12px; margin-top:8px; }
.toast{ margin-top:10px; background:#ecfeff; color:#065f46; border:1px solid #a7f3d0; border-radius:12px; padding:8px 10px; font-weight:800; }
.toast.error{ background:#fff1f2; color:#9f1239; border-color:#fecdd3; }

@media (max-width: 480px){ .bubble-wrap{ max-width:72%; } }

/* 矮屏优化：进一步收紧高度与字号，提升“一屏观感” */
@media (max-height: 760px){
  .sweet-card .head{ margin-bottom:6px; }
  .scatter-canvas{ min-height:360px; }
  .scatter-item{ transform: translateY(-38px) rotate(var(--rot, 0deg)) scale(calc(var(--scale, 1) * .88)); }
  .bubble-text{ font-size: 13px; line-height: 1.45; }
}

/* 主题色变量：用于心形气泡渐变与轻背景点缀 */
:host, .confession-page{ --rom-heart-1:#fecdd3; --rom-heart-2:#fbcfe8; }

/* 主题切换胶囊按钮 */
/* 主题切换按钮样式已移除 */

/* 飘动爱心背景层 */
.float-hearts{ position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:0; }
.float-hearts .h{ position:absolute; bottom:-24px; left:var(--x, 0%); width:10px; height:10px; background:radial-gradient(circle at 30% 30%, var(--rom-heart-1), var(--rom-heart-2)); transform: rotate(45deg); opacity:.18; animation: rise 8s linear infinite; animation-delay: var(--d, 0s); }
.float-hearts .h::before, .float-hearts .h::after{ content:""; position:absolute; width:10px; height:10px; background:inherit; border-radius:50%; }
.float-hearts .h::before{ top:-5px; left:0; }
.float-hearts .h::after{ top:0; left:-5px; }
@keyframes rise{ from{ transform: translateY(10px) rotate(45deg); opacity:.1 } to{ transform: translateY(-110%) rotate(45deg); opacity:.28 } }

/* 主题装饰（樱花/星空/落日）相关样式已移除 */

/* 提交成功：心形礼花粒子 */
.hearts-burst{ position:absolute; right:8px; bottom:58px; pointer-events:none; }
.hearts-burst .p{ position:absolute; left:0; top:0; color:#fb7185; font-size:12px; filter: drop-shadow(0 1px 0 rgba(255,255,255,.7)); transform: translate(calc(var(--tx, 0px)), 0) scale(1); opacity:0; animation: burst .9s ease-out forwards; animation-delay: var(--d, 0s); }
@keyframes burst{ 0%{ transform: translate(0,0) scale(.6); opacity:0 } 20%{ opacity:1 } 100%{ transform: translate(calc(var(--tx, 0px)), -44px) rotate(12deg); opacity:0 } }

/* 提升字幕可读性 */
.scatter-item figcaption{ text-shadow: 0 1px 0 rgba(255,255,255,.6); }

/* 心形拼图模式：缩小图片框，隐藏字幕，提升密度 */
.scatter-canvas.mosaic .scatter-item{ width: clamp(20px, 2.3vw, 32px); transform: translateY(-16px) rotate(var(--rot)) scale(1); }
.scatter-canvas.mosaic .polaroid{ border-radius:6px; box-shadow:0 4px 10px rgba(230,122,136,.10); border:1px solid #f7dfe4; }
.scatter-canvas.mosaic .polaroid.mini img{ object-fit: cover; }
.scatter-canvas.mosaic .polaroid .tape{ display:none; }
.scatter-canvas.mosaic .scatter-item figcaption{ display:none; }

/* 预览大图弹层 */
.lightbox{ position:fixed; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; z-index:9999; }
.lightbox img{ max-width:90vw; max-height:88vh; border-radius:12px; box-shadow:0 20px 48px rgba(0,0,0,.35); }
.lb-close{ position:absolute; top:14px; right:16px; width:34px; height:34px; border-radius:50%; border:0; background:rgba(255,255,255,.9); font-size:20px; line-height:1; cursor:pointer; box-shadow:0 6px 16px rgba(0,0,0,.15); }

/* 心形填充网格：裁剪为心形并用网格排布 40 张 */
.heart-fill-grid{
  position:absolute;
  inset:8% 6% auto 6%;
  height:64%;
  display:grid;
  grid-template-columns: repeat(10, 1fr);
  grid-auto-rows: 1fr;
  gap: 6px;
  z-index:1;
  /* 以 SVG 路径定义心形裁剪区域，确保所有图片都在心形内 */
  -webkit-clip-path: path('M100 30c-15-25-55-20-60 10-5 29 25 49 60 82 35-33 65-53 60-82-5-30-45-35-60-10z');
  clip-path: path('M100 30c-15-25-55-20-60 10-5 29 25 49 60 82 35-33 65-53 60-82-5-30-45-35-60-10z');
}
.heart-fill-grid .cell{ position:relative; width:100%; aspect-ratio: 1 / 1; border-radius:10px; overflow:hidden; box-shadow:0 6px 16px rgba(230,122,136,.10); border:1px solid #f7dfe4; }
.heart-fill-grid .cell img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }

/* 不同大小的单元占格；通过列/行跨度制造大小不一，但总数固定 40 */
.heart-fill-grid .cell.small{ grid-column: span 1; grid-row: span 1; }
.heart-fill-grid .cell.mid{ grid-column: span 2; grid-row: span 2; }
.heart-fill-grid .cell.big{ grid-column: span 3; grid-row: span 3; }

@media (max-width: 900px){
  .heart-fill-grid{ inset:10% 6% auto 6%; height:60%; gap:5px; }
  .heart-fill-grid .cell{ border-radius:8px }
}

/* 心形精确填充（绝对定位） */
.heart-pack{ position:absolute; left:4%; top:4%; width:92%; aspect-ratio: 200 / 160; height:73.6%; z-index:1; transform: translateY(-8%); }
.heart-pack .cell.abs{ position:absolute; border-radius:10px; overflow:hidden; box-shadow:0 6px 16px rgba(230,122,136,.10); border:1px solid #f7dfe4; }
.heart-pack .cell.abs img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }

/* 心形网格（无背景容器） */
.heart-grid-plain{
  position:absolute;
  left:50%;
  top:10px;
  /* 上移整个网格，避免底部一行被遮挡 */
  --y-shift: -10px;
  transform: translate(-50%, var(--y-shift));
  /* 缩放参数：全局90% */
  --scale: 0.9;
  /* 基础尺寸（响应式会覆盖） */
  --tile0: 70px;
  --gap0: 8px;
  --tile: calc(var(--tile0) * var(--scale));
  --gap: calc(var(--gap0) * var(--scale));
  width: calc(9 * var(--tile) + 8 * var(--gap));
  display:grid;
  grid-template-columns: repeat(9, var(--tile));
  gap: var(--gap);
  z-index:1;
}
.hcell{
  width: var(--tile);
  height: var(--tile);
  border-radius:10px;
  overflow:hidden;
  box-shadow:0 4px 8px rgba(0,0,0,.1);
  background-color:rgba(255,255,255,.3);
  border:2px solid rgba(255,255,255,.5);
  transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
  animation: hg-in .5s ease both;
  display:flex;
  align-items:center;
  justify-content:center;
}
.hcell:hover{
  transform:scale(1.1);
  box-shadow:0 8px 16px rgba(0,0,0,.2);
  border-color:rgba(255,20,147,.8);
  z-index:2;
}
.hcell img{
  width:100%;
  height:100%;
  object-fit:cover;
  object-position:center;
  border-radius:8px;
  cursor: zoom-in;
}
.hcell.placeholder{
  background:linear-gradient(135deg,rgba(255,228,236,.65),rgba(254,205,211,.55));
  opacity:.65;
  backdrop-filter: blur(2px);
  border-color:rgba(255,255,255,.55);
}
.hcell.hidden{ visibility:hidden; }

@media (max-width: 900px){
  .heart-grid-plain{ --tile0:60px; --gap0:6px; --y-shift:-8px; width: calc(9 * var(--tile) + 8 * var(--gap)); }
}
@media (max-width: 768px){
  .heart-grid-plain{ --tile0:50px; --gap0:6px; --y-shift:-8px; width: calc(9 * var(--tile) + 8 * var(--gap)); }
}
@media (max-width: 600px){
  .heart-grid-plain{ --tile0:42px; --gap0:5px; --y-shift:-8px; width: calc(9 * var(--tile) + 8 * var(--gap)); }
}
@media (max-width: 460px){
  .heart-grid-plain{ --tile0:34px; --gap0:4px; --y-shift:-8px; width: calc(9 * var(--tile) + 8 * var(--gap)); }
}

/* 上升心形效果（仅排布和上升） */
.floating-hearts{ position:absolute; inset:0; pointer-events:none; z-index:2; overflow:hidden; clip-path:none; }
/* 让心形从容器底部起步（bottom:-100px）并上升到顶部之外（bottom:100%） */
.floating-heart{ position:absolute; bottom:-120px; width:108px; height:108px; animation: riseBottom linear forwards; cursor:pointer; pointer-events:auto; -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,88 C30,72 10,55 10,35 C10,20 22,10 35,10 C44,10 50,15 50,15 C50,15 56,10 65,10 C78,10 90,20 90,35 C90,55 70,72 50,88 Z" fill="white"/></svg>'); -webkit-mask-size: contain; -webkit-mask-repeat: no-repeat; -webkit-mask-position: center; mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,88 C30,72 10,55 10,35 C10,20 22,10 35,10 C44,10 50,15 50,15 C50,15 56,10 65,10 C78,10 90,20 90,35 C90,55 70,72 50,88 Z" fill="white"/></svg>'); mask-size: contain; mask-repeat: no-repeat; mask-position: center; filter: drop-shadow(0 6px 18px rgba(230,122,136,.28)); }
.floating-heart::after{ content:""; position:absolute; inset:0; pointer-events:none; background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,88 C30,72 10,55 10,35 C10,20 22,10 35,10 C44,10 50,15 50,15 C50,15 56,10 65,10 C78,10 90,20 90,35 C90,55 70,72 50,88 Z" fill="none" stroke="%23ef4444" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>') center / contain no-repeat; }
.floating-heart img{ width:100%; height:100%; object-fit:cover; display:block; }
@keyframes riseBottom{
  0%{ bottom:-120px; opacity:0; transform: rotate(-10deg) scale(.9) }
  10%{ opacity:1; transform: rotate(-6deg) scale(.95) }
  30%{ transform: rotate(-2deg) scale(1) }
  50%{ transform: rotate(0deg) scale(1.05) }
  70%{ transform: rotate(3deg) scale(1) }
  100%{ bottom: 100%; opacity:0; transform: rotate(8deg) scale(.92) }
}
@keyframes hg-in{ from{ opacity:0; transform: translateY(8px) } to { opacity:1; transform: translateY(0) } }
</style>
