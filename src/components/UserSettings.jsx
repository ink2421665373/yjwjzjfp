import { useState } from 'react'
import { changePassword } from '../api/backend'

const UserSettings = ({ user, onClose, onLogout }) => {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('请填写所有字段')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }

    if (newPassword.length < 6) {
      setError('新密码至少需要6位')
      return
    }

    setIsLoading(true)

    try {
      await changePassword(oldPassword, newPassword, confirmPassword)
      setSuccess('✓ 密码修改成功！')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message || '密码修改失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    onLogout()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-card p-8 w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>⚙️</span>
            用户设置
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{user.username}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                user.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}>
                {user.role === 'admin' ? '管理员' : '普通用户'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">修改密码</h3>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm animate-fade-in">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-600 mb-2 font-medium">当前密码</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="请输入当前密码"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-2 font-medium">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入新密码（至少6位）"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-2 font-medium">确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入新密码"
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⟳</span>
                修改中...
              </>
            ) : (
              <>
                <span>🔑</span>
                修改密码
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full py-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
          >
            <span>👋</span>
            退出登录
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserSettings
