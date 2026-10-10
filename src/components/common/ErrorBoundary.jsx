import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Erro na interface:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="eyebrow">Algo saiu do lugar</p>
        <h1 className="display-md">Não foi possível carregar esta página.</h1>
        <p className="max-w-md text-ink-muted">Tente recarregar. Se o problema continuar, fale com a gente pelo WhatsApp.</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>Recarregar</button>
      </div>
    );
  }
}
