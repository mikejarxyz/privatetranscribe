type LogoMarkProps = {
  className: string
}

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        mask: 'url(/logo.svg) center / contain no-repeat',
        WebkitMask: 'url(/logo.svg) center / contain no-repeat',
      }}
    />
  )
}
