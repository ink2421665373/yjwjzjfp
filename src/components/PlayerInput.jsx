import { useState } from 'react'

const PlayerInput = ({ onAddPlayer }) => {
  const [playerName, setPlayerName] = useState('')
  const [nickname, setNickname] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!playerName.trim()) {
      setError('请输入角色名')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      await onAddPlayer(playerName.trim(), nickname.trim() || playerName.trim())
      setPlayerName('')
      setNickname('')
    } catch (err) {
      setError(err.message || '添加失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="glass-card p-6 animate-fade-in delay-100">
      <h2 className="section-title mb-5">
        <span className="section-title-icon animate-bounce-subtle">⚔️</span>
        添加玩家
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-shake">
            ⚠️ {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm text-slate-600 mb-2 font-medium">角色名</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value)
              setError('')
            }}
            placeholder="请输入玩家角色名"
            className="input-field"
          />
        </div>
        
        <div>
          <label className="block text-sm text-slate-600 mb-2 font-medium">
            自定义昵称
            <span className="text-slate-400 font-normal ml-1">(可选)</span>
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="不填则使用角色名"
            className="input-field"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⟳</span>
              查询中...
            </>
          ) : (
            <>
              <span>➕</span>
              添加玩家
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default PlayerInput
