// 简易翻译请求节流与并发控制队列
// 目的：避免批量翻译时同时触发大量公共实例请求，引发限流或封禁。
// 策略：
// 1. 最大并发 MAX_CONCURRENT。
// 2. 相邻启动的请求之间至少间隔 MIN_INTERVAL_MS（软节流）。
// 3. 失败不重排队列，仍然释放一个并发槽。
// 4. 可扩展：后续可根据 provider 维度增加更细粒度的配额。

const MAX_CONCURRENT = 3; // 可根据需要通过环境变量或全局配置调整
const MIN_INTERVAL_MS = 250; // 请求启动的时间间隔（非严格速率限制，仅降突发）

type Task<T> = { fn: () => Promise<T>; resolve: (v: T) => void; reject: (e: any) => void };
const queue: Task<any>[] = [];
let active = 0;
let lastStartAt = 0;

function tryStartNext(){
  if (!queue.length) return;
  if (active >= MAX_CONCURRENT) return;
  const now = Date.now();
  const gap = now - lastStartAt;
  if (gap < MIN_INTERVAL_MS){
    setTimeout(tryStartNext, MIN_INTERVAL_MS - gap);
    return;
  }
  const task = queue.shift()!;
  active++; lastStartAt = Date.now();
  let finished = false;
  const finalize = () => {
    if (finished) return; finished = true; active--; setTimeout(tryStartNext, 0);
  };
  Promise.resolve().then(task.fn)
    .then(res => { finalize(); task.resolve(res); })
    .catch(err => { finalize(); task.reject(err); });
}

export function enqueueTranslation<T>(fn: () => Promise<T>): Promise<T>{
  return new Promise<T>((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    tryStartNext();
  });
}

// 可选：清理队列（例如用户取消批量翻译时）
export function cancelPendingTranslations(){
  while(queue.length){ const t = queue.shift()!; t.reject(new Error('cancelled')); }
}

// 运行中状态暴露用于调试或 UI 指示
export function getTranslationQueueStatus(){
  return { active, pending: queue.length };
}
