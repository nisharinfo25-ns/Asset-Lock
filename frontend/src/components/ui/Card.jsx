import { clsx } from 'clsx'

export function Card({ children, className }) {
  return <div className={clsx('card', className)}>{children}</div>
}

export function CardHeader({ children, className }) {
  return <div className={clsx('card-header', className)}>{children}</div>
}

export function CardBody({ children, className }) {
  return <div className={clsx('card-body', className)}>{children}</div>
}
