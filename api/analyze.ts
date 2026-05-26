import type { VercelRequest, VercelResponse } from '@vercel/node'

// 从 Vercel 环境变量读取 API Key
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!

// 免费版提示词
const freePrompt = `你是一个社交媒体评论分析专家。输入是一个评论对象数组（每个对象有text和likes字段）。输出必须是严格的JSON，不要有任何解释。
JSON格式：
{
  "summary": "一句话总结（中文，30字内）",
  "emotion": {
    "positive": 0.6,
    "negative": 0.1,
    "neutral": 0.3,
    "main_emotions": ["惊喜","失望","喜爱"]
  },
  "pain_points": [
    { "topic": "问题简要描述", "percentage": 25, "example": "相关评论文本" }
  ],
  "highlight_comments": [
    { "text": "评论原文", "likes": 100, "reason": "选取原因" }
  ]
}`

// Pro版提示词（在免费版基础上扩展）
const fullPrompt = freePrompt + `
扩展输出以下字段：
  "persona": { "age_range": "推测的年龄段", "identities": ["学生","宝妈"], "lifestyle": ["追求性价比"] },
  "competitors": [ { "name": "竞品名称", "mention_rate": 0.15, "sentiment": "positive/negative/neutral" } ],
  "scenarios": ["使用场景"],
  "purchase_drivers": ["促进购买的因素"],
  "purchase_blockers": ["阻碍购买的因素"],
  "alert": false
`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { comments, pro } = req.body
  if (!comments || !Array.isArray(comments)) return res.status(400).json({ error: '缺少评论数据' })

  const systemPrompt = pro ? fullPrompt : freePrompt
  const userMessage = JSON.stringify(comments.slice(0, 300))

  try {
    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 2000
      })
    })
    const json = await resp.json()
    if (!json.choices) throw new Error(json.error?.message || 'API错误')
    const result = JSON.parse(json.choices[0].message.content)
    return res.status(200).json(result)
  } catch (e: any) {
    console.error(e)
    return res.status(500).json({ error: '分析失败' })
  }
}