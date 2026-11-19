/**
 * Appearance preference row registered into the General section item slot
 * (figma 501:30012 'Frame 2117131228'): title + three preference cubes.
 * Registered by this package — the theme feature owns its own settings
 * surface. Selection follows the persisted preference, never the resolved
 * active theme.
 */
import clsx from 'clsx'
import {
  IconDarkOutlineMedium, IconFollowsystemOutlineMedium, IconLightOutlineMedium,
} from '@xpeach/xph-client-ui-primitives'
import type { PropsLocale, PropsRuntime, PropsStore } from '@xpeach/xph-client-ui-slots'
import type { ThemePreference } from '../theme-settings.ts'
import type { ThemeKey } from './locales.ts'
import type {} from '@xpeach/xph-client-ui-settings/client'
import type { createAppearanceRowStore } from './settings-store.ts'
import css from './AppearanceRow.module.css'

/** Injected business face: the preference write (t rides the standard locale seat). */
export interface AppearanceRowInjected {
  /** Switch the theme preference. */
  setTheme: (id: ThemePreference) => void
}

/** Full component props: runtime share + store share + locale seat + injected face. */
export type AppearanceRowComponentProps =
  PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createAppearanceRowStore>>
  & PropsLocale<'settings.theme'> & AppearanceRowInjected

/** Cube order and icons (figma 501:30015-30017: Light, Dark, System). */
const CUBES: readonly { id: 'light' | 'dark' | 'system'; labelKey: ThemeKey; Icon: typeof IconLightOutlineMedium }[] = [
  { id: 'light', labelKey: 'appearance.light', Icon: IconLightOutlineMedium },
  { id: 'dark', labelKey: 'appearance.dark', Icon: IconDarkOutlineMedium },
  { id: 'system', labelKey: 'appearance.system', Icon: IconFollowsystemOutlineMedium },
]

function resolveSelectedCube(preference: ThemePreference): 'light' | 'dark' | 'system' {
  if (preference === 'system') return 'system'
  if (preference === 'dark' || preference.endsWith('-dark')) return 'dark'
  return 'light'
}

function resolveTargetPreference(current: ThemePreference, clicked: 'light' | 'dark' | 'system'): ThemePreference {
  if (clicked === 'system') return 'system'
  const base = current.endsWith('-dark') ? current.slice(0, -5) : current
  if (base !== 'light' && base !== 'dark' && base !== 'system') {
    return (clicked === 'dark' ? `${base}-dark` : base) as ThemePreference
  }
  return clicked
}

/**
 * Render the Appearance row.
 * @param props - composed slot props.
 * @returns the row element tree.
 */
export function AppearanceRow({ t, setTheme, useStore }: AppearanceRowComponentProps) {
  const preference = useStore(s => s.preference)
  const selectedCube = resolveSelectedCube(preference)
  return (
    <div className={css.group}>
      <div className={css.title}>{t('appearance.title')}</div>
      <div className={css.cubeRow}>
        {CUBES.map(({ id, labelKey, Icon }) => {
          const isSelected = selectedCube === id
          return (
            <button
              key={id}
              type="button"
              className={clsx(css.themeCube, isSelected && css.selected)}
              aria-pressed={isSelected}
              onClick={() => { setTheme(resolveTargetPreference(preference, id)) }}
            >
              <Icon />
              {t(labelKey)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
