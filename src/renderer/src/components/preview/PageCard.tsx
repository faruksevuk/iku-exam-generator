import { memo, useMemo, type ReactNode } from 'react'
import qrcode from 'qrcode-generator'
import { generateBullseyeSvg } from '@/constants/aruco'
import styles from './PageCard.module.css'

interface PageCardProps {
  pageIndex: number
  totalPages: number
  courseCode?: string
  examType?: string
  date?: string
  contentHeight: number
  children: ReactNode
}

function generateQR(text: string): string {
  const qr = qrcode(0, 'L')
  qr.addData(text)
  qr.make()
  return qr.createDataURL(3, 0)
}

const bullseyeUrl = generateBullseyeSvg(16)

export const PageCard = memo(function PageCard({
  pageIndex,
  totalPages,
  courseCode,
  examType,
  date,
  contentHeight,
  children,
}: PageCardProps) {
  const isLast = pageIndex === totalPages - 1
  const pageClass = isLast
    ? styles.page
    : `${styles.page} ${styles.pageBreak}`

  const year = date ? date.split('-')[0] : new Date().getFullYear().toString()
  const qrText = `P${pageIndex + 1}_${courseCode || 'EXAM'}_${examType || 'exam'}_${year}`
  const qrDataUrl = useMemo(() => generateQR(qrText), [qrText])

  return (
    <div
      className={pageClass}
      data-page-index={pageIndex}
      data-page-id={qrText}
    >
      <span className={`${styles.pageBadge} no-print`}>
        Page {pageIndex + 1} / {totalPages}
      </span>

      {/* Bullseye targets at corners */}
      <img src={bullseyeUrl} alt="" className={`${styles.anchor} ${styles.anchorTL}`} data-anchor="TL" />
      <img src={bullseyeUrl} alt="" className={`${styles.anchor} ${styles.anchorTR}`} data-anchor="TR" />
      <img src={bullseyeUrl} alt="" className={`${styles.anchor} ${styles.anchorBL}`} data-anchor="BL" />
      <img src={bullseyeUrl} alt="" className={`${styles.anchor} ${styles.anchorBR}`} data-anchor="BR" />

      {/* QR code */}
      <div className={styles.qrWrap}>
        <img src={qrDataUrl} alt="" className={styles.qrImg} />
        <span className={styles.qrLabel}>{qrText}</span>
      </div>

      <div className={styles.contentArea}>
        {children}
      </div>
    </div>
  )
})
