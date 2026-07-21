// ── Auth route root: redirect straight to the sign-in page ──
import { redirect } from 'next/navigation'

export default function AuthPage() {
  redirect('/auth/signin')
}
