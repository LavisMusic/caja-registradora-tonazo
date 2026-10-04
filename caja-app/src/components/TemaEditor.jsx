import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, RotateCcw, Check, Moon, Sun, LogOut, Wallet, ShoppingCart, Sparkles } from "lucide-react";
import { supabase } from "../supabaseClient";
import { PRESETS_TEMA, TEMA_POR_DEFECTO, resolverPaleta, variablesTema } from "../lib/tema";
import { tematicoDe, tematicosDelRubro } from "../lib/tematicos";
import logoTonazo from "../assets/logo.webp";

// Apartado "Tema" del Perfil del negocio: elegir una paleta armada (oscura
// o clara) o un color libre (con modo oscuro/claro), con VISTA PREVIA en
// vivo (cabecera, botones, medidor, tarjeta de producto) antes de
// guardar. Cambia los colores de la caja (admin y cajero) y de la tienda
// pública del negocio. Guarda con la RPC actualizar_tema_negocio
// (migración 0096).
// Arriba de todo, si su rubro tiene: "Temático de tu rubro" — temas
// especiales con adornos (src/lib/tematicos.js, rubros.clave de 0097).
const mismoTema = (a, b) => JSON.stringify(a || null) === JSON.stringify(b || null);

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

  // Rubro del negocio (para sus temáticos). Consulta tolerante: sin la
  // migración 0097 no hay clave y simplemente no se muestran temáticos.
  useEffect(() => {
    let vivo = true;
    supabase
      .from("negocios")
      .select("rubro_id")
      .eq("id", negocioId)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data?.rubro_id) return;
        const { data: r, error: err } = await supabase.from("rubros").select("clave, nombre").eq("id", data.rubro_id).maybeSingle();
        if (vivo && !err && r) setRubro({ clave: r.clave || null, nombre: r.nombre || "" });
      });
    return () => {
      vivo = false;
    };
  }, [negocioId]);

  useEffect(() => {
    let vivo = true;
    supabase
      .from("negocios")
      .select("tema")
      .eq("id", negocioId)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (!vivo) return;
        if (err) setError("Para usar temas falta correr la migración 0096 en Supabase.");
        const t = data?.tema || null;
        setGuardado(t);
        setTema(t || TEMA_POR_DEFECTO);
        if (t?.principal) {
          setColorLibre(t.principal);
          setModoLibre(t.modo || "oscuro");
        }
        setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [negocioId]);

  const vars = useMemo(() => variablesTema(tema), [tema]);
  const paleta = resolverPaleta(tema);
  const esLibre = !!tema?.principal;
  const tematicoActual = tematicoDe(tema);
  const tematicos = tematicosDelRubro(rubro.clave);
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

      {tematicos.length > 0 && (
        <>
          <label className="tz-field-label">
            <Sparkles size={12} /> Temático de tu rubro ({rubro.nombre})
          </label>
          <div className="tz-tema-presets tz-tema-tematicos">
            {tematicos.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`tz-tema-preset tz-tema-tematico ${tematicoActual?.id === t.id ? "tz-tema-preset-activa" : ""}`}
                style={{ background: t.muestra }}
                onClick={() => setTema({ tematico: t.id, rubro: t.rubro })}
              >
                <span className="tz-tema-preset-nombre" style={{ color: t.paleta.modo === "claro" ? "#14111f" : "#f4f2ff", textShadow: t.paleta.modo === "claro" ? "none" : undefined }}>
                  {t.nombre}
                </span>
                <span
                  className="tz-tema-tematico-desc"
                  style={t.paleta.modo === "claro" ? { color: "#3a3550", textShadow: "none" } : undefined}
                >
                  {t.descripcion}
                </span>
                {tematicoActual?.id === t.id && (
                  <span className="tz-tema-preset-check">
                    <Check size={12} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

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
