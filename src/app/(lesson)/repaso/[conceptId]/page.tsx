import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { LessonPlayer } from '@/components/lesson/LessonPlayer'
import { getReview, getStreak } from '@/lib/queries'
import { requireUser } from '@/lib/supabase/server'

async function Repaso({ params }: { params: Promise<{ conceptId: string }> }) {
  const { conceptId } = await params
  await requireUser()
  const [review, streak] = await Promise.all([getReview(conceptId), getStreak()])
  if (!review) notFound()
  return <LessonPlayer subjectId={review.subjectId} exercises={review.exercises} streak={streak.current} back="/panel" />
}

export default function Page({ params }: PageProps<'/repaso/[conceptId]'>) {
  return <Suspense fallback={null}><Repaso params={params} /></Suspense>
}
