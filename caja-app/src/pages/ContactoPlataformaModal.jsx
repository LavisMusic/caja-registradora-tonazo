import { useEffect, useState } from "react";
import { X, Loader2, Check, Phone } from "lucide-react";
import { supabase } from "../supabaseClient";
import Styles from "../components/Styles";
import { invalidarContactoPlataforma } from "../hooks/useContactoPlataforma";

// Gestor de datos de contacto de la plataforma (super admin). Una sola
// fila en plataforma_contacto; al guardar, un trigger la copia a Taxi-PE
// (webhook 'caja.contacto_plataforma', migración 0087).
const CAMPOS = [
  {
    key: "whatsapp_pagos",
    label: "WhatsApp de pagos",
    ayuda: "Donde los negocios pagan su plan (aviso de vencimiento y pantalla de plan suspendido).",
  },
  {
    key: "whatsapp_soporte",
    label: "WhatsApp de soporte",
    ayuda: "Botón Soporte de Taxi-PE y aviso de cuenta eliminada en las dos apps.",
  },
  {
    key: "whatsapp_afiliacion",
    label: "WhatsApp para afiliar negocios",
    ayuda: "Botón “¿Tienes un negocio? Súmate a Tonazo” del directorio.",
  },
];

export default function ContactoPlataformaModal({ onClose }) {
  const [valores, setValores] = useState({ whatsapp_pagos: "", whatsapp_soporte: "", whatsapp_afiliacion: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let activo = true;
    supabase
      .from("plataforma_contacto")
      .select("whatsapp_pagos, whatsapp_soporte, whatsapp_afiliacion")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (!activo) return;
        if (err) setError("No se pudo cargar el contacto.");
        if (data) {
          setValores({
            whatsapp_pagos: data.whatsapp_pagos || "",
            whatsapp_soporte: data.whatsapp_soporte || "",
            whatsapp_afiliacion: data.whatsapp_afiliacion || "",
          });
        }
        setLoading(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const guardar = async () => {
    setError("");
    setOk(false);
    const limpio = Object.fromEntries(
      CAMPOS.map(({ key }) => [key, valores[key].replace(/\D/g, "") || null])
    );
    const invalido = CAMPOS.find(({ key }) => limpio[key] && !/^\d{9,15}$/.test(limpio[key]));
    if (invalido) {
      setError(`${invalido.label}: ingresa un número válido (9 dígitos, o con código de país).`);
      return;
    }
    setSaving(true);
    const { error: err } = await supabase
      .from("plataforma_contacto")
      .upsert({ id: 1, ...limpio, updated_at: new Date().toISOString() });
    setSaving(false);
    if (err) {
      setError(err.message || "No se pudo guardar.");
      return;
    }
    invalidarContactoPlataforma(limpio);
    setOk(true);
  };

  return (
    <div className="tz-modal-backdrop" onClick={onClose}>
      <Styles />
      <div className="tz-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tz-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>
          <Phone size={17} /> Contacto de la plataforma
        </h2>
        <p className="tz-brand-sub" style={{ marginBottom: 14 }}>
          Se usa en Caja Tonazo y en Taxi-PE. Al guardar, Taxi-PE se actualiza solo.
        </p>

        {loading ? (
          <div className="tz-loading">
            <Loader2 className="tz-spin" size={24} />
          </div>
        ) : (
          <>
            {CAMPOS.map(({ key, label, ayuda }) => (
              <div key={key} className="tz-login-field" style={{ marginBottom: 12 }}>
                <label className="tz-field-label" htmlFor={`contacto-${key}`}>{label}</label>
                <input
                  id={`contacto-${key}`}
                  className="tz-text-input"
                  inputMode="tel"
                  placeholder="Ej. 987654321"
                  value={valores[key]}
                  onChange={(e) => {
                    setOk(false);
                    setValores((v) => ({ ...v, [key]: e.target.value }));
                  }}
                />
                <p className="tz-stock-editor-sub" style={{ margin: "4px 0 0" }}>{ayuda}</p>
              </div>
            ))}
            {error && <p className="tz-error">{error}</p>}
            {ok && <p className="tz-sa-negocio-admin-ok">Guardado. Taxi-PE se actualiza en unos segundos.</p>}
            <button type="button" className="tz-scan-btn tz-payment-save" style={{ width: "100%" }} onClick={guardar} disabled={saving}>
              {saving ? <Loader2 size={15} className="tz-spin" /> : <Check size={15} />} Guardar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
