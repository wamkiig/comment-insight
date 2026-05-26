import { useEffect, useState } from "react"
import "../style.css"

interface Report {
  summary: string
  emotion: { positive: number; negative: number; neutral: number; main_emotions: string[] }
  pain_points: { topic: string; percentage: number; example: string }[]
  highlight_comments: { text: string; likes: number; reason: string }[]
  persona?: { age_range?: string; identities?: string[]; lifestyle?: string[] }
  competitors?: { name: string; mention_rate: number; sentiment: string }[]
  scenarios?: string[]
  purchase_drivers?: string[]
  purchase_blockers?: string[]
  alert?: boolean
}

export default function SidePanel() {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const msgListener = (msg: any) => {
      if (msg.type === "DISPLAY_REPORT") {
        setReport(msg.payload)
        setLoading(false)
      }
      if (msg.type === "ANALYSIS_LOADING") setLoading(true)
      if (msg.type === "ANALYSIS_ERROR") {
        setLoading(false)
        alert(msg.payload)
      }
    }
    chrome.runtime.onMessage.addListener(msgListener)
    return () => chrome.runtime.onMessage.removeListener(msgListener)
  }, [])

  if (loading) return <div className="p-4 text-gray-400 text-sm">AI 正在深度分析评论区...</div>
  if (!report) return <div className="p-4 text-gray-400 text-sm">点击页面右侧 ✨AI 洞察 按钮开始分析</div>

  return (
    <div className="p-4 font-sans text-gray-800 bg-gray-50 min-h-screen">
      <Card title="😊 情绪分布">
        <div className="flex gap-3 text-sm">
          <span className="text-green-600 font-medium">👍 {Math.round(report.emotion.positive * 100)}%</span>
          <span className="text-gray-400">😐 {Math.round(report.emotion.neutral * 100)}%</span>
          <span className="text-red-400 font-medium">👎 {Math.round(report.emotion.negative * 100)}%</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">{report.emotion.main_emotions?.join(" · ")}</div>
      </Card>

      <Card title="📝 总结"><p className="text-sm font-medium">{report.summary}</p></Card>

      <Card title="😣 用户痛点">
        {report.pain_points?.map((pp, i) => (
          <div key={i} className="mb-3 last:mb-0">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">{pp.topic}</span>
              <span className="text-gray-400">{pp.percentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${pp.percentage}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1 italic">“{pp.example}”</p>
          </div>
        ))}
      </Card>

      <Card title="💬 高影响力评论">
        {report.highlight_comments?.map((hc, i) => (
          <div key={i} className="border-l-2 border-blue-400 pl-3 mb-3 last:mb-0">
            <p className="text-sm">{hc.text}</p>
            <p className="text-xs text-gray-400 mt-1">👍 {hc.likes} · {hc.reason}</p>
          </div>
        ))}
      </Card>

      {report.persona && (
        <Card title="👥 用户画像">
          <p className="text-xs mb-2">年龄段：{report.persona.age_range || "未知"}</p>
          <div className="flex flex-wrap gap-2">
            {report.persona.identities?.map(id => <span key={id} className="bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 text-xs">{id}</span>)}
          </div>
        </Card>
      )}

      {report.competitors && (
        <Card title="🕵️ 竞品提及">
          {report.competitors.map((c, i) => (
            <div key={i} className="flex justify-between text-xs mb-1">
              <span>{c.name}</span>
              <span className="text-gray-500">{Math.round(c.mention_rate * 100)}% · {c.sentiment}</span>
            </div>
          ))}
        </Card>
      )}

      {report.scenarios && (
        <Card title="📌 使用场景">
          <div className="flex flex-wrap gap-2">{report.scenarios.map(s => <span key={s} className="bg-gray-100 rounded-full px-2 py-0.5 text-xs">{s}</span>)}</div>
        </Card>
      )}

      {report.purchase_drivers && <Card title="✅ 购买驱动力"><p className="text-xs">{report.purchase_drivers.join("、")}</p></Card>}
      {report.purchase_blockers && <Card title="⚠️ 购买阻碍"><p className="text-xs">{report.purchase_blockers.join("、")}</p></Card>}
      {report.alert && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs">检测到负面情绪或安全警告，请关注。</div>}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold mb-3 text-gray-700">{title}</h3>
      {children}
    </div>
  )
}