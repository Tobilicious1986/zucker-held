"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";

interface Zutat { name:string;emoji:string;menge:string;gramm:number;kh:number;kh_pro_100g:number;kcal:number;gi:number;gi_kategorie:"niedrig"|"mittel"|"hoch"; }
interface Question { id:string;text:string;optionen:string[]; }
interface AnalysisResult { status:"komplett";mahlzeit:string;emoji:string;zutaten:Zutat[];gesamt_kh:number;gesamt_kcal:number;gesamt_gi_gewichtet:number;insulin_hinweis:string;gi_erklaerung:string;hinweis?:string; }
type ParsedResponse = AnalysisResult | { status:"fragen";fragen:Question[];kontext:string };
interface MsgDto { role:string;content:string; }
interface SettingsLite { aiChatAvailable:boolean;aiAvailabilityReason:string; }
interface MealAnalysisApiResponse { rawJson:string;provider:string;available:boolean;errorMessage:string|null; }

const GI_COLOR = {
  niedrig:{dot:"#34d399",text:"#6ee7b7",bg:"rgba(16,185,129,0.12)",ring:"rgba(16,185,129,0.25)",label:"Niedrig"},
  mittel: {dot:"#fbbf24",text:"#fcd34d",bg:"rgba(251,191,36,0.12)", ring:"rgba(251,191,36,0.25)", label:"Mittel"},
  hoch:   {dot:"#f87171",text:"#fca5a5",bg:"rgba(239,68,68,0.12)",  ring:"rgba(239,68,68,0.25)",  label:"Hoch"},
};

function GiBadge({kategorie}:{kategorie:string}) {
  const c=GI_COLOR[kategorie as keyof typeof GI_COLOR]??GI_COLOR.mittel;
  return <span style={{background:c.bg,color:c.text,border:`1px solid ${c.ring}`,borderRadius:999,padding:"2px 8px 2px 6px",fontSize:10,fontWeight:700,letterSpacing:0.4,display:"inline-flex",alignItems:"center",gap:4,textTransform:"uppercase" as const}}><span style={{width:5,height:5,borderRadius:999,background:c.dot,boxShadow:`0 0 8px ${c.dot}`}}/>{c.label}</span>;
}

function AnimatedNumber({value,decimals=0,duration=500}:{value:number;decimals?:number;duration?:number}) {
  const [display,setDisplay]=useState(value);
  const prev=useRef(value);
  useEffect(()=>{
    const start=prev.current,end=value,t0=performance.now();
    let raf:number;
    const tick=(now:number)=>{const t=Math.min((now-t0)/duration,1);const e=1-Math.pow(1-t,3);setDisplay(start+(end-start)*e);if(t<1)raf=requestAnimationFrame(tick);else prev.current=end;};
    raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
  },[value,duration]);
  return <>{display.toFixed(decimals)}</>;
}

function Stepper({value,onChange,min=1,step=10}:{value:number;onChange:(v:number)=>void;min?:number;step?:number}) {
  return <div style={{display:"inline-flex",alignItems:"center",background:"rgba(0,0,0,0.35)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:11,overflow:"hidden",height:34}}>
    <button onClick={()=>onChange(Math.max(min,value-step))} style={{background:"transparent",border:"none",color:"#a1a1aa",width:30,height:34,cursor:"pointer",fontSize:18}}>−</button>
    <input type="number" min={min} value={value} onChange={e=>onChange(Math.max(min,Number(e.target.value)||min))} style={{width:44,background:"transparent",border:"none",color:"#fff",fontSize:13,fontWeight:700,textAlign:"center",outline:"none"}}/>
    <span style={{color:"#52525b",fontSize:10,paddingRight:6,fontWeight:600}}>g</span>
    <button onClick={()=>onChange(value+step)} style={{background:"transparent",border:"none",color:"#a1a1aa",width:30,height:34,cursor:"pointer",fontSize:18}}>+</button>
  </div>;
}

function CarbLoader() {
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"52px 0 40px",gap:26}}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:.4;transform:scale(.95)}50%{opacity:1;transform:scale(1.05)}}.loader-arc{animation:spin 2s linear infinite;transform-origin:60px 60px}.loader-bread{animation:pulse 1.5s ease-in-out infinite}`}</style>
    <div style={{position:"relative",width:120,height:120,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <svg style={{position:"absolute"}} width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3"/>
        <circle cx="60" cy="60" r="50" fill="none" stroke="url(#cg)" strokeWidth="3" strokeLinecap="round" strokeDasharray="200 115" className="loader-arc"/>
        <defs><linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fb923c"/><stop offset="50%" stopColor="#ec4899"/><stop offset="100%" stopColor="#a855f7"/></linearGradient></defs>
      </svg>
      <span className="loader-bread" style={{fontSize:42,filter:"drop-shadow(0 4px 16px rgba(251,146,60,0.4))"}}>🍞</span>
    </div>
    <div style={{textAlign:"center"}}>
      <p style={{margin:"0 0 4px",fontSize:15,fontWeight:700,color:"#fff"}}>Mahlzeit analysieren…</p>
      <p style={{margin:0,fontSize:12,color:"#71717a"}}>KI berechnet KH, GI und Insulin-Hinweise</p>
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════════
// Haupt-Komponente
// ══════════════════════════════════════════════════════════════════
export default function CarbScanPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [manualItems, setManualItems] = useState([{name:"",menge:""}]);
  const [image, setImage] = useState<string|null>(null);
  const [imageBase64, setImageBase64] = useState<string|null>(null);
  const [imageMimeType, setImageMimeType] = useState("image/jpeg");
  const [result, setResult] = useState<AnalysisResult|null>(null);
  const [fragen, setFragen] = useState<Question[]|null>(null);
  const [antworten, setAntworten] = useState<Record<string,string>>({});
  const [fragKontext, setFragKontext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<"text"|"manual"|"photo">("text");
  const [history, setHistory] = useState<MsgDto[]>([]);
  const [grammOverrides, setGrammOverrides] = useState<Record<number,number>>({});
  const [dragActive, setDragActive] = useState(false);
  const [expanded, setExpanded] = useState<Record<number,boolean>>({});
  const [savedInput, setSavedInput] = useState<{text:string;manualItems:{name:string;menge:string}[];image:string|null;imageBase64:string|null;imageMimeType:string;activeTab:"text"|"manual"|"photo"}|null>(null);
  const [bzStart, setBzStart] = useState("");
  const [bzUnit, setBzUnit] = useState<"mg/dl"|"mmol/l">("mg/dl");
  const fileRef = useRef<HTMLInputElement>(null);

  const {data:settings} = useQuery<SettingsLite>({
    queryKey:["settings","carbscan"],
    queryFn:()=>apiClient.get("/api/v1/settings"),
    staleTime:60_000,
  });

  const handleImage = (file:File|null|undefined) => {
    if(!file) return;
    setImage(URL.createObjectURL(file));
    setImageMimeType(file.type||"image/jpeg");
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setImageBase64(res.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const buildPrompt = () => {
    const parts:string[] = [];
    if(text.trim()) parts.push(`Beschreibung: ${text}`);
    const valid = manualItems.filter(i=>i.name.trim());
    if(valid.length) parts.push(`Zutaten: ${valid.map(i=>`${i.name}${i.menge?` (${i.menge})`:""}`).join(", ")}`);
    if(imageBase64) parts.push("Ein Foto der Mahlzeit ist beigefügt.");
    return parts.join("\n") || "Bitte analysiere das beigefügte Foto.";
  };

  const callAPI = async (msgs:MsgDto[]):Promise<ParsedResponse> => {
    const resp = await apiClient.post<MealAnalysisApiResponse>(
      "/api/v1/ai/analyze-meal",
      {messages:msgs, imageBase64:imageBase64??null, imageMimeType:imageBase64?imageMimeType:null}
    );
    if(!resp.available) {
      throw new Error(resp.errorMessage || "Die KI-Mahlzeitenanalyse ist aktuell nicht verfügbar.");
    }
    return JSON.parse(resp.rawJson.replace(/```json|```/g,"").trim());
  };

  const analyze = async () => {
    setSavedInput({text,manualItems:manualItems.map(i=>({...i})),image,imageBase64,imageMimeType,activeTab});
    setLoading(true); setError(null); setResult(null); setFragen(null); setAntworten({}); setGrammOverrides({}); setExpanded({});
    try {
      const msgs:MsgDto[] = [{role:"user",content:buildPrompt()}];
      const parsed = await callAPI(msgs);
      setHistory(msgs);
      if(parsed.status==="fragen"){
        setFragen(parsed.fragen); setFragKontext(parsed.kontext||"");
        setHistory([...msgs,{role:"assistant",content:JSON.stringify(parsed)}]);
      } else { setResult(parsed); }
    } catch(e:unknown) { setError(e instanceof Error ? e.message : "Analyse fehlgeschlagen."); }
    finally { setLoading(false); }
  };

  const submitAnswers = async () => {
    if(!fragen||fragen.some(f=>!antworten[f.id])) return;
    setLoading(true); setError(null); setFragen(null);
    try {
      const answerText = fragen.map(f=>`${f.text}: ${antworten[f.id]}`).join("\n");
      const newMsgs = [...history,{role:"user",content:`Meine Antworten:\n${answerText}\n\nBitte jetzt die vollständige Analyse als Format B.`}];
      setResult(await callAPI(newMsgs) as AnalysisResult);
    } catch(e:unknown) { setError(e instanceof Error ? e.message : "Analyse fehlgeschlagen."); }
    finally { setLoading(false); }
  };

  const editInput = () => {
    if(savedInput){ setText(savedInput.text); setManualItems(savedInput.manualItems.length?savedInput.manualItems:[{name:"",menge:""}]); setImage(savedInput.image); setImageBase64(savedInput.imageBase64); setImageMimeType(savedInput.imageMimeType); setActiveTab(savedInput.activeTab); }
    setResult(null); setFragen(null); setAntworten({}); setFragKontext(""); setHistory([]); setGrammOverrides({}); setError(null); setExpanded({});
  };

  const reset = () => { setResult(null);setFragen(null);setAntworten({});setFragKontext("");setText("");setManualItems([{name:"",menge:""}]);setImage(null);setImageBase64(null);setHistory([]);setGrammOverrides({});setError(null);setExpanded({});setSavedInput(null); };

  const hasInput = text.trim()||manualItems.some(i=>i.name.trim())||!!imageBase64;

  const PAGE_BG = {background:"radial-gradient(ellipse 100% 60% at 20% 0%,rgba(168,85,247,0.18),transparent 50%),radial-gradient(ellipse 80% 50% at 80% 20%,rgba(236,72,153,0.12),transparent 50%),radial-gradient(ellipse 70% 40% at 50% 100%,rgba(239,68,68,0.1),transparent 50%),#030305",minHeight:"100vh",padding:"24px 14px 40px",fontFamily:"'Inter',-apple-system,system-ui,sans-serif",color:"#f4f4f5"};
  const CARD = {background:"linear-gradient(180deg,rgba(24,24,27,0.7),rgba(15,15,17,0.7))",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderRadius:24,border:"1px solid rgba(255,255,255,0.08)",boxShadow:"0 20px 60px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.05)"};

  const tabBtn = (t:"text"|"manual"|"photo",icon:string,label:string) => (
    <button key={t} onClick={()=>setActiveTab(t)} style={{flex:1,padding:"11px 8px",borderRadius:12,border:"none",background:activeTab===t?"linear-gradient(180deg,rgba(255,255,255,0.95),rgba(228,228,231,0.9))":"transparent",color:activeTab===t?"#09090b":"#a1a1aa",fontWeight:activeTab===t?700:500,fontSize:12.5,cursor:"pointer",boxShadow:activeTab===t?"0 2px 12px rgba(0,0,0,0.35)":"none",transition:"all 0.25s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
      <span style={{fontSize:15}}>{icon}</span>{label}
    </button>
  );

  return (
    <div style={PAGE_BG}>
      <style>{`input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}input::placeholder,textarea::placeholder{color:#52525b}@keyframes slideUp{0%{opacity:0;transform:translateY(14px)}100%{opacity:1;transform:translateY(0)}}.enter{animation:slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both}*{-webkit-tap-highlight-color:transparent}`}</style>
      <div style={{maxWidth:580,margin:"0 auto"}}>

        {/* Header */}
        <div style={{marginBottom:22,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{background:"linear-gradient(135deg,#fb923c 0%,#ec4899 50%,#a855f7 100%)",borderRadius:14,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,boxShadow:"0 8px 28px rgba(236,72,153,0.35)"}}>🍞</div>
            <div>
              <h1 style={{margin:0,fontSize:20,fontWeight:800,color:"#fff",letterSpacing:-0.4,lineHeight:1}}>Carb<span style={{background:"linear-gradient(90deg,#fb923c,#ec4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Scan</span></h1>
              <p style={{margin:"3px 0 0",fontSize:11,color:"#71717a",letterSpacing:0.3,fontWeight:500}}>KH · Kcal · GI · Insulin-Guide</p>
            </div>
          </div>
          {(result||fragen)&&<div style={{display:"flex",gap:8}}>
            <button onClick={editInput} style={{background:"linear-gradient(135deg,rgba(168,85,247,0.2),rgba(236,72,153,0.15))",border:"1px solid rgba(168,85,247,0.3)",color:"#e9d5ff",borderRadius:12,padding:"8px 14px",fontSize:12.5,cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>✏️ Bearbeiten</button>
            <button onClick={reset} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#d4d4d8",borderRadius:12,padding:"8px 14px",fontSize:12.5,cursor:"pointer",fontWeight:600}}>↻ Neu</button>
          </div>}
        </div>

        {/* Kein KI-Provider */}
        {settings&&!settings.aiChatAvailable&&<div style={{...CARD,padding:20,marginBottom:16,textAlign:"center"}}>
          <p style={{fontSize:36,marginBottom:8}}>🤖</p>
          <p style={{margin:"0 0 4px",fontWeight:700,color:"#f4f4f5"}}>Kein KI-Provider konfiguriert</p>
          <p style={{margin:"0 0 12px",fontSize:13,color:"#71717a"}}>{settings.aiAvailabilityReason||"Bitte einen API-Key in den Einstellungen hinterlegen."}</p>
          <button onClick={()=>router.push("/settings")} style={{background:"linear-gradient(135deg,#a855f7,#ec4899)",border:"none",color:"#fff",borderRadius:12,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Einstellungen öffnen →</button>
        </div>}

        {/* Loader */}
        {loading&&<div className="enter" style={CARD}><CarbLoader/></div>}

        {/* Rückfragen */}
        {!loading&&fragen&&<div className="enter" style={{...CARD,padding:22}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <div style={{background:"linear-gradient(135deg,rgba(168,85,247,0.3),rgba(236,72,153,0.2))",borderRadius:11,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>🤔</div>
            <p style={{margin:0,fontSize:16,fontWeight:700,color:"#f4f4f5"}}>Kurze Rückfrage</p>
          </div>
          {fragKontext&&<p style={{margin:"0 0 18px",fontSize:13,color:"#a1a1aa",lineHeight:1.55}}>{fragKontext}</p>}
          <div style={{display:"flex",flexDirection:"column",gap:18}}>
            {fragen.map(f=>(
              <div key={f.id}>
                <p style={{margin:"0 0 10px",fontSize:13.5,fontWeight:600,color:"#e4e4e7"}}>{f.text}</p>
                <div style={{display:"flex",flexWrap:"wrap" as const,gap:8}}>
                  {f.optionen.map(opt=>{const sel=antworten[f.id]===opt;return(
                    <button key={opt} onClick={()=>setAntworten(a=>({...a,[f.id]:opt}))} style={{padding:"9px 14px",borderRadius:12,border:`1.5px solid ${sel?"#c084fc":"rgba(255,255,255,0.08)"}`,background:sel?"linear-gradient(135deg,rgba(168,85,247,0.3),rgba(236,72,153,0.2))":"rgba(255,255,255,0.03)",color:sel?"#f0abfc":"#a1a1aa",fontSize:13,cursor:"pointer",fontWeight:sel?700:500,boxShadow:sel?"0 4px 16px rgba(168,85,247,0.3)":"none"}}>{opt}</button>
                  );})}
                </div>
              </div>
            ))}
          </div>
          <button onClick={submitAnswers} disabled={fragen.some(f=>!antworten[f.id])} style={{width:"100%",marginTop:22,padding:"14px",fontSize:15,fontWeight:700,background:fragen.every(f=>antworten[f.id])?"linear-gradient(135deg,#a855f7,#ec4899)":"rgba(255,255,255,0.05)",color:fragen.every(f=>antworten[f.id])?"#fff":"#52525b",border:"none",borderRadius:14,cursor:fragen.every(f=>antworten[f.id])?"pointer":"default",boxShadow:fragen.every(f=>antworten[f.id])?"0 8px 28px rgba(168,85,247,0.4)":"none",letterSpacing:0.3}}>Analysieren →</button>
        </div>}

        {/* Eingabe-Formular */}
        {!loading&&!fragen&&!result&&<div className="enter" style={{...CARD,padding:18}}>
          <div style={{display:"flex",background:"rgba(0,0,0,0.5)",borderRadius:14,padding:4,marginBottom:16,gap:3,border:"1px solid rgba(255,255,255,0.04)"}}>
            {tabBtn("text","📝","Text")}{tabBtn("manual","🧾","Zutaten")}{tabBtn("photo","📷","Foto")}
          </div>

          {activeTab==="text"&&<textarea value={text} onChange={e=>setText(e.target.value)} placeholder="z.B. 2 Scheiben Vollkornbrot mit Butter und Gouda, dazu ein Glas Orangensaft…" rows={4} style={{width:"100%",boxSizing:"border-box",background:"rgba(0,0,0,0.4)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:14,color:"#f4f4f5",padding:"14px 16px",fontSize:14,resize:"vertical",outline:"none",fontFamily:"inherit",lineHeight:1.55}}/>}

          {activeTab==="manual"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
            {manualItems.map((item,i)=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
                <input placeholder="Zutat" value={item.name} onChange={e=>{const u=[...manualItems];u[i].name=e.target.value;setManualItems(u);}} style={{flex:2,background:"rgba(0,0,0,0.4)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:12,color:"#f4f4f5",padding:"11px 14px",fontSize:13,outline:"none"}}/>
                <input placeholder="Menge" value={item.menge} onChange={e=>{const u=[...manualItems];u[i].menge=e.target.value;setManualItems(u);}} style={{flex:1,background:"rgba(0,0,0,0.4)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:12,color:"#f4f4f5",padding:"11px 14px",fontSize:13,outline:"none"}}/>
                {manualItems.length>1&&<button onClick={()=>setManualItems(manualItems.filter((_,idx)=>idx!==i))} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",color:"#f87171",cursor:"pointer",fontSize:15,width:34,height:34,borderRadius:11,fontWeight:600}}>×</button>}
              </div>
            ))}
            <button onClick={()=>setManualItems([...manualItems,{name:"",menge:""}])} style={{alignSelf:"flex-start",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"#a1a1aa",borderRadius:11,padding:"9px 14px",fontSize:12.5,cursor:"pointer",fontWeight:600}}>+ Weitere Zutat</button>
          </div>}

          {activeTab==="photo"&&<div onClick={()=>fileRef.current?.click()} onDragOver={e=>{e.preventDefault();setDragActive(true);}} onDragLeave={()=>setDragActive(false)} onDrop={e=>{e.preventDefault();setDragActive(false);handleImage(e.dataTransfer.files[0]);}} style={{border:`2px dashed ${dragActive?"#c084fc":"rgba(255,255,255,0.12)"}`,borderRadius:16,padding:"34px 20px",textAlign:"center",cursor:"pointer",background:dragActive?"rgba(168,85,247,0.12)":"rgba(0,0,0,0.35)",display:"flex",flexDirection:"column",alignItems:"center",gap:12,transition:"all 0.2s"}}>
            {image?<img src={image} alt="" style={{maxHeight:220,maxWidth:"100%",borderRadius:13,boxShadow:"0 8px 28px rgba(0,0,0,0.5)"}}/>:<><div style={{fontSize:38,filter:"drop-shadow(0 4px 12px rgba(168,85,247,0.3))"}}>📷</div><div><p style={{margin:0,fontSize:14,color:"#f4f4f5",fontWeight:700}}>Foto ablegen oder tippen</p><p style={{margin:"4px 0 0",fontSize:11.5,color:"#71717a"}}>JPG, PNG · beliebige Größe</p></div></>}
            <input ref={fileRef} type="file" accept="image/*" onChange={e=>handleImage(e.target.files?.[0])} style={{display:"none"}}/>
          </div>}

          <button onClick={analyze} disabled={!hasInput} style={{marginTop:14,width:"100%",padding:"15px",fontSize:15,fontWeight:700,background:hasInput?"linear-gradient(135deg,#fb923c 0%,#ec4899 50%,#a855f7 100%)":"rgba(255,255,255,0.05)",color:hasInput?"#fff":"#52525b",border:"none",borderRadius:14,cursor:hasInput?"pointer":"default",boxShadow:hasInput?"0 10px 32px rgba(236,72,153,0.35),inset 0 1px 0 rgba(255,255,255,0.2)":"none",letterSpacing:0.3,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <span style={{fontSize:16}}>✨</span> Analysieren
          </button>
        </div>}

        {error&&<div style={{marginTop:12,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:13,padding:"12px 14px",fontSize:13,color:"#fca5a5"}}>⚠ {error}</div>}

        {/* Ergebnisse */}
        {!loading&&result&&(()=>{
          const totals=result.zutaten.reduce((acc,z,i)=>{const g=grammOverrides[i]!==undefined?grammOverrides[i]:z.gramm;const f=g/(z.gramm||100);return{kh:acc.kh+z.kh*f,kcal:acc.kcal+z.kcal*f};},{kh:0,kcal:0});
          const kh=Math.round(totals.kh*10)/10;
          const kcal=Math.round(totals.kcal);
          const gi=result.gesamt_gi_gewichtet;
          const giCat=gi<55?"niedrig":gi<70?"mittel":"hoch";
          const giC=GI_COLOR[giCat];
          const be=Math.round((kh/12)*10)/10;
          const ke=Math.round((kh/10)*10)/10;
          const hasOverride=Object.keys(grammOverrides).length>0;
          return(<div style={{display:"flex",flexDirection:"column",gap:12}}>

            {/* Hero Card */}
            <div style={{position:"relative",overflow:"hidden",background:"linear-gradient(135deg,#fb923c 0%,#ec4899 50%,#a855f7 100%)",borderRadius:24,padding:"20px 22px",boxShadow:"0 20px 60px rgba(236,72,153,0.35),inset 0 1px 0 rgba(255,255,255,0.2)"}}>
              <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,background:"radial-gradient(circle,rgba(255,255,255,0.2),transparent)",borderRadius:"50%"}}/>
              <div style={{position:"relative",display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                <div style={{fontSize:36,width:56,height:56,background:"rgba(255,255,255,0.2)",backdropFilter:"blur(10px)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,0.25)"}}>{result.emoji||"🍽️"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{margin:"0 0 2px",fontSize:10.5,color:"rgba(255,255,255,0.8)",letterSpacing:0.8,textTransform:"uppercase" as const,fontWeight:700}}>Mahlzeit</p>
                  <p style={{margin:0,fontSize:14,color:"#fff",fontWeight:600,lineHeight:1.3}}>{result.mahlzeit}</p>
                </div>
              </div>
              <div style={{position:"relative",display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:10}}>
                <div>
                  <p style={{margin:"0 0 2px",fontSize:10.5,color:"rgba(255,255,255,0.8)",letterSpacing:0.8,textTransform:"uppercase" as const,fontWeight:700}}>Kohlenhydrate</p>
                  <p style={{margin:0,fontSize:48,fontWeight:900,color:"#fff",lineHeight:0.9,letterSpacing:-1.5}}>
                    <AnimatedNumber value={kh} decimals={1}/><span style={{fontSize:20,fontWeight:700,marginLeft:4,opacity:0.85}}>g</span>
                  </p>
                  {hasOverride&&<p style={{margin:"4px 0 0",fontSize:10,color:"rgba(255,255,255,0.7)",fontWeight:600}}>⚖️ angepasst</p>}
                </div>
                <div style={{display:"flex",gap:8}}>
                  {[{l:"BE",v:be},{l:"KE",v:ke}].map(({l,v})=>(
                    <div key={l} style={{background:"rgba(255,255,255,0.2)",backdropFilter:"blur(10px)",borderRadius:12,padding:"8px 12px",border:"1px solid rgba(255,255,255,0.2)",textAlign:"center",minWidth:52}}>
                      <p style={{margin:0,fontSize:9.5,color:"rgba(255,255,255,0.75)",fontWeight:700,letterSpacing:0.5}}>{l}</p>
                      <p style={{margin:"2px 0 0",fontSize:17,fontWeight:800,color:"#fff",lineHeight:1}}><AnimatedNumber value={v} decimals={1}/></p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Kcal + GI */}
            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1,...CARD,padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{fontSize:13}}>🔥</span><p style={{margin:0,fontSize:10,color:"#71717a",letterSpacing:0.8,textTransform:"uppercase" as const,fontWeight:700}}>Energie</p></div>
                <p style={{margin:0,fontSize:24,fontWeight:800,color:"#fff",lineHeight:1}}><AnimatedNumber value={kcal}/><span style={{fontSize:12,fontWeight:600,color:"#71717a",marginLeft:4}}>kcal</span></p>
              </div>
              <div style={{flex:1,background:`linear-gradient(135deg,${giC.bg},rgba(24,24,27,0.7))`,backdropFilter:"blur(20px)",border:`1px solid ${giC.ring}`,borderRadius:18,padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{width:7,height:7,borderRadius:999,background:giC.dot,boxShadow:`0 0 10px ${giC.dot}`}}/><p style={{margin:0,fontSize:10,color:giC.text,letterSpacing:0.8,textTransform:"uppercase" as const,fontWeight:700}}>GI {GI_COLOR[giCat].label}</p></div>
                <p style={{margin:0,fontSize:24,fontWeight:800,color:"#fff",lineHeight:1}}><AnimatedNumber value={gi}/><span style={{fontSize:12,fontWeight:600,color:"#71717a",marginLeft:4}}>Ø</span></p>
              </div>
            </div>

            {/* BZ-Eingabe */}
            <div style={{background:bzStart?"linear-gradient(135deg,rgba(239,68,68,0.12),rgba(190,24,93,0.06))":"linear-gradient(180deg,rgba(24,24,27,0.7),rgba(15,15,17,0.7))",backdropFilter:"blur(20px)",borderRadius:20,padding:"14px 16px",border:bzStart?"1px solid rgba(239,68,68,0.2)":"1px dashed rgba(255,255,255,0.1)",transition:"all 0.3s"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{background:bzStart?"rgba(239,68,68,0.25)":"rgba(255,255,255,0.06)",borderRadius:10,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🩸</div>
                <div style={{flex:1}}>
                  <p style={{margin:"0 0 1px",fontSize:12.5,color:"#f4f4f5",fontWeight:700}}>Aktueller Blutzucker</p>
                  <p style={{margin:0,fontSize:10.5,color:"#71717a"}}>{bzStart?"BZ-Verlauf wird berechnet":"Optional – für Spritz-Ess-Abstand"}</p>
                </div>
                <div style={{display:"flex",gap:3,background:"rgba(0,0,0,0.4)",borderRadius:8,padding:2}}>
                  {(["mg/dl","mmol/l"] as const).map(u=><button key={u} onClick={()=>setBzUnit(u)} style={{padding:"3px 8px",fontSize:10,fontWeight:700,border:"none",borderRadius:6,background:bzUnit===u?"rgba(255,255,255,0.12)":"transparent",color:bzUnit===u?"#f4f4f5":"#71717a",cursor:"pointer"}}>{u}</button>)}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="number" value={bzStart} onChange={e=>setBzStart(e.target.value)} placeholder={bzUnit==="mg/dl"?"z.B. 120":"z.B. 6.7"} style={{flex:1,background:"rgba(0,0,0,0.4)",border:`1.5px solid ${bzStart?"rgba(239,68,68,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:11,color:"#f4f4f5",padding:"11px 14px",fontSize:15,outline:"none",fontWeight:700}}/>
                <span style={{fontSize:12,color:"#71717a",fontWeight:600,minWidth:42}}>{bzUnit}</span>
                {bzStart&&<button onClick={()=>setBzStart("")} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"#a1a1aa",cursor:"pointer",fontSize:14,width:36,height:36,borderRadius:10,fontWeight:600}}>×</button>}
              </div>
              {!bzStart&&<div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap" as const}}>
                {(bzUnit==="mg/dl"?[{v:"80",l:"Niedrig"},{v:"110",l:"Ziel"},{v:"150",l:"Erhöht"},{v:"200",l:"Hoch"}]:[{v:"4.4",l:"Niedrig"},{v:"6.1",l:"Ziel"},{v:"8.3",l:"Erhöht"},{v:"11.1",l:"Hoch"}]).map(({v,l})=>(
                  <button key={v} onClick={()=>setBzStart(v)} style={{flex:1,minWidth:60,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",color:"#a1a1aa",borderRadius:9,padding:"6px 8px",fontSize:11,cursor:"pointer",fontWeight:600,display:"flex",flexDirection:"column",gap:1}}>
                    <span style={{fontSize:13,fontWeight:700,color:"#d4d4d8"}}>{v}</span>
                    <span style={{fontSize:9,color:"#52525b"}}>{l}</span>
                  </button>
                ))}
              </div>}
            </div>

            {/* BZ Prognose */}
            {bzStart&&!isNaN(parseFloat(bzStart))&&(()=>{
              const bzMgdl=bzUnit==="mmol/l"?parseFloat(bzStart)*18:parseFloat(bzStart);
              const targetBz=110;
              let seaMin=0,seaMax=0,seaAdvice="",seaColor="#34d399",seaIcon="✓";
              if(bzMgdl<80){seaAdvice="BZ niedrig – erst essen, dann ggf. Bolus.";seaColor="#f87171";seaIcon="⚠️";}
              else if(bzMgdl<120){seaMin=0;seaMax=5;seaAdvice="BZ im Zielbereich – direkt essen.";seaColor="#34d399";seaIcon="✓";}
              else if(bzMgdl<160){seaMin=gi>=70?5:10;seaMax=gi>=70?10:15;seaAdvice=`BZ leicht erhöht – ${seaMin}–${seaMax} Min. warten.`;seaColor="#fbbf24";seaIcon="⏱";}
              else if(bzMgdl<200){seaMin=15;seaMax=20;seaAdvice="BZ erhöht – 15–20 Min. Spritz-Ess-Abstand.";seaColor="#fb923c";seaIcon="⏱";}
              else{seaMin=20;seaMax=30;seaAdvice="BZ deutlich erhöht – 20–30 Min. warten.";seaColor="#f87171";seaIcon="⚠️";}
              const seaAvg=(seaMin+seaMax)/2;
              const correctionDrop=Math.max(0,bzMgdl-targetBz);
              const mealRiseTotal=kh*3.5+(gi>=70?15:gi>=55?5:0);
              const totalEffect=correctionDrop+mealRiseTotal;
              const foodPeakDelay=gi>=70?45:gi>=55?60:80;
              const foodDuration=gi>=70?150:gi>=55?180:210;
              const iAC=(t:number)=>{if(t<0)return 0;if(t<15)return(t/15)*0.05;if(t<90)return 0.05+((t-15)/75)*0.55;if(t<180)return 0.60+((t-90)/90)*0.30;if(t<240)return 0.90+((t-180)/60)*0.10;return 1.0;};
              const fAC=(t:number)=>{if(t<0)return 0;if(t>=foodDuration)return 1.0;const x=t/foodDuration,pp=foodPeakDelay/foodDuration;return 1/(1+Math.exp(-5*(x-pp)));};
              const pts=[];for(let t=0;t<=240;t+=3){const drop=iAC(t)*totalEffect;const rise=t>=seaAvg?fAC(t-seaAvg)*mealRiseTotal:0;pts.push({t,bz:Math.max(55,Math.min(bzMgdl-drop+rise,350))});}
              const W=520,H=180,pL=40,pR=15,pT=20,pB=30,cW=W-pL-pR,cH=H-pT-pB;
              const maxBz=Math.max(...pts.map(p=>p.bz),200),minBz=Math.min(...pts.map(p=>p.bz),60),yR=maxBz-minBz;
              const xS=(t:number)=>pL+(t/240)*cW,yS=(b:number)=>pT+cH-((b-minBz)/yR)*cH;
              const path=pts.map((p,i)=>`${i===0?"M":"L"} ${xS(p.t).toFixed(1)} ${yS(p.bz).toFixed(1)}`).join(" ");
              const fill=`${path} L ${xS(240)} ${pT+cH} L ${pL} ${pT+cH} Z`;
              const tL=yS(180),tLow=yS(70),tY=yS(targetBz);
              const landing=pts[pts.length-1].bz;
              const dispBz=(v:number)=>bzUnit==="mmol/l"?(v/18).toFixed(1):Math.round(v).toString();
              return(
                <div style={{background:"linear-gradient(135deg,rgba(239,68,68,0.12),rgba(190,24,93,0.06))",backdropFilter:"blur(20px)",borderRadius:20,padding:"16px 18px",border:"1px solid rgba(239,68,68,0.2)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                    <div style={{background:"rgba(239,68,68,0.25)",borderRadius:9,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📈</div>
                    <p style={{margin:0,fontSize:11,fontWeight:800,color:"#fca5a5",letterSpacing:0.6,textTransform:"uppercase" as const}}>BZ-Prognose</p>
                    <span style={{marginLeft:"auto",fontSize:11,color:"#71717a",fontWeight:600}}>Start: {dispBz(bzMgdl)} {bzUnit}</span>
                  </div>
                  <div style={{background:`linear-gradient(135deg,${seaColor}25,${seaColor}10)`,border:`1px solid ${seaColor}40`,borderRadius:13,padding:"12px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:48,height:48,borderRadius:12,background:`${seaColor}30`,border:`1px solid ${seaColor}50`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontSize:14,lineHeight:1}}>{seaIcon}</span>
                      <p style={{margin:"2px 0 0",fontSize:14,fontWeight:800,color:"#fff",lineHeight:1}}>{seaMin===seaMax?seaMin:`${seaMin}-${seaMax}`}</p>
                      <p style={{margin:0,fontSize:8.5,color:"rgba(255,255,255,0.8)",fontWeight:600}}>MIN</p>
                    </div>
                    <div style={{flex:1}}>
                      <p style={{margin:"0 0 3px",fontSize:11,color:seaColor,fontWeight:800,letterSpacing:0.5,textTransform:"uppercase" as const}}>Spritz-Ess-Abstand</p>
                      <p style={{margin:0,fontSize:12.5,color:"#fef2f2",lineHeight:1.45}}>{seaAdvice}</p>
                    </div>
                  </div>
                  <div style={{background:"rgba(0,0,0,0.3)",borderRadius:13,padding:"10px 6px 6px",border:"1px solid rgba(255,255,255,0.04)",overflow:"hidden"}}>
                    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
                      <defs><linearGradient id="bzF" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.35"/><stop offset="100%" stopColor="#ef4444" stopOpacity="0"/></linearGradient><linearGradient id="bzL" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#60a5fa"/><stop offset="50%" stopColor="#f87171"/><stop offset="100%" stopColor="#34d399"/></linearGradient></defs>
                      <rect x={pL} y={tL} width={cW} height={tLow-tL} fill="rgba(52,211,153,0.08)"/>
                      <line x1={pL} y1={tL} x2={pL+cW} y2={tL} stroke="rgba(52,211,153,0.3)" strokeWidth="1" strokeDasharray="3,3"/>
                      <line x1={pL} y1={tLow} x2={pL+cW} y2={tLow} stroke="rgba(52,211,153,0.3)" strokeWidth="1" strokeDasharray="3,3"/>
                      <line x1={pL} y1={tY} x2={pL+cW} y2={tY} stroke="rgba(52,211,153,0.5)" strokeWidth="1.2" strokeDasharray="4,4"/>
                      <text x={pL-4} y={tY+3} fontSize="9" fill="#6ee7b7" textAnchor="end" fontWeight="700">{dispBz(targetBz)}</text>
                      {[0,60,120,180,240].map(t=><text key={t} x={xS(t)} y={pT+cH+14} fontSize="9" fill="#71717a" textAnchor="middle" fontWeight="600">{t===0?"Jetzt":`+${t}m`}</text>)}
                      <path d={fill} fill="url(#bzF)"/>
                      <path d={path} fill="none" stroke="url(#bzL)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx={xS(0)} cy={yS(bzMgdl)} r="5" fill="#60a5fa" stroke="#1e3a5f" strokeWidth="2"/>
                      {seaAvg>0&&<circle cx={xS(seaAvg)} cy={yS(pts.find(p=>p.t>=seaAvg)?.bz??bzMgdl)} r="5" fill="#fb923c" stroke="#7c2d12" strokeWidth="2"/>}
                      <circle cx={xS(240)} cy={yS(landing)} r="4" fill="#34d399" stroke="#064e3b" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div style={{display:"flex",gap:6,marginTop:12}}>
                    {[{icon:"💉",l:"Bolus",v:"Jetzt",c:"rgba(96,165,250,0.12)",bc:"rgba(96,165,250,0.25)",tc:"#dbeafe"},{icon:"🍽️",l:"Essen",v:`+${seaMin===seaMax?seaMin:`${seaMin}-${seaMax}`} min`,c:"rgba(251,146,60,0.12)",bc:"rgba(251,146,60,0.25)",tc:"#fed7aa"},{icon:"🎯",l:"Ziel",v:`~${dispBz(landing)} ${bzUnit}`,c:"rgba(52,211,153,0.12)",bc:"rgba(52,211,153,0.25)",tc:"#a7f3d0"}].map(x=>(
                      <div key={x.l} style={{flex:1,background:x.c,border:`1px solid ${x.bc}`,borderRadius:10,padding:"8px 10px"}}>
                        <p style={{margin:"0 0 2px",fontSize:9,color:x.bc,fontWeight:800,letterSpacing:0.4,textTransform:"uppercase" as const}}>{x.icon} {x.l}</p>
                        <p style={{margin:0,fontSize:11.5,color:x.tc,fontWeight:600}}>{x.v}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{margin:"10px 0 0",padding:"10px 12px",background:"rgba(0,0,0,0.25)",borderRadius:11,border:"1px solid rgba(255,255,255,0.05)",fontSize:10.5,color:"#a1a1aa",lineHeight:1.5}}>⚠️ <strong style={{color:"#d4d4d8"}}>Nur eine Vorschau.</strong> Jeder Körper reagiert anders. Keine Dosierungsempfehlung!</p>
                </div>
              );
            })()}

            {/* Zutaten */}
            <div style={{...CARD,overflow:"hidden"}}>
              <div style={{padding:"14px 18px 12px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:14}}>🧾</span>
                  <p style={{margin:0,fontSize:11,fontWeight:800,color:"#d4d4d8",letterSpacing:0.8,textTransform:"uppercase" as const}}>Zutaten</p>
                  <span style={{fontSize:10.5,color:"#52525b",background:"rgba(255,255,255,0.05)",padding:"1px 7px",borderRadius:999,fontWeight:600}}>{result.zutaten.length}</span>
                </div>
                <p style={{margin:0,fontSize:10.5,color:"#52525b"}}>Tippen für Details</p>
              </div>
              {result.zutaten.map((z,i)=>{
                const g=grammOverrides[i]!==undefined?grammOverrides[i]:z.gramm;
                const f=g/(z.gramm||100);
                const ikh=Math.round(z.kh*f*10)/10;
                const ikcal=Math.round(z.kcal*f);
                const modified=grammOverrides[i]!==undefined&&grammOverrides[i]!==z.gramm;
                const open=expanded[i];
                return(
                  <div key={i} style={{borderBottom:i<result.zutaten.length-1?"1px solid rgba(255,255,255,0.05)":"none",background:modified?"linear-gradient(90deg,rgba(168,85,247,0.08),transparent)":"transparent"}}>
                    <button onClick={()=>setExpanded(e=>({...e,[i]:!e[i]}))} style={{width:"100%",background:"transparent",border:"none",padding:"14px 18px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,textAlign:"left" as const}}>
                      <div style={{display:"flex",alignItems:"center",gap:11,minWidth:0,flex:1}}>
                        <div style={{fontSize:18,width:38,height:38,flexShrink:0,background:"rgba(255,255,255,0.05)",borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,0.06)"}}>{z.emoji||"🍴"}</div>
                        <div style={{minWidth:0,flex:1}}>
                          <p style={{margin:"0 0 4px",fontSize:14,fontWeight:600,color:"#f4f4f5",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{z.name}</p>
                          <div style={{display:"flex",alignItems:"center",gap:6}}><GiBadge kategorie={z.gi_kategorie}/><span style={{fontSize:11,color:"#71717a",fontWeight:500}}>{g}g</span></div>
                        </div>
                      </div>
                      <div style={{textAlign:"right" as const,flexShrink:0,display:"flex",alignItems:"center",gap:10}}>
                        <div>
                          <p style={{margin:0,fontSize:16,fontWeight:800,color:"#fb923c",lineHeight:1}}><AnimatedNumber value={ikh} decimals={ikh<10?1:0}/><span style={{fontSize:10,fontWeight:600,color:"#71717a",marginLeft:2}}>g KH</span></p>
                          <p style={{margin:"3px 0 0",fontSize:10.5,color:"#52525b"}}><AnimatedNumber value={ikcal}/> kcal</p>
                        </div>
                        <span style={{color:"#52525b",fontSize:11,transition:"transform 0.3s",display:"block",transform:open?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
                      </div>
                    </button>
                    {open&&<div style={{padding:"0 18px 14px",display:"flex",flexDirection:"column",gap:10}}>
                      <div style={{display:"flex",gap:10,fontSize:11,color:"#a1a1aa"}}>
                        <div style={{background:"rgba(0,0,0,0.3)",padding:"6px 10px",borderRadius:9,flex:1}}><p style={{margin:0,fontSize:9.5,color:"#52525b",letterSpacing:0.4,textTransform:"uppercase" as const,fontWeight:700}}>Dichte</p><p style={{margin:"2px 0 0",fontWeight:700,color:"#d4d4d8"}}>{z.kh_pro_100g}g KH/100g</p></div>
                        <div style={{background:"rgba(0,0,0,0.3)",padding:"6px 10px",borderRadius:9,flex:1}}><p style={{margin:0,fontSize:9.5,color:"#52525b",letterSpacing:0.4,textTransform:"uppercase" as const,fontWeight:700}}>GI</p><p style={{margin:"2px 0 0",fontWeight:700,color:"#d4d4d8"}}>{z.gi}</p></div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:10.5,color:"#71717a",fontWeight:600}}>Menge:</span><Stepper value={g} onChange={(v)=>setGrammOverrides(prev=>({...prev,[i]:v}))}/></div>
                        {modified&&<button onClick={()=>setGrammOverrides(prev=>{const n={...prev};delete n[i];return n;})} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"#a1a1aa",cursor:"pointer",fontSize:11,fontWeight:600,padding:"6px 10px",borderRadius:9}}>↺ {z.gramm}g</button>}
                      </div>
                    </div>}
                  </div>
                );
              })}
            </div>

            {/* Insulin */}
            <div style={{background:"linear-gradient(135deg,rgba(59,130,246,0.18),rgba(37,99,235,0.08))",backdropFilter:"blur(20px)",borderRadius:20,padding:"16px 18px",border:"1px solid rgba(59,130,246,0.25)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><div style={{background:"rgba(59,130,246,0.25)",borderRadius:9,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>💉</div><p style={{margin:0,fontSize:11,fontWeight:800,color:"#93c5fd",letterSpacing:0.6,textTransform:"uppercase" as const}}>Insulin-Einschätzung</p></div>
              <p style={{margin:0,fontSize:13.5,color:"#dbeafe",lineHeight:1.6}}>{result.insulin_hinweis}</p>
            </div>

            {/* GI */}
            <div style={{background:"linear-gradient(135deg,rgba(251,191,36,0.14),rgba(245,158,11,0.06))",backdropFilter:"blur(20px)",borderRadius:20,padding:"16px 18px",border:"1px solid rgba(251,191,36,0.2)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><div style={{background:"rgba(251,191,36,0.25)",borderRadius:9,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📊</div><p style={{margin:0,fontSize:11,fontWeight:800,color:"#fcd34d",letterSpacing:0.6,textTransform:"uppercase" as const}}>Glykämischer Index</p></div>
              <p style={{margin:"0 0 12px",fontSize:13.5,color:"#fef3c7",lineHeight:1.6}}>{result.gi_erklaerung}</p>
              <div style={{position:"relative",height:8,background:"linear-gradient(90deg,#34d399 0%,#34d399 45%,#fbbf24 55%,#fbbf24 65%,#f87171 75%,#f87171 100%)",borderRadius:999,marginBottom:6,overflow:"hidden"}}>
                <div style={{position:"absolute",top:"50%",left:`${Math.min(Math.max(gi,0),100)}%`,transform:"translate(-50%,-50%)",width:18,height:18,borderRadius:999,background:"#fff",border:`3px solid ${giC.dot}`,boxShadow:`0 2px 10px ${giC.dot}`}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#a8a29e",fontWeight:600}}><span>0</span><span>55</span><span>70</span><span>100</span></div>
            </div>

            {result.hinweis&&<div style={{background:"linear-gradient(135deg,rgba(34,197,94,0.12),rgba(22,163,74,0.06))",backdropFilter:"blur(20px)",borderRadius:20,padding:"14px 18px",border:"1px solid rgba(34,197,94,0.2)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><div style={{background:"rgba(34,197,94,0.25)",borderRadius:9,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>💡</div><p style={{margin:0,fontSize:11,fontWeight:800,color:"#4ade80",letterSpacing:0.6,textTransform:"uppercase" as const}}>Hinweis</p></div>
              <p style={{margin:0,fontSize:13.5,color:"#bbf7d0",lineHeight:1.6}}>{result.hinweis}</p>
            </div>}

            <p style={{fontSize:10.5,color:"#3f3f46",textAlign:"center",margin:"6px 0 0",lineHeight:1.5}}>Schätzwerte · Kein Ersatz für medizinischen Rat<br/>Insulindosierung immer mit Arzt absprechen</p>
          </div>);
        })()}

      </div>
    </div>
  );
}
