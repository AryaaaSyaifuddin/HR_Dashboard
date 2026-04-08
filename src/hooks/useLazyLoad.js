import { useEffect, useRef, useState } from 'react'

// Custom hook untuk lazy load element saat visible
export function useLazyLoad(options = {}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!ref?.current) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        // Unobserve after first intersection untuk optimize
        observer.unobserve(entry.target)
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    })

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [options])

  return { ref, isVisible }
}
