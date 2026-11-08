/** `approval` namespace dictionaries. */

/** Simplified Chinese dictionary and key-set source of truth. */
export const zh = {
  waiting: '等待审批',
  'detail.aria': '审批详情',
  escalation: '工具 {toolName} 请求越权执行',
  reject: '拒绝',
  allowOnce: '允许一次',
} satisfies Record<string, string>

/** Approval dictionary key union. */
export type ApprovalKey = keyof typeof zh

/** English dictionary, checked against the Chinese key set. */
export const en = {
  waiting: 'Waiting for approval',
  'detail.aria': 'Approval details',
  escalation: 'Tool {toolName} requests privileged execution',
  reject: 'Reject',
  allowOnce: 'Allow once',
} satisfies Record<ApprovalKey, string>

/** Japanese copy, checked against the English keys. */
export const ja = {
  'waiting': '承認待ち',
  'detail.aria': '承認の詳細',
  'escalation': 'ツール {toolName} が特権実行を要求しています',
  'reject': '拒否',
  'allowOnce': '1 回だけ許可',
} satisfies Record<keyof typeof en, string>

/** Spanish dictionary, checked against the English keys. */
export const es = {
  waiting: 'Esperando aprobación',
  'detail.aria': 'Detalles de aprobación',
  escalation: 'La herramienta {toolName} solicita ejecución privilegiada',
  reject: 'Rechazar',
  allowOnce: 'permitir una vez',
} satisfies Record<keyof typeof en, string>

/** French dictionary, checked against the English keys. */
export const fr = {
  waiting: "En attente d'approbation",
  'detail.aria': "Détails de l'approbation",
  escalation: "L'outil {toolName} demande une exécution privilégiée",
  reject: 'Rejeter',
  allowOnce: 'Autoriser une fois',
} satisfies Record<keyof typeof en, string>

/** German dictionary, checked against the English keys. */
export const de = {
  waiting: 'Warten auf Genehmigung',
  'detail.aria': 'Einzelheiten zur Genehmigung',
  escalation: 'Tool {toolName} fordert privilegierte Ausführung an',
  reject: 'Ablehnen',
  allowOnce: 'Einmal zulassen',
} satisfies Record<keyof typeof en, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  waiting: 'Ожидание одобрения',
  'detail.aria': 'Детали утверждения',
  escalation: 'Инструмент {toolName} запрашивает привилегированное выполнение',
  reject: 'Отклонить',
  allowOnce: 'Разрешить один раз',
} satisfies Record<keyof typeof en, string>

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  waiting: 'Aguardando aprovação',
  'detail.aria': 'Detalhes de aprovação',
  escalation: 'A ferramenta {toolName} solicita execução privilegiada',
  reject: 'Rejeitar',
  allowOnce: 'Permitir uma vez',
} satisfies Record<keyof typeof en, string>
