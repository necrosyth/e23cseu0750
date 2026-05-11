'use client'
import { ToggleButton, ToggleButtonGroup, Box } from '@mui/material'

const TYPES = ['All', 'Placement', 'Result', 'Event']

export default function FilterBar({ value, onChange }) {
  return (
    <Box mb={2}>
      <ToggleButtonGroup value={value} exclusive onChange={(e, val) => { if (val) onChange(val) }} size="small">
        {TYPES.map(t => (
          <ToggleButton key={t} value={t} sx={{ px: 2, textTransform: 'none' }}>{t}</ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  )
}
