/** 按业务域惰性装载构建期Schema校验分片；避免冷启动全量解析与单包膨胀。 */
export type ValidatorFn = (data: unknown) => boolean;
export type ValidatorShardMap = Readonly<Record<string, unknown>>;
export declare function getValidatorShardSync(shard: string): ValidatorShardMap | undefined;
export declare function loadValidatorShard(shard: string): Promise<ValidatorShardMap>;
export declare function isSafeJsonValue(value: unknown): boolean;
export declare function isSafeRawDocument(value: unknown, path?: string): boolean;
export declare function validateWithShard(shard: ValidatorShardMap, name: string, value: unknown): boolean;
export declare function validateRawDocumentWithShard(shard: ValidatorShardMap, name: string, value: unknown): boolean;
