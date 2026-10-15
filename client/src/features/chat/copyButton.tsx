import { useEffect, useState } from 'react'
import { CheckIcon, CopyIcon } from './icons'

type Props = { text: string; className?: string }

export function CopyButton({ text, className = '' }: Props) {
  const [copied, setCopied] = useState(false)

  // Show the check mark briefly, then go back to the copy icon
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      // Clipboard access can be denied (or missing outside a secure context); nothing to do
    }
  }

  const label = copied ? 'Copied' : 'Copy response'

  return (
    <div className={`group relative w-fit ${className}`}>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={label}
        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900"
      >
        {copied ? <CheckIcon className="size-5" /> : <CopyIcon className="size-5" />}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-10 mb-1 rounded-md bg-gray-900 px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100 group-has-focus-visible:opacity-100"
      >
        {label}
      </span>
    </div>
  )
}
