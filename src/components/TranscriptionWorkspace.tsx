import type { TranscriptionController } from '../hooks/useTranscriptionController'
import { TranscriptPanel } from './TranscriptPanel'
import { TranscriptionTool } from './TranscriptionTool'

type TranscriptionWorkspaceProps = {
  controller: TranscriptionController
}

export function TranscriptionWorkspace({
  controller,
}: TranscriptionWorkspaceProps) {
  return (
    <section
      className="grid grid-cols-1 items-stretch border-b border-zinc-300 dark:border-zinc-800 lg:grid-cols-[minmax(360px,1fr)_minmax(0,1fr)]"
      id="tool"
    >
      <TranscriptionTool {...controller} />
      <TranscriptPanel {...controller} />
    </section>
  )
}
