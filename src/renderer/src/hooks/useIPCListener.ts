import { useEffect } from 'react'

export function useIPCListener<T>(
  register: (cb: (data: T) => void) => (() => void),
  callback: (data: T) => void,
  deps: unknown[] = []
): void {
  useEffect(() => {
    const unsubscribe = register(callback)
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
