'use client'
import { useState, useEffect } from 'react'
import { Typography, Box, Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import NotificationCard from '../../components/NotificationCard'
import FilterBar from '../../components/FilterBar'
import { fetchNotifications } from '../../utils/api'
import { getTopN } from '../../utils/scorer'
import { useLogger } from '../../hooks/useLogger'

export default function PriorityPage() {
  const [allNotifs, setAllNotifs] = useState([])
  const [topList, setTopList] = useState([])
  const [topN, setTopN] = useState(10)
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { log } = useLogger()

  useEffect(() => {
    loadAll()
    log('info', 'page', 'priority inbox page loaded')
  }, [])

  useEffect(() => {
    if (allNotifs.length > 0) {
      const top = getTopN(allNotifs, topN, filter)
      setTopList(top)
      log('info', 'component', `recalculated top ${topN} with filter ${filter}`)
    }
  }, [allNotifs, topN, filter])

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchNotifications(1, 100, 'All')
      setAllNotifs(res.data || [])
    } catch (err) {
      log('error', 'api', `priority page fetch failed: ${err.message}`)
      setError('Could not load notifications.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>Priority Inbox</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>Top notifications ranked by type importance and recency.</Typography>
      <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
        <FilterBar value={filter} onChange={setFilter} />
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <InputLabel>Show top</InputLabel>
          <Select value={topN} label="Show top" onChange={e => setTopN(e.target.value)}>
            {[5, 10, 15, 20].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
      {loading && <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!loading && !error && topList.length === 0 && <Typography color="text.secondary">No notifications match this filter.</Typography>}
      {!loading && topList.map((notif, i) => <NotificationCard key={notif.ID} notif={notif} rank={i + 1} />)}
    </Box>
  )
}
