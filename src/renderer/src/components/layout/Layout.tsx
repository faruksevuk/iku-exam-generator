import type { ReactNode } from 'react'
import { LOGO } from '@/constants/logo'
import { Stepper } from './Stepper'
import styles from './Layout.module.css'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.app}>
      <div className={`${styles.topBar} no-print`}>
        <div className={styles.topBarLeft}>
          <img src={LOGO} alt="IKU Logo" className={styles.logo} />
          <div>
            <div className={styles.appTitle}>IKU Exam Generator</div>
            <div className={styles.appSub}>OCR-Compatible Exam Creator</div>
          </div>
        </div>
        <div className={styles.version}>v1.0.5</div>
      </div>
      <div className="no-print">
        <Stepper />
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  )
}
