// @vitest-environment jsdom
/** Unit tests for the modernized 1-click PKCE XPeach SSO Onboarding & Login UI. */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type XPeachKey, zh } from '../src/client/locales.ts'
import { XPeachOnboarding, type XPeachOnboardingProps } from '../src/client/XPeachOnboarding.tsx'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

function makeTranslator(dict: Record<XPeachKey, string>): XPeachOnboardingProps['t'] {
  return ((key: string, params?: Record<string, string | number>): string => {
    let text = (dict as Record<string, string>)[key] ?? key
    if (params !== undefined) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v))
      }
    }
    return text
  }) as XPeachOnboardingProps['t']
}

describe('XPeachOnboarding 1-click PKCE SSO login UI', () => {
  it('renders clean SSO sign-in card without legacy token paste inputs and completes PKCE browser flow', async () => {
    const ssoBrowserStart = vi.fn(async () => ({
      attemptId: 'att-pkce-1',
      mode: 'pkce' as const,
      authorizationUrl: 'https://sso.xpeach.codes/authorize?client_id=xpeach-harness',
      expiresIn: 300,
      interval: 1,
      browserOpened: true,
    }))
    const ssoBrowserCancel = vi.fn(async () => undefined)
    const ssoBrowserPoll = vi.fn(async () => ({
      status: 'pending' as const,
    }))

    render(
      <XPeachOnboarding
        t={makeTranslator(zh)}
        ssoBrowserStart={ssoBrowserStart}
        ssoBrowserPoll={ssoBrowserPoll}
        ssoBrowserCancel={ssoBrowserCancel}
        subscribeCredentialChange={() => () => undefined}
        keyState={async () => ({ bound: false })}
        sessionBound={async () => ({ bound: false })}
        onboardingScan={async () => ({ sources: [], mcp: [], skills: [], prompts: [] })}
        importConversations={async () => []}
        importAssets={async () => ({ mcp: 0, skills: 0, prompts: 0, errors: [] })}
        onboardingDone={async () => ({ done: false })}
        onboardingComplete={async () => ({ done: true })}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('欢迎使用 XPeach Harness')).toBeTruthy()
      expect(screen.getByText('SSO 免密一键接入')).toBeTruthy()
    })

    fireEvent.click(screen.getByText('开始设置'))

    await waitFor(() => {
      expect(screen.getByText('登录 XPeach 账号')).toBeTruthy()
      expect(screen.getByText('免粘贴一键回环')).toBeTruthy()
    })

    expect(screen.queryByPlaceholderText(/Access Token/iu)).toBeNull()
    expect(screen.queryByText('粘贴访问令牌')).toBeNull()

    fireEvent.click(screen.getByText('通过 XPeach SSO 一键登录'))

    await waitFor(() => {
      expect(ssoBrowserStart).toHaveBeenCalledWith(true)
      expect(screen.getByText('正在等待浏览器完成 SSO 授权')).toBeTruthy()
      expect(screen.getByText('复制授权链接')).toBeTruthy()
    })
    expect(screen.queryByText('复制验证码')).toBeNull()

    fireEvent.click(screen.getByText('取消等待'))
    expect(ssoBrowserCancel).toHaveBeenCalledWith('att-pkce-1')
  })
})
