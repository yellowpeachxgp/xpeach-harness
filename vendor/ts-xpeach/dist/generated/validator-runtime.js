const SHARD_CACHE = new Map();
const SHARD_PENDING = new Map();
let nodeShardRequire;
function getNodeShardRequire() {
    if (nodeShardRequire !== undefined)
        return nodeShardRequire;
    try {
        const proc = globalThis.process;
        const mod = typeof proc?.getBuiltinModule === 'function' ? proc.getBuiltinModule('node:module') : undefined;
        nodeShardRequire = typeof mod?.createRequire === 'function' && import.meta.url.startsWith('file:') ? mod.createRequire(import.meta.url) : null;
    }
    catch {
        nodeShardRequire = null;
    }
    return nodeShardRequire;
}
function shardRelativePath(shard) {
    switch (shard) {
        case "admin": return './validators-admin.gen.js';
        case "admin-finance": return './validators-admin-finance.gen.js';
        case "internal": return './validators-internal.gen.js';
        case "legacy-v1": return './validators-legacy-v1.gen.js';
        case "oidc": return './validators-oidc.gen.js';
        case "portal": return './validators-portal.gen.js';
        case "public": return './validators-public.gen.js';
        case "v2-core": return './validators-v2-core.gen.js';
        default: return './validators.gen.js';
    }
}
function importShard(shard) {
    switch (shard) {
        case "admin": return import('./validators-admin.gen.js');
        case "admin-finance": return import('./validators-admin-finance.gen.js');
        case "internal": return import('./validators-internal.gen.js');
        case "legacy-v1": return import('./validators-legacy-v1.gen.js');
        case "oidc": return import('./validators-oidc.gen.js');
        case "portal": return import('./validators-portal.gen.js');
        case "public": return import('./validators-public.gen.js');
        case "v2-core": return import('./validators-v2-core.gen.js');
        default: return import('./validators.gen.js');
    }
}
export function getValidatorShardSync(shard) {
    const hit = SHARD_CACHE.get(shard);
    if (hit)
        return hit;
    const req = getNodeShardRequire();
    if (!req)
        return undefined;
    try {
        const loaded = req(shardRelativePath(shard));
        if (loaded && typeof loaded === 'object') {
            SHARD_CACHE.set(shard, loaded);
            return loaded;
        }
    }
    catch {
        // 浏览器与打包单文件环境自动降级为异步分片加载
    }
    return undefined;
}
export function loadValidatorShard(shard) {
    const syncHit = getValidatorShardSync(shard);
    if (syncHit)
        return Promise.resolve(syncHit);
    const pending = SHARD_PENDING.get(shard);
    if (pending)
        return pending;
    const task = importShard(shard).then((mod) => {
        SHARD_CACHE.set(shard, mod);
        SHARD_PENDING.delete(shard);
        return mod;
    }, (err) => {
        SHARD_PENDING.delete(shard);
        throw err;
    });
    SHARD_PENDING.set(shard, task);
    return task;
}
export function isSafeJsonValue(value) {
    if (typeof value === 'number')
        return Number.isFinite(value) && (!Number.isInteger(value) || Number.isSafeInteger(value));
    if (Array.isArray(value))
        return value.every(isSafeJsonValue);
    return value === null || typeof value !== 'object' || Object.values(value).every(isSafeJsonValue);
}
const rawDocumentValidators = new Set(["s218_200"]);
export function isSafeRawDocument(value, path = '') {
    if (['/paths', '/components/parameters', '/components/schemas', '/components/securitySchemes'].includes(path))
        return true;
    if (Array.isArray(value))
        return value.every((item) => isSafeRawDocument(item, path + '/*'));
    if (value !== null && typeof value === 'object')
        return Object.entries(value).every(([key, item]) => isSafeRawDocument(item, path + '/' + key.replaceAll('~', '~0').replaceAll('/', '~1').replaceAll('*', '~2')));
    return isSafeJsonValue(value);
}
export function validateWithShard(shard, name, value) {
    const fn = shard[name];
    return isSafeJsonValue(value) && typeof fn === 'function' && fn(value) === true;
}
export function validateRawDocumentWithShard(shard, name, value) {
    const fn = shard[name];
    return rawDocumentValidators.has(name) && isSafeRawDocument(value) && typeof fn === 'function' && fn(value) === true;
}
