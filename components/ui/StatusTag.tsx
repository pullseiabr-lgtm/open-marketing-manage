import { statusTagClass } from '@/lib/utils'

export default function StatusTag({ status }: { status: string }) {
  return <span className={`tag ${statusTagClass(status)}`}>{status}</span>
}
