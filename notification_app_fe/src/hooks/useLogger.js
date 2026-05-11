'use client'
import { useRef } from 'react'

export function useLogger() {
  const tokenRef = useRef(null)
  const tokenExpiryRef = useRef(0)

  async function getToken() {
    if (tokenRef.current && Date.now() / 1000 < tokenExpiryRef.current - 30) return tokenRef.current
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/v1/auth-token')
    const data = await res.json()
    tokenRef.current = data.token
    tokenExpiryRef.current = data.expiresAt
    return data.token
  }

  async function log(level, pkg, message) {
    try {
      if (process.env.NODE_ENV === 'development') return
      const token = await getToken()
      await fetch('http://4.224.186.213/evaluation-service/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stack: 'frontend', level, package: pkg, message })
      })
    } catch (err) {}
  }

  return { log }
}
