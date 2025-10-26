import api from './api'

export async function fetchHeartImages(limit = 90): Promise<string[]> {
  try{
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
