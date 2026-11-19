/** 两份旧桌面录制保留当时文字，参数、执行和结果沿用当前注册定义。 */
export const name = 'snapshot-legacy-desktop-tool-descriptions'
export const inject = ['agents', 'tools']

const descriptions = {
  ask_user_question: 'Ask the user a concise question when you need confirmation, a choice, or missing information before proceeding. An answer item with empty selected and no custom means the user skipped that question: continue without it, do not ask it again, and do not treat the skip as permission.',
  present: 'Declare existing files as final deliverables for the user. Hosts may show presented files only after your turn ends, so call it once the files are final. If the user needs to review files earlier, such as before a tool call that waits for their answer, link them in your message instead. Use it when the user needs a separate file, especially Office documents, spreadsheets, and slide decks; prefer your final response when that suffices. The user opens the current files; their contents are not copied.',
}

const guidance = [
  ['tool:write', 'TOOL_WRITE', 'Read an existing file before overwriting it with write (the default fs-observation-policy requires it) and prefer edit for targeted changes.'],
  ['tool:edit', 'TOOL_EDIT', 'Read a file before editing it (the default fs-observation-policy requires it), unless you just created or edited it in this session.'],
  ['tool:subagent', 'TOOL_SUBAGENT', 'Start independent delegations with `subagent` or `subagent_fork` together in one assistant message and continue useful work while they run. When only waiting for their results remains, end your turn instead of sleeping or polling; the next result starts a new turn.'],
  ['ui:deliverable-file-references', 'DELIVERABLE_FILE_REFERENCES', 'Prefer showing the primary results within your final response alongside a brief explanation. Use ![Description](<path/to/image.png>) when an image supports an explanation or comparison. Use [Description](<path/to/image.png>) when referring to an image or listing files. Enclose Markdown file destinations in angle brackets, especially paths containing spaces. Do not call present just to list edited source files, or run commands to check whether a diff view will appear. Use present to publish complete deliverables, including images, Office documents, spreadsheets, and slide decks, when separate access helps the user. Hosts that support file cards can show the presented file with preview and open actions. Avoid repeating results already shown inline unless the separate card adds useful access. Outside commands, configuration expressions, and code blocks, link every mention of an existing file, including repeats and tables, to its full path relative to the working directory or absolute; append #L24 or #L24-L30 to the target for known lines. Use the filename or a clear alias as the label, adding only enough parent directories to distinguish files; keep full paths out of labels. Default to the name alone; when precise locations matter, append :24 or :24–30, with no # or L in the line suffix.'],
]

/** @param {import('@xpeach/xph-cordis').Context} ctx - 仅此历史场景的上下文。 */
export function apply(ctx) {
  ctx.on('agent/created', async ({ agent }) => {
    await agent.ctx.plugin({
      name: 'snapshot-legacy-command-tool-description-scope',
      inject: ['tools', 'systemPrompt'],
      apply: inner => {
        for (const [name, description] of Object.entries(descriptions)) {
          const definition = ctx.tools.get(name)
          if (definition === undefined) throw new Error(`历史附件场景缺少工具：${name}`)
          inner.tools.register({ ...definition, description })
        }
        for (const [name, order, text] of guidance) {
          inner.systemPrompt.section({ name, order: inner.systemPrompt.getSectionOrder(order), text })
        }
      },
    })
  })
}
