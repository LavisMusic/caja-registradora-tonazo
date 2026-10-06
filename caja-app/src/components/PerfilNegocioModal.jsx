import { useEffect, useState } from "react";
import { X, Loader2, Save, Store, ImagePlus, Plus, Trash2, Copy } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import LogoAdaptadorModal from "./LogoAdaptadorModal";
import { COLORES } from "../pages/NegociosDirectorio";
import { DIAS_SEMANA, horarioVacio } from "../lib/horario";
import logoTonazo from "../assets/logo.webp";
import TemaEditor from "./TemaEditor";

// "Perfil" del negocio (botón de la cabecera, solo admin). Apartados:
//   * Datos: logo (se adapta a cuadrado / horizontal / vertical con
//     Recortar o Ajustar — LogoAdaptadorModal), nombre, color de su
//     tarjeta en el directorio y WhatsApp del negocio (OBLIGATORIO para
//     poder renovar el plan: ahí le llegan el resumen y la boleta).
//   * Descripciones: frases cortas (hasta 6, de 20 caracteres) que la
//     tienda pública muestra debajo del logo, una tras otra.
//   * Horarios: horario de atención de cada sucursal (la tienda muestra
//     el de hoy de la sucursal elegida).
//   * Tema: colores de su caja y su tienda (TemaEditor).
// El slug (dirección de login) NO se edita acá: solo el super admin.
// Guarda con la RPC actualizar_perfil_negocio (migración 0095).
const APARTADOS = [
  { id: "datos", label: "Datos" },
  { id: "descripciones", label: "Descripciones" },
  { id: "horarios", label: "Horarios" },
  { id: "tema", label: "Tema" },
];
const MAX_DESCRIPCIONES = 6;

// ¿La imagen tiene al menos algunos píxeles transparentes? Se revisa en
// una copia chica (rápido) y se piden unos cuantos para no confundir un
// borde suelto con un logo "sin fondo".
function tieneTransparencia(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, 256 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * escala));
      canvas.height = Math.max(1, Math.round(img.height * escala));
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const datos = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparentes = 0;
      for (let i = 3; i < datos.length; i += 4) if (datos[i] < 200) transparentes += 1;
      resolve(transparentes >= Math.max(10, (canvas.width * canvas.height) / 200));
    };
    img.onerror = () => resolve(false);
    img.src = src;
  });
}
const MAX_CARACTERES = 20;

export default function PerfilNegocioModal({ onClose, apartadoInicial = "datos" }) {
  const { negocioId } = useAuth();
  const [apartado, setApartado] = useState(apartadoInicial);
  const [cargando, setCargando] = useState(true);
  const [negocio, setNegocio] = useState(null);
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState(COLORES[0]);
  const [whatsapp, setWhatsapp] = useState("");
  const [descripciones, setDescripciones] = useState([]);
  const [logoBlob, setLogoBlob] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFuente, setLogoFuente] = useState("");
  const [sucursales, setSucursales] = useState([]);
  const [sucursalId, setSucursalId] = useState("");
  const [horario, setHorario] = useState(horarioVacio());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [logoError, setLogoError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    if (!negocioId) return undefined;
    let vivo = true;
    (async () => {
      const [{ data: n }, { data: locs }] = await Promise.all([
        supabase.from("negocios").select("id, nombre, slug, color, whatsapp, descripciones, logo_url").eq("id", negocioId).single(),
        supabase.from("localidades").select("id").eq("negocio_id", negocioId),
      ]);
      const locIds = (locs || []).map((l) => l.id);
      const { data: sucs } = await supabase
        .from("sucursales")
        .select("id, nombre, horario, activo")
        .in("localidad_id", locIds.length ? locIds : ["00000000-0000-0000-0000-000000000000"])
        .order("orden");
      if (!vivo) return;
      if (n) {
        setNegocio(n);
        setNombre(n.nombre || "");
        setColor(n.color || COLORES[0]);
        setWhatsapp(n.whatsapp || "");
        setDescripciones(n.descripciones || []);
      }
      const activas = (sucs || []).filter((s) => s.activo !== false);
      setSucursales(activas);
      if (activas[0]) {
        setSucursalId(activas[0].id);
        setHorario(activas[0].horario || horarioVacio());
      }
      setCargando(false);
    })();
    return () => {
      vivo = false;
    };
  }, [negocioId]);

  useEffect(() => () => logoPreview && URL.revokeObjectURL(logoPreview), [logoPreview]);

  const avisar = (texto) => {
    setOk(texto);
    setTimeout(() => setOk(""), 3500);
  };

  // Solo PNG SIN fondo: se rechaza otro formato y también un PNG sin
  // ningún píxel transparente (casi seguro trae fondo).
  const elegirLogo = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setLogoError("");
    if (f.type !== "image/png" && !/\.png$/i.test(f.name || "")) {
      return setLogoError("El logo tiene que ser un PNG sin fondo.");
    }
    const lector = new FileReader();
    lector.onload = async () => {
      const src = String(lector.result);
      if (!(await tieneTransparencia(src))) {
        return setLogoError("Este PNG tiene fondo: súbelo sin fondo (transparente).");
      }
      setLogoFuente(src);
    };
    lector.readAsDataURL(f);
  };

  const guardarPerfil = async () => {
    setError("");
    if (!nombre.trim()) return setError("El nombre no puede quedar vacío.");
    const digitos = whatsapp.replace(/\D/g, "");
    if (whatsapp.trim() && digitos.length < 9) return setError("El WhatsApp debe tener al menos 9 dígitos.");
    const limpias = descripciones.map((d) => d.trim()).filter(Boolean);
    setGuardando(true);
    let logoUrl = null;
    if (logoBlob) {
      const ruta = `${negocioId}/${Date.now()}.png`;
      const { error: errSubida } = await supabase.storage
        .from("negocio-logos")
        .upload(ruta, logoBlob, { contentType: "image/png", upsert: false });
      if (errSubida) {
        setGuardando(false);
        return setError(`No se pudo subir el logo: ${errSubida.message}`);
      }
      logoUrl = supabase.storage.from("negocio-logos").getPublicUrl(ruta).data.publicUrl;
    }
    const { error: err } = await supabase.rpc("actualizar_perfil_negocio", {
      p_nombre: nombre.trim(),
      p_color: color,
      p_whatsapp: whatsapp.trim(),
      p_descripciones: limpias,
      p_logo_url: logoUrl,
    });
    setGuardando(false);
    if (err) return setError(err.message || "No se pudo guardar el perfil.");
    setDescripciones(limpias);
    if (logoUrl) {
      setNegocio((prev) => ({ ...prev, logo_url: logoUrl }));
      setLogoBlob(null);
      setLogoPreview("");
    }
    avisar("Perfil guardado.");
  };

  const elegirSucursal = (id) => {
    setSucursalId(id);
    setHorario(sucursales.find((s) => s.id === id)?.horario || horarioVacio());
    setError("");
  };

  const cambiarDia = (dia, cambios) =>
    setHorario((prev) => ({ ...prev, [dia]: cambios === null ? null : { ...(prev[dia] || { abre: "08:00", cierra: "20:00" }), ...cambios } }));

  const copiarLunesATodos = () =>
    setHorario((prev) => Object.fromEntries(DIAS_SEMANA.map((d) => [d.id, prev.lun ? { ...prev.lun } : null])));

  const guardarHorario = async () => {
    setError("");
    for (const d of DIAS_SEMANA) {
      const h = horario[d.id];
      if (h && (!h.abre || !h.cierra)) return setError(`Completa las horas del ${d.label.toLowerCase()}.`);
    }
    setGuardando(true);
    const { data, error: err } = await supabase.from("sucursales").update({ horario }).eq("id", sucursalId).select("id");
    setGuardando(false);
    if (err || !data?.length) return setError(err?.message || "No se pudo guardar el horario.");
    setSucursales((prev) => prev.map((s) => (s.id === sucursalId ? { ...s, horario } : s)));
    avisar("Horario guardado.");
  };

  const logoActual = logoPreview || negocio?.logo_url || logoTonazo;

  return (
    <div className="tz-modal-backdrop">
      <div className="tz-modal tz-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <div className="tz-payment-modal">
          <h2>
            <Store size={17} /> Perfil del negocio
          </h2>

          {cargando ? (
            <div className="tz-loading" style={{ minHeight: 120 }}>
              <Loader2 className="tz-spin" size={22} />
            </div>
          ) : (
            <>
              <div className="tz-plan-filtros tz-plan-apartados">
                {APARTADOS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`tz-gasto-tipo-btn ${apartado === a.id ? "tz-gasto-tipo-active" : ""}`}
                    onClick={() => {
                      setApartado(a.id);
                      setError("");
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              {apartado === "datos" && (
                <div className="tz-add-entry">
                  <label className="tz-field-label">Logo</label>
                  <div className="tz-perfil-logo">
                    <div className="tz-logo-preview">
                      <img src={logoActual} alt="Logo del negocio" />
                    </div>
                    <label className="tz-scan-btn" style={{ cursor: "pointer" }}>
                      <ImagePlus size={16} /> Cambiar logo
                      <input type="file" accept="image/png,.png" hidden onChange={elegirLogo} />
                    </label>
                  </div>

                  <small className="tz-stock-editor-sub">Solo PNG sin fondo (transparente).</small>
                  {logoError && <p className="tz-error" style={{ margin: 0 }}>{logoError}</p>}

                  <label className="tz-field-label">Nombre del negocio</label>
                  <input className="tz-text-input" value={nombre} onChange={(e) => setNombre(e.target.value)} />

                  <label className="tz-field-label">WhatsApp del negocio</label>
                  <input
                    className="tz-text-input"
                    inputMode="tel"
                    placeholder="Ej. 987654321"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                  <small className="tz-stock-editor-sub">
                    Obligatorio para renovar tu plan: ahí te llegan el resumen y la boleta de cada pago.
                  </small>

                  <label className="tz-field-label">Color de tu tarjeta en el directorio</label>
                  <div className="tz-card-negocio-colores">
                    {COLORES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`tz-card-negocio-color ${color === c ? "tz-card-negocio-color-activo" : ""}`}
                        style={{ background: c }}
                        onClick={() => setColor(c)}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Otro color" />
                  </div>

                  <p className="tz-stock-editor-sub" style={{ margin: "6px 0 0" }}>
                    Dirección de acceso: <strong>/{negocio?.slug}</strong> (solo la cambia el administrador de la plataforma).
                  </p>

                  {error && <p className="tz-error">{error}</p>}
                  {ok && <p className="tz-success">{ok}</p>}
                  <div className="tz-add-entry-actions">
                    <button className="tz-camera-cancel" onClick={onClose} disabled={guardando}>
                      Cerrar
                    </button>
                    <button className="tz-pw-submit tz-payment-save" onClick={guardarPerfil} disabled={guardando}>
                      {guardando ? <Loader2 size={16} className="tz-spin" /> : <Save size={16} />}
                      Guardar
                    </button>
                  </div>
                </div>
              )}

              {apartado === "descripciones" && (
                <div className="tz-add-entry">
                  <p className="tz-stock-editor-sub" style={{ margin: 0 }}>
                    Frases cortas que tu tienda muestra debajo del logo, una tras otra (después del saludo al cliente y antes
                    del horario). Hasta {MAX_DESCRIPCIONES}, de {MAX_CARACTERES} caracteres cada una.
                  </p>
                  {descripciones.map((d, i) => (
                    <div key={i} className="tz-perfil-descripcion">
                      <input
                        className="tz-text-input"
                        maxLength={MAX_CARACTERES}
                        placeholder="Ej. Pollos a la brasa"
                        value={d}
                        onChange={(e) => setDescripciones((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                      />
                      <span className="tz-perfil-contador">
                        {d.length}/{MAX_CARACTERES}
                      </span>
                      <button
                        type="button"
                        className="tz-vis-reject-btn"
                        onClick={() => setDescripciones((prev) => prev.filter((_, j) => j !== i))}
                        aria-label="Quitar descripción"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  {descripciones.length < MAX_DESCRIPCIONES && (
                    <button type="button" className="tz-gasto-add-item" onClick={() => setDescripciones((prev) => [...prev, ""])}>
                      <Plus size={14} /> Agregar descripción
                    </button>
                  )}
                  {error && <p className="tz-error">{error}</p>}
                  {ok && <p className="tz-success">{ok}</p>}
                  <div className="tz-add-entry-actions">
                    <button className="tz-camera-cancel" onClick={onClose} disabled={guardando}>
                      Cerrar
                    </button>
                    <button className="tz-pw-submit tz-payment-save" onClick={guardarPerfil} disabled={guardando}>
                      {guardando ? <Loader2 size={16} className="tz-spin" /> : <Save size={16} />}
                      Guardar
                    </button>
                  </div>
                </div>
              )}

              {apartado === "tema" && (
                <TemaEditor negocioId={negocioId} nombre={nombre} logoUrl={logoPreview || negocio?.logo_url} onCerrar={onClose} />
              )}

              {apartado === "horarios" &&
                (sucursales.length === 0 ? (
                  <p className="tz-method-history-empty">Todavía no tienes sucursales activas.</p>
                ) : (
                  <div className="tz-add-entry">
                    <label className="tz-field-label">Sucursal</label>
                    <select className="tz-text-input" value={sucursalId} onChange={(e) => elegirSucursal(e.target.value)}>
                      {sucursales.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre}
                          {s.horario ? "" : " (sin horario)"}
                        </option>
                      ))}
                    </select>

                    <div className="tz-horario-dias">
                      {DIAS_SEMANA.map((d) => {
                        const h = horario[d.id];
                        return (
                          <div key={d.id} className={`tz-horario-dia ${h ? "" : "tz-horario-dia-cerrado"}`}>
                            <span className="tz-horario-dia-nombre">{d.label}</span>
                            <label className="tz-toggle">
                              <input
                                type="checkbox"
                                checked={!!h}
                                onChange={(e) => cambiarDia(d.id, e.target.checked ? {} : null)}
                                aria-label={`${d.label} abierto`}
                              />
                              <span className="tz-toggle-slider" />
                            </label>
                            {h ? (
                              <span className="tz-horario-horas">
                                <input
                                  type="time"
                                  className="tz-text-input"
                                  value={h.abre || ""}
                                  onChange={(e) => cambiarDia(d.id, { abre: e.target.value })}
                                  aria-label={`${d.label} abre`}
                                />
                                <span>a</span>
                                <input
                                  type="time"
                                  className="tz-text-input"
                                  value={h.cierra || ""}
                                  onChange={(e) => cambiarDia(d.id, { cierra: e.target.value })}
                                  aria-label={`${d.label} cierra`}
                                />
                              </span>
                            ) : (
                              <span className="tz-horario-horas tz-horario-cerrado-texto">Cerrado</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button type="button" className="tz-gasto-add-item" onClick={copiarLunesATodos}>
                      <Copy size={14} /> Copiar el horario del lunes a todos los días
                    </button>

                    {error && <p className="tz-error">{error}</p>}
                    {ok && <p className="tz-success">{ok}</p>}
                    <div className="tz-add-entry-actions">
                      <button className="tz-camera-cancel" onClick={onClose} disabled={guardando}>
                        Cerrar
                      </button>
                      <button className="tz-pw-submit tz-payment-save" onClick={guardarHorario} disabled={guardando || !sucursalId}>
                        {guardando ? <Loader2 size={16} className="tz-spin" /> : <Save size={16} />}
                        Guardar horario
                      </button>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      </div>

      {logoFuente && (
        <LogoAdaptadorModal
          imageSrc={logoFuente}
          onCancel={() => setLogoFuente("")}
          onConfirm={(blob) => {
            setLogoBlob(blob);
            setLogoPreview(URL.createObjectURL(blob));
            setLogoFuente("");
          }}
        />
      )}
    </div>
  );
}
