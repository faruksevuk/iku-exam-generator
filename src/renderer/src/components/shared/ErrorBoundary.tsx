import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, info)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <h2 style={{ fontSize: '16px', color: '#c0392b', marginBottom: '8px' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '14px' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '8px 20px',
              borderRadius: '9px',
              border: 'none',
              background: '#333',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Reset
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
