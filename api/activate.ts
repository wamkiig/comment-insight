import type { VercelRequest, VercelResponse } from '@vercel/node'

// 从 Vercel 环境变量中获取有效激活码列表
const VALID_CODES = (process.env.VALID_CODES || '').split(',')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { code } = req.body
  if (!code) return res.json({ valid: false })
  const valid = VALID_CODES.includes(code.trim())
  return res.status(200).json({ valid })
}