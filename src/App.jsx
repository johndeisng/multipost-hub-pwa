import React, { useEffect, useMemo, useRef, useState } from "react";

const platformPresets = {
  instagram: { name: "Instagram", maxCaption: 2200, url: "https://www.instagram.com/", uploadUrl: "https://www.instagram.com/create/select/" },
  facebook:  { name: "Facebook",  maxCaption: 63206, url: "https://www.facebook.com/",  uploadUrl: "https://www.facebook.com/creatorstudio?tab=creation_tools" },
  tiktok:    { name: "TikTok",    maxCaption: 2200, url: "https://www.tiktok.com/",    uploadUrl: "https://www.tiktok.com/upload" },
  youtube:   { name: "YouTube Shorts", maxCaption: 5000, url: "https://www.youtube.com/", uploadUrl: "https://www.youtube.com/upload" },
};

const templateLibrary = [
  { id: "aida", name: "AIDA corto", body: `{{hook}}\n\n{{beneficio_principal}}\n\n{{bullets}}\n\n👉 {{cta}}\n\n{{hashtags}}` },
  { id: "pas", name: "PAS directo", body: `{{problema}}\n\n{{agitar}}\n\n{{solucion}}\n\n👉 {{cta}}\n\n{{hashtags}}` },
  { id: "promo", name: "Promo con urgencia", body: `🚀 {{hook}}\n\n{{beneficio_principal}}\n\n{{bullets}}\n\n⏳ Solo por hoy: {{oferta}}\n\n👉 {{cta}}\n\n{{hashtags}}` },
];

const hashtagSets = {
  generico: "#marketing #ventas #negocio #emprender #reels #shorts #tiktok #youtube",
  tapiceria: "#tapiceria #tapiforros #carseats #custominterior #autopersonalizado #miami #bogota",
  manualidades: "#manualidades #crochet #amigurumi #macrame #hechoamano #emprendedora #vivodeko",
  agencia: "#metaads #funnels #landingpage #branding #diseñoweb #seo #clickfunnels",
};

const defaultTemplate = templateLibrary[0].body;
const exampleData = {
  hook: "¿Quieres convertir tus videos en clientes reales?",
  beneficio_principal: "Publica el mismo contenido en 4 plataformas en minutos.",
  bullets: "• Formato 9:16 optimizado\n• Copys por plataforma\n• CTA y enlaces claros",
  cta: "Escríbeme \"CATÁLOGO\" y te envío el link",
  hashtags: hashtagSets.generico,
};

function useLocalState(key, initial) {
  const [value, setValue] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [key, value]);
  return [value, setValue];
}
function buildUTM(base, { source, medium, campaign, content, term }) {
  try { const url = new URL(base);
    if (source) url.searchParams.set("utm_source", source);
    if (medium) url.searchParams.set("utm_medium", medium);
    if (campaign) url.searchParams.set("utm_campaign", campaign);
    if (content) url.searchParams.set("utm_content", content);
    if (term) url.searchParams.set("utm_term", term);
    return url.toString();
  } catch { return base; }
}
function bytesToSize(bytes){ if(bytes===0)return"0 B";const s=["B","KB","MB","GB","TB"];const i=Math.floor(Math.log(bytes)/Math.log(1024));return parseFloat((bytes/Math.pow(1024,i)).toFixed(2))+" "+s[i]; }

export default function App(){
  const [files, setFiles] = useLocalState("spa_files", []);
  const [template, setTemplate] = useLocalState("spa_template", defaultTemplate);
  const [vars, setVars] = useLocalState("spa_vars", exampleData);
  const [override, setOverride] = useLocalState("spa_override", { instagram:"", facebook:"", tiktok:"", youtube:"" });
  const [tpl, setTpl] = useLocalState("spa_tpl", "aida");
  const [hashKey, setHashKey] = useLocalState("spa_hash", "generico");
  const [utm, setUtm] = useLocalState("spa_utm", { base: "https://tusitio.com/oferta", source:"", medium:"", campaign:"", content:"", term:"" });

  const fileRef = React.useRef(null);

  useEffect(()=>{ const t = templateLibrary.find(x=>x.id===tpl); if(t) setTemplate(t.body); }, [tpl]);
  useEffect(()=>{ setVars(v=>({...v, hashtags: hashtagSets[hashKey]||v.hashtags })); }, [hashKey]);

  const baseCaption = React.useMemo(()=>{
    let out = template;
    Object.entries(vars).forEach(([k,v])=>{ out = out.replaceAll(`{{${k}}}`, v||""); });
    return out.trim();
  }, [template, vars]);

  const captions = React.useMemo(()=>{
    const res = {};
    Object.entries(platformPresets).forEach(([k,p])=>{
      let c = override[k]?.trim()? override[k] : baseCaption;
      if(k==="tiktok") c = c.replaceAll("•","–");
      if(k==="youtube") c += "\n\nMás info y enlaces en el primer comentario.";
      if(c.length > p.maxCaption) c = c.slice(0,p.maxCaption-1)+"…";
      res[k]=c;
    });
    return res;
  }, [baseCaption, override]);

  function onFiles(list){
    const arr = Array.from(list||[]).map(f=>({ name:f.name, size:f.size, type:f.type, url:URL.createObjectURL(f) }));
    setFiles(prev=>[...prev, ...arr]);
  }
  function copy(t){ return navigator.clipboard.writeText(t).then(()=>alert("Copiado")).catch(()=>prompt("Copia manual:", t)); }

  const igUrl = buildUTM(utm.base, { ...utm, source: utm.source||"instagram", medium: utm.medium||"social" });
  const ttUrl = buildUTM(utm.base, { ...utm, source: utm.source||"tiktok", medium: utm.medium||"social" });
  const ytUrl = buildUTM(utm.base, { ...utm, source: utm.source||"youtube", medium: utm.medium||"social" });
  const fbUrl = buildUTM(utm.base, { ...utm, source: utm.source||"facebook", medium: utm.medium||"social" });

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Social Post App — PWA</h1>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700" onClick={()=>{localStorage.clear(); location.reload();}}>Reset</button>
          </div>
        </header>

        <section className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-neutral-900 rounded-2xl p-4 shadow">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium">1) Sube tus videos/fotos</h2>
                <button className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500" onClick={()=>fileRef.current?.click()}>Seleccionar</button>
                <input ref={fileRef} type="file" className="hidden" accept="video/*,image/*" multiple onChange={e=>onFiles(e.target.files)} />
              </div>
              {files.length===0 ? (<p className="text-neutral-400 text-sm">No hay archivos aún. Sube MP4, MOV, JPG, PNG…</p>) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {files.map((f,i)=> (
                    <div key={i} className="bg-neutral-800 rounded-xl overflow-hidden shadow relative">
                      <div className="p-2 text-xs absolute right-0 top-0 bg-neutral-900/70"> {bytesToSize(f.size)} </div>
                      {f.type.startsWith("video") ? (<video src={f.url} className="w-full aspect-[9/16] object-cover" controls />) : (<img src={f.url} alt={f.name} className="w-full aspect-[9/16] object-cover" />)}
                      <div className="p-3 text-sm truncate" title={f.name}>{f.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-neutral-900 rounded-2xl p-4 shadow">
            <h2 className="text-lg font-medium mb-3">2) Plantillas & Hashtags</h2>
            <label className="text-xs uppercase tracking-wide text-neutral-400">Plantilla</label>
            <select className="w-full mt-1 mb-3 rounded-xl bg-neutral-800 p-2 outline-none" value={tpl} onChange={e=>setTpl(e.target.value)}>
              {templateLibrary.map(t=>(<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
            <label className="text-xs uppercase tracking-wide text-neutral-400">Hashtags</label>
            <select className="w-full mt-1 mb-3 rounded-xl bg-neutral-800 p-2 outline-none" value={hashKey} onChange={e=>setHashKey(e.target.value)}>
              {Object.keys(hashtagSets).map(k=>(<option key={k} value={k}>{k}</option>))}
            </select>
            <p className="text-xs text-neutral-400">Puedes editar el texto final en el panel de cada plataforma.</p>
          </div>
        </section>

        <section className="mt-6 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-neutral-900 rounded-2xl p-4 shadow">
            <h2 className="text-lg font-medium">3) Variables</h2>
            <div className="space-y-3 mt-3">
              {Object.keys(vars).map((k)=>(
                <div key={k}>
                  <label className="text-xs uppercase tracking-wide text-neutral-400">{k}</label>
                  <textarea className="mt-1 w-full rounded-xl bg-neutral-800 p-3 outline-none focus:ring-2 ring-blue-600 min-h-[60px]" value={vars[k]} onChange={(e)=>setVars({...vars,[k]:e.target.value})} />
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-neutral-900 rounded-2xl p-4 shadow">
            <h2 className="text-lg font-medium">4) Plantilla activa</h2>
            <textarea className="mt-2 w-full rounded-xl bg-neutral-800 p-3 outline-none focus:ring-2 ring-blue-600 min-h-[180px] font-mono text-sm" value={template} onChange={(e)=>setTemplate(e.target.value)} />
            <p className="text-xs text-neutral-400 mt-2">Variables: {Object.keys(vars).map(k=>`{{${k}}}`).join(", ")}</p>
          </div>
        </section>

        <section className="mt-6 grid md:grid-cols-2 gap-6">
          {Object.entries(platformPresets).map(([key, p]) => (
            <div key={key} className="bg-neutral-900 rounded-2xl p-4 shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold">{p.name}</h3>
                  <p className="text-xs text-neutral-400">Límite aprox: {p.maxCaption.toLocaleString()} caracteres</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm" onClick={()=>copy(captions[key])}>Copiar</button>
                  <a className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm" href={p.uploadUrl} target="_blank" rel="noreferrer">Abrir subida</a>
                </div>
              </div>
              <textarea className="mt-3 w-full rounded-2xl bg-neutral-800 p-3 outline-none focus:ring-2 ring-blue-600 min-h-[140px] text-sm" value={override[key] || captions[key]} onChange={(e)=>setOverride({...override,[key]:e.target.value})} />
              <div className="mt-2 flex flex-wrap gap-2">
                <a className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm" href={p.url} target="_blank" rel="noreferrer">Abrir {p.name}</a>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-6 bg-neutral-900 rounded-2xl p-4 shadow">
          <h2 className="text-lg font-medium">5) UTM Builder</h2>
          <div className="grid md:grid-cols-3 gap-4 mt-2">
            {["base","source","medium","campaign","content","term"].map((f)=>(
              <div key={f}>
                <label className="text-xs uppercase tracking-wide text-neutral-400">{f}</label>
                <input className="w-full mt-1 rounded-xl bg-neutral-800 p-2 outline-none" value={utm[f]||""} onChange={e=>setUtm({...utm,[f]:e.target.value})} />
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-3 text-sm">
            <div className="bg-neutral-800 p-3 rounded-xl">
              <div className="font-semibold mb-1">URLs rápidas por plataforma</div>
              <ul className="space-y-1">
                <li><a className="underline" href={buildUTM(utm.base,{...utm,source:utm.source||"instagram",medium:utm.medium||"social"})} target="_blank" rel="noreferrer">Instagram</a></li>
                <li><a className="underline" href={buildUTM(utm.base,{...utm,source:utm.source||"tiktok",medium:utm.medium||"social"})} target="_blank" rel="noreferrer">TikTok</a></li>
                <li><a className="underline" href={buildUTM(utm.base,{...utm,source:utm.source||"youtube",medium:utm.medium||"social"})} target="_blank" rel="noreferrer">YouTube</a></li>
                <li><a className="underline" href={buildUTM(utm.base,{...utm,source:utm.source||"facebook",medium:utm.medium||"social"})} target="_blank" rel="noreferrer">Facebook</a></li>
              </ul>
            </div>
            <div className="bg-neutral-800 p-3 rounded-xl">
              <div className="font-semibold mb-1">Tips de tracking</div>
              <ul className="list-disc ml-5 text-neutral-300">
                <li>Usa <code>utm_campaign</code> con fecha u oferta.</li>
                <li><code>utm_content</code> para distinguir creatividades.</li>
                <li>Acórtalo si lo necesitas.</li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="py-10 text-center text-xs text-neutral-500">
          Hecho con ❤️ — Social Post App PWA
        </footer>
      </div>
    </div>
  );
}
