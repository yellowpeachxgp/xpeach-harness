/** 浏览器正式SDK入口；Cookie由浏览器管理，所有请求按正式注册操作校验。 */
import { executeOperation, resolveConfig, resolveOperation, ResponseFormatError } from './generated/runtime.js';
export class BrowserClient {
    cfg;
    constructor(options = {}) {
        const location = globalThis.location;
        if (options.baseUrl && location && new URL(options.baseUrl).origin !== location.origin)
            throw new ResponseFormatError('浏览器SDK只允许当前同源站点');
        this.cfg = resolveConfig({ baseUrl: options.baseUrl ?? '', browser: true,
            ...(options.fetch ? { fetch: options.fetch } : {}), ...(options.csrfToken ? { csrfToken: options.csrfToken } : {}),
            ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}) });
    }
    async request(request) {
        if (!request.path.startsWith('/') || request.path.startsWith('//') || request.path.includes('?') || request.path.includes('#'))
            throw new ResponseFormatError('浏览器操作必须使用明确的站点路径');
        const { spec, pathParams } = resolveOperation(request.method, request.path);
        const query = {};
        for (const [key, value] of Object.entries(request.query ?? {})) {
            if (value === undefined)
                continue;
            const parameter = spec.parameters.find(p => p.in === 'query' && p.name === key);
            if (!parameter)
                throw new ResponseFormatError('查询字段未在正式操作声明');
            if (typeof value === 'string' && ['integer', 'number'].includes(parameter.type)) {
                if (!/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(value))
                    throw new ResponseFormatError('数字查询参数格式无效');
                query[key] = Number(value);
            }
            else if (typeof value === 'string' && parameter.type === 'boolean') {
                if (value !== 'true' && value !== 'false')
                    throw new ResponseFormatError('布尔查询参数格式无效');
                query[key] = value === 'true';
            }
            else
                query[key] = value;
        }
        const input = { pathParams, query,
            ...(request.body === undefined ? {} : { body: request.body }), ...(request.headers ? { headers: request.headers } : {}),
            ...(request.idempotencyKey === undefined ? {} : { idempotencyKey: request.idempotencyKey }) };
        return executeOperation(this.cfg, spec, input, request.signal ? { signal: request.signal } : {});
    }
}
