import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Pencil, Zap, Users, Loader2, ImagePlus, Store, Save, UserPlus, Check, X } from "lucide-react";
import { ESTADOS_PLAN, DIAS_AVISO, calcularEstadoPlan, diasHasta, duracionPlan, formatFechaCorta } from "../lib/planes";
import { slugify } from "./GestorNegociosModal.jsx";

// Directorio de negocios del super admin — mismo diseño que el
// Directorio de Conductores del admin de Taxi-PE:
//   * pestañas  = rubros (+ "Todos"),
//   * acordeones = estado del plan (Por vencer, En gracia, Suspendidos,
//     En prueba, Activos, Exentos),
//   * tarjetas  = negocios, con su color propio (borde con brillo), logo,
//     datos, su plan en etiqueta, Recarga rápida (registrar pago), Ver
//     clientes, edición y el desplegable de estado (Automático / Exento /
//     Suspendido manual).
// El borrado de un negocio vive en el Gestor de negocios (cabecera).
export const COLORES = ["#2be8ff", "#ff2f9e", "#d7ff3b", "#39ff8a", "#ff9500", "#b98bff", "#ff5470", "#ffffff"];

const GRUPOS = [
  { key: "por_vencer", label: "Por vencer", color: "var(--yellow)" },
  { key: "gracia", label: "En gracia", color: ESTADOS_PLAN.gracia.color },
  { key: "suspendido", label: "Suspendidos", color: ESTADOS_PLAN.suspendido.color },
  { key: "prueba", label: "En prueba", color: ESTADOS_PLAN.prueba.color },
  { key: "activo", label: "Activos", color: ESTADOS_PLAN.activo.color },
  { key: "exento", label: "Exentos", color: ESTADOS_PLAN.exento.color },
];

export function grupoDeNegocio(n) {
  const estado = calcularEstadoPlan(n);
  if (["prueba", "activo"].includes(estado)) {
    const dias = diasHasta(n.plan_vence_at);
    if (dias != null && dias <= DIAS_AVISO) return "por_vencer";
  }
  return estado;
}

function modoDe(n) {
  if (n.plan_suspendido_manual) return "suspendido";
  if (n.plan_exento) return "exento";
  return "automatico";
}

function GrupoEstado({ grupo, count, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="tz-vis-category">
      <div className="tz-vis-header-row">
        <button type="button" className="tz-vis-category-header" onClick={() => setOpen((v) => !v)}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: grupo.color, flexShrink: 0 }} />
            {grupo.label}
          </span>
          <span className="tz-vis-category-meta">
            {count} {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>
      </div>
      {open && <div className="tz-vis-accordion-inner">{children}</div>}
    </div>
  );
}

function TarjetaNegocio({ negocio, rubros, plan, sucursales, onUpdate, onLogoChange, onCreateAdmin, onRecargar, onVerClientes }) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(negocio.nombre);
  const [slug, setSlug] = useState(negocio.slug || "");
  const [rubroId, setRubroId] = useState(negocio.rubro_id || "");
  const [color, setColor] = useState(negocio.color || COLORES[0]);
  const [whatsapp, setWhatsapp] = useState(negocio.whatsapp || "");
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [cambiandoModo, setCambiandoModo] = useState(false);
  const [error, setError] = useState("");
  const [creandoAdmin, setCreandoAdmin] = useState(false);
  const [admin, setAdmin] = useState({ nombre: "", usuario: "", clave: "" });
  const [adminMsg, setAdminMsg] = useState("");

  const estado = calcularEstadoPlan(negocio);
  const infoEstado = ESTADOS_PLAN[estado] || ESTADOS_PLAN.activo;
  const rubro = rubros.find((r) => r.id === negocio.rubro_id);
  const dias = diasHasta(negocio.plan_vence_at);

  const empezarEdicion = () => {
    setNombre(negocio.nombre);
    setSlug(negocio.slug || "");
    setRubroId(negocio.rubro_id || "");
    setColor(negocio.color || COLORES[0]);
    setWhatsapp(negocio.whatsapp || "");
    setError("");
    setEditando(true);
  };

  const guardar = async () => {
    const n = nombre.trim();
    const s = slugify(slug);
    if (!n || !s) return setError("Nombre y slug no pueden quedar vacíos.");
    setGuardando(true);
    setError("");
    const w = whatsapp.replace(/[^\d+]/g, "");
    if (w && w.replace(/\D/g, "").length < 9) return setError("El WhatsApp debe tener al menos 9 dígitos.");
    const { error: err } = await onUpdate(negocio, {
      nombre: n,
      slug: s,
      rubro_id: rubroId || negocio.rubro_id,
      color,
      whatsapp: w || null,
    });
    setGuardando(false);
    if (err) return setError(err.code === "23505" ? `Ya existe un negocio con el slug "${s}".` : err.message || "No se pudo guardar.");
    setEditando(false);
  };

  const cambiarModo = async (e) => {
    const modo = e.target.value;
    setCambiandoModo(true);
    // Suspendido => queda "Sin plan" (regla; la base también lo hace).
    await onUpdate(negocio, {
      plan_exento: modo === "exento",
      plan_suspendido_manual: modo === "suspendido",
      ...(modo === "suspendido" ? { plan_id: null } : {}),
    });
    setCambiandoModo(false);
  };

  const subirLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSubiendo(true);
    const { error: err } = await onLogoChange(negocio, file);
    setSubiendo(false);
    if (err) setError("No se pudo subir el logo.");
  };

  const crearAdmin = async () => {
    const { nombre: an, usuario, clave } = admin;
    if (!an.trim() || !usuario.trim() || !clave) return setAdminMsg("Completa nombre, usuario y clave.");
    setAdminMsg("");
    const { error: err } = await onCreateAdmin(negocio, { nombre: an.trim(), usuario: usuario.trim(), pin: clave });
    if (err) return setAdminMsg(err);
    setAdminMsg(`Admin "${usuario.trim()}" creado.`);
    setAdmin({ nombre: "", usuario: "", clave: "" });
    setCreandoAdmin(false);
  };

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="tz-card tz-card-negocio"
      style={{ "--tz-negocio-color": negocio.color || "var(--cyan)" }}
    >
      <div className="tz-card-row">
        <label className="tz-card-negocio-logo" title="Cambiar logo">
          {negocio.logo_url ? <img src={negocio.logo_url} alt={negocio.nombre} /> : <Store size={26} />}
          <span className="tz-card-negocio-logo-overlay">
            {subiendo ? <Loader2 size={15} className="tz-spin" /> : <ImagePlus size={15} />}
          </span>
          <input type="file" accept="image/*" onChange={subirLogo} disabled={subiendo} hidden />
        </label>

        <div className="tz-card-main">
          <div className="tz-card-top">
            <div className="tz-card-info" style={{ width: "100%" }}>
              {editando ? (
                <div className="tz-vis-inline-edit-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                  <input className="tz-text-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" />
                  <input className="tz-text-input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug (dirección de login)" />
                  <input
                    className="tz-text-input"
                    inputMode="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="WhatsApp del negocio (ej. 987654321)"
                    aria-label="WhatsApp del negocio"
                  />
                  <select className="tz-text-input" value={rubroId} onChange={(e) => setRubroId(e.target.value)}>
                    {rubros.map((r) => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
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
                  {error && <p className="tz-error">{error}</p>}
                  <div className="tz-add-entry-actions">
                    <button className="tz-camera-cancel" onClick={() => setEditando(false)} disabled={guardando}>
                      Cancelar
                    </button>
                    <button className="tz-pw-submit tz-payment-save" onClick={guardar} disabled={guardando}>
                      {guardando ? <Loader2 size={16} className="tz-spin" /> : <Save size={16} />} Guardar
                    </button>
                  </div>
                  {creandoAdmin ? (
                    <div className="tz-card-negocio-admin">
                      <input className="tz-text-input" placeholder="Nombre del admin" value={admin.nombre} onChange={(e) => setAdmin((a) => ({ ...a, nombre: e.target.value }))} />
                      <input
                        className="tz-text-input"
                        placeholder="Usuario (para el login)"
                        autoCapitalize="off"
                        value={admin.usuario}
                        onChange={(e) => setAdmin((a) => ({ ...a, usuario: e.target.value }))}
                      />
                      <input
                        type="password"
                        className="tz-text-input"
                        placeholder="Clave (6 a 10 dígitos)"
                        value={admin.clave}
                        onChange={(e) => setAdmin((a) => ({ ...a, clave: e.target.value }))}
                      />
                      <div className="tz-vis-confirm-actions">
                        <button type="button" className="tz-cliente-action-btn tz-cliente-action-pago" onClick={crearAdmin}>
                          <Check size={13} /> Crear acceso
                        </button>
                        <button type="button" className="tz-cliente-action-btn" onClick={() => setCreandoAdmin(false)}>
                          <X size={13} /> Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className="tz-sa-add-btn" onClick={() => { setAdminMsg(""); setCreandoAdmin(true); }}>
                      <UserPlus size={14} /> Dar acceso a un admin
                    </button>
                  )}
                  {adminMsg && <p className="tz-stock-editor-sub">{adminMsg}</p>}
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <h3 className="tz-card-name">{negocio.nombre}</h3>
                    <button type="button" className="tz-vis-edit-btn" onClick={empezarEdicion} aria-label="Editar negocio" title="Editar datos">
                      <Pencil size={14} />
                    </button>
                    <button type="button" className="tz-vis-edit-btn" onClick={() => onRecargar(negocio)} aria-label="Recarga rápida" title="Recarga rápida (registrar pago del plan)">
                      <Zap size={14} />
                    </button>
                    <button type="button" className="tz-vis-edit-btn" onClick={() => onVerClientes(negocio)} aria-label="Ver clientes" title="Ver clientes">
                      <Users size={14} />
                    </button>
                  </div>
                  <p className="tz-card-negocio-dato">
                    /{negocio.slug || "sin-slug"} · {rubro?.nombre || "Sin rubro"}
                  </p>
                  <p className="tz-card-negocio-dato">WhatsApp: {negocio.whatsapp || "sin registrar"}</p>
                  <p className="tz-card-negocio-dato">
                    {sucursales} sucursal{sucursales === 1 ? "" : "es"}
                    {plan?.max_sucursales != null ? ` de ${plan.max_sucursales}` : ""}
                  </p>
                  {adminMsg && <p className="tz-stock-editor-sub">{adminMsg}</p>}
                </>
              )}
            </div>
          </div>

          <div className="tz-card-bottom">
            <div className="tz-card-stockrow">
              <span className="tz-tag tz-tag-ok" title="Membresía (plan)">
                {plan && estado !== "suspendido" ? `${plan.nombre} · ${duracionPlan(plan.meses)}` : "Sin plan"}
              </span>
              {negocio.plan_exento ? (
                <span className="tz-tag tz-tag-ok">Sin vencimiento</span>
              ) : negocio.plan_vence_at ? (
                <span className={`tz-tag ${dias != null && dias < 0 ? "tz-tag-danger" : "tz-tag-warn"}`}>
                  {dias != null && dias < 0 ? "Venció" : "Vence"} {formatFechaCorta(negocio.plan_vence_at)}
                </span>
              ) : null}
              {!negocio.activo && <span className="tz-tag tz-tag-danger">Oculto en el directorio</span>}
            </div>
            <select
              className="tz-estado-select"
              data-estado={modoDe(negocio) === "automatico" ? estado : modoDe(negocio)}
              value={modoDe(negocio)}
              onChange={cambiarModo}
              disabled={cambiandoModo}
              title={`Estado actual: ${infoEstado.label}`}
            >
              <option value="automatico">Automático · {infoEstado.label}</option>
              <option value="exento">Exento</option>
              <option value="suspendido">Suspendido</option>
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function NegociosDirectorio({ negocios, rubros, planes, sucursalesPorNegocio, ...acciones }) {
  const rubrosConNegocios = useMemo(
    () => rubros.filter((r) => negocios.some((n) => n.rubro_id === r.id)),
    [rubros, negocios]
  );
  const [tab, setTab] = useState("todos");
  const visibles = tab === "todos" ? negocios : negocios.filter((n) => n.rubro_id === tab);
  const grupos = GRUPOS.map((g) => ({ ...g, negocios: visibles.filter((n) => grupoDeNegocio(n) === g.key) })).filter(
    (g) => g.negocios.length > 0
  );

  return (
    <section>
      <nav className="tz-tabs">
        <button className={`tz-tab ${tab === "todos" ? "tz-tab-active" : ""}`} onClick={() => setTab("todos")}>
          Todos
        </button>
        {rubrosConNegocios.map((r) => (
          <button key={r.id} className={`tz-tab ${tab === r.id ? "tz-tab-active" : ""}`} onClick={() => setTab(r.id)}>
            {r.nombre}
          </button>
        ))}
      </nav>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {grupos.length === 0 ? (
          <div className="tz-empty">
            <p>No hay negocios en este rubro todavía.</p>
          </div>
        ) : (
          grupos.map((g, i) => (
            <GrupoEstado key={g.key} grupo={g} count={g.negocios.length} defaultOpen={i === 0}>
              <div className="tz-directorio-grid">
                {g.negocios.map((n) => (
                  <TarjetaNegocio
                    key={n.id}
                    negocio={n}
                    rubros={rubros}
                    plan={planes.find((p) => p.id === n.plan_id) || null}
                    sucursales={sucursalesPorNegocio[n.id] || 0}
                    {...acciones}
                  />
                ))}
              </div>
            </GrupoEstado>
          ))
        )}
      </div>
    </section>
  );
}
