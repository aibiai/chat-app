// 聊天页背景管理交互脚本
// 依赖管理员登录后本地缓存的 admin_token
(async function(){
  const token = localStorage.getItem('admin_token');
  const statusEl = document.getElementById('bg-status');
  const fileInput = document.getElementById('bg-file');
  const fileNameEl = document.getElementById('bg-file-name');
  const uploadBtn = document.getElementById('bg-upload');
  const tbody = document.getElementById('bg-tbody');

  function setStatus(text, ok){ if(statusEl) { statusEl.textContent = text; statusEl.style.color = ok ? '#059669' : '#dc2626'; } }

  if(fileInput){
    fileInput.addEventListener('change', () => {
      const f = fileInput.files && fileInput.files[0];
      fileNameEl.textContent = f ? `${f.name} (${formatSize(f.size)})` : '';
    });
  }

  if(uploadBtn){
    uploadBtn.addEventListener('click', async () => {
      const f = fileInput.files && fileInput.files[0];
      if(!f){ setStatus('请先选择图片文件', false); return; }
      if(f.size > 5 * 1024 * 1024){ setStatus('文件过大，需 < 5MB', false); return; }
      try{
        setStatus('上传中...', true);
        const fd = new FormData(); fd.append('file', f);
        const resp = await fetch('/api/content/theme/chat-backgrounds/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
        const jd = await resp.json();
        if(!resp.ok || !jd.ok){ throw new Error(jd.error || 'UPLOAD_FAILED'); }
        setStatus('上传成功', true);
        fileInput.value = ''; fileNameEl.textContent='';
        await loadList();
      }catch(e){ setStatus('上传失败: '+ (e && e.message || e), false); }
    });
  }

  function formatSize(bytes){ if(!Number.isFinite(bytes)) return '—'; const kb = bytes/1024; if(kb < 1024) return kb.toFixed(1)+' KB'; return (kb/1024).toFixed(2)+' MB'; }

  async function loadList(){
    tbody.innerHTML = '<tr><td colspan="7" style="padding:12px;font-size:12px;color:#64748b;">加载中...</td></tr>';
    try{
      const resp = await fetch('/admin/api/chat-backgrounds', { headers: { Authorization: `Bearer ${token}` } });
      const jd = await resp.json();
      if(!resp.ok || !jd.ok){ throw new Error(jd.error || 'LOAD_FAILED'); }
      const list = jd.list || [];
      if(!list.length){ tbody.innerHTML = '<tr><td colspan="7" style="padding:12px;font-size:12px;color:#64748b;">暂无背景，请上传。</td></tr>'; return; }
      tbody.innerHTML = '';
      list.forEach(item => {
        const tr = document.createElement('tr'); tr.style.borderBottom='1px solid var(--border)'; tr.style.fontSize='12px';
        const previewTd = document.createElement('td'); previewTd.style.padding='8px 6px';
        const img = document.createElement('img'); img.src = item.url; img.alt = item.id; img.style.width='96px'; img.style.height='54px'; img.style.objectFit='cover'; img.style.borderRadius='6px'; img.loading='lazy'; previewTd.appendChild(img);
        const nameTd = document.createElement('td'); nameTd.style.padding='8px 6px'; nameTd.textContent = item.name ? `${item.id} / ${item.name}` : item.id;
        const urlTd = document.createElement('td'); urlTd.style.padding='8px 6px'; urlTd.textContent = item.url;
        const sizeTd = document.createElement('td'); sizeTd.style.padding='8px 6px'; sizeTd.textContent = formatSize(item.size);
        const timeTd = document.createElement('td'); timeTd.style.padding='8px 6px'; timeTd.textContent = item.createdAt ? new Date(item.createdAt).toLocaleString() : '—';
        const stateTd = document.createElement('td'); stateTd.style.padding='8px 6px'; stateTd.textContent = item.active ? '已启用' : '—'; stateTd.style.color = item.active ? '#059669' : '#64748b';
        const opTd = document.createElement('td'); opTd.style.padding='8px 6px'; opTd.style.whiteSpace='nowrap';
        const actBtn = document.createElement('button'); actBtn.type='button'; actBtn.textContent = item.active ? '已启用' : '启用'; actBtn.className='panel-btn'; actBtn.style.marginRight='6px'; actBtn.disabled = !!item.active; actBtn.onclick = () => activate(item.id);
        const delBtn = document.createElement('button'); delBtn.type='button'; delBtn.textContent='删除'; delBtn.className='panel-btn'; delBtn.disabled = !!item.active; delBtn.onclick = () => remove(item.id);
        opTd.appendChild(actBtn); opTd.appendChild(delBtn);
        tr.appendChild(previewTd); tr.appendChild(nameTd); tr.appendChild(urlTd); tr.appendChild(sizeTd); tr.appendChild(timeTd); tr.appendChild(stateTd); tr.appendChild(opTd);
        tbody.appendChild(tr);
      });
    }catch(e){ tbody.innerHTML = '<tr><td colspan="7" style="padding:12px;color:#dc2626;font-size:12px;">加载失败: '+ (e && e.message || e) +'</td></tr>'; }
  }

  async function activate(id){
    if(!id) return;
    setStatus('启用中...', true);
    try{
      const resp = await fetch('/admin/api/chat-backgrounds/activate', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id }) });
      const jd = await resp.json();
      if(!resp.ok || !jd.ok){ throw new Error(jd.error || 'ACTIVATE_FAILED'); }
      setStatus('已启用', true); await loadList();
    }catch(e){ setStatus('启用失败: '+ (e && e.message || e), false); }
  }

  async function remove(id){
    if(!id) return;
    if(!window.confirm('确定要删除该背景吗？')) return;
    setStatus('删除中...', true);
    try{
      const resp = await fetch('/admin/api/chat-backgrounds/delete', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ids: [id] }) });
      const jd = await resp.json();
      if(!resp.ok || !jd.ok){ throw new Error(jd.error || 'DELETE_FAILED'); }
      setStatus('已删除', true); await loadList();
    }catch(e){ setStatus('删除失败: '+ (e && e.message || e), false); }
  }

  await loadList();
})();
