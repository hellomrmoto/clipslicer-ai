import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export default function Card({ children, className }: CardProps) {
  return (
    <div className={clsx('bg-white rounded-2xl border border-gray-200 shadow-sm', className)}>
      {children}
    </div>
  )
}
