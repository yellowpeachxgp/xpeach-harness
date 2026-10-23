/** Browser entry for the Web client. */
import '@xpeach/xph-client-ui-theme/brand-font.css'
import { migrateLegacyStorageKeys } from './storage-migrate'

// XPeach rebrand: one-shot localStorage carry-over from the legacy dsh.*
// namespace to xph.* — per-origin storage so the two products never collide.
migrateLegacyStorageKeys()
import { AppWebEntry, applyIndexInjections } from '@xpeach/xph-client-web'

interface DesktopBootGlobal {
  dshDesktopBoot?: {
    failed(message: string): Promise<void>
    ready(): Promise<{
      injections: Parameters<typeof applyIndexInjections>[0]
      streamBaseUrl: string
      /** Set when this profile holds no site token: the workspace holds the sign-in gate. */
      requireAuth?: boolean
    }>
  }
}
const desktop = (globalThis as DesktopBootGlobal).dshDesktopBoot
const reportFailure = (reason: unknown): void => {
  if (desktop === undefined) throw reason
  void desktop.failed(reason instanceof Error ? reason.message : String(reason)).catch(console.error)
}

try {
  const el = document.getElementById('root')
  if (el === null) throw new Error('web app: missing #root')
  const entry = new AppWebEntry(el)
  if (desktop !== undefined) {
    const gate = (globalThis as { __DSH_BOOT_READY__?: PromiseWithResolvers<void> }).__DSH_BOOT_READY__
    if (gate === undefined) throw new Error('desktop web: boot readiness is missing')
    void desktop.ready().then(async ({ injections, streamBaseUrl, requireAuth }) => {
      const transport = globalThis as {
        __DSH_TRANSPORT__?: { ownsHost: boolean; streamBaseUrl: string }
        __XPH_AUTH_GATE__?: boolean
      }
      transport.__DSH_TRANSPORT__ = { ownsHost: true, streamBaseUrl }
      // Publish the gate before the plugins mount so the product sign-in surface
      // owns the first paint instead of the workspace.
      transport.__XPH_AUTH_GATE__ = requireAuth === true
      await applyIndexInjections(injections, src => new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = src
        script.onload = () => { resolve() }
        script.onerror = () => { reject(new Error(`desktop web: failed to load ${src}`)) }
        document.head.append(script)
      }))
      gate.resolve()
    }).catch((error: unknown) => { gate.reject(error) })
  }
  void entry.run(desktop === undefined ? undefined : reportFailure)
} catch (reason) {
  reportFailure(reason)
}
