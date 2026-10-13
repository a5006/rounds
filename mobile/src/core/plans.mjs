import { normalizeConfig, DEFAULT_CONFIG } from './mobile-core.mjs';

export const PLAN_CATEGORIES = ['拳击实战', '空击步伐', '重沙袋力量', 'HIIT 间歇', '敏捷训练'];
export const PLAN_COLORS = ['#ff525d', '#a2c9ff', '#fdbb43', '#e4bdbc'];
const template = (id, name, category, color, rounds, workSec, restSec, prepSec) => ({ id, name, category, color, config: { rounds, workSec, restSec, prepSec, noRestLast: true }, vibration: true, volume: 1, showOnHome: id !== 'preset-amateur', template: true });
export const PLAN_TEMPLATES = [
  template('preset-agility', '敏捷协调速训', '敏捷训练', PLAN_COLORS[2], 8, 20, 10, 10),
  template('preset-sparring', '8 回合实战摸底', '拳击实战', PLAN_COLORS[0], 8, 180, 60, 10),
  template('preset-hiit', 'HIIT 极限冲刺', 'HIIT 间歇', PLAN_COLORS[1], 10, 90, 30, 10),
  template('preset-amateur', '业余搏击对抗 3R', '拳击实战', PLAN_COLORS[1], 3, 180, 60, 10),
];
export function normalizePlan(input, id = input.id) {
  const name = typeof input.name === 'string' ? input.name.trim().slice(0, 40) : '';
  if (!name) throw new Error('请输入方案名称');
  const volume = Number(input.volume ?? 1);
  return { id, name, category: PLAN_CATEGORIES.includes(input.category) ? input.category : PLAN_CATEGORIES[0], color: PLAN_COLORS.includes(input.color) ? input.color : PLAN_COLORS[0], config: normalizeConfig(input.config), vibration: input.vibration !== false, volume: Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 1, showOnHome: typeof input.showOnHome === 'boolean' ? input.showOnHome : Boolean(input.favorite), template: false };
}
export function snapshotPlan(plan) { return plan ? { ...plan, config: { ...plan.config } } : null; }
export function restorePlans(saved, legacyConfig = DEFAULT_CONFIG) {
  const rows = Array.isArray(saved) ? saved : [normalizePlan({ name: '我的训练方案', config: legacyConfig }, 'custom-legacy')];
  const templates = PLAN_TEMPLATES.map(plan => {
    const saved = rows.find(x => x?.id === plan.id);
    return { ...snapshotPlan(plan), showOnHome: typeof saved?.showOnHome === 'boolean' ? saved.showOnHome : Boolean(saved?.favorite) || plan.showOnHome };
  });
  const seen = new Set(templates.map(x => x.id));
  const custom = [];
  for (const row of rows) {
    if (!row || typeof row.id !== 'string' || !row.id || row.id === 'preset-pro' || seen.has(row.id)) continue;
    try { custom.push(normalizePlan(row)); seen.add(row.id); } catch { /* Ignore invalid persisted entries while retaining valid plans. */ }
  }
  return [...templates, ...custom];
}
export function saveCustomPlan(plans, draft, id) {
  const existing = plans.find(x => x.id === id);
  if (existing?.template) throw new Error('预设方案请先复制为副本');
  const next = normalizePlan({ ...draft, showOnHome: existing?.showOnHome ?? draft.showOnHome }, id);
  return existing ? plans.map(x => x.id === id ? next : x) : [...plans, next];
}
export function copyPlan(plans, id, newId) {
  const source = plans.find(x => x.id === id);
  if (!source) throw new Error('方案不存在');
  return saveCustomPlan(plans, { ...source, name: `${source.name.slice(0, 35)} · 副本`, showOnHome: false }, newId);
}
export function removeCustomPlan(plans, id) {
  if (plans.find(x => x.id === id)?.template) throw new Error('预设方案不能删除');
  return plans.filter(x => x.id !== id);
}
export function togglePlanHome(plans, id) { return plans.map(x => x.id === id ? { ...x, showOnHome: !x.showOnHome } : x); }
export function homePlans(plans) { return plans.filter(x => x.showOnHome); }
export function planDurationMs(config) { return (config.prepSec + config.workSec * config.rounds + config.restSec * (config.rounds - (config.noRestLast ? 1 : 0))) * 1000; }
export function makeStartRequest(session, config, plan) { return { config: normalizeConfig(config), plan: snapshotPlan(plan), requiresConfirmation: Boolean(session.config && ['prep', 'work', 'rest'].includes(session.phase)) }; }
