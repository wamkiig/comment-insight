import type { VercelRequest, VercelResponse } from '@vercel/node'

// 从环境变量中读取有效激活码列表（多个用逗号分隔，如 "ABC123,DEF456"）
const VALID_CODES = (process.env.VALID_CODES || '').split(',')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { code } = req.body
  // 如果没有传激活码，直接返回无效
  if (!code) return res.json({ valid: false })
  
  // 检查激活码是否在列表里（trim 去除首尾空格）
  const valid = VALID_CODES.includes(code.trim())
  return res.status(200).json({ valid })
}