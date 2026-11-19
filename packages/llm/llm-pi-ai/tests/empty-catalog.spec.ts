/** 显式空目录停用路由，省略目录仍保留已安装模型。 */
import { expect, it } from 'vitest'
import { Config, resolveProfiles, type Options } from '../src/config.ts'
import { catalogModels } from '../src/catalog.ts'

it('真实配置解析保留省略与显式空数组的区别', () => {
  const absent = Config({ providers: { deepseek: {} } }).providers.get()
  const empty = Config({ providers: { deepseek: { models: [] } } }).providers.get()
  expect(absent.deepseek).not.toHaveProperty('models')
  expect(empty.deepseek?.models).toEqual([])
  expect(resolveProfiles(structuredClone(absent) as Options['providers']).get('deepseek')?.piProvider?.getModels().length).toBeGreaterThan(0)
  expect(resolveProfiles(structuredClone(empty) as Options['providers']).get('deepseek')?.piProvider?.getModels()).toEqual([])
})

it('手工声明路由接受显式空目录，省略模型时仍拒绝', () => {
  const route = { api: 'openai-completions', baseURL: 'https://empty.invalid' }
  expect(resolveProfiles({ 'empty-route': { ...route, models: [] } }).get('empty-route')?.piProvider?.getModels()).toEqual([])
  expect(() => resolveProfiles({ 'empty-route': route })).toThrow('resolves no models')
})

it('空目录仍拒绝无效协议，不跳过路由验证', () => {
  expect(() => resolveProfiles({ 'empty-route': { api: 'unsupported', models: [] } })).toThrow('supported protocols')
  expect(() => resolveProfiles({ 'empty-route': { models: [] } })).toThrow('supported protocols')
})

it('空列表与 modelOverrides 不能同时配置', () => {
  const model = catalogModels('deepseek').keys().next().value
  if (model === undefined) throw new Error('内置 DeepSeek 目录没有模型')
  expect(() => resolveProfiles({ deepseek: { models: [], modelOverrides: { [model]: {} } } })).toThrow('beside a models list')
})
