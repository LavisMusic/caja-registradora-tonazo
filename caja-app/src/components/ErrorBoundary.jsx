import { Component } from "react";

/* Red de seguridad contra la "pantalla negra": un error lanzado DURANTE
   el render (ej. leer una propiedad de un objeto que llegó null/
   undefined desde Supabase) no se puede atrapar con try/catch dentro
   del componente — try/catch solo funciona en código imperativo
   (handlers, funciones async), nunca en el árbol de JSX que React
   evalúa. La ÚNICA forma de interceptar eso en React es un Error
   Boundary: un component de clase (los hooks no tienen equivalente)
   que implementa getDerivedStateFromError/componentDidCatch.

   Sin esto, cualquier excepción durante el render tira TODO el árbol
   de React entero — de ahí la pantalla negra real, no una figura: React
   desmonta todo porque no sabe si el estado quedó consistente. Con
   esto, se atrapa el error, se loguea, y se muestra una pantalla de
   error recuperable (con un botón que reintenta re-renderizar, y otro
   que hace un reload real por si el estado en memoria quedó
   corrupto) en vez de dejar la app completamente en blanco. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Error de render capturado por ErrorBoundary:", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 24,
            textAlign: "center",
            background: "#0a0716",
            color: "#f4f2ff",
            fontFamily: "'Rajdhani', sans-serif",
          }}
        >
          <h1 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: 20 }}>
            Algo salió mal
          </h1>
          <p style={{ margin: 0, color: "#9c93c2", maxWidth: 420 }}>
            La pantalla se quedó en un estado inesperado (posiblemente una respuesta incompleta de
            Supabase). Nada se perdió del lado del servidor — reintenta o recarga la página.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "1px solid rgba(43,232,255,0.4)",
                background: "rgba(43,232,255,0.1)",
                color: "#2be8ff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.04)",
                color: "#f4f2ff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
