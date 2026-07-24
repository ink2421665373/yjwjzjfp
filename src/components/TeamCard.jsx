const TeamCard = ({ team, teamName, index }) => {
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
  
  const colorIndex = teamName.charCodeAt(0) % colors.length

  return (
    <div className="glass-card glass-card-hover overflow-hidden animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className={`h-1.5 bg-gradient-to-r ${colors[colorIndex]}`} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white text-xl font-bold shadow-lg animate-float`}>
              {teamName.charAt(0)}
            </div>
            <div>
              <h3 className="text-slate-800 font-bold text-lg">{teamName}</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-800">{team.length}</p>
            <p className="text-slate-500 text-xs">队员</p>
          </div>
        </div>
        
        <div className="space-y-2">
          {team.map((player, index) => (
            <div key={player.id} className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl hover:bg-slate-100 transition-colors">
              <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-xs text-slate-500 font-medium shadow-sm">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-slate-700 font-medium truncate">{player.nickname}</p>
                <p className="text-slate-500 text-xs truncate">{player.playerName}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TeamCard
