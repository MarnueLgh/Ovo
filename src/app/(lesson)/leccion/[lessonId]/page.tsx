import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { LessonPlayer } from '@/components/lesson/LessonPlayer'
import { getLessonForPlay } from '@/lib/queries'
import { requireUser } from '@/lib/supabase/server'

async function Leccion({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params
  await requireUser()
  const lesson = await getLessonForPlay(lessonId)
  if (!lesson) notFound()
  return <LessonPlayer lessonId={lessonId} subjectId={lesson.subjectId} exercises={lesson.exercises} />
}

export default function Page({ params }: PageProps<'/leccion/[lessonId]'>) {
  return <Suspense fallback={null}><Leccion params={params} /></Suspense>
}
