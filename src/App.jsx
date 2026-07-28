import { useState, useEffect } from 'react'
import PlayerInput from './components/PlayerInput'
import PlayerList from './components/PlayerList'
import TeamResult from './components/TeamResult'
import GroupPanel from './components/GroupPanel'
import TeamPanel from './components/TeamPanel'
import AnnouncementPanel from './components/AnnouncementPanel'
import LoginModal from './components/LoginModal'
import ParticleBackground from './components/ParticleBackground'
import UserSettings from './components/UserSettings'

import { login as apiLogin, getPlayers, addPlayer, deletePlayer, getGroups, addGroup, updateGroup, deleteGroup, addPlayerToGroup, removePlayerFromGroup, getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement, clearAllData, importGroups } from './api/backend'

function loadUser() {
  try {
    const saved = localStorage.getItem('naraka_user')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load user:', e)
  }
  return null
}

function App() {
  const savedUser = loadUser()
  
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])
  
  const [teamNames, setTeamNames] = useState([])
  const [showResult, setShowResult] = useState(false)
  const [powerGroups, setPowerGroups] = useState([
    { id: 1, name: '1组', players: [], customScore: 0, playerIds: [] },
    { id: 2, name: '2组', players: [], customScore: 0, playerIds: [] },
    { id: 3, name: '3组', players: [], customScore: 0, playerIds: [] }
  ])
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: '欢迎使用队友分配系统',
      content: '本系统可以帮助您根据天选三排数据智能分配队友，确保各队实力均衡。',
      author: '管理员',
      createdAt: '2026/6/17 10:00',
      pinned: 1
    },
    {
      id: 2,
      title: '使用提示',
      content: '分组：用于区分玩家实力等级；分队：用于实际匹配队伍。添加玩家后先分组再分队。',
      author: '管理员',
      createdAt: '2026/6/17 10:05',
      pinned: 0
    },
    {
      id: 3,
      title: '权限说明',
      content: '管理员可以添加/修改/删除玩家和公告，普通用户只能查看。默认管理员密码：admin',
      author: '管理员',
      createdAt: '2026/6/17 11:00',
      pinned: 0
    }
  ])
  const [saveStatus, setSaveStatus] = useState('')
  const [currentUser, setCurrentUser] = useState(savedUser || null)
  const [showLogin, setShowLogin] = useState(!savedUser)
  const [isLoading, setIsLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (savedUser) {
        try {
          const [playersData, groupsData, announcementsData] = await Promise.all([
            getPlayers(),
            getGroups(),
            getAnnouncements()
          ])
          
          const groupsWithPlayers = groupsData.map(group => ({
            ...group,
            players: playersData.filter(p => group.playerIds.includes(p.id)).map(p => ({ ...p, sourceGroupId: group.id }))
          }))
          const ungroupedPlayers = playersData.filter(p => !groupsData.some(g => g.playerIds.includes(p.id)))
          
          setPlayers(ungroupedPlayers)
          setPowerGroups(groupsWithPlayers)
          setAnnouncements(announcementsData)
        } catch (error) {
          console.error('Failed to load data:', error)
        }
      }
      setIsLoading(false)
    }
    loadData()

    const handleTokenExpired = () => {
      setCurrentUser(null)
      setShowLogin(true)
      showSaveMessage('⏰ 登录已过期，请重新登录')
    }

    window.addEventListener('tokenExpired', handleTokenExpired)

    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired)
    }
  }, [savedUser])

  const isAdmin = currentUser?.role === 'admin'

  const showSaveMessage = (message) => {
    setSaveStatus(message)
    setTimeout(() => setSaveStatus(''), 2000)
  }

  const handleLogin = async (user, token) => {
    setCurrentUser(user)
    setShowLogin(false)
    showSaveMessage('✅ 登录成功')
  }

  const handleLogout = () => {
    localStorage.removeItem('naraka_token')
    localStorage.removeItem('naraka_user')
    setCurrentUser(null)
    setShowLogin(true)
    showSaveMessage('👋 已退出登录')
  }

  const handleAddPlayer = async (playerName, nickname) => {
    if (!isAdmin) {
      alert('只有管理员可以添加玩家！')
      return
    }
    
    const newPlayer = {
      playerId: playerName,
      playerName: playerName,
      nickname,
      score: 0,
      stats: null,
      recentBattles: null
    }
    
    const savedPlayer = await addPlayer(newPlayer)
    setPlayers(prev => [...prev, savedPlayer])
    setShowResult(false)
    showSaveMessage('✅ 玩家已保存')
  }

  const handleRemovePlayer = async (playerId) => {
    if (!isAdmin) {
      alert('只有管理员可以删除玩家！')
      return
    }
    
    await deletePlayer(playerId)
    setPlayers(prev => prev.filter(p => p.id !== playerId))
    setPowerGroups(prev => prev.map(group => ({
      ...group,
      players: group.players.filter(p => p.id !== playerId)
    })))
    setShowResult(false)
    showSaveMessage('✅ 玩家已移除')
  }

  const handleAllocate = (allocatedTeams) => {
    setTeams(allocatedTeams.map(t => t.players))
    setTeamNames(allocatedTeams.map(t => t.name))
    setShowResult(true)
  }

  const handleReset = () => {
    setShowResult(false)
  }

  const handleAddToGroup = async (player, groupId) => {
    if (!isAdmin) {
      alert('只有管理员可以修改分组！')
      return
    }
    
    await addPlayerToGroup(groupId, player.id)
    const sourceGroupId = player.sourceGroupId
    
    setPlayers(prev => prev.filter(p => p.id !== player.id))
    setPowerGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const playerWithGroup = { ...player, sourceGroupId: groupId }
        return { ...group, players: [...(group.players || []), playerWithGroup] }
      }
      if (sourceGroupId && group.id === sourceGroupId && sourceGroupId !== groupId) {
        return { ...group, players: (group.players || []).filter(p => p.id !== player.id) }
      }
      return group
    }))
    showSaveMessage('✅ 分组已更新')
  }

  const handleRemoveFromGroup = async (playerId, groupId) => {
    if (!isAdmin) {
      alert('只有管理员可以修改分组！')
      return
    }
    
    await removePlayerFromGroup(groupId, playerId)
    
    const group = powerGroups.find(g => g.id === groupId)
    const removedPlayer = group?.players?.find(p => p.id === playerId)
    
    if (removedPlayer) {
      setPowerGroups(prev => prev.map(g => {
        if (g.id === groupId) {
          return { ...g, players: (g.players || []).filter(p => p.id !== playerId) }
        }
        return g
      }))
      setPlayers(prev => [...prev, removedPlayer])
      showSaveMessage('✅ 玩家已移回未分组列表')
    }
  }

  const handleGroupRename = async (groupId, newName) => {
    if (!isAdmin) {
      alert('只有管理员可以修改分组名称！')
      return
    }
    
    const group = powerGroups.find(g => g.id === groupId)
    await updateGroup(groupId, { name: newName, customScore: group?.customScore || 0 })
    setPowerGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, name: newName } : group
    ))
    showSaveMessage('✅ 分组名称已更新')
  }

  const handleUpdateGroupScore = async (groupId, customScore) => {
    if (!isAdmin) {
      alert('只有管理员可以修改分组分数！')
      return
    }
    
    const group = powerGroups.find(g => g.id === groupId)
    await updateGroup(groupId, { name: group?.name || '', customScore })
    setPowerGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, customScore } : group
    ))
    showSaveMessage('✅ 分组分数已更新')
  }

  const handleAddGroup = async () => {
    if (!isAdmin) {
      alert('只有管理员可以添加分组！')
      return
    }
    
    const newGroup = await addGroup({ name: `${powerGroups.length + 1}组`, customScore: 0 })
    setPowerGroups(prev => [...prev, { ...newGroup, players: [] }])
    showSaveMessage('✅ 新分组已添加')
  }

  const handleRemoveGroup = async (groupId) => {
    if (!isAdmin) {
      alert('只有管理员可以删除分组！')
      return
    }
    
    const group = powerGroups.find(g => g.id === groupId)
    if (group) {
      setPlayers(prev => [...prev, ...group.players])
    }
    await deleteGroup(groupId)
    setPowerGroups(prev => prev.filter(g => g.id !== groupId))
    showSaveMessage('✅ 分组已删除')
  }

  const handleBringGroupToTop = (groupId) => {
    setPowerGroups(prev => {
      const group = prev.find(g => g.id === groupId)
      const otherGroups = prev.filter(g => g.id !== groupId)
      return [group, ...otherGroups]
    })
    showSaveMessage('✅ 分组已置顶')
  }

  const handleClearGroups = () => {
    if (!isAdmin) {
      alert('只有管理员可以清空分组！')
      return
    }
    
    const allPlayers = powerGroups.flatMap(g => g.players)
    setPlayers(prev => [...prev, ...allPlayers])
    setPowerGroups([
      { id: 1, name: '1组', players: [], customScore: 0, playerIds: [] },
      { id: 2, name: '2组', players: [], customScore: 0, playerIds: [] },
      { id: 3, name: '3组', players: [], customScore: 0, playerIds: [] }
    ])
    showSaveMessage('✅ 分组已清空')
  }

  const handleAddAnnouncement = async (announcement) => {
    if (!isAdmin) {
      alert('只有管理员可以发布公告！')
      return
    }
    
    const savedAnnouncement = await addAnnouncement(announcement)
    setAnnouncements(prev => [...prev, savedAnnouncement])
    showSaveMessage('✅ 公告已发布')
  }

  const handleEditAnnouncement = async (id, updatedData) => {
    if (!isAdmin) {
      alert('只有管理员可以编辑公告！')
      return
    }
    
    await updateAnnouncement(id, updatedData)
    setAnnouncements(prev => prev.map(ann => 
      ann.id === id ? { ...ann, ...updatedData } : ann
    ))
    showSaveMessage('✅ 公告已更新')
  }

  const handleDeleteAnnouncement = async (id) => {
    if (!isAdmin) {
      alert('只有管理员可以删除公告！')
      return
    }
    
    await deleteAnnouncement(id)
    setAnnouncements(prev => prev.filter(ann => ann.id !== id))
    showSaveMessage('✅ 公告已删除')
  }

  const handleTogglePin = async (id) => {
    if (!isAdmin) {
      alert('只有管理员可以设置置顶！')
      return
    }
    
    const announcement = announcements.find(ann => ann.id === id)
    await updateAnnouncement(id, { ...announcement, pinned: !announcement.pinned })
    setAnnouncements(prev => prev.map(ann => 
      ann.id === id ? { ...ann, pinned: !ann.pinned } : ann
    ))
    showSaveMessage('✅ 公告置顶已更新')
  }

  const handleClearAllData = async () => {
    if (!isAdmin) {
      alert('只有管理员可以清除数据！')
      return
    }
    
    if (confirm('确定要清除所有保存的数据吗？此操作不可撤销！')) {
      try {
        await clearAllData()
        
        setPlayers([])
        setPowerGroups([
          { id: 1, name: '1组', players: [], customScore: 0, playerIds: [] },
          { id: 2, name: '2组', players: [], customScore: 0, playerIds: [] },
          { id: 3, name: '3组', players: [], customScore: 0, playerIds: [] }
        ])
        setAnnouncements([
          { id: 1, title: '欢迎使用队友分配系统', content: '本系统可以帮助您根据天选三排数据智能分配队友，确保各队实力均衡。', author: '管理员', pinned: 1 },
          { id: 2, title: '使用提示', content: '分组：用于区分玩家实力等级；分队：用于实际匹配队伍。添加玩家后先分组再分队。', author: '管理员', pinned: 0 },
          { id: 3, title: '权限说明', content: '管理员可以添加/修改/删除玩家和公告，普通用户只能查看。', author: '管理员', pinned: 0 }
        ])
        setTeams([])
        setTeamNames([])
        setShowResult(false)
        showSaveMessage('🗑️ 所有数据已清除')
      } catch (error) {
        alert('清除数据失败：' + error.message)
      }
    }
  }

  const exportToCSV = (type) => {
    let csvContent = ''
    let filename = ''
    
    if (type === 'teams') {
      const teams = JSON.parse(localStorage.getItem('naraka_teams') || '[]')
      const maxPlayers = Math.max(...teams.map(t => t.players.length), 1)
      const headers = ['队伍名称', '自定义分', '组内总和', ...Array.from({ length: maxPlayers }, (_, i) => `玩家${i + 1}`)]
      csvContent = '\uFEFF' + headers.join(',') + '\n'
      teams.forEach(team => {
        const groupScoreSum = team.players.reduce((sum, player) => {
          if (player.sourceGroupId) {
            const group = powerGroups.find(g => g.id === player.sourceGroupId)
            return sum + (group?.customScore || 0)
          }
          return sum
        }, 0)
        const row = [
          `"${team.name}"`,
          `"${team.customScore || 0}"`,
          `"${groupScoreSum}"`,
          ...team.players.map(p => `"${p.nickname}"`)
        ]
        csvContent += row.join(',') + '\n'
      })
      filename = `分队数据_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`
    } else if (type === 'groups') {
      const maxPlayers = Math.max(...powerGroups.map(g => g.players.length), 1)
      const headers = ['分组名称', '组分数', ...Array.from({ length: maxPlayers }, (_, i) => `玩家${i + 1}`)]
      csvContent = '\uFEFF' + headers.join(',') + '\n'
      powerGroups.forEach(group => {
        const row = [
          `"${group.name}"`,
          `"${group.customScore || 0}"`,
          ...group.players.map(p => `"${p.nickname}"`)
        ]
        csvContent += row.join(',') + '\n'
      })
      filename = `分组数据_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showSaveMessage('✅ 数据导出成功')
  }

  const handleImportGroups = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const rows = text.split('\n').filter(row => row.trim())
      if (rows.length < 2) {
        alert('CSV文件格式不正确')
        return
      }

      const headers = rows[0].split(',').map(h => h.trim().replace(/['"]/g, ''))
      const groupNameIndex = headers.indexOf('分组名称')
      const groupScoreIndex = headers.indexOf('组分数')
      
      if (groupNameIndex === -1) {
        alert('CSV文件缺少"分组名称"列')
        return
      }

      const groupsData = []
      for (let i = 1; i < rows.length; i++) {
        const row = parseCSVRow(rows[i])
        const groupName = row[groupNameIndex]?.trim().replace(/['"]/g, '')
        const groupScore = groupScoreIndex >= 0 ? parseFloat(row[groupScoreIndex]?.trim()) || 0 : 0
        const players = row.slice(Math.max(groupNameIndex, groupScoreIndex) + 1).filter(p => p?.trim())
        
        if (groupName) {
          groupsData.push({
            name: groupName,
            customScore: groupScore,
            players: players.map(name => ({
              nickname: name.trim().replace(/['"]/g, ''),
              playerName: name.trim().replace(/['"]/g, ''),
              id: Date.now() + i + Math.random()
            }))
          })
        }
      }

      await importGroups(groupsData)
      loadData()
      showSaveMessage('✅ 分组数据导入成功')
    } catch (error) {
      console.error('Import failed:', error)
      alert('导入失败：' + error.message)
    }
    
    e.target.value = ''
  }

  const parseCSVRow = (row) => {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(current)
    
    return result
  }

  const allPlayers = [...players, ...powerGroups.flatMap(g => g.players)]

  if (showLogin) {
    return <LoginModal onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen py-6 px-4 relative overflow-hidden">
      <ParticleBackground />
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="glass-card p-6 mb-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-3xl shadow-lg animate-float">
                ⚔️
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">永劫无间队友分配</h1>
                <p className="text-slate-500 text-sm">智能分配队友，保证各队实力均衡</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`badge ${isAdmin ? 'badge-purple' : 'badge-green'}`}>
                👤 {currentUser?.username} · {isAdmin ? '管理员' : '普通用户'}
              </span>
              <button
                onClick={() => setShowSettings(true)}
                className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
              >
                <span>⚙️</span>
                设置
              </button>
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
              >
                <span>🔓</span>
                退出
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-slate-200/60">
            <button
              onClick={() => exportToCSV('teams')}
              className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
            >
              <span>📤</span>
              导出分队数据
            </button>
            <button
              onClick={() => exportToCSV('groups')}
              className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
            >
              <span>📥</span>
              导出分组数据
            </button>
            <label className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 cursor-pointer">
              <span>📥</span>
              导入分组数据
              <input type="file" accept=".csv" onChange={handleImportGroups} className="hidden" />
            </label>
            {isAdmin && (
              <button
                onClick={handleClearAllData}
                className="btn-danger text-sm py-2 px-4 flex items-center gap-2 ml-auto"
              >
                <span>🗑️</span>
                清除数据
              </button>
            )}
          </div>
        </header>

        {saveStatus && (
          <div className="fixed top-6 right-6 z-50 animate-slide-down">
            <div className="glass-card px-5 py-3 bg-emerald-50 border border-emerald-200 text-emerald-600 font-medium flex items-center gap-2">
              <span className="animate-bounce-subtle">✅</span>
              {saveStatus}
            </div>
          </div>
        )}

        <div className="mb-6">
          <AnnouncementPanel
            announcements={announcements}
            onAdd={handleAddAnnouncement}
            onEdit={handleEditAnnouncement}
            onDelete={handleDeleteAnnouncement}
            onTogglePin={handleTogglePin}
            isAdmin={isAdmin}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            {isAdmin && <PlayerInput onAddPlayer={handleAddPlayer} />}
            
            <div className="glass-card p-6 animate-fade-in delay-200">
              <h3 className="section-title mb-4">
                <span className="section-title-icon animate-bounce-subtle">📋</span>
                使用说明
              </h3>
              <ul className="space-y-3 text-slate-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-violet-500">▸</span>
                  添加玩家并设置自定义昵称
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-500">▸</span>
                  分组：按实力划分等级
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-500">▸</span>
                  分队：实际匹配队伍
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-500">▸</span>
                  支持拖拽移动玩家
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">💾</span>
                  数据自动保存到服务器
                </li>
              </ul>
              <div className={`mt-4 p-3 rounded-xl ${isAdmin ? 'bg-violet-50 border border-violet-200/60' : 'bg-emerald-50 border border-emerald-200/60'}`}>
                <p className={`text-xs ${isAdmin ? 'text-violet-600' : 'text-emerald-600'} font-medium`}>
                  🔒 {isAdmin ? '您是管理员，拥有全部权限' : '您是普通用户，只能查看'}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {showResult ? (
              <TeamResult
                      teams={teams}
                      teamNames={teamNames}
                      onReset={handleReset}
                    />
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <GroupPanel
                  players={players}
                  groups={powerGroups}
                  onAddToGroup={handleAddToGroup}
                  onRemoveFromGroup={handleRemoveFromGroup}
                  onGroupRename={handleGroupRename}
                  onUpdateGroupScore={handleUpdateGroupScore}
                  onAddGroup={handleAddGroup}
                  onRemoveGroup={handleRemoveGroup}
                  onClearGroups={handleClearGroups}
                  onBringToTop={handleBringGroupToTop}
                  isAdmin={isAdmin}
                  onRemovePlayer={handleRemovePlayer}
                />
                <TeamPanel
                  players={players}
                  groups={powerGroups}
                  isAdmin={isAdmin}
                  onRemovePlayer={handleRemovePlayer}
                />
              </div>
            )}
          </div>
        </div>

        <footer className="mt-10 text-center text-slate-500 text-sm">
          <p>💾 数据自动保存到服务器 · 🔐 权限管理已启用 · ⚔️ 永劫无间队友分配系统</p>
        </footer>
      </div>
      
      {showSettings && (
        <UserSettings
          user={currentUser}
          onClose={() => setShowSettings(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}

export default App