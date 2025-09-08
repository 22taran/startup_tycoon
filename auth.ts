import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth.config'

export async function auth() {
  return await getServerSession(authOptions)
}

export { signIn, signOut } from 'next-auth/react'
