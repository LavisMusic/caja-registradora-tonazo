import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Save, RotateCcw, Check, Moon, Sun, LogOut, Wallet, ShoppingCart, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "../supabaseClient";
import { PRESETS_TEMA, TEMA_POR_DEFECTO, resolverPaleta, variablesTema } from "../lib/tema";
import { TEMATICOS, tematicoDe } from "../lib/tematicos";
import logoTonazo from "../assets/logo.webp";

// Apartado "Tema" del Perfil del negocio: elegir una paleta armada (oscura
// o clara) o un color libre (con modo oscuro/claro), con VISTA PREVIA en
// vivo (cabecera, botones, medidor, tarjeta de producto) antes de
// guardar. Cambia los colores de la caja (admin y cajero) y de la tienda
// pública del negocio. Guarda con la RPC actualizar_tema_negocio
// (migración 0096).
// Arriba de todo: "Temas por rubros" — temas especiales con adornos
// (src/lib/tematicos.js). Son LIBRES (migración 0099): cualquier negocio
// usa el de cualquier rubro. Se muestran 3 (primero el de su rubro) y
// "Ver más" despliega todos agrupados por rubro, de 3 en 3.
const mismoTema = (a, b) => JSON.stringify(a || null) === JSON.stringify(b || null);

function TarjetaTematico({ t, activa, onClick }) {
  const claro = t.paleta.modo === "claro";
  return (
    <button
      type="button"
      className={`tz-tema-preset tz-tema-tematico ${activa ? "tz-tema-preset-activa" : ""}`}
      style={{ background: t.muestra }}
      onClick={onClick}
    >
      <span className="tz-tema-preset-nombre" style={{ color: claro ? "#14111f" : "#f4f2ff", textShadow: claro ? "none" : undefined }}>
        {t.nombre}
      </span>
      <span className="tz-tema-tematico-desc" style={claro ? { color: "#3a3550", textShadow: "none" } : undefined}>
        {t.descripcion}
      </span>
      {activa && (
        <span className="tz-tema-preset-check">
          <Check size={12} />
        </span>
      )}
    </button>
  );
}

function MuestraPaleta({ paleta, activa, onClick }) {
  return (
    <button
      type="button"
      className={`tz-tema-preset ${activa ? "tz-tema-preset-activa" : ""}`}
      onClick={onClick}
      style={{ background: `linear-gradient(150deg, ${paleta.fondo1}, ${paleta.fondo2})` }}
    >
      <span className="tz-tema-preset-puntos">
        {[paleta.principal, paleta.secundario, paleta.acento, paleta.botones].map((c, i) => (
          <i key={i} style={{ background: c }} />
        ))}
      </span>
      <span className="tz-tema-preset-nombre" style={{ color: paleta.modo === "claro" ? "#14111f" : "#f4f2ff" }}>
        {paleta.nombre}
      </span>
      {activa && (
        <span className="tz-tema-preset-check">
          <Check size={12} />
        </span>
      )}
    </button>
  );
}

export default function TemaEditor({ negocioId, nombre, logoUrl }) {
  const [cargando, setCargando] = useState(true);
  const [guardado, setGuardado] = useState(null);
  const [tema, setTema] = useState(TEMA_POR_DEFECTO);
  const [colorLibre, setColorLibre] = useState("#2be8ff");
  const [modoLibre, setModoLibre] = useState("oscuro");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [rubro, setRubro] = useState({ clave: null, nombre: "" });
  // clave → nombre de todos los rubros (para agrupar los temáticos).
  const [nombresRubro, setNombresRubro] = useState({});
  const [verTodos, setVerTodos] = useState(false);
  // Para comparar en el callback de tiempo real sin re-suscribirse.
  const estado = useRef({ guardado: null, tema: TEMA_POR_DEFECTO, rubroId: null });
  estado.current.guardado = guardado;
  estado.current.tema = tema;

  // Rubro del negocio (sus temáticos salen primero). Consulta tolerante:
  // sin la migración 0097 no hay clave.
  const cargarRubro = async (rubroId) => {
    estado.current.rubroId = rubroId;
    if (!rubroId) return null;
    const { data: r, error: err } = await supabase.from("rubros").select("clave, nombre").eq("id", rubroId).maybeSingle();
    if (err || !r) return null;
    const nuevo = { clave: r.clave || null, nombre: r.nombre || "" };
    setRubro(nuevo);
    return nuevo;
  };

  const aplicarGuardado = (t, { forzar = false } = {}) => {
    const sinCambiosPropios = mismoTema(estado.current.tema, estado.current.guardado || TEMA_POR_DEFECTO);
    setGuardado(t);
    // Si el admin estaba probando otro tema sin guardar, no se le pisa
    // la selección (salvo que el tema guardado lo cambie la base).
    if (forzar || sinCambiosPropios) setTema(t || TEMA_POR_DEFECTO);
    if (t?.principal) {
      setColorLibre(t.principal);
      setModoLibre(t.modo || "oscuro");
    }
  };

  useEffect(() => {
    let vivo = true;
    supabase
      .from("negocios")
      .select("tema, rubro_id")
      .eq("id", negocioId)
      .maybeSingle()
      .then(async ({ data, error: err }) => {
        if (!vivo) return;
        if (err) setError("Para usar temas falta correr la migración 0096 en Supabase.");
        aplicarGuardado(data?.tema || null, { forzar: true });
        await cargarRubro(data?.rubro_id || null);
        const { data: rs } = await supabase.from("rubros").select("clave, nombre");
        if (vivo && rs) setNombresRubro(Object.fromEntries(rs.filter((r) => r.clave).map((r) => [r.clave, r.nombre])));
        if (vivo) setCargando(false);
      });

    // TIEMPO REAL: si cambia el tema guardado (otra sesión del admin) o
    // el rubro (lo cambia el super admin), la pestaña se actualiza sola.
    const canal = supabase
      .channel(`tema-negocio-${negocioId}-${Math.random().toString(36).slice(2, 10)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "negocios", filter: `id=eq.${negocioId}` },
        async ({ new: fila }) => {
          if (!vivo || !fila) return;
          if ("tema" in fila && !mismoTema(fila.tema || null, estado.current.guardado || null)) {
            aplicarGuardado(fila.tema || null);
          }
          if ("rubro_id" in fila && fila.rubro_id !== estado.current.rubroId) await cargarRubro(fila.rubro_id);
        }
      )
      .subscribe();
    return () => {
      vivo = false;
      supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [negocioId]);

  const vars = useMemo(() => variablesTema(tema), [tema]);
  const paleta = resolverPaleta(tema);
  const esLibre = !!tema?.principal;
  const tematicoActual = tematicoDe(tema);
  // Primero los temáticos del rubro del negocio, luego el resto.
  const ordenados = [...TEMATICOS.filter((t) => t.rubro === rubro.clave), ...TEMATICOS.filter((t) => t.rubro !== rubro.clave)];
  const destacados = ordenados.slice(0, 3);
  const grupos = [];
  for (const t of ordenados) {
    const g = grupos.find((x) => x.rubro === t.rubro);
    if (g) g.temas.push(t);
    else grupos.push({ rubro: t.rubro, temas: [t] });
  }
  const nombreRubro = (clave) => nombresRubro[clave] || clave.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
  const cambios = !mismoTema(tema, guardado || TEMA_POR_DEFECTO);

  const usarLibre = (color = colorLibre, modo = modoLibre) => setTema({ modo, principal: color });

  const guardar = async (nuevo) => {
    setError("");
    setOk("");
    setGuardando(true);
    const valor = nuevo === null || mismoTema(nuevo, TEMA_POR_DEFECTO) ? null : nuevo;
    const { error: err } = await supabase.rpc("actualizar_tema_negocio", { p_tema: valor });
    setGuardando(false);
    if (err) return setError(err.message || "No se pudo guardar el tema.");
    setGuardado(valor);
    setTema(valor || TEMA_POR_DEFECTO);
    setOk(valor ? "Tema guardado: ya se ve en tu caja y en tu tienda." : "Volviste al tema original.");
  };

  if (cargando) {
    return (
      <div className="tz-loading" style={{ minHeight: 120 }}>
        <Loader2 className="tz-spin" size={22} />
      </div>
    );
  }

  return (
    <div className="tz-add-entry">
      <p className="tz-stock-editor-sub" style={{ margin: 0 }}>
        Los colores de tu caja (admin y cajeros) y de tu tienda en línea. El texto siempre se ajusta para que se lea bien.
      </p>

      <label className="tz-field-label">
        <Sparkles size={12} /> Temas por rubros
      </label>
      {!verTodos ? (
        <div className="tz-tema-presets tz-tema-tematicos">
          {destacados.map((t) => (
            <TarjetaTematico key={t.id} t={t} activa={tematicoActual?.id === t.id} onClick={() => setTema({ tematico: t.id, rubro: t.rubro })} />
          ))}
        </div>
      ) : (
        <div className="tz-tema-grupos">
          {grupos.map((g) => (
            <div key={g.rubro} className="tz-tema-grupo">
              <span className="tz-tema-grupo-rubro">
                {nombreRubro(g.rubro)}
                {g.rubro === rubro.clave ? " · tu rubro" : ""}
              </span>
              {g.temas.map((t) => (
                <TarjetaTematico key={t.id} t={t} activa={tematicoActual?.id === t.id} onClick={() => setTema({ tematico: t.id, rubro: t.rubro })} />
              ))}
            </div>
          ))}
        </div>
      )}
      <button type="button" className="tz-tema-ver-mas" onClick={() => setVerTodos((v) => !v)}>
        {verTodos ? (
          <>
            <ChevronUp size={14} /> Ver menos
          </>
        ) : (
          <>
            <ChevronDown size={14} /> Ver más ({TEMATICOS.length} temas)
          </>
        )}
      </button>

      <label className="tz-field-label">Paletas oscuras</label>
      <div className="tz-tema-presets">
        {PRESETS_TEMA.filter((p) => p.modo === "oscuro").map((p) => (
          <MuestraPaleta key={p.id} paleta={p} activa={!esLibre && !tematicoActual && paleta.id === p.id} onClick={() => setTema({ preset: p.id })} />
        ))}
      </div>
      <label className="tz-field-label">Paletas claras</label>
      <div className="tz-tema-presets">
        {PRESETS_TEMA.filter((p) => p.modo === "claro").map((p) => (
          <MuestraPaleta key={p.id} paleta={p} activa={!esLibre && !tematicoActual && paleta.id === p.id} onClick={() => setTema({ preset: p.id })} />
        ))}
      </div>

      <label className="tz-field-label">Color libre</label>
      <div className={`tz-tema-libre ${esLibre ? "tz-tema-libre-activo" : ""}`}>
        <input
          type="color"
          value={colorLibre}
          onChange={(e) => {
            setColorLibre(e.target.value);
            usarLibre(e.target.value, modoLibre);
          }}
          aria-label="Color principal"
        />
        <div className="tz-gasto-tipo-buttons" style={{ flex: 1 }}>
          <button
            type="button"
            className={`tz-gasto-tipo-btn ${modoLibre === "oscuro" ? "tz-gasto-tipo-active" : ""}`}
            onClick={() => {
              setModoLibre("oscuro");
              usarLibre(colorLibre, "oscuro");
            }}
          >
            <Moon size={13} /> Oscuro
          </button>
          <button
            type="button"
            className={`tz-gasto-tipo-btn ${modoLibre === "claro" ? "tz-gasto-tipo-active" : ""}`}
            onClick={() => {
              setModoLibre("claro");
              usarLibre(colorLibre, "claro");
            }}
          >
            <Sun size={13} /> Claro
          </button>
        </div>
      </div>

      <label className="tz-field-label">Vista previa</label>
      {tematicoActual && <style>{tematicoActual.css([":root .tz-tema-preview.tz-tema-preview-tematico"])}</style>}
      <div className={`tz-tema-preview ${tematicoActual ? "tz-tema-preview-tematico" : ""}`} style={vars}>
        <div className="tz-tema-preview-cabecera">
          <button type="button" className="tz-header-btn" tabIndex={-1}>
            <ShoppingCart size={15} />
            <span className="tz-header-btn-label">Pedidos</span>
          </button>
          <div className="tz-tema-preview-centro">
            <img src={logoUrl || logoTonazo} alt="" />
            <p className="tz-subtitle">{nombre || "Mi negocio"}</p>
          </div>
          <button type="button" className="tz-header-btn" tabIndex={-1}>
            <LogOut size={15} />
            <span className="tz-header-btn-label">Salir</span>
          </button>
        </div>
        <div className="tz-tema-preview-cuerpo">
          <div className="tz-stat-chip">
            <span className="tz-stat-label">Recaudado hoy</span>
            <span className="tz-stat-value tz-pink">S/ 245.50</span>
          </div>
          <div className="tz-stat-chip tz-stat-chip-green">
            <span className="tz-stat-label">Ganancia neta</span>
            <span className="tz-stat-value tz-green">S/ 98.20</span>
          </div>
          <div className="tz-tema-preview-producto">
            <strong>Pollo a la brasa</strong>
            <span>1/4 de pollo + papas</span>
            <span className="tz-tema-preview-precio">S/ 18.00</span>
          </div>
          <div className="tz-gasto-tipo-buttons">
            <button type="button" className="tz-gasto-tipo-btn tz-gasto-tipo-active" tabIndex={-1}>
              Categoría
            </button>
            <button type="button" className="tz-gasto-tipo-btn" tabIndex={-1}>
              Otra
            </button>
          </div>
          <button type="button" className="tz-scan-btn tz-payment-save" tabIndex={-1}>
            <Wallet size={15} /> Cobrar
          </button>
        </div>
      </div>

      {error && <p className="tz-error">{error}</p>}
      {ok && <p className="tz-success">{ok}</p>}
      <div className="tz-add-entry-actions">
        <button className="tz-camera-cancel" onClick={() => guardar(null)} disabled={guardando || !guardado}>
          <RotateCcw size={15} /> Tema original
        </button>
        <button className="tz-pw-submit tz-payment-save" onClick={() => guardar(tema)} disabled={guardando || !cambios}>
          {guardando ? <Loader2 size={16} className="tz-spin" /> : <Save size={16} />}
          Guardar tema
        </button>
      </div>
    </div>
  );
}
