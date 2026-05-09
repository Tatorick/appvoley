import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const ClubContext = createContext(null)

export function ClubProvider({ children }) {
  const { user } = useAuth()
  const [club, setClub] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchClubAndRole = useCallback(async () => {
    if (!user) {
      setClub(null)
      setRole(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // 1. Check if Owner
      const { data: ownedClub } = await supabase
        .from('clubs')
        .select('*')
        .eq('created_by', user.id)
        .maybeSingle()

      if (ownedClub) {
        setClub(ownedClub)
        setRole('owner')
      } else {
        // 2. Check if Member
        const { data: memberData } = await supabase
          .from('club_members')
          .select('*, clubs(*)')
          .eq('profile_id', user.id)
          .maybeSingle()

        if (memberData?.clubs) {
          setClub(memberData.clubs)
          setRole(memberData.role_in_club || memberData.role || 'assistant')
        } else {
          setClub(null)
          setRole(null)
        }
      }
    } catch (err) {
      console.error('Error in ClubContext:', err)
      setClub(null)
      setRole(null)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchClubAndRole()
  }, [fetchClubAndRole])

  // Expose refresh so pages that modify club data can trigger a re-fetch
  const refreshClub = useCallback(() => {
    fetchClubAndRole()
  }, [fetchClubAndRole])

  return (
    <ClubContext.Provider value={{ club, role, loading, refreshClub }}>
      {children}
    </ClubContext.Provider>
  )
}

export function useClubContext() {
  return useContext(ClubContext)
}
