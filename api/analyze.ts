// 引入 Vercel 的类型定义，让 IDE 有自动补全和类型检查
import type { VercelRequest, VercelResponse } from '@vercel/node'

// 从环境变量中读取 DeepSeek API Key，感叹号表示“一定存在”（部署时在 Vercel 后台设置）
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!

/**
 * 免费版提示词（基础分析）
 * 要求 AI 返回严格的 JSON 格式，不输出任何额外文字
 * 包含：一句话总结、情绪分布、主要情绪、痛点列表、高影响力评论
 */
const freePrompt = `你是一个社交媒体评论分析专家。输入是一个评论对象数组（每个对象有text和likes字段）。输出必须是严格的JSON，不要包含任何解释。
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

/**
 * Pro 版提示词（在免费版基础上扩展更多维度）
 * 直接复用 freePrompt 并在末尾追加新字段，减少重复
 */
const fullPrompt = freePrompt + `
扩展输出以下字段：
  "persona": { "age_range": "推测的年龄段", "identities": ["学生","宝妈"], "lifestyle": ["追求性价比"] },
  "competitors": [ { "name": "竞品名称", "mention_rate": 0.15, "sentiment": "positive/negative/neutral" } ],
  "scenarios": ["使用场景"],
  "purchase_drivers": ["促进购买的因素"],
  "purchase_blockers": ["阻碍购买的因素"],
  "alert": false
`

// 默认导出一个异步函数，这就是 Vercel Serverless Function 的入口
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只接受 POST 请求，其他方法返回 405
  if (req.method !== 'POST') return res.status(405).end()
  
  // 从请求体中解构出 comments 数组和 pro 布尔值
  const { comments, pro } = req.body
  // 如果没有 comments 或不是数组，返回 400 错误
  if (!comments || !Array.isArray(comments)) return res.status(400).json({ error: '缺少评论数据' })

  // 根据是否为 Pro 选择对应的系统提示词
  const systemPrompt = pro ? fullPrompt : freePrompt
  // 将评论数组转为 JSON 字符串，并限制最多 300 条（控制 token 消耗）
  const userMessage = JSON.stringify(comments.slice(0, 300))

  try {
    // 调用 DeepSeek 的 chat completions 接口
    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 使用你自己的 API Key（从环境变量读取，绝对不会暴露给前端）
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',          // DeepSeek 的对话模型
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        response_format: { type: 'json_object' }, // 强制返回纯 JSON
        temperature: 0.2,               // 低温度保证结果稳定
        max_tokens: 2000                 // 限制输出长度
      })
    })

    const json = await resp.json()
    // 如果 DeepSeek 返回错误（如 key 无效），抛异常
    if (!json.choices) throw new Error(json.error?.message || 'API错误')
    
    // 解析 AI 返回的 JSON 字符串
    const result = JSON.parse(json.choices[0].message.content)
    // 返回给前端（插件）
    return res.status(200).json(result)
  } catch (e: any) {
    console.error(e)
    // 内部错误返回 500
    return res.status(500).json({ error: '分析失败' })
  }
}