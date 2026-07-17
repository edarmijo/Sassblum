import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error Boundary global que captura errores de render y muestra un fallback UI.
 * Previene que un error en un componente rompa toda la aplicación.
 * Implementa getDerivedStateFromError + componentDidCatch.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold mb-2 text-foreground">Algo salió mal</h2>
            <p className="text-muted-foreground mb-6">
              Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center px-6 py-2.5 bg-brand-cyan text-brand-navy font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Reintentar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
