'use client'
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import StarIcon from '@mui/icons-material/Star'
import Link from 'next/link'

export default function Navbar() {
  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>CampusNotify</Typography>
        <Box display="flex" gap={1}>
          <Button component={Link} href="/" color="inherit" startIcon={<NotificationsIcon />} sx={{ textTransform: 'none' }}>All</Button>
          <Button component={Link} href="/priority" color="inherit" startIcon={<StarIcon />} sx={{ textTransform: 'none' }}>Priority</Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
