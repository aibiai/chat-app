/*
  一次性清理脚本：
  - 将 apps/api/data/users.json 中的不一致等级（extra.level 与 membershipLevel）对齐
  - 规则：
    membershipLevel: 'none'|'purple'|'crown' -> extra.level: 0|1|2
    若 membershipLevel 缺失但存在 extra.level（0/1/2），则反推 membershipLevel
  - 自动备份原文件到 users.json.bak-YYYYMMDDHHmmss
  - 支持 --dry-run 查看预览

  运行（Windows PowerShell）：
    # 仅预览
    node scripts/fix-membership-levels.js --dry-run
    # 实际修复
    node scripts/fix-membership-levels.js
*/

import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const DATA_PATH = join(ROOT, 'apps', 'api', 'data', 'users.json');

const LEVEL_TO_NUMBER: Record<'none'|'purple'|'crown', number> = { none: 0, purple: 1, crown: 2 };
const NUMBER_TO_LEVEL: Record<number, 'none'|'purple'|'crown'> = { 0: 'none', 1: 'purple', 2: 'crown' };

function nowStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function main() {
  const dry = process.argv.includes('--dry-run') || process.argv.includes('--dry');
  if (!existsSync(DATA_PATH)) {
    console.error('[fix-membership-levels] users.json not found:', DATA_PATH);
    process.exit(1);
  }
  const raw = readFileSync(DATA_PATH, 'utf-8');
  let users: any[] = [];
  try {
    users = JSON.parse(raw);
    if (!Array.isArray(users)) throw new Error('users.json is not an array');
  } catch (e) {
    console.error('[fix-membership-levels] parse users.json failed:', (e as Error).message);
    process.exit(1);
  }

  let fixed = 0;
  let inferred = 0;
  const changes: Array<{ id: string; before: any; after: any }> = [];

  users.forEach((u) => {
    const extra: any = u || {};
    const levelStr = (u?.membershipLevel || '').toString();
    const hasLevelStr = levelStr === 'none' || levelStr === 'purple' || levelStr === 'crown';
    const numRaw = Number(extra.level);
    const hasNum = Number.isFinite(numRaw);

    if (hasLevelStr) {
      const want = LEVEL_TO_NUMBER[levelStr as keyof typeof LEVEL_TO_NUMBER];
      if (!hasNum || numRaw !== want) {
        changes.push({ id: u.id, before: { level: extra.level, membershipLevel: u.membershipLevel }, after: { level: want, membershipLevel: u.membershipLevel } });
        extra.level = want;
        fixed++;
      }
    } else if (hasNum) {
      const lvl = NUMBER_TO_LEVEL[numRaw] || 'none';
      if (u.membershipLevel !== lvl) {
        changes.push({ id: u.id, before: { level: extra.level, membershipLevel: u.membershipLevel }, after: { level: numRaw, membershipLevel: lvl } });
        u.membershipLevel = lvl;
        inferred++;
      }
    }
  });

  console.log(`[fix-membership-levels] scanned=${users.length}, fixedLevelField=${fixed}, inferredMembershipLevel=${inferred}`);
  if (changes.length) {
    console.log('Examples (first 10):');
    changes.slice(0, 10).forEach((c, i) => console.log(`#${i+1}`, c));
  } else {
    console.log('No changes needed.');
  }

  if (dry) {
    console.log('[fix-membership-levels] Dry run, no file written.');
    return;
  }

  // backup and write
  const backup = `${DATA_PATH}.bak-${nowStamp()}`;
  copyFileSync(DATA_PATH, backup);
  writeFileSync(DATA_PATH, JSON.stringify(users, null, 2), 'utf-8');
  console.log('[fix-membership-levels] Written file and backup created:', backup);
}

main();
