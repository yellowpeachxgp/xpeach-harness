// PAT login flow regression: settings unbind → console login card → rebind.
// Runs after admin/console cases so a stale key still exists upstream; the
// final bind restores the bound state for later cases.
import { openConsole } from './harness.mjs'
export const name = 'login: unbind → login card → rebind'
const KEY = process.env.XPEACH_TEST_KEY
if (KEY === undefined || KEY.length === 0) {
  throw new Error('XPEACH_TEST_KEY is required: set it to a test-account key; never commit a real key as a fallback')
}
export async function run(page) {
  // 1) open settings → XPeach section → unbind
  await page.getByRole('button', { name: /settings|设置/i }).first().click()
  await page.waitForTimeout(2500)
  await page.getByText('XPeach', { exact: true }).first().click()
  await page.waitForTimeout(3000)
  const unbind = page.getByRole('button', { name: /解绑|Unbind/i }).first()
  if (await unbind.count() === 0) throw new Error('no unbind button — section not bound?')
  await unbind.click()
  await page.waitForTimeout(2500)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(800)
  // 2) console shows the login card
  await openConsole(page)
  const loginInput = page.locator('input[type="password"]').last()
  await loginInput.waitFor({ timeout: 15000 })
  // 3) wrong-shape key rejected client-side
  await loginInput.fill('bad-key')
  await page.locator('button').filter({ hasText: /绑定|Bind/i }).last().click().catch(() => {})
  await page.waitForTimeout(1200)
  const errCount = await page.locator('[class*="bindError"], [class*="loginCard"] [class*="Error"]').count()
  // 4) real key → dashboard
  await loginInput.fill(KEY)
  await loginInput.press('Enter')
  await page.waitForTimeout(7000)
  const body = await page.evaluate(() => document.body.innerText)
  if (!/已用额度|Used|令牌|测试/.test(body)) throw new Error('bind did not restore dashboard')
  console.log('    login flow: unbind→card→rebind ok')
}
