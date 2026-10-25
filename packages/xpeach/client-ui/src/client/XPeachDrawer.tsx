/** Shared edit-drawer: labeled field column + action row, one grammar for
 * user/channel/pricing/profile drawers. */
import type { JSX, ReactNode } from 'react'
import css from './xpeach.module.css'

export function EditDrawer({ children, actions }: { readonly children: ReactNode; readonly actions?: ReactNode }): JSX.Element {
  return <div className={css.chEdit} onClick={(e) => { e.stopPropagation() }}>
    {children}
    {actions !== undefined && <div className={css.drawerFoot}>{actions}</div>}
  </div>
}

export function DrawerField({ label, children }: { readonly label: ReactNode; readonly children: ReactNode }): JSX.Element {
  return <label className={css.chField}><span>{label}</span>{children}</label>
}
