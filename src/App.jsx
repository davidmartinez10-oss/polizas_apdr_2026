import { useState, useEffect, useMemo, useRef } from "react";

const SUPABASE_URL = "https://epzmprugpupxareufmsj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwem1wcnVncHVweGFyZXVmbXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NzExOTgsImV4cCI6MjA4ODE0NzE5OH0.RtbUahwWGcaWUBeQr9amJOZEeaF0zs08yycQKTMzRpg";

const LOGO_PDR = "data:image/png;base64,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";

// ═══════════════════════════════════════════════════════════════
// CLIENTE SUPABASE
// ═══════════════════════════════════════════════════════════════
const supabase = {
  from: (table) => ({
    select: async (cols = "*") => {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${cols}`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" } });
      if (!r.ok) throw new Error(`DB: ${r.status}`); return { data: await r.json() };
    },
    update: async (body, match) => {
      const p = new URLSearchParams(); Object.entries(match).forEach(([k, v]) => p.append(k, `eq.${v}`));
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${p}`, { method: "PATCH", headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(`DB: ${r.status}`); return { data: await r.json() };
    },
    selectWhere: async (cols = "*", field, value) => {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${cols}&${field}=eq.${encodeURIComponent(value)}`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" } });
      if (!r.ok) throw new Error(`DB: ${r.status}`); return { data: await r.json() };
    },
  }),
  storage: {
    upsert: async (bucket, path, file) => {
      const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, { method: "PUT", headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "x-upsert": "true" }, body: file });
      if (!r.ok) { const t = await r.text(); throw new Error(`Upload: ${r.status} - ${t}`); }
      return { data: await r.json() };
    },
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
  if ([a,b].includes("VIGENTE")) return "VIGENTE"; return "SIN DATO";
};
const formatFecha = (s) => { const d = parseFecha(s); if (!d) return "—"; return d.toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"}); };

// Colores corporativos: Naranja, Amarillo, Gris, Negro, Blanco, Rojo
const estadoConfig = (e) => ({
  "VIGENTE":         { bg:"rgba(34,197,94,0.08)", border:"rgba(34,197,94,0.2)", text:"#22c55e", dot:"#16a34a" },
  "PRÓXIMA A VENCER":{ bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.2)", text:"#f59e0b", dot:"#d97706" },
  "VENCIDA":         { bg:"rgba(220,38,38,0.08)", border:"rgba(220,38,38,0.2)", text:"#ef4444", dot:"#dc2626" },
  "BLOQUEADO":       { bg:"rgba(113,113,122,0.08)", border:"rgba(113,113,122,0.2)", text:"#a1a1aa", dot:"#71717a" },
}[e] || { bg:"rgba(161,161,170,0.06)", border:"rgba(161,161,170,0.15)", text:"#a1a1aa", dot:"#71717a" });

const ADMIN_USER = "admin", ADMIN_PASS = "Apdr2026#";

// Colores corporativos APDR
const C = {
  naranja: "#ea580c",     // naranja fuerte
  naranjaL: "#f97316",    // naranja claro
  amarillo: "#eab308",    // amarillo
  rojo: "#dc2626",        // rojo
  negro: "#0a0a0a",       // fondo
  grisO: "#18181b",       // gris oscuro
  grisM: "#27272a",       // gris medio
  grisB: "#3f3f46",       // gris borde
  grisT: "#71717a",       // gris texto
  grisL: "#a1a1aa",       // gris claro
  blanco: "#fafafa",      // blanco
  blancoM: "#e4e4e7",     // blanco mate
};

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}html{height:100%}
  body{font-family:'DM Sans',-apple-system,sans-serif;color:${C.blancoM};-webkit-font-smoothing:antialiased;min-height:100%;background:${C.negro}}
  #root{min-height:100%}
  ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.grisM};border-radius:10px}
  input:focus,select:focus,button:focus-visible{outline:none}::placeholder{color:${C.grisB}}input[type="date"]{color-scheme:dark}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideRow{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
  @keyframes spin{to{transform:rotate(360deg)}}
`;

function FixedBG() {
  return (
    <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",background:C.negro}}>
      <div style={{position:"absolute",inset:0,opacity:.02,backgroundImage:"radial-gradient(circle at 1px 1px, "+C.grisL+" 1px, transparent 0)",backgroundSize:"40px 40px"}}/>
      <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:`linear-gradient(90deg,transparent,${C.naranja}40,${C.amarillo}30,transparent)`}}/>
      <div style={{position:"absolute",top:"-15%",left:"-5%",width:500,height:500,background:`radial-gradient(circle,${C.naranja}06 0%,transparent 70%)`,borderRadius:"50%"}}/>
    </div>
  );
}

const iS = {width:"100%",padding:"10px 14px",background:`${C.grisO}cc`,border:`1px solid ${C.grisB}80`,borderRadius:8,color:C.blancoM,fontSize:13,fontFamily:"'DM Sans',sans-serif",transition:"border-color .2s"};
const fIn = (e) => { e.target.style.borderColor=C.naranjaL+"66"; e.target.style.boxShadow=`0 0 0 2px ${C.naranja}10`; };
const fOut = (e) => { e.target.style.borderColor=C.grisB+"80"; e.target.style.boxShadow="none"; };

// ═══════════════════════════════════════════════════════════════
// PDF UPLOADER
// ═══════════════════════════════════════════════════════════════
function PDFUp({code,num,label}){
  const [u,setU]=useState(false);const [st,setSt]=useState(null);const [msg,setMsg]=useState("");const ref=useRef(null);
  const go=async(e)=>{
    const f=e.target.files?.[0];if(!f)return;
    if(f.type!=="application/pdf"){setSt("e");setMsg("Solo PDF");return;}
    if(f.size>10485760){setSt("e");setMsg("Máx 10MB");return;}
    setU(true);setSt(null);
    try{const n=f.name.replace(/[^a-zA-Z0-9._-]/g,"_");await supabase.storage.upsert("polizas-pdf",`polizas/${code}/poliza_${num}_${n}`,f);setSt("ok");setMsg(`PDF ${label} subido`);}
    catch(err){setSt("e");setMsg(err.message);}
    setU(false);if(ref.current)ref.current.value="";
  };
  return(
    <div style={{marginTop:8}}>
      <button onClick={()=>ref.current?.click()} disabled={u}
        style={{padding:"7px 14px",background:`${C.naranja}0a`,border:`1px solid ${C.naranja}25`,borderRadius:7,color:C.naranjaL,fontSize:11,fontWeight:600,cursor:u?"wait":"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
        {u?(<><span style={{display:"inline-block",width:11,height:11,border:`2px solid ${C.naranja}30`,borderTopColor:C.naranjaL,borderRadius:"50%",animation:"spin .6s linear infinite"}}/>Subiendo...</>):(
          <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>PDF {label}</>
        )}
      </button>
      <input ref={ref} type="file" accept=".pdf" onChange={go} style={{display:"none"}}/>
      {st&&<div style={{marginTop:6,padding:"6px 10px",borderRadius:6,fontSize:11,fontWeight:500,background:st==="ok"?"rgba(34,197,94,.06)":"rgba(220,38,38,.06)",border:`1px solid ${st==="ok"?"rgba(34,197,94,.15)":"rgba(220,38,38,.15)"}`,color:st==="ok"?"#22c55e":"#ef4444",animation:"fadeIn .2s"}}>{st==="ok"?"✓":"⚠"} {msg}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EDITOR COMPLETO DE PÓLIZA
// ═══════════════════════════════════════════════════════════════
function PolizaEditor({emp,polizaNum,asegField,numField,iniField,finField,onSaved}){
  const [aseg,setAseg]=useState(emp[asegField]||"");
  const [num,setNum]=useState(emp[numField]||"");
  const [ini,setIni]=useState(emp[iniField]||"");
  const [fin,setFin]=useState(emp[finField]||"");
  const [saving,setSaving]=useState(false);
  const [saveMsg,setSaveMsg]=useState(null);
  const [open,setOpen]=useState(false);

  useEffect(()=>{setAseg(emp[asegField]||"");setNum(emp[numField]||"");setIni(emp[iniField]||"");setFin(emp[finField]||"");},[emp,asegField,numField,iniField,finField]);

  const changed=aseg!==(emp[asegField]||"")||num!==(emp[numField]||"")||ini!==(emp[iniField]||"")||fin!==(emp[finField]||"");
  const label=polizaNum==="1"?"Resp. Civil":"RCE";

  const save=async()=>{
    setSaving(true);setSaveMsg(null);
    try{
      const body={[asegField]:aseg||null,[numField]:num||null,[iniField]:ini||null,[finField]:fin||null};
      await supabase.from("polizas").update(body,{id:emp.id});
      setSaveMsg({ok:true,t:"Guardado"});
      if(onSaved)onSaved({...emp,...body});
    }catch(err){setSaveMsg({ok:false,t:err.message});}
    setSaving(false);setTimeout(()=>setSaveMsg(null),4000);
  };

  return(
    <div style={{marginTop:14}}>
      <button onClick={()=>setOpen(!open)} style={{width:"100%",padding:"10px 14px",background:`${C.grisM}50`,border:`1px solid ${C.grisB}40`,borderRadius:8,color:C.grisL,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all .15s"}}>
        <span style={{display:"flex",alignItems:"center",gap:8}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.naranjaL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Editar póliza
        </span>
        <span style={{transform:open?"rotate(180deg)":"rotate(0)",transition:"transform .2s",fontSize:10}}>▼</span>
      </button>
      {open&&(
        <div style={{marginTop:8,padding:16,background:`${C.grisO}dd`,borderRadius:10,border:`1px solid ${C.grisB}40`,animation:"fadeIn .2s"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div><label style={{display:"block",fontSize:10,color:C.grisT,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Aseguradora</label>
              <input value={aseg} onChange={e=>setAseg(e.target.value)} placeholder="Nombre" style={iS} onFocus={fIn} onBlur={fOut}/></div>
            <div><label style={{display:"block",fontSize:10,color:C.grisT,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>N° Póliza</label>
              <input value={num} onChange={e=>setNum(e.target.value)} placeholder="Número" style={{...iS,fontFamily:"'JetBrains Mono',monospace"}} onFocus={fIn} onBlur={fOut}/></div>
            <div><label style={{display:"block",fontSize:10,color:C.grisT,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Inicio vigencia</label>
              <input type="date" value={ini} onChange={e=>setIni(e.target.value)} style={iS} onFocus={fIn} onBlur={fOut}/></div>
            <div><label style={{display:"block",fontSize:10,color:C.grisT,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Fin vigencia</label>
              <input type="date" value={fin} onChange={e=>setFin(e.target.value)} style={iS} onFocus={fIn} onBlur={fOut}/></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            {changed&&<button onClick={save} disabled={saving} style={{padding:"8px 20px",background:saving?`${C.naranja}20`:C.naranja,border:"none",borderRadius:7,color:"#fff",fontSize:12,fontWeight:600,cursor:saving?"wait":"pointer",fontFamily:"'DM Sans',sans-serif",display:"inline-flex",alignItems:"center",gap:6}}>
              {saving?(<><span style={{display:"inline-block",width:11,height:11,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .6s linear infinite"}}/>Guardando...</>):"Guardar cambios"}
            </button>}
            {saveMsg&&<span style={{fontSize:11,fontWeight:500,color:saveMsg.ok?"#22c55e":"#ef4444",animation:"fadeIn .2s"}}>{saveMsg.ok?"✓":"⚠"} {saveMsg.t}</span>}
          </div>
          <PDFUp code={emp.codigo} num={polizaNum} label={label}/>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// APP PRINCIPAL
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
    setError("");if(!loginUser.trim()||!loginPass.trim()){setError("Ingrese usuario y contraseña");return;}
    setLoading(true);
    try{
      if(loginUser===ADMIN_USER&&loginPass===ADMIN_PASS){setRole("admin");await loadAllData();setScreen("dashboard");}
      else{const{data}=await supabase.from("polizas").selectWhere("*","usr",loginUser);
        if(!data?.length){setError("Usuario no encontrado");setLoading(false);return;}
        const emp=data[0];if(emp.pwd!==loginPass){setError("Contraseña incorrecta");setLoading(false);return;}
        if(emp.bloqueado){setError("Cuenta bloqueada");setLoading(false);return;}
        setEmpresaData(emp);setRole("empresa");setScreen("empresa");}
    }catch(e){setError("Error: "+e.message);}setLoading(false);
  };
  const loadAllData=async()=>{setRefreshing(true);try{const{data}=await supabase.from("polizas").select("*");setAllData(data||[]);setLastRefresh(new Date());}catch(e){setError(e.message);}setRefreshing(false);};
  const logout=()=>{setScreen("login");setRole(null);setEmpresaData(null);setAllData([]);setLoginUser("");setLoginPass("");setError("");setSearch("");setFiltro("TODOS");setSelectedEmpresa(null);setShowPass(false);};
  const handleSaved=(u)=>{setAllData(p=>p.map(e=>e.id===u.id?{...e,...u}:e));if(empresaData?.id===u.id)setEmpresaData(p=>({...p,...u}));if(selectedEmpresa?.id===u.id)setSelectedEmpresa(p=>({...p,...u}));};

  const resumen=useMemo(()=>{const r={total:0,vigentes:0,proximas:0,vencidas:0,bloqueadas:0};allData.forEach(e=>{r.total++;const s=estadoConsolidado(e);if(s==="BLOQUEADO")r.bloqueadas++;else if(s==="VIGENTE")r.vigentes++;else if(s==="PRÓXIMA A VENCER")r.proximas++;else if(s==="VENCIDA")r.vencidas++;});return r;},[allData,tick]);

  const filteredData=useMemo(()=>{
    let l=[...allData];
    if(search){const s=search.toLowerCase();l=l.filter(e=>(e.empresa||"").toLowerCase().includes(s)||(e.p1_aseg||"").toLowerCase().includes(s)||(e.p2_aseg||"").toLowerCase().includes(s)||(e.p1_num||"").toLowerCase().includes(s)||(e.p2_num||"").toLowerCase().includes(s)||String(e.codigo||"").includes(s)||(e.correo||"").toLowerCase().includes(s));}
    if(filtro!=="TODOS")l=l.filter(e=>estadoConsolidado(e)===filtro);
    const o={VENCIDA:0,"PRÓXIMA A VENCER":1,VIGENTE:2,"SIN DATO":3,BLOQUEADO:4};
    l.sort((a,b)=>(o[estadoConsolidado(a)]??5)-(o[estadoConsolidado(b)]??5));return l;
  },[allData,search,filtro,tick]);

  // ═══════════════ LOGIN ═══════════════
  if(screen==="login"){
    return(<><style>{globalCSS}</style><FixedBG/>
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",zIndex:1}}>
        <div style={{width:"100%",maxWidth:380,padding:24,animation:"fadeUp .7s ease-out"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:40}}>
            <img src={LOGO_PDR} alt="PazdelRío" style={{height:100,objectFit:"contain",marginBottom:20,display:"block"}}/>
            <div style={{width:60,height:2,background:`linear-gradient(90deg,${C.naranja},${C.amarillo})`,borderRadius:1,marginBottom:14}}/>
            <p style={{fontSize:11,color:C.grisT,letterSpacing:4,textTransform:"uppercase",fontWeight:600}}>Control de Pólizas</p>
          </div>
          <div style={{background:`${C.grisO}ee`,border:`1px solid ${C.grisB}40`,borderRadius:16,padding:28,backdropFilter:"blur(20px)"}}>
            <div style={{marginBottom:18}}>
              <label style={{display:"block",fontSize:10,color:C.grisT,marginBottom:6,fontWeight:600,textTransform:"uppercase",letterSpacing:1.5}}>Usuario</label>
              <input value={loginUser} onChange={e=>setLoginUser(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Ingrese su usuario" style={{...iS,padding:"12px 14px",borderRadius:10}} onFocus={fIn} onBlur={fOut}/>
            </div>
            <div style={{marginBottom:22}}>
              <label style={{display:"block",fontSize:10,color:C.grisT,marginBottom:6,fontWeight:600,textTransform:"uppercase",letterSpacing:1.5}}>Contraseña</label>
              <div style={{position:"relative"}}>
                <input type={showPass?"text":"password"} value={loginPass} onChange={e=>setLoginPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="••••••••" style={{...iS,padding:"12px 40px 12px 14px",borderRadius:10}} onFocus={fIn} onBlur={fOut}/>
                <button onClick={()=>setShowPass(!showPass)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.grisT,cursor:"pointer",fontSize:12,padding:4}}>{showPass?"◉":"◎"}</button>
              </div>
            </div>
            {error&&<div style={{padding:"10px 14px",background:`${C.rojo}0a`,border:`1px solid ${C.rojo}20`,borderRadius:8,color:"#ef4444",fontSize:12,marginBottom:14,display:"flex",alignItems:"center",gap:6}}><span>⚠</span>{error}</div>}
            <button onClick={handleLogin} disabled={loading} style={{width:"100%",padding:12,background:loading?`${C.naranja}30`:`linear-gradient(135deg,${C.naranja},${C.naranjaL})`,border:"none",borderRadius:10,color:"#fff",fontSize:13,fontWeight:600,cursor:loading?"wait":"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 20px ${C.naranja}30`}}>
              {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span style={{display:"inline-block",width:13,height:13,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .6s linear infinite"}}/>Verificando...</span>:"Ingresar"}
            </button>
          </div>
          <p style={{textAlign:"center",marginTop:24,fontSize:10,color:C.grisB}}>Gerencia de Logística · {new Date().getFullYear()}</p>
        </div>
      </div>
    </>);
  }

  // ═══════════════ VISTA EMPRESA ═══════════════
  if(screen==="empresa"&&empresaData){
    const emp=empresaData;const e1=calcularEstado(emp.p1_fin),e2=calcularEstado(emp.p2_fin);
    const d1=diasRestantes(emp.p1_fin),d2=diasRestantes(emp.p2_fin);
    return(<><style>{globalCSS}</style><FixedBG/>
      <div style={{minHeight:"100vh",padding:20,position:"relative",zIndex:1}}>
        <div style={{maxWidth:820,margin:"0 auto",animation:"fadeUp .5s ease-out"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,padding:"20px 0",borderBottom:`1px solid ${C.grisB}30`}}>
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              <img src={LOGO_PDR} alt="PazdelRío" style={{height:44,objectFit:"contain"}}/>
              <div style={{width:1,height:32,background:`${C.grisB}40`}}/>
              <div>
                <h1 style={{fontSize:20,fontWeight:600,color:C.blanco,letterSpacing:"-.3px"}}>{emp.empresa}</h1>
                <p style={{fontSize:12,color:C.grisT,marginTop:2}}>Cód. {emp.codigo} · {hoy().toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
              </div>
            </div>
            <button onClick={logout} style={{padding:"8px 18px",background:"transparent",border:`1px solid ${C.grisB}40`,borderRadius:8,color:C.grisT,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>Cerrar sesión</button>
          </div>
          {[{label:"Póliza I — Responsabilidad Civil",aseg:emp.p1_aseg,num:emp.p1_num,ini:emp.p1_ini,fin:emp.p1_fin,estado:e1,dias:d1,pn:"1",aF:"p1_aseg",nF:"p1_num",iF:"p1_ini",fF:"p1_fin"},
            {label:"Póliza II — RCE",aseg:emp.p2_aseg,num:emp.p2_num,ini:emp.p2_ini,fin:emp.p2_fin,estado:e2,dias:d2,pn:"2",aF:"p2_aseg",nF:"p2_num",iF:"p2_ini",fF:"p2_fin"},
          ].map((p,i)=>{const c=estadoConfig(p.estado);const prog=p.dias!==null&&p.dias>=0?Math.min(100,Math.max(0,(p.dias/365)*100)):0;
            return(<div key={i} style={{background:`${C.grisO}88`,border:`1px solid ${c.border}`,borderRadius:16,padding:24,marginBottom:16,backdropFilter:"blur(10px)",animation:`fadeUp .5s ease-out ${i*.1}s both`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <h2 style={{fontSize:14,fontWeight:600,color:C.blancoM}}>{p.label}</h2>
                <StatusBadge estado={p.estado} size="md"/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                <InfoItem label="Aseguradora" value={p.aseg||"—"}/><InfoItem label="N° Póliza" value={p.num||"—"} mono/>
                <InfoItem label="Vigencia desde" value={formatFecha(p.ini)}/><InfoItem label="Vigencia hasta" value={formatFecha(p.fin)}/></div>
              {p.dias!==null&&(<div style={{padding:"14px 18px",borderRadius:10,background:c.bg,border:`1px solid ${c.border}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{color:C.grisT,fontSize:12}}>{p.dias<0?"Venció hace":"Días restantes"}</span>
                  <span style={{fontSize:28,fontWeight:700,color:c.text,fontFamily:"'JetBrains Mono',monospace",lineHeight:1}}>{Math.abs(p.dias)}</span></div>
                {p.dias>=0&&<div style={{height:3,background:`${C.grisB}40`,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${prog}%`,background:c.dot,borderRadius:2,transition:"width .5s"}}/></div>}
              </div>)}
              <PolizaEditor emp={emp} polizaNum={p.pn} asegField={p.aF} numField={p.nF} iniField={p.iF} finField={p.fF} onSaved={handleSaved}/>
            </div>);})}
          {emp.correo&&<div style={{background:`${C.grisO}50`,border:`1px solid ${C.grisB}20`,borderRadius:10,padding:"14px 18px",fontSize:12,color:C.grisT,animation:"fadeUp .5s ease-out .25s both"}}><span style={{color:C.grisL}}>Contacto:</span> <span style={{color:C.blancoM}}>{emp.correo}</span></div>}
        </div>
      </div>
    </>);
  }

  // ═══════════════ DASHBOARD ADMIN ═══════════════
  if(screen==="dashboard"&&role==="admin"){
    return(<><style>{globalCSS}</style><FixedBG/>
      <div style={{minHeight:"100vh",position:"relative",zIndex:1}}>
        <div style={{padding:"12px 24px",borderBottom:`1px solid ${C.grisB}20`,display:"flex",justifyContent:"space-between",alignItems:"center",background:`${C.negro}ee`,backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <img src={LOGO_PDR} alt="PazdelRío" style={{height:34,objectFit:"contain"}}/>
            <div style={{width:1,height:24,background:`${C.grisB}40`}}/>
            <div><span style={{fontSize:13,fontWeight:600,color:C.blanco}}>Panel de Control</span><span style={{fontSize:10,color:C.grisT,display:"block",marginTop:1}}>Pólizas Transportadoras · {hoy().toLocaleDateString("es-CO")}</span></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={loadAllData} disabled={refreshing} style={{padding:"6px 12px",background:`${C.naranja}0a`,border:`1px solid ${C.naranja}25`,borderRadius:7,color:C.naranjaL,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500,display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:13,animation:refreshing?"spin .8s linear infinite":"none"}}>↻</span>{refreshing?"...":"Actualizar"}</button>
            {lastRefresh&&<span style={{fontSize:9,color:C.grisB}}>{lastRefresh.toLocaleTimeString("es-CO")}</span>}
            <button onClick={logout} style={{padding:"6px 12px",background:"transparent",border:`1px solid ${C.grisB}30`,borderRadius:7,color:C.grisT,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>Salir</button>
          </div>
        </div>
        <div style={{padding:24,maxWidth:1400,margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20,animation:"fadeUp .4s"}}>
            {[{l:"Total",v:resumen.total,c:C.naranjaL,f:"TODOS"},{l:"Vigentes",v:resumen.vigentes,c:"#22c55e",f:"VIGENTE"},{l:"Próximas",v:resumen.proximas,c:C.amarillo,f:"PRÓXIMA A VENCER"},{l:"Vencidas",v:resumen.vencidas,c:C.rojo,f:"VENCIDA"},{l:"Bloqueadas",v:resumen.bloqueadas,c:C.grisL,f:"BLOQUEADO"}].map((card,i)=>{
              const act=filtro===card.f;
              return(<button key={i} onClick={()=>setFiltro(card.f)} style={{background:act?`${C.grisO}ee`:`${C.grisO}66`,border:`1px solid ${act?card.c+"35":C.grisB+"20"}`,borderRadius:12,padding:"16px 14px",cursor:"pointer",transition:"all .2s",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
                <div style={{fontSize:26,fontWeight:700,color:card.c,fontFamily:"'JetBrains Mono',monospace",lineHeight:1,marginBottom:4}}>{card.v}</div>
                <div style={{fontSize:10,color:act?C.grisL:C.grisT,fontWeight:500,letterSpacing:.5}}>{card.l}</div>
              </button>);})}
          </div>
          <div style={{marginBottom:14,animation:"fadeUp .4s .1s both"}}>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:C.grisB,fontSize:14,pointerEvents:"none"}}>⌕</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar empresa, aseguradora, póliza, correo..." style={{...iS,padding:"10px 16px 10px 36px",borderRadius:10,width:"100%"}} onFocus={fIn} onBlur={fOut}/>
            </div>
          </div>
          <div style={{fontSize:11,color:C.grisB,marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
            <span>{filteredData.length} de {allData.length}</span>
            {filtro!=="TODOS"&&<button onClick={()=>setFiltro("TODOS")} style={{padding:"2px 8px",background:`${C.naranja}0a`,border:`1px solid ${C.naranja}20`,borderRadius:5,color:C.naranjaL,fontSize:10,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{filtro} ✕</button>}
          </div>
          <div style={{background:`${C.grisO}50`,border:`1px solid ${C.grisB}15`,borderRadius:14,overflow:"hidden",animation:"fadeUp .5s .2s both"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>{[{l:"#",w:40},{l:"Empresa"},{l:"Póliza I"},{l:"Vence I",w:95},{l:"Días",w:50},{l:"Estado",w:110},{l:"Póliza II"},{l:"Vence II",w:95},{l:"Días",w:50},{l:"Estado",w:110}].map((h,i)=>(
                  <th key={i} style={{padding:"10px 12px",textAlign:(i>=4&&i<=5)||i>=8?"center":"left",color:C.grisB,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:1,borderBottom:`1px solid ${C.grisB}15`,whiteSpace:"nowrap",width:h.w||"auto",background:`${C.negro}50`}}>{h.l}</th>
                ))}</tr></thead>
                <tbody>{filteredData.map((emp,idx)=>{
                  const e1=emp.bloqueado?"BLOQUEADO":calcularEstado(emp.p1_fin),e2=emp.bloqueado?"BLOQUEADO":calcularEstado(emp.p2_fin);
                  const d1=diasRestantes(emp.p1_fin),d2=diasRestantes(emp.p2_fin),c1=estadoConfig(e1),c2=estadoConfig(e2);
                  return(<tr key={emp.id||idx} style={{borderBottom:`1px solid ${C.grisB}0a`,cursor:"pointer",animation:`slideRow .3s ease-out ${Math.min(idx*.015,.4)}s both`,transition:"background .15s"}}
                    onClick={()=>setSelectedEmpresa(emp)} onMouseEnter={e=>e.currentTarget.style.background=`${C.naranja}04`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"10px 12px",color:C.grisB,fontFamily:"'JetBrains Mono',monospace",fontSize:9}}>{idx+1}</td>
                    <td style={{padding:"10px 12px"}}><div style={{fontWeight:600,color:C.blancoM,whiteSpace:"nowrap",fontSize:12}}>{emp.empresa}</div><div style={{fontSize:9,color:C.grisB,marginTop:1,fontFamily:"'JetBrains Mono',monospace"}}>{emp.codigo}</div></td>
                    <td style={{padding:"10px 12px",whiteSpace:"nowrap"}}><div style={{fontSize:11,color:C.grisL}}>{emp.p1_aseg||"—"}</div><div style={{fontSize:9,color:C.grisB,fontFamily:"'JetBrains Mono',monospace",marginTop:1}}>{emp.p1_num||""}</div></td>
                    <td style={{padding:"10px 12px",color:C.grisT,whiteSpace:"nowrap",fontSize:11}}>{formatFecha(emp.p1_fin)}</td>
                    <td style={{padding:"10px 12px",textAlign:"center"}}>{d1!==null?<span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:c1.text,fontSize:12}}>{d1}</span>:<span style={{color:C.grisM}}>—</span>}</td>
                    <td style={{padding:"10px 12px",textAlign:"center"}}><StatusBadge estado={e1}/></td>
                    <td style={{padding:"10px 12px",whiteSpace:"nowrap"}}><div style={{fontSize:11,color:C.grisL}}>{emp.p2_aseg||"—"}</div><div style={{fontSize:9,color:C.grisB,fontFamily:"'JetBrains Mono',monospace",marginTop:1}}>{emp.p2_num||""}</div></td>
                    <td style={{padding:"10px 12px",color:C.grisT,whiteSpace:"nowrap",fontSize:11}}>{formatFecha(emp.p2_fin)}</td>
                    <td style={{padding:"10px 12px",textAlign:"center"}}>{d2!==null?<span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:c2.text,fontSize:12}}>{d2}</span>:<span style={{color:C.grisM}}>—</span>}</td>
                    <td style={{padding:"10px 12px",textAlign:"center"}}><StatusBadge estado={e2}/></td>
                  </tr>);})}</tbody>
              </table>
            </div>
            {filteredData.length===0&&<div style={{padding:"50px 20px",textAlign:"center",color:C.grisB,fontSize:12}}>Sin resultados</div>}
          </div>
          {error&&<div style={{marginTop:14,padding:"10px 14px",background:`${C.rojo}08`,border:`1px solid ${C.rojo}15`,borderRadius:8,color:"#ef4444",fontSize:12}}>{error}</div>}
        </div>
        {selectedEmpresa&&<EmpresaModal emp={selectedEmpresa} onClose={()=>setSelectedEmpresa(null)} onSaved={handleSaved}/>}
      </div>
    </>);
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// MODAL EMPRESA
// ═══════════════════════════════════════════════════════════════
function EmpresaModal({emp,onClose,onSaved}){
  const e1=emp.bloqueado?"BLOQUEADO":calcularEstado(emp.p1_fin),e2=emp.bloqueado?"BLOQUEADO":calcularEstado(emp.p2_fin);
  const d1=diasRestantes(emp.p1_fin),d2=diasRestantes(emp.p2_fin);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20,animation:"fadeIn .2s"}} onClick={onClose}>
      <div style={{background:C.grisO,border:`1px solid ${C.grisB}30`,borderRadius:18,width:"100%",maxWidth:620,maxHeight:"85vh",overflow:"auto",padding:28,animation:"fadeUp .3s ease-out"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
          <div><h2 style={{fontSize:18,fontWeight:700,color:C.blanco,marginBottom:3}}>{emp.empresa}</h2><p style={{fontSize:11,color:C.grisT}}>Cód. {emp.codigo}{emp.correo&&` · ${emp.correo}`}</p></div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:7,background:`${C.grisM}80`,border:`1px solid ${C.grisB}30`,color:C.grisT,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {[{label:"Póliza I — Responsabilidad Civil",aseg:emp.p1_aseg,num:emp.p1_num,ini:emp.p1_ini,fin:emp.p1_fin,estado:e1,dias:d1,pn:"1",aF:"p1_aseg",nF:"p1_num",iF:"p1_ini",fF:"p1_fin"},
          {label:"Póliza II — RCE",aseg:emp.p2_aseg,num:emp.p2_num,ini:emp.p2_ini,fin:emp.p2_fin,estado:e2,dias:d2,pn:"2",aF:"p2_aseg",nF:"p2_num",iF:"p2_ini",fF:"p2_fin"},
        ].map((p,i)=>{const c=estadoConfig(p.estado);
          return(<div key={i} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:12,padding:18,marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <span style={{fontSize:12,fontWeight:600,color:C.blancoM}}>{p.label}</span><StatusBadge estado={p.estado} size="md"/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <InfoItem label="Aseguradora" value={p.aseg||"—"} small/><InfoItem label="N° Póliza" value={p.num||"—"} mono small/>
              <InfoItem label="Inicio" value={formatFecha(p.ini)} small/><InfoItem label="Vencimiento" value={formatFecha(p.fin)} small/></div>
            {p.dias!==null&&(<div style={{marginTop:12,padding:"8px 12px",background:`${C.negro}50`,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:11,color:C.grisT}}>{p.dias<0?"Venció hace":"Días restantes"}</span>
              <span style={{fontSize:20,fontWeight:700,color:c.text,fontFamily:"'JetBrains Mono',monospace"}}>{Math.abs(p.dias)}</span></div>)}
            <PolizaEditor emp={emp} polizaNum={p.pn} asegField={p.aF} numField={p.nF} iniField={p.iF} finField={p.fF} onSaved={onSaved}/>
          </div>);})}
        {emp.bloqueado&&<div style={{padding:"10px 14px",background:`${C.grisL}08`,border:`1px solid ${C.grisL}15`,borderRadius:8,color:C.grisL,fontSize:11,textAlign:"center"}}>⊘ Empresa BLOQUEADA</div>}
      </div>
    </div>
  );
}

function StatusBadge({estado,size="sm"}){
  const c=estadoConfig(estado);const md=size==="md";
  return(<span style={{display:"inline-flex",alignItems:"center",gap:md?5:3,padding:md?"4px 10px":"3px 8px",borderRadius:5,background:c.bg,border:`1px solid ${c.border}`,color:c.text,fontSize:md?10:9,fontWeight:600,whiteSpace:"nowrap",letterSpacing:.3}}>
    <span style={{width:md?5:4,height:md?5:4,borderRadius:"50%",background:c.dot,flexShrink:0,animation:estado==="PRÓXIMA A VENCER"?"pulse 2s ease-in-out infinite":"none"}}/>
    {estado==="PRÓXIMA A VENCER"?"PRÓXIMA":estado}
  </span>);
}

function InfoItem({label,value,mono,small}){
  return(<div>
    <div style={{fontSize:small?9:10,color:C.grisT,marginBottom:2,textTransform:"uppercase",letterSpacing:.5,fontWeight:500}}>{label}</div>
    <div style={{fontSize:small?12:13,color:C.blancoM,fontWeight:500,fontFamily:mono?"'JetBrains Mono',monospace":"'DM Sans',sans-serif"}}>{value}</div>
  </div>);
}
