export const calculateGeneralStats = (matches) => {
    const completed = matches.filter(m => m.status === 'completed')
    const won = completed.filter(m => m.score_us > m.score_them).length
    const lost = completed.length - won
    const winRate = completed.length > 0 ? Math.round((won / completed.length) * 100) : 0

    return { total: completed.length, won, lost, winRate }
}

export const calculatePlayerStats = (players) => {
    if (!players || players.length === 0) return null

    // Gender
    const male = players.filter(p => p.genero === 'M').length
    const female = players.filter(p => p.genero === 'F').length

    // Height
    const heights = players.map(p => parseFloat(p.altura)).filter(h => h > 0)
    const avgHeight = heights.length ? (heights.reduce((a, b) => a + b, 0) / heights.length).toFixed(2) : 0

    // Age
    const now = new Date()
    const ages = players.map(p => {
        if (!p.fecha_nacimiento) return 0
        const birth = new Date(p.fecha_nacimiento)
        return Math.floor((now - birth) / 31557600000) // approx year
    }).filter(a => a > 0)
    const avgAge = ages.length ? Math.floor(ages.reduce((a, b) => a + b, 0) / ages.length) : 0

    return { male, female, avgHeight, avgAge, total: players.length }
}

export const calculateTeamStats = (teams, matches) => {
    return teams.map(team => {
        const teamMatches = matches.filter(m => m.team_id === team.id && m.status === 'completed')
        const won = teamMatches.filter(m => m.score_us > m.score_them).length
        const lost = teamMatches.length - won
        const winRate = teamMatches.length > 0 ? Math.round((won / teamMatches.length) * 100) : 0
        return { ...team, won, lost, total: teamMatches.length, winRate }
    }).sort((a, b) => b.winRate - a.winRate)
}
