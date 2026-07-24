import TeamCard from './TeamCard'

const TeamResult = ({ teams, teamNames, onReset }) => {
  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="section-title">
          <span className="section-title-icon">⚡</span>
          分配结果
          <span className="badge badge-green">{teams.length} 个队伍</span>
        </h2>
        <button
          onClick={onReset}
          className="btn-primary flex items-center gap-2"
        >
          <span>🔄</span>
          重新分配
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.map((team, index) => (
          <TeamCard
            key={index}
            team={team}
            teamName={teamNames[index]}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}

export default TeamResult
