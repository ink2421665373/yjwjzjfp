import { useState } from 'react'

function APIConfig({ isAdmin }) {
  const [aiApiKey, setAiApiKey] = useState(localStorage.getItem('naraka_ai_api_key') || '')
  const [aiApiUrl, setAiApiUrl] = useState(localStorage.getItem('naraka_ai_api_url') || 'https://api.openai.com/v1')
  const [aiModel, setAiModel] = useState(localStorage.getItem('naraka_ai_model') || '')
  const [availableModels, setAvailableModels] = useState([])
  const [isFetchingModels, setIsFetchingModels] = useState(false)
  const [testStatus, setTestStatus] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  const fetchModels = async () => {
    if (!aiApiKey.trim()) {
      alert('请先输入API Key！')
      return
    }
    
    setIsFetchingModels(true)
    
    try {
      const response = await fetch(`${aiApiUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${aiApiKey}`
        },
        timeout: 15000
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.data && Array.isArray(data.data)) {
          const modelNames = data.data.map(m => m.id).filter(m => 
            m.includes('gpt') || m.includes('turbo') || m.includes('claude') || m.includes('llama') || m.includes('qwen')
          )
          setAvailableModels(modelNames)
          setTestStatus(`✅ 获取到 ${modelNames.length} 个模型！`)
        } else {
          setTestStatus('⚠️ 未找到可用模型')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        setTestStatus(`❌ 获取失败: ${errorData.error?.message || `HTTP ${response.status}`}`)
      }
    } catch (error) {
      setTestStatus(`❌ 获取失败: ${error.message}`)
    } finally {
      setIsFetchingModels(false)
    }
  }

  const handleSave = () => {
    if (!aiModel.trim()) {
      alert('请选择或输入模型名称！')
      return
    }
    localStorage.setItem('naraka_ai_api_key', aiApiKey)
    localStorage.setItem('naraka_ai_api_url', aiApiUrl)
    localStorage.setItem('naraka_ai_model', aiModel)
    setTestStatus('✅ AI配置已保存！')
    setTimeout(() => setTestStatus(''), 3000)
  }

  const handleTestConnection = async () => {
    if (!aiApiKey.trim()) {
      alert('请输入API Key！')
      return
    }
    
    if (!aiModel.trim()) {
      alert('请选择或输入模型名称！')
      return
    }
    
    setIsTesting(true)
    setTestStatus('')
    
    try {
      const response = await fetch(`${aiApiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiApiKey}`
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [{ role: 'user', content: 'hello' }],
          max_tokens: 10
        }),
        timeout: 15000
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.choices && data.choices.length > 0) {
          setTestStatus('✅ AI API连接成功！')
        } else {
          setTestStatus(`⚠️ API返回异常`)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        setTestStatus(`❌ 连接失败: ${errorData.error?.message || `HTTP ${response.status}`}`)
      }
    } catch (error) {
      setTestStatus(`❌ 连接失败: ${error.message}`)
    } finally {
      setIsTesting(false)
    }
  }

  const handleReset = () => {
    setAiApiKey('')
    setAiApiUrl('https://api.openai.com/v1')
    setAiModel('')
    setAvailableModels([])
    localStorage.removeItem('naraka_ai_api_key')
    localStorage.setItem('naraka_ai_api_url', 'https://api.openai.com/v1')
    localStorage.removeItem('naraka_ai_model')
    setTestStatus('🔄 配置已重置')
    setTimeout(() => setTestStatus(''), 3000)
  }

  if (!isAdmin) return null

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
        <span className="text-2xl">🤖</span>
        AI API配置
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-white/60 text-sm mb-2">API Key</label>
          <input
            type="password"
            value={aiApiKey}
            onChange={(e) => setAiApiKey(e.target.value)}
            className="w-full bg-white/10 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          />
          <p className="text-white/40 text-xs mt-1">OpenAI API Key</p>
        </div>
        
        <div>
          <label className="block text-white/60 text-sm mb-2">API地址</label>
          <input
            type="text"
            value={aiApiUrl}
            onChange={(e) => setAiApiUrl(e.target.value)}
            className="w-full bg-white/10 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="https://api.openai.com/v1"
          />
          <p className="text-white/40 text-xs mt-1">支持自定义API地址（如本地部署的LLM）</p>
        </div>
        
        <div>
          <label className="block text-white/60 text-sm mb-2">模型名称</label>
          
          {availableModels.length > 0 ? (
            <div>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full bg-white/10 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
              >
                <option value="">请选择模型</option>
                {availableModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          ) : (
            <input
              type="text"
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="w-full bg-white/10 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono mb-2"
              placeholder="输入模型名称或点击下方按钮获取"
            />
          )}
          
          <button
            onClick={fetchModels}
            disabled={isFetchingModels || !aiApiKey.trim()}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-bold disabled:opacity-50"
          >
            {isFetchingModels ? '🔄 获取中...' : '🔍 从API获取模型列表'}
          </button>
          
          {availableModels.length > 0 && (
            <p className="text-white/40 text-xs mt-2">
              已获取到 {availableModels.length} 个模型
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-bold disabled:opacity-50"
          >
            {isTesting ? '🔄 测试中...' : '🔍 测试连接'}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-bold"
          >
            💾 保存
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            🔄 重置
          </button>
        </div>
        
        {testStatus && (
          <div className={`p-3 rounded-lg text-sm ${
            testStatus.includes('✅') ? 'bg-green-600/20 text-green-400' :
            testStatus.includes('⚠️') ? 'bg-yellow-600/20 text-yellow-400' :
            'bg-red-600/20 text-red-400'
          }`}>
            {testStatus}
          </div>
        )}
        
        {!aiApiKey && (
          <div className="p-3 bg-yellow-600/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              ⚠️ 未配置AI API，将使用内置回答。配置后可使用真实AI服务。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default APIConfig