import { memo } from 'react'
import { useLazyLoad } from '../hooks/useLazyLoad'

/**
 * Lazy-loaded chart card wrapper
 * Hanya render chart content saat card visible di viewport
 */
const LazyChartCard = memo(function LazyChartCard({ title, desc, children }) {
  const { ref, isVisible } = useLazyLoad()

  return (
    <div ref={ref} className="chart-card">
      <p className="chart-title">{title}</p>
      <p className="chart-desc">{desc}</p>
      {isVisible ? children : <div style={{ height: 210, backgroundColor: '#f9f9f9', borderRadius: 4 }} />}
    </div>
  )
})

export default LazyChartCard
