import { useState } from 'react'
import { login, register } from '../api/backend'
import ParticleBackground from './ParticleBackground'

const LoginModal = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRegister, setIsRegister] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      const result = await login(username, password)
      onLogin(result.user, result.token)
    } catch (err) {
      setError(err.message || '登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await register(username, password)
      onLogin(result.user, result.token)
    } catch (err) {
      setError(err.message || '注册失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <ParticleBackground />
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '0.5s' }} />
      
      <div className="glass-card p-8 w-full max-w-md animate-scale-in relative z-10 animate-pulse-glow">
        <div className="text-center mb-8">
          <div className="text-6xl mb-5 inline-block animate-float">⚔️</div>
          <h1 className="text-2xl font-bold mb-2 gradient-text">永劫无间队友分配</h1>
          <p className="text-slate-500 text-sm">智能分队 · 公平竞技 · 快乐开黑</p>
        </div>

        <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setIsRegister(false); setError('') }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              !isRegister ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            🔐 登录
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(''); setPassword(''); setConfirmPassword('') }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isRegister ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            📝 注册
          </button>
        </div>
        
        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-shake">
              ⚠️ {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm text-slate-600 mb-2 font-medium">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isRegister ? '请输入用户名（3-20字符）' : '请输入用户名'}
              className="input-field"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-600 mb-2 font-medium">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? '请输入密码（至少6位）' : '请输入密码'}
              className="input-field"
            />
          </div>
          
          {isRegister && (
            <div>
              <label className="block text-sm text-slate-600 mb-2 font-medium">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                className="input-field"
              />
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⟳</span>
                {isRegister ? '注册中...' : '登录中...'}
              </>
            ) : (
              <>
                <span>{isRegister ? '📝' : '🔐'}</span>
                {isRegister ? '注 册' : '登 录'}
              </>
            )}
          </button>
        </form>

        {!isRegister && (
          <p className="text-center text-slate-400 text-xs mt-5">
            默认账号：admin/admin（管理员） | user/user（普通用户）
          </p>
        )}
        
        {isRegister && (
          <p className="text-center text-slate-400 text-xs mt-5">
            注册后为普通用户，如需管理员权限请联系系统管理员
          </p>
        )}
      </div>
    </div>
  )
}

export default LoginModal
