import { useState, useEffect } from 'react'

const STORAGE_KEY = 'naraka_teams'

function TeamPanel({ players, groups, isAdmin, onRemovePlayer }) {
  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return [
          { id: 1, name: '队伍1', players: [], customScore: 0 },
          { id: 2, name: '队伍2', players: [], customScore: 0 },
          { id: 3, name: '队伍3', players: [], customScore: 0 }
        ]
      }
    }
    return [
      { id: 1, name: '队伍1', players: [], customScore: 0 },
      { id: 2, name: '队伍2', players: [], customScore: 0 },
      { id: 3, name: '队伍3', players: [], customScore: 0 }
    ]
  })
  const [editingTeamId, setEditingTeamId] = useState(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teams))
  }, [teams])

  const availablePlayers = players.concat(groups.flatMap(g => g.players || []))

  const teamRankings = teams
    .filter(t => t.customScore > 0 || t.players.length > 0)
    .map(t => ({ ...t, totalScore: t.customScore || 0 }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((t, index) => ({ ...t, rank: index + 1 }))

  const getRankIcon = (rank) => {
    const icons = ['🥇', '🥈', '🥉']
    return icons[rank - 1] || `${rank}`
  }

  const handleStartEdit = (team) => {
    setEditingTeamId(team.id)
    setEditName(team.name)
  }

  const handleSaveEdit = (teamId) => {
    if (editName.trim()) {
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, name: editName.trim() } : t))
    }
    setEditingTeamId(null)
    setEditName('')
  }

  const handleAddToTeam = (player, teamId) => {
    setTeams(prev => prev.map(t => ({
      ...t,
      players: t.id === teamId ? [...t.players, player] : t.players.filter(p => p.id !== player.id)
    })))
  }

  const handleRemoveFromTeam = (playerId, teamId) => {
    setTeams(prev => prev.map(t => {
      if (t.id === teamId) {
        return { ...t, players: t.players.filter(p => p.id !== playerId) }
      }
      return t
    }))
  }

  const handleCustomScoreChange = (teamId, value) => {
    const numValue = parseFloat(value) || 0
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, customScore: numValue } : t))
  }

  const handleAddTeam = () => {
    const newId = Math.max(...teams.map(t => t.id)) + 1
    setTeams(prev => [...prev, { id: newId, name: `队伍${newId}`, players: [], customScore: 0 }])
  }

  const handleRemoveTeam = (teamId) => {
    if (teams.length <= 1) {
      alert('至少需要保留一个队伍！')
      return
    }
    const removedTeam = teams.find(t => t.id === teamId)
    if (removedTeam && removedTeam.players.length > 0) {
      alert('请先将该队伍的玩家移除！')
      return
    }
    setTeams(prev => prev.filter(t => t.id !== teamId))
  }

  const handleClearTeams = () => {
    setTeams([
      { id: 1, name: '队伍1', players: [], customScore: 0 },
      { id: 2, name: '队伍2', players: [], customScore: 0 },
      { id: 3, name: '队伍3', players: [], customScore: 0 }
    ])
  }

  const getTeamColor = (index) => {
    const colors = [
      'from-rose-500 to-orange-500',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-violet-500 to-fuchsia-500',
      'from-amber-500 to-orange-500',
      'from-indigo-500 to-violet-500',
      'from-pink-500 to-rose-500',
      'from-cyan-500 to-blue-500',
    ]
    return colors[index % colors.length]
  }

  const getAvatarIndex = (name) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash) % 6 + 1
  }

  const unassignedPlayers = availablePlayers.filter(p => !teams.some(t => t.players.some(tp => tp.id === p.id)))

  return (
    <div className="glass-card p-6 animate-fade-in delay-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <h2 className="section-title">
          <span className="section-title-icon animate-bounce-subtle">🎯</span>
          分队匹配
          <span className="badge badge-purple">{teams.length} 个队伍</span>
        </h2>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button
                onClick={handleAddTeam}
                className="btn-success text-sm py-2 px-4 flex items-center gap-1"
              >
                <span>➕</span>
                添加队伍
              </button>
              <button
                onClick={handleClearTeams}
                className="btn-secondary text-sm py-2 px-4 flex items-center gap-1"
              >
                <span>↺</span>
                清空
              </button>
            </>
          )}
        </div>
      </div>

      {teamRankings.length > 0 && (
        <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 animate-scale-in">
          <h3 className="text-slate-800 font-semibold mb-3 flex items-center gap-2">
            <span className="animate-bounce-subtle">🏆</span>
            当前排名
          </h3>
          <div className="flex flex-wrap gap-2">
            {teamRankings.map((team, idx) => (
              <div key={team.id} className="glass-card px-4 py-2.5 flex items-center gap-2.5 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <span className="text-xl">{getRankIcon(team.rank)}</span>
                <span className="text-slate-800 text-sm font-medium">{team.name}</span>
                <span className="badge badge-yellow">{team.totalScore} 分</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {availablePlayers.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <div className="text-4xl mb-3 animate-float">🎮</div>
          <p>暂无玩家，请先添加玩家</p>
        </div>
      ) : (
        <>
          <div className="mb-5 glass-card p-4 bg-slate-50/50">
            <h3 className="text-slate-700 font-semibold mb-3 flex items-center gap-2">
              <span>📋</span>
              待分配玩家
              <span className="badge badge-purple ml-auto">
                {unassignedPlayers.length}
              </span>
            </h3>
            <div className="space-y-2">
              {unassignedPlayers.map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-white/80 rounded-xl px-3 py-2.5 hover:bg-white hover:shadow-md transition-all animate-fade-in"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold avatar-gradient-${getAvatarIndex(player.nickname || '?')} shadow-sm`}>
                      {player.nickname?.charAt(0) || '?'}
                    </div>
                    <span className="text-slate-700 text-sm font-medium">{player.nickname}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {teams.map((team, idx) => (
                      <button
                        key={team.id}
                        onClick={() => handleAddToTeam(player, team.id)}
                        className={`px-2.5 py-1 text-xs font-medium text-white rounded-lg bg-gradient-to-r ${getTeamColor(idx)} hover:opacity-90 transition-all hover:scale-105 shadow-sm`}
                      >
                        +{team.name}
                      </button>
                    ))}
                    {isAdmin && onRemovePlayer && (
                      <button
                        onClick={() => onRemovePlayer(player.id)}
                        className="px-2.5 py-1 text-xs text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-all hover:scale-105"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {teams.map((team, teamIndex) => {
              const teamRank = teamRankings.find(r => r.id === team.id)
              const colorIdx = teamIndex % 8
              const groupScoreSum = team.players.reduce((sum, player) => {
                if (player.sourceGroupId) {
                  const group = groups.find(g => g.id === player.sourceGroupId)
                  return sum + (group?.customScore || 0)
                }
                return sum
              }, 0)
              return (
                <div key={team.id} className="glass-card glass-card-hover overflow-hidden animate-fade-in" style={{ animationDelay: `${teamIndex * 0.1}s` }}>
                  <div className={`h-1.5 bg-gradient-to-r ${getTeamColor(colorIdx)}`} />
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      {editingTeamId === team.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="input-field text-sm py-1.5 px-3 w-32"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(team.id)}
                          />
                          <button
                            onClick={() => handleSaveEdit(team.id)}
                            className="btn-success text-sm py-1.5 px-3"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingTeamId(null)}
                            className="btn-secondary text-sm py-1.5 px-3"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 flex-wrap">
                          {teamRank && <span className="text-2xl animate-bounce-subtle">{getRankIcon(teamRank.rank)}</span>}
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getTeamColor(colorIdx)} flex items-center justify-center text-white font-bold shadow-lg`}>
                            {team.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-slate-800 font-semibold">{team.name}</h3>
                            <p className="text-slate-500 text-xs">{team.players.length} 名队员</p>
                          </div>
                          {groupScoreSum > 0 && (
                            <span className="badge badge-yellow">
                              组分: +{groupScoreSum}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex flex-col items-center bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200/60">
                          <span className="text-slate-500 text-xs">自定义分</span>
                          <input
                            type="number"
                            value={team.customScore || ''}
                            onChange={(e) => handleCustomScoreChange(team.id, e.target.value)}
                            className="w-16 bg-transparent text-slate-700 text-sm text-center focus:outline-none border-b border-slate-300 focus:border-violet-500 transition-colors"
                            placeholder="0"
                            min="0"
                            step="0.1"
                          />
                        </div>
                        <div className="flex flex-col items-center bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg px-3 py-1.5 border border-amber-200/60">
                          <span className="text-amber-600 text-xs">组内总和</span>
                          <span className="text-amber-700 text-sm font-semibold">{groupScoreSum}</span>
                        </div>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleStartEdit(team)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-500 transition-all hover:scale-110"
                              title="重命名"
                            >
                              ✏️
                            </button>
                            {teams.length > 1 && (
                              <button
                                onClick={() => handleRemoveTeam(team.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all hover:scale-110"
                                title="删除队伍"
                              >
                                🗑️
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {team.players.length > 0 ? (
                      <div className="space-y-2">
                        {team.players.map((player, idx) => {
                          const playerGroup = player.sourceGroupId ? groups.find(g => g.id === player.sourceGroupId) : null
                          return (
                            <div 
                              key={player.id} 
                              className="flex items-center justify-between bg-slate-50/80 rounded-xl p-3 hover:bg-slate-100 transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs text-slate-500 font-medium shadow-sm">
                                  {idx + 1}
                                </span>
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold avatar-gradient-${getAvatarIndex(player.nickname || '?')} shadow-sm`}>
                                  {player.nickname?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <div className="text-slate-700 font-medium text-sm">{player.nickname}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {playerGroup?.customScore > 0 && (
                                  <span className="badge badge-yellow text-xs">+{playerGroup.customScore}</span>
                                )}
                                {isAdmin && (
                                  <button
                                    onClick={() => handleRemoveFromTeam(player.id, team.id)}
                                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    移出
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-sm">
                        该队伍暂无玩家
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default TeamPanel
