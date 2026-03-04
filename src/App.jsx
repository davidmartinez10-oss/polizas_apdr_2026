import { useState, useEffect, useMemo, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN SUPABASE — Reemplaza con tus credenciales reales
// ═══════════════════════════════════════════════════════════════
const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
const SUPABASE_ANON_KEY = "TU_ANON_KEY_AQUI";

// ═══════════════════════════════════════════════════════════════
// CLIENTE SUPABASE LIGERO (sin SDK — fetch directo)
// ═══════════════════════════════════════════════════════════════
const supabase = {
  from: (table) => ({
    select: async (columns = "*") => {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?select=${columns}`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
      return { data: await res.json(), error: null };
    },
    update: async (body, match) => {
      const params = new URLSearchParams();
      Object.entries(match).forEach(([k, v]) => params.append(k, `eq.${v}`));
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
      return { data: await res.json(), error: null };
    },
    selectWhere: async (columns = "*", field, value) => {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?select=${columns}&${field}=eq.${encodeURIComponent(value)}`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
      return { data: await res.json(), error: null };
    },
  }),
};

// ═══════════════════════════════════════════════════════════════
// UTILIDADES DE FECHA — Cálculo DINÁMICO contra new Date()
// ═══════════════════════════════════════════════════════════════
const hoy = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const parseFecha = (str) => {
  if (!str) return null;
  const d = new Date(str + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
};

const diasRestantes = (fechaFin) => {
  const fin = parseFecha(fechaFin);
  if (!fin) return null;
  const diff = fin.getTime() - hoy().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * CÁLCULO DINÁMICO DE ESTADO — Basado en la fecha actual vs fecha_fin
 * No depende de campos estáticos de la DB; se recalcula en cada render
 */
const calcularEstado = (fechaFin) => {
  const dias = diasRestantes(fechaFin);
  if (dias === null) return "SIN DATO";
  if (dias < 0) return "VENCIDA";
  if (dias <= 10) return "PRÓXIMA A VENCER";
  return "VIGENTE";
};

/**
 * Estado consolidado de una empresa (peor de ambas pólizas)
 */
const estadoConsolidado = (emp) => {
  if (emp.bloqueado) return "BLOQUEADO";
  const e1 = calcularEstado(emp.p1_fin);
  const e2 = calcularEstado(emp.p2_fin);
  if ([e1, e2].includes("VENCIDA")) return "VENCIDA";
  if ([e1, e2].includes("PRÓXIMA A VENCER")) return "PRÓXIMA A VENCER";
  if ([e1, e2].includes("VIGENTE")) return "VIGENTE";
  return "SIN DATO";
};

const formatFecha = (str) => {
  const d = parseFecha(str);
  if (!d) return "—";
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const estadoConfig = (estado) => {
  switch (estado) {
    case "VIGENTE":
      return {
        bg: "rgba(16,185,129,0.08)",
        border: "rgba(16,185,129,0.2)",
        text: "#34d399",
        dot: "#10b981",
        icon: "✓",
      };
    case "PRÓXIMA A VENCER":
      return {
        bg: "rgba(245,158,11,0.08)",
        border: "rgba(245,158,11,0.2)",
        text: "#fbbf24",
        dot: "#f59e0b",
        icon: "⚠",
      };
    case "VENCIDA":
      return {
        bg: "rgba(239,68,68,0.08)",
        border: "rgba(239,68,68,0.2)",
        text: "#f87171",
        dot: "#ef4444",
        icon: "✕",
      };
    case "BLOQUEADO":
      return {
        bg: "rgba(139,92,246,0.08)",
        border: "rgba(139,92,246,0.2)",
        text: "#a78bfa",
        dot: "#8b5cf6",
        icon: "⊘",
      };
    default:
      return {
        bg: "rgba(148,163,184,0.08)",
        border: "rgba(148,163,184,0.2)",
        text: "#94a3b8",
        dot: "#64748b",
        icon: "?",
      };
  }
};

// ═══════════════════════════════════════════════════════════════
// CREDENCIALES ADMIN
// ═══════════════════════════════════════════════════════════════
const ADMIN_USER = "admin";
const ADMIN_PASS = "Apdr2026#";

// ═══════════════════════════════════════════════════════════════
// CSS GLOBAL
// ═══════════════════════════════════════════════════════════════
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body, #root { height:100%; width:100%; }
  body {
    font-family: 'DM Sans', -apple-system, sans-serif;
    background: #060611;
    color: #e2e8f0;
    -webkit-font-smoothing: antialiased;
  }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: #334155; }
  input:focus, select:focus, button:focus-visible { outline: none; }
  ::placeholder { color: #334155; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideRow {
    from { opacity: 0; transform: translateX(-12px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.15); }
    50% { box-shadow: 0 0 40px rgba(59,130,246,0.25); }
  }
`;

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("login");
  const [role, setRole] = useState(null);
  const [empresaData, setEmpresaData] = useState(null);
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [showPass, setShowPass] = useState(false);

  // ─── Auto-refresh del cálculo dinámico cada minuto ──────────
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // ─── Login ──────────────────────────────────────
  const handleLogin = async () => {
    setError("");
    if (!loginUser.trim() || !loginPass.trim()) {
      setError("Ingrese usuario y contraseña");
      return;
    }
    setLoading(true);
    try {
      if (loginUser === ADMIN_USER && loginPass === ADMIN_PASS) {
        setRole("admin");
        await loadAllData();
        setScreen("dashboard");
      } else {
        const { data, error: err } = await supabase
          .from("polizas")
          .selectWhere("*", "usr", loginUser);
        if (err) throw err;
        if (!data || data.length === 0) {
          setError("Usuario no encontrado");
          setLoading(false);
          return;
        }
        const emp = data[0];
        if (emp.pwd !== loginPass) {
          setError("Contraseña incorrecta");
          setLoading(false);
          return;
        }
        if (emp.bloqueado) {
          setError("Cuenta bloqueada — Contacte a APDR");
          setLoading(false);
          return;
        }
        setEmpresaData(emp);
        setRole("empresa");
        setScreen("empresa");
      }
    } catch (e) {
      setError("Error de conexión: " + e.message);
    }
    setLoading(false);
  };

  // ─── Cargar todos los datos (admin) ─────────────
  const loadAllData = async () => {
    setRefreshing(true);
    try {
      const { data, error: err } = await supabase.from("polizas").select("*");
      if (err) throw err;
      setAllData(data || []);
      setLastRefresh(new Date());
    } catch (e) {
      setError("Error cargando datos: " + e.message);
    }
    setRefreshing(false);
  };

  // ─── Logout ─────────────────────────────────────
  const handleLogout = () => {
    setScreen("login");
    setRole(null);
    setEmpresaData(null);
    setAllData([]);
    setLoginUser("");
    setLoginPass("");
    setError("");
    setSearch("");
    setFiltro("TODOS");
    setSelectedEmpresa(null);
    setShowPass(false);
  };

  // ─── Resumen dinámico para admin ────────────────
  const resumen = useMemo(() => {
    const r = {
      total: 0,
      vigentes: 0,
      proximas: 0,
      vencidas: 0,
      bloqueadas: 0,
      sinDato: 0,
    };
    allData.forEach((emp) => {
      r.total++;
      const estado = estadoConsolidado(emp);
      if (estado === "BLOQUEADO") r.bloqueadas++;
      else if (estado === "VIGENTE") r.vigentes++;
      else if (estado === "PRÓXIMA A VENCER") r.proximas++;
      else if (estado === "VENCIDA") r.vencidas++;
      else r.sinDato++;
    });
    return r;
    // eslint-disable-next-line
  }, [allData, tick]);

  // ─── Filtrado y ordenamiento admin ──────────────
  const filteredData = useMemo(() => {
    let list = [...allData];

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (e) =>
          (e.empresa || "").toLowerCase().includes(s) ||
          (e.p1_aseg || "").toLowerCase().includes(s) ||
          (e.p2_aseg || "").toLowerCase().includes(s) ||
          (e.p1_num || "").toLowerCase().includes(s) ||
          (e.p2_num || "").toLowerCase().includes(s) ||
          String(e.codigo || "").includes(s) ||
          (e.correo || "").toLowerCase().includes(s)
      );
    }

    if (filtro !== "TODOS") {
      list = list.filter((e) => {
        const estado = estadoConsolidado(e);
        return estado === filtro;
      });
    }

    // Ordenar: vencidas primero, luego próximas, vigentes, sin dato, bloqueadas
    const orden = {
      VENCIDA: 0,
      "PRÓXIMA A VENCER": 1,
      VIGENTE: 2,
      "SIN DATO": 3,
      BLOQUEADO: 4,
    };
    list.sort((a, b) => {
      const ea = estadoConsolidado(a);
      const eb = estadoConsolidado(b);
      return (orden[ea] ?? 5) - (orden[eb] ?? 5);
    });

    return list;
    // eslint-disable-next-line
  }, [allData, search, filtro, tick]);

  // ═══════════════════════════════════════════════════════════════
  // PANTALLA LOGIN
  // ═══════════════════════════════════════════════════════════════
  if (screen === "login") {
    return (
      <>
        <style>{globalCSS}</style>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#060611",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle grid */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.025,
              backgroundImage:
                "linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />

          {/* Accent glows */}
          <div
            style={{
              position: "absolute",
              top: "-15%",
              left: "-10%",
              width: "600px",
              height: "600px",
              background:
                "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 60%)",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-20%",
              right: "-5%",
              width: "500px",
              height: "500px",
              background:
                "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 60%)",
              borderRadius: "50%",
            }}
          />

          <div
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "24px",
              animation: "fadeUp 0.7s ease-out",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Logo area */}
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  margin: "0 auto 20px",
                  background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#fff",
                  letterSpacing: "-1px",
                  animation: "glow 3s ease-in-out infinite",
                }}
              >
                AP
              </div>
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#f1f5f9",
                  letterSpacing: "-0.5px",
                  marginBottom: "6px",
                }}
              >
                Acerías Paz del Río
              </h1>
              <p
                style={{
                  fontSize: "12px",
                  color: "#475569",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  fontWeight: "500",
                }}
              >
                Control de Pólizas
              </p>
            </div>

            {/* Login form */}
            <div
              style={{
                background: "rgba(15,23,42,0.6)",
                border: "1px solid rgba(148,163,184,0.06)",
                borderRadius: "20px",
                padding: "32px",
                backdropFilter: "blur(20px)",
              }}
            >
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    color: "#64748b",
                    marginBottom: "8px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                  }}
                >
                  Usuario
                </label>
                <input
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Ingrese su usuario"
                  style={{
                    width: "100%",
                    padding: "13px 16px",
                    background: "rgba(6,6,17,0.8)",
                    border: "1px solid rgba(148,163,184,0.08)",
                    borderRadius: "12px",
                    color: "#e2e8f0",
                    fontSize: "14px",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(59,130,246,0.4)";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(59,130,246,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(148,163,184,0.08)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    color: "#64748b",
                    marginBottom: "8px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                  }}
                >
                  Contraseña
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      padding: "13px 44px 13px 16px",
                      background: "rgba(6,6,17,0.8)",
                      border: "1px solid rgba(148,163,184,0.08)",
                      borderRadius: "12px",
                      color: "#e2e8f0",
                      fontSize: "14px",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "rgba(59,130,246,0.4)";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(59,130,246,0.08)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(148,163,184,0.08)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <button
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#475569",
                      cursor: "pointer",
                      fontSize: "13px",
                      padding: "4px",
                    }}
                  >
                    {showPass ? "◉" : "◎"}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.15)",
                    borderRadius: "10px",
                    color: "#f87171",
                    fontSize: "13px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>⚠</span> {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: loading
                    ? "#1e3a5f"
                    : "linear-gradient(135deg, #1d4ed8, #2563eb)",
                  border: "none",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: loading ? "wait" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 20px rgba(37,99,235,0.25)",
                }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                    Verificando...
                  </span>
                ) : (
                  "Ingresar"
                )}
              </button>
            </div>

            <p
              style={{
                textAlign: "center",
                marginTop: "28px",
                fontSize: "11px",
                color: "#334155",
                letterSpacing: "0.5px",
              }}
            >
              Gerencia de Logística · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VISTA EMPRESA
  // ═══════════════════════════════════════════════════════════════
  if (screen === "empresa" && empresaData) {
    const emp = empresaData;
    const e1 = calcularEstado(emp.p1_fin);
    const e2 = calcularEstado(emp.p2_fin);
    const d1 = diasRestantes(emp.p1_fin);
    const d2 = diasRestantes(emp.p2_fin);

    return (
      <>
        <style>{globalCSS}</style>
        <div
          style={{
            minHeight: "100vh",
            background: "#060611",
            padding: "20px",
          }}
        >
          <div
            style={{
              maxWidth: "820px",
              margin: "0 auto",
              animation: "fadeUp 0.5s ease-out",
            }}
          >
            {/* Header empresa */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "32px",
                padding: "24px 0",
                borderBottom: "1px solid rgba(148,163,184,0.06)",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#fff",
                    }}
                  >
                    AP
                  </div>
                  <h1
                    style={{
                      fontSize: "22px",
                      fontWeight: "700",
                      color: "#f1f5f9",
                    }}
                  >
                    {emp.empresa}
                  </h1>
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#475569",
                    paddingLeft: "48px",
                  }}
                >
                  Código: {emp.codigo} · {hoy().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: "10px 20px",
                  background: "rgba(148,163,184,0.04)",
                  border: "1px solid rgba(148,163,184,0.08)",
                  borderRadius: "10px",
                  color: "#64748b",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.15s",
                }}
              >
                Cerrar sesión
              </button>
            </div>

            {/* Póliza Cards */}
            {[
              {
                label: "Póliza I — Responsabilidad Civil",
                aseg: emp.p1_aseg,
                num: emp.p1_num,
                ini: emp.p1_ini,
                fin: emp.p1_fin,
                estado: e1,
                dias: d1,
              },
              {
                label: "Póliza II — RCE",
                aseg: emp.p2_aseg,
                num: emp.p2_num,
                ini: emp.p2_ini,
                fin: emp.p2_fin,
                estado: e2,
                dias: d2,
              },
            ].map((pol, i) => {
              const c = estadoConfig(pol.estado);
              const progress =
                pol.dias !== null && pol.dias >= 0
                  ? Math.min(100, Math.max(0, (pol.dias / 365) * 100))
                  : 0;

              return (
                <div
                  key={i}
                  style={{
                    background: "rgba(15,23,42,0.5)",
                    border: `1px solid ${c.border}`,
                    borderRadius: "18px",
                    padding: "28px",
                    marginBottom: "20px",
                    backdropFilter: "blur(10px)",
                    animation: `fadeUp 0.5s ease-out ${i * 0.12}s both`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "24px",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: "15px",
                        fontWeight: "600",
                        color: "#cbd5e1",
                      }}
                    >
                      {pol.label}
                    </h2>
                    <StatusBadge estado={pol.estado} size="md" />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "20px",
                      marginBottom: "20px",
                    }}
                  >
                    <InfoItem label="Aseguradora" value={pol.aseg || "—"} />
                    <InfoItem
                      label="N° Póliza"
                      value={pol.num || "—"}
                      mono
                    />
                    <InfoItem
                      label="Vigencia desde"
                      value={formatFecha(pol.ini)}
                    />
                    <InfoItem
                      label="Vigencia hasta"
                      value={formatFecha(pol.fin)}
                    />
                  </div>

                  {/* Dynamic expiry bar */}
                  {pol.dias !== null && (
                    <div
                      style={{
                        padding: "16px 20px",
                        borderRadius: "12px",
                        background: c.bg,
                        border: `1px solid ${c.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "10px",
                        }}
                      >
                        <span
                          style={{
                            color: "#94a3b8",
                            fontSize: "13px",
                          }}
                        >
                          {pol.dias < 0
                            ? "Venció hace"
                            : "Días restantes"}
                        </span>
                        <span
                          style={{
                            fontSize: "32px",
                            fontWeight: "700",
                            color: c.text,
                            fontFamily: "'JetBrains Mono', monospace",
                            lineHeight: 1,
                          }}
                        >
                          {Math.abs(pol.dias)}
                        </span>
                      </div>
                      {pol.dias >= 0 && (
                        <div
                          style={{
                            height: "4px",
                            background: "rgba(148,163,184,0.08)",
                            borderRadius: "2px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${progress}%`,
                              background: c.dot,
                              borderRadius: "2px",
                              transition: "width 0.5s ease",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {emp.correo && (
              <div
                style={{
                  background: "rgba(15,23,42,0.3)",
                  border: "1px solid rgba(148,163,184,0.04)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  fontSize: "13px",
                  color: "#475569",
                  animation: "fadeUp 0.5s ease-out 0.3s both",
                }}
              >
                <span style={{ color: "#64748b" }}>Contacto:</span>{" "}
                <span style={{ color: "#94a3b8" }}>{emp.correo}</span>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // DASHBOARD ADMIN
  // ═══════════════════════════════════════════════════════════════
  if (screen === "dashboard" && role === "admin") {
    return (
      <>
        <style>{globalCSS}</style>
        <div style={{ minHeight: "100vh", background: "#060611" }}>
          {/* Top Bar */}
          <div
            style={{
              padding: "14px 24px",
              borderBottom: "1px solid rgba(148,163,184,0.04)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(6,6,17,0.9)",
              backdropFilter: "blur(20px)",
              position: "sticky",
              top: 0,
              zIndex: 100,
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "9px",
                  background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#fff",
                }}
              >
                AP
              </div>
              <div>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#f1f5f9",
                  }}
                >
                  Panel de Control
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#475569",
                    display: "block",
                    marginTop: "1px",
                  }}
                >
                  APDR · Pólizas Transportadoras ·{" "}
                  {hoy().toLocaleDateString("es-CO")}
                </span>
              </div>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <button
                onClick={loadAllData}
                disabled={refreshing}
                style={{
                  padding: "7px 14px",
                  background: "rgba(59,130,246,0.06)",
                  border: "1px solid rgba(59,130,246,0.15)",
                  borderRadius: "8px",
                  color: "#60a5fa",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "14px",
                    animation: refreshing
                      ? "spin 0.8s linear infinite"
                      : "none",
                  }}
                >
                  ↻
                </span>
                {refreshing ? "Cargando..." : "Actualizar"}
              </button>
              {lastRefresh && (
                <span style={{ fontSize: "10px", color: "#334155" }}>
                  {lastRefresh.toLocaleTimeString("es-CO")}
                </span>
              )}
              <button
                onClick={handleLogout}
                style={{
                  padding: "7px 14px",
                  background: "rgba(148,163,184,0.04)",
                  border: "1px solid rgba(148,163,184,0.06)",
                  borderRadius: "8px",
                  color: "#64748b",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: "500",
                }}
              >
                Salir
              </button>
            </div>
          </div>

          <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
            {/* Resumen Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "12px",
                marginBottom: "24px",
                animation: "fadeUp 0.4s ease-out",
              }}
            >
              {[
                {
                  label: "Total",
                  value: resumen.total,
                  color: "#3b82f6",
                  filtroVal: "TODOS",
                },
                {
                  label: "Vigentes",
                  value: resumen.vigentes,
                  color: "#10b981",
                  filtroVal: "VIGENTE",
                },
                {
                  label: "Próximas",
                  value: resumen.proximas,
                  color: "#f59e0b",
                  filtroVal: "PRÓXIMA A VENCER",
                },
                {
                  label: "Vencidas",
                  value: resumen.vencidas,
                  color: "#ef4444",
                  filtroVal: "VENCIDA",
                },
                {
                  label: "Bloqueadas",
                  value: resumen.bloqueadas,
                  color: "#8b5cf6",
                  filtroVal: "BLOQUEADO",
                },
              ].map((card, i) => {
                const isActive = filtro === card.filtroVal;
                return (
                  <button
                    key={i}
                    onClick={() => setFiltro(card.filtroVal)}
                    style={{
                      background: isActive
                        ? `rgba(${card.color === "#3b82f6" ? "59,130,246" : card.color === "#10b981" ? "16,185,129" : card.color === "#f59e0b" ? "245,158,11" : card.color === "#ef4444" ? "239,68,68" : "139,92,246"},0.08)`
                        : "rgba(15,23,42,0.4)",
                      border: `1px solid ${isActive ? card.color + "33" : "rgba(148,163,184,0.04)"}`,
                      borderRadius: "14px",
                      padding: "18px 16px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textAlign: "left",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "30px",
                        fontWeight: "700",
                        color: card.color,
                        fontFamily: "'JetBrains Mono', monospace",
                        lineHeight: 1,
                        marginBottom: "6px",
                      }}
                    >
                      {card.value}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: isActive ? "#94a3b8" : "#475569",
                        fontWeight: "500",
                        letterSpacing: "0.3px",
                      }}
                    >
                      {card.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Search + Filter */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "16px",
                flexWrap: "wrap",
                animation: "fadeUp 0.4s ease-out 0.1s both",
              }}
            >
              <div
                style={{ flex: 1, minWidth: "260px", position: "relative" }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#334155",
                    fontSize: "14px",
                    pointerEvents: "none",
                  }}
                >
                  ⌕
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar empresa, aseguradora, póliza, correo..."
                  style={{
                    width: "100%",
                    padding: "11px 16px 11px 38px",
                    background: "rgba(15,23,42,0.5)",
                    border: "1px solid rgba(148,163,184,0.06)",
                    borderRadius: "10px",
                    color: "#e2e8f0",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "rgba(59,130,246,0.3)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(148,163,184,0.06)")
                  }
                />
              </div>
            </div>

            {/* Results info */}
            <div
              style={{
                fontSize: "12px",
                color: "#334155",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>
                {filteredData.length} de {allData.length} empresas
              </span>
              {filtro !== "TODOS" && (
                <button
                  onClick={() => setFiltro("TODOS")}
                  style={{
                    padding: "3px 10px",
                    background: "rgba(59,130,246,0.08)",
                    border: "1px solid rgba(59,130,246,0.15)",
                    borderRadius: "6px",
                    color: "#60a5fa",
                    fontSize: "11px",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {filtro} ✕
                </button>
              )}
              <span
                style={{
                  fontSize: "10px",
                  color: "#1e293b",
                  marginLeft: "auto",
                }}
              >
                Vencimiento calculado dinámicamente
              </span>
            </div>

            {/* Table */}
            <div
              style={{
                background: "rgba(15,23,42,0.3)",
                border: "1px solid rgba(148,163,184,0.03)",
                borderRadius: "16px",
                overflow: "hidden",
                animation: "fadeUp 0.5s ease-out 0.2s both",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13px",
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        { label: "#", w: "44px" },
                        { label: "Empresa", w: "auto" },
                        { label: "Póliza I", w: "auto" },
                        { label: "Vence I", w: "100px" },
                        { label: "Días", w: "56px" },
                        { label: "Estado I", w: "120px" },
                        { label: "Póliza II", w: "auto" },
                        { label: "Vence II", w: "100px" },
                        { label: "Días", w: "56px" },
                        { label: "Estado II", w: "120px" },
                      ].map((h, i) => (
                        <th
                          key={i}
                          style={{
                            padding: "12px 14px",
                            textAlign: i >= 4 && i <= 5 || i >= 8 ? "center" : "left",
                            color: "#334155",
                            fontWeight: "600",
                            fontSize: "10px",
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                            borderBottom: "1px solid rgba(148,163,184,0.04)",
                            whiteSpace: "nowrap",
                            width: h.w,
                            background: "rgba(6,6,17,0.3)",
                          }}
                        >
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((emp, idx) => {
                      const e1 = emp.bloqueado
                        ? "BLOQUEADO"
                        : calcularEstado(emp.p1_fin);
                      const e2 = emp.bloqueado
                        ? "BLOQUEADO"
                        : calcularEstado(emp.p2_fin);
                      const d1 = diasRestantes(emp.p1_fin);
                      const d2 = diasRestantes(emp.p2_fin);
                      const c1 = estadoConfig(e1);
                      const c2 = estadoConfig(e2);

                      return (
                        <tr
                          key={emp.id || idx}
                          style={{
                            borderBottom: "1px solid rgba(148,163,184,0.02)",
                            cursor: "pointer",
                            animation: `slideRow 0.3s ease-out ${Math.min(idx * 0.015, 0.4)}s both`,
                            transition: "background 0.15s",
                          }}
                          onClick={() => setSelectedEmpresa(emp)}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(59,130,246,0.02)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <td
                            style={{
                              padding: "11px 14px",
                              color: "#1e293b",
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "10px",
                            }}
                          >
                            {idx + 1}
                          </td>
                          <td style={{ padding: "11px 14px" }}>
                            <div
                              style={{
                                fontWeight: "600",
                                color: "#e2e8f0",
                                whiteSpace: "nowrap",
                                fontSize: "13px",
                              }}
                            >
                              {emp.empresa}
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#334155",
                                marginTop: "2px",
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              {emp.codigo}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#94a3b8",
                              }}
                            >
                              {emp.p1_aseg || "—"}
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#334155",
                                fontFamily: "'JetBrains Mono', monospace",
                                marginTop: "1px",
                              }}
                            >
                              {emp.p1_num || ""}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              color: "#94a3b8",
                              whiteSpace: "nowrap",
                              fontSize: "12px",
                            }}
                          >
                            {formatFecha(emp.p1_fin)}
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              textAlign: "center",
                            }}
                          >
                            {d1 !== null ? (
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontWeight: "600",
                                  color: c1.text,
                                  fontSize: "13px",
                                }}
                              >
                                {d1}
                              </span>
                            ) : (
                              <span style={{ color: "#1e293b" }}>—</span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              textAlign: "center",
                            }}
                          >
                            <StatusBadge estado={e1} />
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#94a3b8",
                              }}
                            >
                              {emp.p2_aseg || "—"}
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#334155",
                                fontFamily: "'JetBrains Mono', monospace",
                                marginTop: "1px",
                              }}
                            >
                              {emp.p2_num || ""}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              color: "#94a3b8",
                              whiteSpace: "nowrap",
                              fontSize: "12px",
                            }}
                          >
                            {formatFecha(emp.p2_fin)}
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              textAlign: "center",
                            }}
                          >
                            {d2 !== null ? (
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontWeight: "600",
                                  color: c2.text,
                                  fontSize: "13px",
                                }}
                              >
                                {d2}
                              </span>
                            ) : (
                              <span style={{ color: "#1e293b" }}>—</span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "11px 14px",
                              textAlign: "center",
                            }}
                          >
                            <StatusBadge estado={e2} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredData.length === 0 && (
                <div
                  style={{
                    padding: "60px 20px",
                    textAlign: "center",
                    color: "#334155",
                    fontSize: "13px",
                  }}
                >
                  No se encontraron empresas con los filtros actuales
                </div>
              )}
            </div>

            {error && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 16px",
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.12)",
                  borderRadius: "10px",
                  color: "#f87171",
                  fontSize: "13px",
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Modal detalle empresa */}
          {selectedEmpresa && (
            <EmpresaModal
              emp={selectedEmpresa}
              onClose={() => setSelectedEmpresa(null)}
            />
          )}
        </div>
      </>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// MODAL DETALLE EMPRESA (admin)
// ═══════════════════════════════════════════════════════════════
function EmpresaModal({ emp, onClose }) {
  const e1 = emp.bloqueado ? "BLOQUEADO" : calcularEstado(emp.p1_fin);
  const e2 = emp.bloqueado ? "BLOQUEADO" : calcularEstado(emp.p2_fin);
  const d1 = diasRestantes(emp.p1_fin);
  const d2 = diasRestantes(emp.p2_fin);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: "20px",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0c0c1d",
          border: "1px solid rgba(148,163,184,0.06)",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "640px",
          maxHeight: "85vh",
          overflow: "auto",
          padding: "32px",
          animation: "fadeUp 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "28px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#f1f5f9",
                marginBottom: "4px",
              }}
            >
              {emp.empresa}
            </h2>
            <p style={{ fontSize: "12px", color: "#475569" }}>
              Código: {emp.codigo}
              {emp.correo && ` · ${emp.correo}`}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(148,163,184,0.06)",
              border: "1px solid rgba(148,163,184,0.08)",
              color: "#64748b",
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Póliza details */}
        {[
          {
            label: "Póliza I — Responsabilidad Civil",
            aseg: emp.p1_aseg,
            num: emp.p1_num,
            ini: emp.p1_ini,
            fin: emp.p1_fin,
            estado: e1,
            dias: d1,
          },
          {
            label: "Póliza II — RCE",
            aseg: emp.p2_aseg,
            num: emp.p2_num,
            ini: emp.p2_ini,
            fin: emp.p2_fin,
            estado: e2,
            dias: d2,
          },
        ].map((pol, i) => {
          const c = estadoConfig(pol.estado);
          return (
            <div
              key={i}
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: "14px",
                padding: "20px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#cbd5e1",
                  }}
                >
                  {pol.label}
                </span>
                <StatusBadge estado={pol.estado} size="md" />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                }}
              >
                <InfoItem label="Aseguradora" value={pol.aseg || "—"} small />
                <InfoItem
                  label="N° Póliza"
                  value={pol.num || "—"}
                  mono
                  small
                />
                <InfoItem
                  label="Inicio"
                  value={formatFecha(pol.ini)}
                  small
                />
                <InfoItem
                  label="Vencimiento"
                  value={formatFecha(pol.fin)}
                  small
                />
              </div>
              {pol.dias !== null && (
                <div
                  style={{
                    marginTop: "14px",
                    padding: "10px 14px",
                    background: "rgba(6,6,17,0.3)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {pol.dias < 0 ? "Venció hace" : "Días restantes"}
                  </span>
                  <span
                    style={{
                      fontSize: "22px",
                      fontWeight: "700",
                      color: c.text,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {Math.abs(pol.dias)}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {emp.bloqueado && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(139,92,246,0.06)",
              border: "1px solid rgba(139,92,246,0.12)",
              borderRadius: "10px",
              color: "#a78bfa",
              fontSize: "12px",
              textAlign: "center",
            }}
          >
            ⊘ Esta empresa se encuentra BLOQUEADA
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ═══════════════════════════════════════════════════════════════
function StatusBadge({ estado, size = "sm" }) {
  const c = estadoConfig(estado);
  const isMd = size === "md";
  const displayText =
    estado === "PRÓXIMA A VENCER" ? "PRÓXIMA" : estado;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isMd ? "6px" : "4px",
        padding: isMd ? "5px 12px" : "3px 9px",
        borderRadius: "6px",
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        fontSize: isMd ? "11px" : "10px",
        fontWeight: "600",
        whiteSpace: "nowrap",
        letterSpacing: "0.3px",
      }}
    >
      <span
        style={{
          width: isMd ? "6px" : "5px",
          height: isMd ? "6px" : "5px",
          borderRadius: "50%",
          background: c.dot,
          flexShrink: 0,
          animation:
            estado === "PRÓXIMA A VENCER"
              ? "pulse 2s ease-in-out infinite"
              : "none",
        }}
      />
      {displayText}
    </span>
  );
}

function InfoItem({ label, value, mono, small }) {
  return (
    <div>
      <div
        style={{
          fontSize: small ? "10px" : "11px",
          color: "#475569",
          marginBottom: "3px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          fontWeight: "500",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: small ? "13px" : "14px",
          color: "#e2e8f0",
          fontWeight: "500",
          fontFamily: mono
            ? "'JetBrains Mono', monospace"
            : "'DM Sans', sans-serif",
        }}
      >
        {value}
      </div>
    </div>
  );
}
