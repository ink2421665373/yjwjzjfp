import { useState } from 'react'

function AIQA({ isAdmin }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '您好！我是永劫无间AI助手，请问有什么可以帮您的？我可以帮您分析玩家数据、提供分组建议、解答游戏问题等。'
    }
  ])
  const [isLoading, setIsLoading] = useState(false)

  const gameQuestions = [
    { q: '季沧海怎么玩？', a: '季沧海是一位强大的近战英雄，擅长火焰攻击。核心技能是燎原劲和龙摆尾，团战中可以利用大招打出范围伤害。建议搭配魂玉：烈焰斩、风火轮、夺魂。' },
    { q: '胡桃怎么玩？', a: '胡桃是一位灵活的刺客型英雄，擅长突进和收割。核心技能是影袭和鬼哭神嚎，可以快速切入战场。建议搭配魂玉：噬魂斩、影遁、狂暴。' },
    { q: '天海怎么玩？', a: '天海是一位坦克型英雄，擅长控制和保护队友。核心技能是金钟罩和万法归一，团战中可以吸收大量伤害。建议搭配魂玉：金刚不坏、金钟破、修罗。' },
    { q: '岳山怎么玩？', a: '岳山是一位战士型英雄，攻守兼备。核心技能是云龙九变和破云斩，能快速接近敌人。建议搭配魂玉：破阵、横扫千军、固守。' },
    { q: '什么是天选三排？', a: '天选三排是永劫无间的一种游戏模式，三名玩家组队进行大逃杀对战，最终存活到最后的队伍获胜。天选之人是指在该模式中获胜的玩家。' },
    { q: '如何提高胜率？', a: '提高胜率的关键在于：1.熟悉地图和资源分布；2.掌握至少2-3个英雄；3.与队友保持沟通；4.注意听声辨位；5.合理利用地形和草丛。' },
    { q: '什么魂玉最好？', a: '没有绝对最好的魂玉，关键在于搭配。攻击型推荐：噬魂斩、夺魂、狂暴；防御型推荐：金刚不坏、固守、护盾；机动性推荐：钩锁百裂、影遁、疾风步。' }
  ]

  const generateFallbackResponse = (userQuestion) => {
    const lowerQ = userQuestion.toLowerCase()
    
    const matched = gameQuestions.find(q => lowerQ.includes(q.q.toLowerCase().slice(0, -1)))
    if (matched) {
      return matched.a
    }
    
    if (lowerQ.includes('分组') || lowerQ.includes('分队') || lowerQ.includes('队友')) {
      return '分组和分队功能可以帮助您公平分配队友。建议先添加玩家，然后使用自动分配功能，系统会根据玩家评分进行均衡分组。如果您有特殊需求，也可以手动调整。'
    }
    
    if (lowerQ.includes('评分') || lowerQ.includes('分数')) {
      return '评分系统综合考虑了玩家的段位分、场均击杀、场均伤害、K/D比率、第一率等多个维度，能够客观反映玩家实力。您可以在配置面板中调整各项指标的权重。'
    }
    
    return `关于"${userQuestion}"，这是一个很好的问题！永劫无间是一款非常有趣的游戏，建议您多练习不同英雄，与队友保持良好沟通，相信您的实力会不断提升！如有具体问题，欢迎继续提问。`
  }

  const callAIAPI = async (userQuestion) => {
    const apiKey = localStorage.getItem('naraka_ai_api_key')
    const apiUrl = localStorage.getItem('naraka_ai_api_url') || 'https://api.openai.com/v1'
    const selectedModel = localStorage.getItem('naraka_ai_model') || 'gpt-3.5-turbo'
    const model = selectedModel === 'custom' 
      ? localStorage.getItem('naraka_ai_custom_model') || 'gpt-3.5-turbo'
      : selectedModel
    
    if (!apiKey) {
      return null
    }

    try {
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { 
              role: 'system', 
              content: '你是永劫无间游戏的专业助手，擅长分析玩家数据、提供分组建议和解答游戏问题。请用中文回答，回答要简洁明了。'
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userQuestion }
          ],
          max_tokens: 500
        }),
        timeout: 30000
      })

      if (response.ok) {
        const data = await response.json()
        if (data.choices && data.choices.length > 0) {
          return data.choices[0].message.content
        }
      }
      return null
    } catch (error) {
      console.error('AI API调用失败:', error)
      return null
    }
  }

  const handleSend = async () => {
    if (!question.trim()) return
    
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setIsLoading(true)
    setQuestion('')
    
    let response = null
    
    response = await callAIAPI(question)
    
    if (!response) {
      await new Promise(resolve => setTimeout(resolve, 800))
      response = generateFallbackResponse(question)
    }
    
    setMessages(prev => [...prev, { role: 'assistant', content: response }])
    setIsLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const hasAIConfigured = localStorage.getItem('naraka_ai_api_key')

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
        <span className="text-2xl">🤖</span>
        AI助手
        {hasAIConfigured && <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full">已配置</span>}
        {!hasAIConfigured && <span className="text-xs bg-gray-600 px-2 py-0.5 rounded-full">内置模式</span>}
      </h2>
      
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-purple-500 to-pink-500'
            }`}>
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className={`max-w-[70%] p-3 rounded-xl ${
              msg.role === 'user' 
                ? 'bg-blue-600/30 text-white' 
                : 'bg-white/10 text-white'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              🤖
            </div>
            <div className="bg-white/10 text-white p-3 rounded-xl">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入您的问题，例如：季沧海怎么玩？"
          className="flex-1 bg-white/10 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/40"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          发送
        </button>
      </div>
      
      <div className="mt-3 flex flex-wrap gap-2">
        {gameQuestions.slice(0, 4).map((q, i) => (
          <button
            key={i}
            onClick={() => {
              setQuestion(q.q)
            }}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-full transition-colors"
          >
            {q.q.slice(0, -1)}
          </button>
        ))}
      </div>
    </div>
  )
}

export default AIQA