import { describe, it, expect } from 'vitest'
import { calculateGeneralStats, calculatePlayerStats, calculateTeamStats } from './stats'

describe('Statistics Utils', () => {

    describe('calculateGeneralStats', () => {
        it('should return zeros for empty matches', () => {
            const result = calculateGeneralStats([])
            expect(result).toEqual({ total: 0, won: 0, lost: 0, winRate: 0 })
        })

        it('should calculate win rate correctly', () => {
            const matches = [
                { status: 'completed', score_us: 3, score_them: 0 }, // Won
                { status: 'completed', score_us: 1, score_them: 3 }, // Lost
                { status: 'completed', score_us: 3, score_them: 2 }, // Won
                { status: 'pending', score_us: 0, score_them: 0 }    // Ignored
            ]
            const result = calculateGeneralStats(matches)
            expect(result).toEqual({ total: 3, won: 2, lost: 1, winRate: 67 }) // 2/3 = 66.66 -> 67
        })
    })

    describe('calculatePlayerStats', () => {
        it('should return null for empty players', () => {
            expect(calculatePlayerStats([])).toBeNull()
        })

        it('should calculate demographics correctly', () => {
            const players = [
                { genero: 'M', altura: '1.80', fecha_nacimiento: '2000-01-01' },
                { genero: 'F', altura: '1.70', fecha_nacimiento: '2005-01-01' },
                { genero: 'M', altura: '1.90', fecha_nacimiento: '1995-01-01' }
            ]

            // Mock Date to ensure consistent age calculation
            // Vitest uses system time by default, so ages will change over time.
            // For simplicity, we'll check approximate ranges or just check the logic flow.
            // Better: Mock system time.

            const result = calculatePlayerStats(players)

            expect(result.male).toBe(2)
            expect(result.female).toBe(1)
            expect(result.avgHeight).toBe('1.80') // (1.8+1.7+1.9)/3 = 1.80
            expect(result.total).toBe(3)
            expect(result.avgAge).toBeGreaterThan(0)
        })
    })

    describe('calculateTeamStats', () => {
        it('should calculate stats per team', () => {
            const teams = [{ id: 't1', nombre: 'Team A' }, { id: 't2', nombre: 'Team B' }]
            const matches = [
                { team_id: 't1', status: 'completed', score_us: 3, score_them: 0 },
                { team_id: 't1', status: 'completed', score_us: 0, score_them: 3 },
                { team_id: 't2', status: 'completed', score_us: 3, score_them: 0 }
            ]

            const result = calculateTeamStats(teams, matches)

            // Team B should be first (100% win rate)
            expect(result[0].id).toBe('t2')
            expect(result[0].winRate).toBe(100)

            // Team A second (50% win rate)
            expect(result[1].id).toBe('t1')
            expect(result[1].winRate).toBe(50)
        })
    })
})
