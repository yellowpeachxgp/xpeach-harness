/** 凭据与导入隔离目录的物理路径判断。 */
import { realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path'

function physicalPath(path: string): string {
  let ancestor = resolve(path)
  const missing: string[] = []
  for (;;) {
    try {
      return resolve(realpathSync(ancestor), ...missing)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      const parent = dirname(ancestor)
      if (parent === ancestor) throw error
      missing.unshift(basename(ancestor))
      ancestor = parent
    }
  }
}

/**
 * 判断目录是否属于系统临时根，支持符号链接别名与尚不存在的子目录。
 * @param directory - 待判断的目录路径。
 * @returns 规范后的物理路径位于系统临时根内时为 true；权限错误直接传播。
 */
export function isTemporaryCredentialDirectory(directory: string): boolean {
  const suffix = relative(physicalPath(tmpdir()), physicalPath(directory))
  return suffix === '' || (!isAbsolute(suffix) && suffix.split(sep)[0] !== '..')
}
