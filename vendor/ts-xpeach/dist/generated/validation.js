/** 只返回固定校验结果，不携带实例数据。 */
import * as generated from './validators.gen.js';
import { isSafeRawDocument } from './validator-runtime.js';
const validators = generated;
function safe(value) { if (typeof value === 'number')
    return Number.isFinite(value) && (!Number.isInteger(value) || Number.isSafeInteger(value)); if (Array.isArray(value))
    return value.every(safe); return value === null || typeof value !== 'object' || Object.values(value).every(safe); }
export function validateSchema(name, value) { return safe(value) && validators[name]?.(value) === true; }
// 只用于正式公开文档；丢弃校验对象，调用者仅得到原始字节。
const rawDocumentValidators = new Set(["s218_200"]);
export function validateRawJSONDocument(name, value) { return rawDocumentValidators.has(name) && isSafeRawDocument(value) && validators[name]?.(value) === true; }
