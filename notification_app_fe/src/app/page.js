'use client'
import { useState, useEffect } from 'react'
import { Typography, Pagination, Box, Alert, CircularProgress } from '@mui/material'
import NotificationCard from '../components/NotificationCard'
import FilterBar from '../components/FilterBar'
import { fetchNotifications } from '../utils/api'
import { useLogger } from '../hooks/useLogger'

export default function AllNotificationsPage() {
  const [notifs, setNotifs] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { log } = useLogger()
  const limit = 20

  useEffect(() => {
    loadNotifs()
    log('info', 'page', 'all notifications page loaded')
  }, [page, filter])

  async function loadNotifs() {
    setLoading(true)
    setError(null)
    try {
      log('info', 'api', `fetching page ${page} with filter ${filter}`)
      const res = await fetchNotifications(page, limit, filter)
      setNotifs(res.data || [])
      setTotal(res.total || 0)
    } catch (err) {
      log('error', 'api', `failed to fetch notifications: ${err.message}`)
      setError('Could not load notifications. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  function handleFilterChange(val) {
    setFilter(val)
    setPage(1)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>Notifications</Typography>
      <FilterBar value={filter} onChange={handleFilterChange} />
      {loading && <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!loading && !error && notifs.length === 0 && <Typography color="text.secondary">No notifications found.</Typography>}
      {!loading && notifs.map(notif => <NotificationCard key={notif.ID} notif={notif} />)}
      {totalPages > 1 && <Box display="flex" justifyContent="center" mt={3}><Pagination count={totalPages} page={page} onChange={(e, val) => setPage(val)} color="primary" /></Box>}
    </Box>
  )
}
