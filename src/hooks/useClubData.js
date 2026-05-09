// useClubData.js
// This hook now reads from the global ClubContext instead of making
// per-page DB queries. Club data is fetched once when the app loads
// and shared across all pages, eliminating 1-2 round-trips per navigation.
import { useClubContext } from '../context/ClubContext'

export function useClubData() {
  return useClubContext()
}
