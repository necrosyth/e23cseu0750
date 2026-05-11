'use client'
import { Card, CardContent, Typography, Chip, Box } from '@mui/material'
import { useEffect } from 'react'
import { markViewed, isViewed } from '../utils/viewedStore'

const typeColor = {
  Placement: 'success',
  Result: 'primary',
  Event: 'warning'
}

function formatTime(ts) {
  const d = new Date(ts.replace(' ', 'T'))
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function NotificationCard({ notif, rank }) {
  const isNew = !isViewed(notif.ID)

  useEffect(() => {
    markViewed(notif.ID)
  }, [notif.ID])

  return (
    <Card sx={{ mb: 1.5, borderLeft: `4px solid`, borderLeftColor: `${typeColor[notif.Type] || 'grey'}.main`, position: 'relative', opacity: isNew ? 1 : 0.85 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          {rank && <Typography variant="caption" color="text.secondary" fontWeight={600}>#{rank}</Typography>}
          <Chip label={notif.Type} color={typeColor[notif.Type] || 'default'} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
          {isNew && <Chip label="New" color="error" size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />}
          {notif.score !== undefined && <Typography variant="caption" color="text.secondary" ml="auto">score: {notif.score}</Typography>}
        </Box>
        <Typography variant="body1" fontWeight={500} sx={{ textTransform: 'capitalize' }}>{notif.Message}</Typography>
        <Typography variant="caption" color="text.secondary">{formatTime(notif.Timestamp)}</Typography>
      </CardContent>
    </Card>
  )
}
