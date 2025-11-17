import api from './api'

export async function fetchHeartImages(limit = 90): Promise<string[]> {
  try{
    // 优先尝试新布局接口（更精准位置），若失败则回退旧接口
    const layoutResp = await api.get('/api/confession/heart/layout').catch(()=>null)
    if(layoutResp && Array.isArray(layoutResp.data?.cells)){
      const cells = layoutResp.data.cells
      // 返回与心形墙顺序一一对应的图片数组（缺失使用空字符串占位，不再压缩顺序）
      const imgs = cells.map((c:any)=> typeof c.img === 'string' && c.img ? c.img : '')
      // 截断到 limit，但保留前缀空占位确保索引稳定
      return imgs.slice(0, limit)
    }
    const { data } = await api.get('/api/confession/heart/images', { params: { limit } })
    const arr = Array.isArray(data?.images) ? data.images : []
    return arr.filter((s: any) => typeof s === 'string' && s.trim().length > 0)
  }catch{
    return []
  }
}

export async function uploadHeartImage(file: File): Promise<string | null> {
  try{
    const fd = new FormData(); fd.append('file', file)
    const { data } = await api.post('/api/confession/heart/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data?.url || null
  }catch{
    return null
  }
}
