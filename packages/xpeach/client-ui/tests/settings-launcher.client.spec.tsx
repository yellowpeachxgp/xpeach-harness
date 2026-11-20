// @vitest-environment jsdom
/** Unit tests for the unified sidebar XPeachSettingsLauncher and token status popover. */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type XPeachKey, zh } from '../src/client/locales.ts'
import { XPeachSettingsLauncher } from '../src/client/XPeachSettingsLauncher.tsx'

afterEach(cleanup)

type LauncherProps = ComponentProps<typeof XPeachSettingsLauncher>

function makeTranslator(dict: Record<XPeachKey, string>): LauncherProps['t'] {
  return ((key: string, params?: Record<string, string | number>): string => {
    let text = (dict as Record<string, string>)[key] ?? key
    if (params !== undefined) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v))
      }
    }
    return text
  }) as LauncherProps['t']
}

describe('XPeachSettingsLauncher unified quota popover', () => {
  it('renders live balance pill in sidebar footer and opens unified XPeach token status card', async () => {
    const openSettings = vi.fn()
    const openConsole = vi.fn()
    const ssoLogout = vi.fn(async () => {})
    const loadUsage: LauncherProps['loadUsage'] = vi.fn(async () => ({
      bound: true,
      usage: {
        name: 'Admin',
        total_granted: 918.15 * 500_000,
        total_used: 793.90 * 500_000,
        total_available: 124.25 * 500_000,
        unlimited_quota: false,
        model_limits_enabled: false,
        expires_at: 0,
      },
      fetchedAt: Date.now(),
    }))
    const userSelf: LauncherProps['userSelf'] = vi.fn(async () => ({
      id: 1,
      username: 'admin',
      display_name: 'Admin',
      role: 10,
      status: 1,
      email: 'admin@xpeach.codes',
      quota: 124.25 * 500_000,
      used_quota: 793.90 * 500_000,
      request_count: 42,
      group: 'default',
      aff_code: 'ABCD',
      aff_count: 0,
      aff_quota: 0,
      aff_history_quota: 0,
    }))
    const nowSec = Math.floor(Date.now() / 1000)
    const load: LauncherProps['load'] = vi.fn(async () => ({
      bound: true,
      fetchedAt: Date.now(),
      logs: [
        {
          id: 101,
          user_id: 1,
          username: 'admin',
          created_at: nowSec - 30,
          type: 2,
          model_name: 'deepseek-v4.1-flash',
          quota: 5_000,
          prompt_tokens: 66,
          completion_tokens: 12,
          use_time: 2,
          is_stream: true,
          channel: 1,
          token_name: 'Admin',
        },
      ],
    }))

    render(
      <XPeachSettingsLauncher
        wide
        openSettings={openSettings}
        openConsole={openConsole}
        ssoLogout={ssoLogout}
        loadUsage={loadUsage}
        userSelf={userSelf}
        load={load}
        t={makeTranslator(zh)}
      />,
    )

    const pillButton = await waitFor(() => {
      const btn = screen.getByRole('button', { name: zh['pill.title'] })
      expect(btn.textContent).toContain('124.25🍑')
      return btn
    })

    fireEvent.click(pillButton)

    const dialog = await screen.findByRole('dialog', { name: zh['pill.title'] })
    expect(dialog.textContent).toContain('Admin')
    expect(dialog.textContent).toContain('918.15🍑')
    expect(dialog.textContent).toContain('793.90🍑')
    expect(dialog.textContent).toContain('deepseek-v4.1-flash')
    expect(dialog.textContent).toContain(zh['pill.low'])

    fireEvent.click(screen.getByRole('button', { name: zh['pill.openConsole'] }))
    expect(openConsole).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog', { name: zh['pill.title'] })).toBeNull()

    fireEvent.click(pillButton)
    await screen.findByRole('dialog', { name: zh['pill.title'] })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: zh['pill.title'] })).toBeNull()
  })
})
