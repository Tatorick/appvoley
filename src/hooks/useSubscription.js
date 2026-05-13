import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useClubContext } from '../context/ClubContext'

// Feature access by plan
const PLAN_FEATURES = {
  free: {
    maxPlayers: 15,
    maxTeams: 2,
    maxUsers: 1,
    modules: ['players', 'teams', 'attendance', 'agenda', 'matchmaking', 'portal'],
  },
  basic: {
    maxPlayers: 50,
    maxTeams: 5,
    maxUsers: 2,
    modules: ['players', 'teams', 'attendance', 'agenda', 'matchmaking', 'portal', 'payments', 'tournaments', 'statistics'],
  },
  pro: {
    maxPlayers: Infinity,
    maxTeams: Infinity,
    maxUsers: 5,
    modules: ['players', 'teams', 'attendance', 'agenda', 'matchmaking', 'portal', 'payments', 'tournaments', 'statistics', 'certificates', 'medical', 'audit', 'export'],
  },
}

export function useSubscription() {
  const { club } = useClubContext()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchSubscription = useCallback(async () => {
    if (!club) {
      setSubscription(null)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.rpc('get_my_subscription')

      if (error) throw error

      if (data && data.length > 0) {
        setSubscription(data[0])
      } else {
        // Default: trial
        setSubscription({ plan: 'free', status: 'trial', billing_cycle: 'none', days_left: 7 })
      }
    } catch (err) {
      console.error('Error fetching subscription:', err)
      // Fallback to free plan on error so app doesn't break
      setSubscription({ plan: 'free', status: 'active', billing_cycle: 'none', days_left: 0 })
    } finally {
      setLoading(false)
    }
  }, [club?.id])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  // Check if a specific module/feature is accessible
  const canAccess = useCallback((feature) => {
    if (!subscription) return true // Don't block while loading

    // During trial, everything is accessible (PRO access)
    if (subscription.status === 'trial' && subscription.days_left > 0) return true

    const plan = subscription.plan || 'free'
    const config = PLAN_FEATURES[plan] || PLAN_FEATURES.free

    return config.modules.includes(feature)
  }, [subscription])

  // Check player/team limits
  const checkLimit = useCallback((type, currentCount) => {
    if (!subscription) return { allowed: true, limit: Infinity }

    if (subscription.status === 'trial' && subscription.days_left > 0) {
      return { allowed: true, limit: Infinity }
    }

    const plan = subscription.plan || 'free'
    const config = PLAN_FEATURES[plan] || PLAN_FEATURES.free

    const limit = type === 'players' ? config.maxPlayers : type === 'teams' ? config.maxTeams : config.maxUsers

    return {
      allowed: currentCount < limit,
      limit,
      current: currentCount,
    }
  }, [subscription])

  const isTrialActive = subscription?.status === 'trial' && subscription?.days_left > 0
  const isExpired = subscription?.status === 'expired' || (subscription?.status === 'trial' && subscription?.days_left <= 0)
  const currentPlan = isTrialActive ? 'pro' : (subscription?.plan || 'free')

  return {
    subscription,
    loading,
    canAccess,
    checkLimit,
    isTrialActive,
    isExpired,
    currentPlan,
    daysLeft: subscription?.days_left || 0,
    refresh: fetchSubscription,
    PLAN_FEATURES,
  }
}
