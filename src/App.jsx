import { useState, useEffect, useMemo, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN SUPABASE
// ═══════════════════════════════════════════════════════════════
const SUPABASE_URL = "https://epzmprugpupxareufmsj.supabase.co";
const SUPABASE_ANON_KEY= "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwem1wcnVncHVweGFyZXVmbXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NzExOTgsImV4cCI6MjA4ODE0NzE5OH0.RtbUahwWGcaWUBeQr9amJOZEeaF0zs08yycQKTMzRpg";

// ═══════════════════════════════════════════════════════════════
// CLIENTE SUPABASE LIGERO
// ═══════════════════════════════════════════════════════════════
const supabase = {
  from: (table) => ({
    select: async (columns = "*") => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
      return { data: await res.json(), error: null };
    },
    update: async (body, match) => {
      const params = new URLSearchParams();
      Object.entries(match).forEach(([k, v]) => params.append(k, `eq.${v}`));
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
      return { data: await res.json(), error: null };
    },
    selectWhere: async (columns = "*", field, value) => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}&${field}=eq.${encodeURIComponent(value)}`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
      return { data: await res.json(), error: null };
    },
  }),
  storage: {
    upsert: async (bucket, path, file) => {
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
        method: "PUT",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "x-upsert": "true" },
        body: file,
      });
      if (!res.ok) { const t = await res.text(); throw new Error(`Upload: ${res.status} - ${t}`); }
      return { data: await res.json(), error: null };
    },
    getPublicUrl: (bucket, path) => `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`,
  },
};

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════
const hoy = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const parseFecha = (s) => { if (!s) return null; const d = new Date(s+"T00:00:00"); return isNaN(d)?null:d; };
const diasRestantes = (f) => { const fin = parseFecha(f); if (!fin) return null; return Math.ceil((fin-hoy())/(864e5)); };
const calcularEstado = (f) => { const d = diasRestantes(f); if (d===null) return "SIN DATO"; if (d<0) return "VENCIDA"; if (d<=10) return "PRÓXIMA A VENCER"; return "VIGENTE"; };
const estadoConsolidado = (e) => {
  if (e.bloqueado) return "BLOQUEADO";
  const a = calcularEstado(e.p1_fin), b = calcularEstado(e.p2_fin);
  if ([a,b].includes("VENCIDA")) return "VENCIDA";
  if ([a,b].includes("PRÓXIMA A VENCER")) return "PRÓXIMA A VENCER";
  if ([a,b].includes("VIGENTE")) return "VIGENTE";
  return "SIN DATO";
};
const formatFecha = (s) => { const d = parseFecha(s); if (!d) return "—"; return d.toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"}); };
const estadoConfig = (e) => {
  const m = { "VIGENTE":{bg:"rgba(16,185,129,0.08)",border:"rgba(16,185,129,0.2)",text:"#34d399",dot:"#10b981"}, "PRÓXIMA A VENCER":{bg:"rgba(245,158,11,0.08)",border:"rgba(245,158,11,0.2)",text:"#fbbf24",dot:"#f59e0b"}, "VENCIDA":{bg:"rgba(239,68,68,0.08)",border:"rgba(239,68,68,0.2)",text:"#f87171",dot:"#ef4444"}, "BLOQUEADO":{bg:"rgba(139,92,246,0.08)",border:"rgba(139,92,246,0.2)",text:"#a78bfa",dot:"#8b5cf6"} };
  return m[e] || {bg:"rgba(148,163,184,0.08)",border:"rgba(148,163,184,0.2)",text:"#94a3b8",dot:"#64748b"};
};

const ADMIN_USER = "admin", ADMIN_PASS = "Apdr2026#";

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}html{height:100%;width:100%}
  body{font-family:'DM Sans',-apple-system,sans-serif;color:#e2e8f0;-webkit-font-smoothing:antialiased;min-height:100%;background:#060611}
  #root{min-height:100%}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:10px}
  input:focus,select:focus,button:focus-visible{outline:none}::placeholder{color:#334155}input[type="date"]{color-scheme:dark}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideRow{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(59,130,246,.15)}50%{box-shadow:0 0 40px rgba(59,130,246,.25)}}
`;

function FixedBackground() {
  return (
    <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",background:"#060611"}}>
      <div style={{position:"absolute",inset:0,opacity:.025,backgroundImage:"linear-gradient(#94a3b8 1px,transparent 1px),linear-gradient(90deg,#94a3b8 1px,transparent 1px)",backgroundSize:"80px 80px"}}/>
      <div style={{position:"absolute",top:"-15%",left:"-10%",width:600,height:600,background:"radial-gradient(circle,rgba(59,130,246,.06) 0%,transparent 60%)",borderRadius:"50%"}}/>
      <div style={{position:"absolute",bottom:"-20%",right:"-5%",width:500,height:500,background:"radial-gradient(circle,rgba(99,102,241,.04) 0%,transparent 60%)",borderRadius:"50%"}}/>
      <div style={{position:"absolute",top:"40%",left:"50%",transform:"translate(-50%,-50%)",width:800,height:800,background:"radial-gradient(circle,rgba(30,58,138,.03) 0%,transparent 60%)",borderRadius:"50%"}}/>
    </div>
  );
}

const iS = {width:"100%",padding:"9px 12px",background:"rgba(6,6,17,0.8)",border:"1px solid rgba(148,163,184,0.12)",borderRadius:"8px",color:"#e2e8f0",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",transition:"border-color 0.2s"};

// ═══════════════════════════════════════════════════════════════
// PDF UPLOADER
// ═══════════════════════════════════════════════════════════════
function PDFUploader({empresaCodigo,polizaNum,label}){
  const [uploading,setU]=useState(false);
  const [status,setS]=useState(null);
  const [msg,setM]=useState("");
  const ref=useRef(null);
  const handle=async(e)=>{
    const f=e.target.files?.[0]; if(!f)return;
    if(f.type!=="application/pdf"){setS("error");setM("Solo PDF");return;}
    if(f.size>10*1024*1024){setS("error");setM("Máximo 10 MB");return;}
    setU(true);setS(null);setM("");
    try{
      const clean=f.name.replace(/[^a-zA-Z0-9._-]/g,"_");
      await supabase.storage.upsert("polizas-pdf",`polizas/${empresaCodigo}/poliza_${polizaNum}_${clean}`,f);
      setS("success");setM(`Póliza ${label} subida`);
    }catch(err){setS("error");setM(err.message);}
    setU(false);if(ref.current)ref.current.value="";
  };
  return(
    <div style={{marginTop:8}}>
      <button onClick={()=>ref.current?.click()} disabled={uploading}
        style={{padding:"7px 14px",background:uploading?"rgba(59,130,246,0.04)":"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:8,color:"#60a5fa",fontSize:11,fontWeight:600,cursor:uploading?"wait":"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
        {uploading?(<><span style={{display:"inline-block",width:11,height:11,border:"2px solid rgba(96,165,250,.3)",borderTopColor:"#60a5fa",borderRadius:"50%",animation:"spin .6s linear infinite"}}/>Subiendo...</>):(
          <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>PDF {label}</>
        )}
      </button>
      <input ref={ref} type="file" accept=".pdf" onChange={handle} style={{display:"none"}}/>
      {status&&<div style={{marginTop:6,padding:"6px 10px",borderRadius:6,fontSize:11,fontWeight:500,background:status==="success"?"rgba(16,185,129,.08)":"rgba(239,68,68,.08)",border:`1px solid ${status==="success"?"rgba(16,185,129,.2)":"rgba(239,68,68,.2)"}`,color:status==="success"?"#34d399":"#f87171",animation:"fadeIn .2s"}}>{status==="success"?"✓":"⚠"} {msg}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EDITOR DE FECHAS + PDF (por cada póliza)
// ═══════════════════════════════════════════════════════════════
function PolizaEditor({emp,polizaNum,iniField,finField,onSaved}){
  const [ini,setIni]=useState(emp[iniField]||"");
  const [fin,setFin]=useState(emp[finField]||"");
  const [saving,setSaving]=useState(false);
  const [saveMsg,setSaveMsg]=useState(null);

  useEffect(()=>{setIni(emp[iniField]||"");setFin(emp[finField]||"");},[emp,iniField,finField]);

  const changed=ini!==(emp[iniField]||"")||fin!==(emp[finField]||"");
  const label=polizaNum==="1"?"Resp. Civil":"RCE";

  const save=async()=>{
    setSaving(true);setSaveMsg(null);
    try{
      const body={};body[iniField]=ini||null;body[finField]=fin||null;
      await supabase.from("polizas").update(body,{id:emp.id});
      setSaveMsg({ok:true,t:"Fechas guardadas"});
      if(onSaved)onSaved({...emp,[iniField]:ini||null,[finField]:fin||null});
    }catch(err){setSaveMsg({ok:false,t:err.message});}
    setSaving(false);setTimeout(()=>setSaveMsg(null),3500);
  };

  return(
    <div style={{marginTop:16,padding:"14px 16px",background:"rgba(6,6,17,0.25)",borderRadius:10,border:"1px solid rgba(148,163,184,0.06)"}}>
      <div style={{fontSize:11,color:"#64748b",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Editar fechas & subir PDF</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div>
          <label style={{display:"block",fontSize:10,color:"#475569",marginBottom:4,fontWeight:500,textTransform:"uppercase",letterSpacing:.5}}>Inicio vigencia</label>
          <input type="date" value={ini} onChange={e=>setIni(e.target.value)} style={iS}
            onFocus={e=>e.target.style.borderColor="rgba(59,130,246,0.4)"}
            onBlur={e=>e.target.style.borderColor="rgba(148,163,184,0.12)"}/>
        </div>
        <div>
          <label style={{display:"block",fontSize:10,color:"#475569",marginBottom:4,fontWeight:500,textTransform:"uppercase",letterSpacing:.5}}>Fin vigencia</label>
          <input type="date" value={fin} onChange={e=>setFin(e.target.value)} style={iS}
            onFocus={e=>e.target.style.borderColor="rgba(59,130,246,0.4)"}
            onBlur={e=>e.target.style.borderColor="rgba(148,163,184,0.12)"}/>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        {changed&&<button onClick={save} disabled={saving} style={{padding:"8px 18px",background:saving?"#1e3a5f":"linear-gradient(135deg,#1d4ed8,#2563eb)",border:"none",borderRadius:8,color:"#fff",fontSize:12,fontWeight:600,cursor:saving?"wait":"pointer",fontFamily:"'DM Sans',sans-serif",display:"inline-flex",alignItems:"center",gap:6}}>
          {saving?(<><span style={{display:"inline-block",width:11,height:11,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .6s linear infinite"}}/>Guardando...</>):"Guardar fechas"}
        </button>}
        {saveMsg&&<span style={{fontSize:11,fontWeight:500,color:saveMsg.ok?"#34d399":"#f87171",animation:"fadeIn .2s"}}>{saveMsg.ok?"✓":"⚠"} {saveMsg.t}</span>}
      </div>
      <PDFUploader empresaCodigo={emp.codigo} polizaNum={polizaNum} label={label}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function App(){
  const [screen,setScreen]=useState("login");
  const [role,setRole]=useState(null);
  const [empresaData,setEmpresaData]=useState(null);
  const [allData,setAllData]=useState([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [loginUser,setLoginUser]=useState("");
  const [loginPass,setLoginPass]=useState("");
  const [search,setSearch]=useState("");
  const [filtro,setFiltro]=useState("TODOS");
  const [refreshing,setRefreshing]=useState(false);
  const [lastRefresh,setLastRefresh]=useState(null);
  const [selectedEmpresa,setSelectedEmpresa]=useState(null);
  const [showPass,setShowPass]=useState(false);
  const [tick,setTick]=useState(0);

  useEffect(()=>{const i=setInterval(()=>setTick(t=>t+1),60000);return()=>clearInterval(i);},[]);

  const handleLogin=async()=>{
    setError("");
    if(!loginUser.trim()||!loginPass.trim()){setError("Ingrese usuario y contraseña");return;}
    setLoading(true);
    try{
      if(loginUser===ADMIN_USER&&loginPass===ADMIN_PASS){setRole("admin");await loadAllData();setScreen("dashboard");}
      else{
        const{data,error:err}=await supabase.from("polizas").selectWhere("*","usr",loginUser);
        if(err)throw err;if(!data||!data.length){setError("Usuario no encontrado");setLoading(false);return;}
        const emp=data[0];
        if(emp.pwd!==loginPass){setError("Contraseña incorrecta");setLoading(false);return;}
        if(emp.bloqueado){setError("Cuenta bloqueada — Contacte a APDR");setLoading(false);return;}
        setEmpresaData(emp);setRole("empresa");setScreen("empresa");
      }
    }catch(e){setError("Error: "+e.message);}
    setLoading(false);
  };

  const loadAllData=async()=>{
    setRefreshing(true);
    try{const{data}=await supabase.from("polizas").select("*");setAllData(data||[]);setLastRefresh(new Date());}
    catch(e){setError("Error: "+e.message);}
    setRefreshing(false);
  };

  const handleLogout=()=>{setScreen("login");setRole(null);setEmpresaData(null);setAllData([]);setLoginUser("");setLoginPass("");setError("");setSearch("");setFiltro("TODOS");setSelectedEmpresa(null);setShowPass(false);};

  const handleSaved=(u)=>{
    setAllData(p=>p.map(e=>e.id===u.id?{...e,...u}:e));
    if(empresaData&&empresaData.id===u.id)setEmpresaData(p=>({...p,...u}));
    if(selectedEmpresa&&selectedEmpresa.id===u.id)setSelectedEmpresa(p=>({...p,...u}));
  };

  const resumen=useMemo(()=>{
    const r={total:0,vigentes:0,proximas:0,vencidas:0,bloqueadas:0,sinDato:0};
    allData.forEach(e=>{r.total++;const s=estadoConsolidado(e);if(s==="BLOQUEADO")r.bloqueadas++;else if(s==="VIGENTE")r.vigentes++;else if(s==="PRÓXIMA A VENCER")r.proximas++;else if(s==="VENCIDA")r.vencidas++;else r.sinDato++;});
    return r;
  },[allData,tick]);

  const filteredData=useMemo(()=>{
    let l=[...allData];
    if(search){const s=search.toLowerCase();l=l.filter(e=>(e.empresa||"").toLowerCase().includes(s)||(e.p1_aseg||"").toLowerCase().includes(s)||(e.p2_aseg||"").toLowerCase().includes(s)||(e.p1_num||"").toLowerCase().includes(s)||(e.p2_num||"").toLowerCase().includes(s)||String(e.codigo||"").includes(s)||(e.correo||"").toLowerCase().includes(s));}
    if(filtro!=="TODOS")l=l.filter(e=>estadoConsolidado(e)===filtro);
    const o={VENCIDA:0,"PRÓXIMA A VENCER":1,VIGENTE:2,"SIN DATO":3,BLOQUEADO:4};
    l.sort((a,b)=>(o[estadoConsolidado(a)]??5)-(o[estadoConsolidado(b)]??5));
    return l;
  },[allData,search,filtro,tick]);

  // ═══════════════════════ LOGIN ═══════════════════════
  if(screen==="login"){
    return(<><style>{globalCSS}</style><FixedBackground/>
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",zIndex:1}}>
        <div style={{width:"100%",maxWidth:400,padding:24,animation:"fadeUp .7s ease-out"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <div style={{width:64,height:64,margin:"0 auto 20px",background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,color:"#fff",letterSpacing:"-1px",animation:"glow 3s ease-in-out infinite"}}>AP</div>
            <h1 style={{fontSize:20,fontWeight:700,color:"#f1f5f9",marginBottom:6}}>Acerías Paz del Río</h1>
            <p style={{fontSize:12,color:"#475569",letterSpacing:3,textTransform:"uppercase",fontWeight:500}}>Control de Pólizas</p>
          </div>
          <div style={{background:"rgba(15,23,42,0.6)",border:"1px solid rgba(148,163,184,0.06)",borderRadius:20,padding:32,backdropFilter:"blur(20px)"}}>
            <div style={{marginBottom:20}}>
              <label style={{display:"block",fontSize:11,color:"#64748b",marginBottom:8,fontWeight:600,textTransform:"uppercase",letterSpacing:1.5}}>Usuario</label>
              <input value={loginUser} onChange={e=>setLoginUser(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Ingrese su usuario" style={{...iS,padding:"13px 16px",fontSize:14,borderRadius:12}} onFocus={e=>{e.target.style.borderColor="rgba(59,130,246,0.4)";e.target.style.boxShadow="0 0 0 3px rgba(59,130,246,0.08)";}} onBlur={e=>{e.target.style.borderColor="rgba(148,163,184,0.08)";e.target.style.boxShadow="none";}}/>
            </div>
            <div style={{marginBottom:24}}>
              <label style={{display:"block",fontSize:11,color:"#64748b",marginBottom:8,fontWeight:600,textTransform:"uppercase",letterSpacing:1.5}}>Contraseña</label>
              <div style={{position:"relative"}}>
                <input type={showPass?"text":"password"} value={loginPass} onChange={e=>setLoginPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="••••••••" style={{...iS,padding:"13px 44px 13px 16px",fontSize:14,borderRadius:12}} onFocus={e=>{e.target.style.borderColor="rgba(59,130,246,0.4)";e.target.style.boxShadow="0 0 0 3px rgba(59,130,246,0.08)";}} onBlur={e=>{e.target.style.borderColor="rgba(148,163,184,0.08)";e.target.style.boxShadow="none";}}/>
                <button onClick={()=>setShowPass(!showPass)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:13,padding:4}}>{showPass?"◉":"◎"}</button>
              </div>
            </div>
            {error&&<div style={{padding:"12px 16px",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:10,color:"#f87171",fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14}}>⚠</span> {error}</div>}
            <button onClick={handleLogin} disabled={loading} style={{width:"100%",padding:13,background:loading?"#1e3a5f":"linear-gradient(135deg,#1d4ed8,#2563eb)",border:"none",borderRadius:12,color:"#fff",fontSize:14,fontWeight:600,cursor:loading?"wait":"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 4px 20px rgba(37,99,235,0.25)"}}>
              {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span style={{display:"inline-block",width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .6s linear infinite"}}/>Verificando...</span>:"Ingresar"}
            </button>
          </div>
          <p style={{textAlign:"center",marginTop:28,fontSize:11,color:"#334155"}}>Gerencia de Logística · {new Date().getFullYear()}</p>
        </div>
      </div>
    </>);
  }

  // ═══════════════════════ VISTA EMPRESA ═══════════════════════
  if(screen==="empresa"&&empresaData){
    const emp=empresaData;
    const e1=calcularEstado(emp.p1_fin),e2=calcularEstado(emp.p2_fin);
    const d1=diasRestantes(emp.p1_fin),d2=diasRestantes(emp.p2_fin);
    return(<><style>{globalCSS}</style><FixedBackground/>
      <div style={{minHeight:"100vh",padding:20,position:"relative",zIndex:1}}>
        <div style={{maxWidth:820,margin:"0 auto",animation:"fadeUp .5s ease-out"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:32,padding:"24px 0",borderBottom:"1px solid rgba(148,163,184,0.06)"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>AP</div>
                <h1 style={{fontSize:22,fontWeight:700,color:"#f1f5f9"}}>{emp.empresa}</h1>
              </div>
              <p style={{fontSize:13,color:"#475569"}}>Código: {emp.codigo} · {hoy().toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
            </div>
            <button onClick={handleLogout} style={{padding:"10px 20px",background:"rgba(148,163,184,0.04)",border:"1px solid rgba(148,163,184,0.08)",borderRadius:10,color:"#64748b",fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cerrar sesión</button>
          </div>

          {[
            {label:"Póliza I — Responsabilidad Civil",aseg:emp.p1_aseg,num:emp.p1_num,ini:emp.p1_ini,fin:emp.p1_fin,estado:e1,dias:d1,pn:"1",iF:"p1_ini",fF:"p1_fin"},
            {label:"Póliza II — RCE",aseg:emp.p2_aseg,num:emp.p2_num,ini:emp.p2_ini,fin:emp.p2_fin,estado:e2,dias:d2,pn:"2",iF:"p2_ini",fF:"p2_fin"},
          ].map((p,i)=>{
            const c=estadoConfig(p.estado);
            const prog=p.dias!==null&&p.dias>=0?Math.min(100,Math.max(0,(p.dias/365)*100)):0;
            return(
              <div key={i} style={{background:"rgba(15,23,42,0.5)",border:`1px solid ${c.border}`,borderRadius:18,padding:28,marginBottom:20,backdropFilter:"blur(10px)",animation:`fadeUp .5s ease-out ${i*.12}s both`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
                  <h2 style={{fontSize:15,fontWeight:600,color:"#cbd5e1"}}>{p.label}</h2>
                  <StatusBadge estado={p.estado} size="md"/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
                  <InfoItem label="Aseguradora" value={p.aseg||"—"}/>
                  <InfoItem label="N° Póliza" value={p.num||"—"} mono/>
                  <InfoItem label="Vigencia desde" value={formatFecha(p.ini)}/>
                  <InfoItem label="Vigencia hasta" value={formatFecha(p.fin)}/>
                </div>
                {p.dias!==null&&(
                  <div style={{padding:"16px 20px",borderRadius:12,background:c.bg,border:`1px solid ${c.border}`}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                      <span style={{color:"#94a3b8",fontSize:13}}>{p.dias<0?"Venció hace":"Días restantes"}</span>
                      <span style={{fontSize:32,fontWeight:700,color:c.text,fontFamily:"'JetBrains Mono',monospace",lineHeight:1}}>{Math.abs(p.dias)}</span>
                    </div>
                    {p.dias>=0&&<div style={{height:4,background:"rgba(148,163,184,0.08)",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${prog}%`,background:c.dot,borderRadius:2,transition:"width .5s ease"}}/></div>}
                  </div>
                )}
                <PolizaEditor emp={emp} polizaNum={p.pn} iniField={p.iF} finField={p.fF} onSaved={handleSaved}/>
              </div>
            );
          })}

          {emp.correo&&<div style={{background:"rgba(15,23,42,0.3)",border:"1px solid rgba(148,163,184,0.04)",borderRadius:12,padding:"16px 20px",fontSize:13,color:"#475569",animation:"fadeUp .5s ease-out .3s both"}}><span style={{color:"#64748b"}}>Contacto:</span> <span style={{color:"#94a3b8"}}>{emp.correo}</span></div>}
        </div>
      </div>
    </>);
  }

  // ═══════════════════════ DASHBOARD ADMIN ═══════════════════════
  if(screen==="dashboard"&&role==="admin"){
    return(<><style>{globalCSS}</style><FixedBackground/>
      <div style={{minHeight:"100vh",position:"relative",zIndex:1}}>
        <div style={{padding:"14px 24px",borderBottom:"1px solid rgba(148,163,184,0.04)",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(6,6,17,0.85)",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff"}}>AP</div>
            <div><span style={{fontSize:14,fontWeight:600,color:"#f1f5f9"}}>Panel de Control</span><span style={{fontSize:11,color:"#475569",display:"block",marginTop:1}}>APDR · Pólizas Transportadoras · {hoy().toLocaleDateString("es-CO")}</span></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={loadAllData} disabled={refreshing} style={{padding:"7px 14px",background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.15)",borderRadius:8,color:"#60a5fa",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500,display:"flex",alignItems:"center",gap:6}}>
              <span style={{display:"inline-block",fontSize:14,animation:refreshing?"spin .8s linear infinite":"none"}}>↻</span>{refreshing?"Cargando...":"Actualizar"}
            </button>
            {lastRefresh&&<span style={{fontSize:10,color:"#334155"}}>{lastRefresh.toLocaleTimeString("es-CO")}</span>}
            <button onClick={handleLogout} style={{padding:"7px 14px",background:"rgba(148,163,184,0.04)",border:"1px solid rgba(148,163,184,0.06)",borderRadius:8,color:"#64748b",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>Salir</button>
          </div>
        </div>

        <div style={{padding:24,maxWidth:1400,margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:24,animation:"fadeUp .4s ease-out"}}>
            {[{l:"Total",v:resumen.total,c:"#3b82f6",f:"TODOS"},{l:"Vigentes",v:resumen.vigentes,c:"#10b981",f:"VIGENTE"},{l:"Próximas",v:resumen.proximas,c:"#f59e0b",f:"PRÓXIMA A VENCER"},{l:"Vencidas",v:resumen.vencidas,c:"#ef4444",f:"VENCIDA"},{l:"Bloqueadas",v:resumen.bloqueadas,c:"#8b5cf6",f:"BLOQUEADO"}].map((card,i)=>{
              const act=filtro===card.f;const rgb={"#3b82f6":"59,130,246","#10b981":"16,185,129","#f59e0b":"245,158,11","#ef4444":"239,68,68","#8b5cf6":"139,92,246"};
              return(<button key={i} onClick={()=>setFiltro(card.f)} style={{background:act?`rgba(${rgb[card.c]},.08)`:"rgba(15,23,42,.4)",border:`1px solid ${act?card.c+"33":"rgba(148,163,184,.04)"}`,borderRadius:14,padding:"18px 16px",cursor:"pointer",transition:"all .2s",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
                <div style={{fontSize:30,fontWeight:700,color:card.c,fontFamily:"'JetBrains Mono',monospace",lineHeight:1,marginBottom:6}}>{card.v}</div>
                <div style={{fontSize:11,color:act?"#94a3b8":"#475569",fontWeight:500,letterSpacing:.3}}>{card.l}</div>
              </button>);
            })}
          </div>

          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap",animation:"fadeUp .4s ease-out .1s both"}}>
            <div style={{flex:1,minWidth:260,position:"relative"}}>
              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#334155",fontSize:14,pointerEvents:"none"}}>⌕</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar empresa, aseguradora, póliza, correo..." style={{...iS,padding:"11px 16px 11px 38px",borderRadius:10}} onFocus={e=>e.target.style.borderColor="rgba(59,130,246,.3)"} onBlur={e=>e.target.style.borderColor="rgba(148,163,184,.06)"}/>
            </div>
          </div>

          <div style={{fontSize:12,color:"#334155",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
            <span>{filteredData.length} de {allData.length} empresas</span>
            {filtro!=="TODOS"&&<button onClick={()=>setFiltro("TODOS")} style={{padding:"3px 10px",background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.15)",borderRadius:6,color:"#60a5fa",fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{filtro} ✕</button>}
            <span style={{fontSize:10,color:"#1e293b",marginLeft:"auto"}}>Vencimiento calculado dinámicamente</span>
          </div>

          <div style={{background:"rgba(15,23,42,.3)",border:"1px solid rgba(148,163,184,.03)",borderRadius:16,overflow:"hidden",animation:"fadeUp .5s ease-out .2s both"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr>
                  {[{l:"#",w:44},{l:"Empresa"},{l:"Póliza I"},{l:"Vence I",w:100},{l:"Días",w:56},{l:"Estado I",w:120},{l:"Póliza II"},{l:"Vence II",w:100},{l:"Días",w:56},{l:"Estado II",w:120}].map((h,i)=>(
                    <th key={i} style={{padding:"12px 14px",textAlign:(i>=4&&i<=5)||i>=8?"center":"left",color:"#334155",fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:.8,borderBottom:"1px solid rgba(148,163,184,.04)",whiteSpace:"nowrap",width:h.w||"auto",background:"rgba(6,6,17,.3)"}}>{h.l}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filteredData.map((emp,idx)=>{
                    const e1=emp.bloqueado?"BLOQUEADO":calcularEstado(emp.p1_fin);
                    const e2=emp.bloqueado?"BLOQUEADO":calcularEstado(emp.p2_fin);
                    const d1=diasRestantes(emp.p1_fin),d2=diasRestantes(emp.p2_fin);
                    const c1=estadoConfig(e1),c2=estadoConfig(e2);
                    return(
                      <tr key={emp.id||idx} style={{borderBottom:"1px solid rgba(148,163,184,.02)",cursor:"pointer",animation:`slideRow .3s ease-out ${Math.min(idx*.015,.4)}s both`,transition:"background .15s"}}
                        onClick={()=>setSelectedEmpresa(emp)} onMouseEnter={e=>e.currentTarget.style.background="rgba(59,130,246,.02)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{padding:"11px 14px",color:"#1e293b",fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>{idx+1}</td>
                        <td style={{padding:"11px 14px"}}><div style={{fontWeight:600,color:"#e2e8f0",whiteSpace:"nowrap",fontSize:13}}>{emp.empresa}</div><div style={{fontSize:10,color:"#334155",marginTop:2,fontFamily:"'JetBrains Mono',monospace"}}>{emp.codigo}</div></td>
                        <td style={{padding:"11px 14px",whiteSpace:"nowrap"}}><div style={{fontSize:12,color:"#94a3b8"}}>{emp.p1_aseg||"—"}</div><div style={{fontSize:10,color:"#334155",fontFamily:"'JetBrains Mono',monospace",marginTop:1}}>{emp.p1_num||""}</div></td>
                        <td style={{padding:"11px 14px",color:"#94a3b8",whiteSpace:"nowrap",fontSize:12}}>{formatFecha(emp.p1_fin)}</td>
                        <td style={{padding:"11px 14px",textAlign:"center"}}>{d1!==null?<span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:c1.text,fontSize:13}}>{d1}</span>:<span style={{color:"#1e293b"}}>—</span>}</td>
                        <td style={{padding:"11px 14px",textAlign:"center"}}><StatusBadge estado={e1}/></td>
                        <td style={{padding:"11px 14px",whiteSpace:"nowrap"}}><div style={{fontSize:12,color:"#94a3b8"}}>{emp.p2_aseg||"—"}</div><div style={{fontSize:10,color:"#334155",fontFamily:"'JetBrains Mono',monospace",marginTop:1}}>{emp.p2_num||""}</div></td>
                        <td style={{padding:"11px 14px",color:"#94a3b8",whiteSpace:"nowrap",fontSize:12}}>{formatFecha(emp.p2_fin)}</td>
                        <td style={{padding:"11px 14px",textAlign:"center"}}>{d2!==null?<span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:c2.text,fontSize:13}}>{d2}</span>:<span style={{color:"#1e293b"}}>—</span>}</td>
                        <td style={{padding:"11px 14px",textAlign:"center"}}><StatusBadge estado={e2}/></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredData.length===0&&<div style={{padding:"60px 20px",textAlign:"center",color:"#334155",fontSize:13}}>No se encontraron empresas con los filtros actuales</div>}
          </div>
          {error&&<div style={{marginTop:16,padding:"12px 16px",background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.12)",borderRadius:10,color:"#f87171",fontSize:13}}>{error}</div>}
        </div>
        {selectedEmpresa&&<EmpresaModal emp={selectedEmpresa} onClose={()=>setSelectedEmpresa(null)} onSaved={handleSaved}/>}
      </div>
    </>);
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// MODAL EMPRESA (con edición de fechas + upload)
// ═══════════════════════════════════════════════════════════════
function EmpresaModal({emp,onClose,onSaved}){
  const e1=emp.bloqueado?"BLOQUEADO":calcularEstado(emp.p1_fin);
  const e2=emp.bloqueado?"BLOQUEADO":calcularEstado(emp.p2_fin);
  const d1=diasRestantes(emp.p1_fin),d2=diasRestantes(emp.p2_fin);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20,animation:"fadeIn .2s"}} onClick={onClose}>
      <div style={{background:"#0c0c1d",border:"1px solid rgba(148,163,184,.06)",borderRadius:20,width:"100%",maxWidth:640,maxHeight:"85vh",overflow:"auto",padding:32,animation:"fadeUp .3s ease-out"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
          <div><h2 style={{fontSize:20,fontWeight:700,color:"#f1f5f9",marginBottom:4}}>{emp.empresa}</h2><p style={{fontSize:12,color:"#475569"}}>Código: {emp.codigo}{emp.correo&&` · ${emp.correo}`}</p></div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:8,background:"rgba(148,163,184,.06)",border:"1px solid rgba(148,163,184,.08)",color:"#64748b",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {[
          {label:"Póliza I — Responsabilidad Civil",aseg:emp.p1_aseg,num:emp.p1_num,ini:emp.p1_ini,fin:emp.p1_fin,estado:e1,dias:d1,pn:"1",iF:"p1_ini",fF:"p1_fin"},
          {label:"Póliza II — RCE",aseg:emp.p2_aseg,num:emp.p2_num,ini:emp.p2_ini,fin:emp.p2_fin,estado:e2,dias:d2,pn:"2",iF:"p2_ini",fF:"p2_fin"},
        ].map((p,i)=>{
          const c=estadoConfig(p.estado);
          return(
            <div key={i} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:14,padding:20,marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <span style={{fontSize:13,fontWeight:600,color:"#cbd5e1"}}>{p.label}</span>
                <StatusBadge estado={p.estado} size="md"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <InfoItem label="Aseguradora" value={p.aseg||"—"} small/>
                <InfoItem label="N° Póliza" value={p.num||"—"} mono small/>
                <InfoItem label="Inicio" value={formatFecha(p.ini)} small/>
                <InfoItem label="Vencimiento" value={formatFecha(p.fin)} small/>
              </div>
              {p.dias!==null&&(
                <div style={{marginTop:14,padding:"10px 14px",background:"rgba(6,6,17,.3)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:12,color:"#64748b"}}>{p.dias<0?"Venció hace":"Días restantes"}</span>
                  <span style={{fontSize:22,fontWeight:700,color:c.text,fontFamily:"'JetBrains Mono',monospace"}}>{Math.abs(p.dias)}</span>
                </div>
              )}
              <PolizaEditor emp={emp} polizaNum={p.pn} iniField={p.iF} finField={p.fF} onSaved={onSaved}/>
            </div>
          );
        })}
        {emp.bloqueado&&<div style={{padding:"12px 16px",background:"rgba(139,92,246,.06)",border:"1px solid rgba(139,92,246,.12)",borderRadius:10,color:"#a78bfa",fontSize:12,textAlign:"center"}}>⊘ Esta empresa se encuentra BLOQUEADA</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ═══════════════════════════════════════════════════════════════
function StatusBadge({estado,size="sm"}){
  const c=estadoConfig(estado);const md=size==="md";
  return(<span style={{display:"inline-flex",alignItems:"center",gap:md?6:4,padding:md?"5px 12px":"3px 9px",borderRadius:6,background:c.bg,border:`1px solid ${c.border}`,color:c.text,fontSize:md?11:10,fontWeight:600,whiteSpace:"nowrap",letterSpacing:.3}}>
    <span style={{width:md?6:5,height:md?6:5,borderRadius:"50%",background:c.dot,flexShrink:0,animation:estado==="PRÓXIMA A VENCER"?"pulse 2s ease-in-out infinite":"none"}}/>
    {estado==="PRÓXIMA A VENCER"?"PRÓXIMA":estado}
  </span>);
}

function InfoItem({label,value,mono,small}){
  return(<div>
    <div style={{fontSize:small?10:11,color:"#475569",marginBottom:3,textTransform:"uppercase",letterSpacing:.5,fontWeight:500}}>{label}</div>
    <div style={{fontSize:small?13:14,color:"#e2e8f0",fontWeight:500,fontFamily:mono?"'JetBrains Mono',monospace":"'DM Sans',sans-serif"}}>{value}</div>
  </div>);
}
