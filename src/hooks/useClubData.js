import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useClubData() {
  const { user } = useAuth()
  const [club, setClub] = useState(null)
  const [role, setRole] = useState(null) // 'owner', 'admin', 'coach', 'assistant' or null
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchClubAndRole() {
      setLoading(true)
      try {
        // 1. Check if Owner (created_by)
        // We select minimal data needed initially, or full club data if we want to provide it to consumers
        const { data: ownedClub } = await supabase
          .from('clubs')
          .select('*')
          .eq('created_by', user.id)
          .single()

        if (ownedClub) {
          setClub(ownedClub)
          setRole('owner')
        } else {
          // 2. Check if Member
          const { data: memberData } = await supabase
            .from('club_members')
            .select('*, clubs(*)') // Join clubs to get club details
            .eq('profile_id', user.id)
            .single()

          if (memberData && memberData.clubs) {
            setClub(memberData.clubs)
            // Use the role from the member table
            setRole(memberData.role || 'assistant') // Fallback just in case
          } else {
             // No club found
             setClub(null)
             setRole(null)
          }
        }
      } catch (err) {
        console.error("Error in useClubData:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchClubAndRole()
  }, [user])

  return { club, role, loading }
}
