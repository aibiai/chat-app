<template>
  <img :src="cleanSrc || src" :alt="alt" :width="size" :height="size" class="icon" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

interface Props { src: string; size?: number; alt?: string }
const props = withDefaults(defineProps<Props>(), { size: 44, alt: 'icon' })
const cleanSrc = ref<string>('')

function isNearGray(r: number, g: number, b: number){
  const max = Math.max(r,g,b), min = Math.min(r,g,b)
  const diff = max - min
  const brightness = max / 255
  return diff < 10 && brightness > 0.75 // 近灰且较亮
}

function process(){
  if (!props.src) { cleanSrc.value = ''; return }
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const w = img.width, h = img.height
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const imgData = ctx.getImageData(0,0,w,h)
    const data = imgData.data
    // 采样左上角 10x10，记录最常见的两种近灰色，作为棋盘底色
    const count: Record<string, number> = {}
    for (let y=0; y<Math.min(10,h); y++){
      for (let x=0; x<Math.min(10,w); x++){
        const i = (y*w + x)*4
        const r=data[i], g=data[i+1], b=data[i+2], a=data[i+3]
        if (a>240 && isNearGray(r,g,b)){
          const key = `${r},${g},${b}`
          count[key] = (count[key]||0)+1
        }
      }
    }
    const bgColors = Object.entries(count)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,2)
      .map(([k])=>k.split(',').map(n=>parseInt(n,10)) as number[])
    // 将整张图中与这两种灰色接近的像素置为透明
    for (let i=0; i<data.length; i+=4){
      const r=data[i], g=data[i+1], b=data[i+2]
      for (const c of bgColors){
        if (Math.abs(r-c[0])<12 && Math.abs(g-c[1])<12 && Math.abs(b-c[2])<12){
          data[i+3]=0; // alpha=0
          break
        }
      }
    }
    ctx.putImageData(imgData,0,0)
    cleanSrc.value = canvas.toDataURL('image/png')
  }
  img.onerror = () => { cleanSrc.value = '' }
  img.src = props.src
}

onMounted(process)
watch(() => props.src, process)
</script>

<style scoped>
.icon{ display:inline-block; width:auto; height:auto; object-fit:contain; }
</style>
