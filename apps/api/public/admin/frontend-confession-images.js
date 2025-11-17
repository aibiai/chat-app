// 表白墙图片修改页面脚本（心形固定布局，后台仅管理图片，不可改动布局）
// 依赖：perm-guard.js 提供 admin_token
(function(){
  const gridEl = document.getElementById('heartwall-grid')
  const uploadBtn = document.getElementById('heart-upload-btn')
  const deleteBtn = document.getElementById('heart-delete-btn')
  const refreshBtn = document.getElementById('heart-refresh-btn')
  const fileInput = document.getElementById('heart-file-input')

  // 样式（与前端心形 9×8 网格一致）
  const style = document.createElement('style')
  style.textContent = `
    .heartwall-grid { position:relative; left:50%; transform:translateX(-50%); --tile0:70px; --gap0:8px; --scale:0.9; --tile:calc(var(--tile0)*var(--scale)); --gap:calc(var(--gap0)*var(--scale)); width: calc(9 * var(--tile) + 8 * var(--gap)); display:grid; grid-template-columns: repeat(9, var(--tile)); gap: var(--gap); padding:20px 0; }
    @media (max-width:900px){ .heartwall-grid{ --tile0:60px; --gap0:6px; } }
    @media (max-width:768px){ .heartwall-grid{ --tile0:50px; --gap0:6px; } }
    @media (max-width:600px){ .heartwall-grid{ --tile0:42px; --gap0:5px; } }
    @media (max-width:460px){ .heartwall-grid{ --tile0:34px; --gap0:4px; } }
    .heart-cell { width:var(--tile); height:var(--tile); background:rgba(255,255,255,.3); border-radius:10px; overflow:hidden; position:relative; cursor:pointer; box-shadow:0 4px 8px rgba(0,0,0,.08); display:flex; align-items:center; justify-content:center; font-size:11px; color:#9f1239; user-select:none; border:2px solid rgba(255,255,255,.5); animation:hg-in .45s ease both; }
    .heart-cell.hidden { visibility:hidden; }
    .heart-cell.occupied { background:#fff; }
    .heart-cell.selected { outline:2px solid #ff6ea5; }
    .heart-cell img { width:100%; height:100%; object-fit:cover; }
    .heart-cell .cell-id { position:absolute; bottom:2px; right:4px; background:rgba(0,0,0,.35); color:#fff; font-size:10px; padding:2px 4px; border-radius:8px; }
  `
  document.head.appendChild(style)

  const PATTERN = [
    [0,0,1,1,0,1,1,0,0],
    [0,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,0,0,0],
    [0,0,0,0,1,0,0,0,0],
  ]

  let cells = [] // 后端返回的显示单元
  let loading = false

  function token(){
    try{ const t = localStorage.getItem('admin_token'); if(t) return t }catch{}
    try{ if(window.getAdminToken){ const t = window.getAdminToken(); if(typeof t === 'string') return t } }catch{}
    return ''
  }
  function authHeader(){ const t = token(); return t ? (t.startsWith('Bearer ') ? t : 'Bearer '+ t) : '' }

  async function fetchLayout(){
    gridEl.innerHTML = '<div class="empty">加载中...</div>'
    try{
      const resp = await fetch('/api/confession/heart/layout')
      const data = await resp.json()
      if(!data.ok) throw new Error(data.error||'加载失败')
      cells = data.cells.sort((a,b)=> a.y===b.y? a.x-b.x : a.y-b.y)
      render()
    }catch(e){ gridEl.innerHTML = '<div class="empty">加载失败</div>' }
  }

  function render(){
    gridEl.innerHTML = ''
    let idx = 0
    for(let r=0;r<PATTERN.length;r++){
      for(let c=0;c<PATTERN[r].length;c++){
        const show = PATTERN[r][c] === 1
        const data = show ? cells[idx] : null
        if (show) idx++
        const el = document.createElement('div')
        el.className = 'heart-cell' + (show?'':' hidden') + (data?.img? ' occupied':'')
        if (data){ el.dataset.id = data.id }
        if (show){
          if(data?.img){ const img = document.createElement('img'); img.src = data.img; el.appendChild(img) } else { el.textContent = '空' }
          const tag = document.createElement('span'); tag.className='cell-id'; tag.textContent = data?.id || ''; el.appendChild(tag)
          el.addEventListener('click', ()=> el.classList.toggle('selected'))
        }
        gridEl.appendChild(el)
      }
    }
  }

  // 上传逻辑
  uploadBtn.addEventListener('click', ()=> fileInput.click())
  fileInput.addEventListener('change', async ()=>{
    if(!fileInput.files?.length) return
    const fm = new FormData()
    for(const f of fileInput.files) fm.append('files', f)
    const selected = Array.from(gridEl.querySelectorAll('.heart-cell.selected')).map(el=> el.dataset.id).filter(Boolean)
    if(selected.length) fm.append('positions', JSON.stringify(selected))
    loading = true; setLoading(true)
    try{
      const hdr = authHeader();
      const resp = await fetch('/api/confession/heart/upload-batch', { method:'POST', headers: hdr? { 'Authorization': hdr } : {}, body: fm })
      const data = await resp.json(); if(!data.ok) throw new Error(data.error||'上传失败')
      for(const u of data.updated){ const cell = cells.find(c=> c.id === u.id); if(cell) cell.img = u.url }
      render(); fileInput.value=''
    }catch(e){ alert('上传失败: '+ e.message) }
    finally{ loading=false; setLoading(false) }
  })

  // 批量删除
  deleteBtn.addEventListener('click', async ()=>{
    const ids = Array.from(gridEl.querySelectorAll('.heart-cell.selected.occupied')).map(el=> el.dataset.id).filter(Boolean)
    if(!ids.length){ alert('请选择至少一个已占用单元格'); return }
    if(!confirm('确认清空 '+ ids.length +' 个单元格的图片?')) return
    loading = true; setLoading(true)
    try{
      const hdr = authHeader();
      const headers = { 'Content-Type':'application/json' }; if(hdr) headers['Authorization'] = hdr
      const resp = await fetch('/api/confession/heart/delete', { method:'POST', headers, body: JSON.stringify({ ids }) })
      const data = await resp.json(); if(!data.ok) throw new Error(data.error||'删除失败')
      for(const id of ids){ const cell = cells.find(c=> c.id === id); if(cell) cell.img = null }
      render()
    }catch(e){ alert('删除失败: '+ e.message) }
    finally{ loading=false; setLoading(false) }
  })

  refreshBtn.addEventListener('click', fetchLayout)

  function setLoading(v){ if(v){ gridEl.classList.add('loading') } else { gridEl.classList.remove('loading') } }

  fetchLayout()
})()
