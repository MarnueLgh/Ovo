import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { LessonPlayer } from '@/components/lesson/LessonPlayer'
import { getLessonForPlay, getStreak } from '@/lib/queries'
import { requireUser } from '@/lib/supabase/server'

async function Leccion({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params
  await requireUser()
  const [lesson, streak] = await Promise.all([getLessonForPlay(lessonId), getStreak()])
  if (!lesson) notFound()
  return <LessonPlayer lessonId={lessonId} subjectId={lesson.subjectId} exercises={lesson.exercises} streak={streak.current} />
}

export default function Page({ params }: PageProps<'/leccion/[lessonId]'>) {
  return <Suspense fallback={null}><Leccion params={params} /></Suspense>
}
