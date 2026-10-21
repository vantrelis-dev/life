/* Visual preferences are local to this browser, separate from private agenda data. */
(function(root){
  'use strict';
  const PREF_KEY='life.interface.v1';
  const pages=['agenda','goals','habits','decisions','finance'];
  const views=['day','week','month','matrix'];
  function preferences(value){
    return {collapsed:value?.collapsed===true,theme:['light','dark'].includes(value?.theme)?value.theme:'light'};
  }
  function route(value,today){
    const d=String(value?.date||'');
    const validDate=/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d+'T12:00:00Z'))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
    return {page:pages.includes(value?.page)?value.page:'agenda',view:views.includes(value?.view)?value.view:'day',date:validDate?d:today,company:/^[\w-]{1,80}$/.test(value?.company||'')?value.company:'all'};
  }
  const paths={
    menu:'M4 6h16M4 12h16M4 18h16',
    fold:'M9 4v16M15 8l-4 4 4 4M4 4h16v16H4z',
    agenda:'M7 3v4m10-4v4M4 10h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z',
    goals:'M20 12a8 8 0 1 1-8-8m0 4a4 4 0 1 0 4 4m-4 0 9-9m-5 0h5v5',
    habits:'M4 10a8 8 0 0 1 13-4l3 3m0-5v5h-5M20 14a8 8 0 0 1-13 4l-3-3m0 5v-5h5',
    decisions:'M12 3v6m-6 6 6-6 6 6M6 15v6m12-6v6M3 21h6m6 0h6',
    finance:'M4 6h16v14H4zM4 10h16m-5 4h5M7 3h10',
    projects:'M3 6h7l2 3h9v11H3zM3 6V4h7l2 2h7v3',
    repeats:'M4 9h16m-3-3 3 3-3 3M20 15H4m3-3-3 3 3 3',
    import:'M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6',
    print:'M7 8V3h10v5M7 16H3V8h18v8h-4M7 13h10v8H7zm10-2h1',
    info:'M12 11v6m0-10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    moon:'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z',
    sun:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    connect:'M8 8 5 11a4 4 0 0 0 6 6l3-3m2 2 3-3a4 4 0 0 0-6-6l-3 3m-2 6 8-8'
  };
  function icon(name){return '<svg class="nav-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+`<path d="${paths[name]||paths.agenda}"/>`+'</svg>';}
  let prefs=preferences({}),initialized=false,lastRoute='',navigate=null;
  function readRoute(today){
    if(!root.location)return route({},today);
    return route(Object.fromEntries(new URLSearchParams(root.location.search)),today);
  }
  function init(){
    if(initialized||!root.document?.querySelector('.sidebar'))return;
    initialized=true;
    const doc=root.document,sidebar=doc.querySelector('.sidebar'),shell=doc.querySelector('.shell'),toggle=doc.querySelector('#navigation-toggle');
    const mobile=root.matchMedia('(max-width: 760px)');
    try{prefs=preferences(JSON.parse(root.localStorage.getItem(PREF_KEY)||'{}'));}catch{}
    const dialog=doc.createElement('dialog');dialog.id='navigation-dialog';dialog.className='navigation-dialog';dialog.setAttribute('aria-label','Menú de Life');
    dialog.innerHTML='<div class="mobile-menu-head"><span>Life · Mi espacio</span><button type="button" class="icon" aria-label="Cerrar menú">×</button></div>';
    doc.body.append(dialog);
    // app.js first renders behind the access gate, where offsets are zero.
    // Position the notebook only once, after the verified session reveals it.
    const reveal=new root.MutationObserver(()=>{
      if(doc.documentElement.classList.contains('life-locked'))return;
      reveal.disconnect();
      root.requestAnimationFrame(()=>{
        const timeline=doc.querySelector('#day-agenda')||doc.querySelector('#week-hours');
        const morning=timeline?.querySelector('[data-slot-time="07:00"]');
        if(morning)timeline.scrollTop=morning.offsetTop;
        const wrap=doc.querySelector('#week-wrap');
        const selected=new URLSearchParams(root.location.search).get('date');
        const column=wrap&&[...wrap.querySelectorAll('.day-column')].find(el=>el.dataset.dropDate===selected);
        if(column&&root.innerWidth<600)wrap.scrollLeft=column.offsetLeft-wrap.offsetLeft-16;
      });
    });
    reveal.observe(doc.documentElement,{attributes:true,attributeFilter:['class']});
    function store(){try{root.localStorage.setItem(PREF_KEY,JSON.stringify(prefs));}catch{}}
    function theme(){
      doc.documentElement.dataset.theme=prefs.theme;
      const button=doc.querySelector('#theme-toggle'),dark=prefs.theme==='dark';
      button.innerHTML=icon(dark?'sun':'moon')+'<span class="nav-label">Modo '+(dark?'claro':'oscuro')+'</span>';
      button.title='Cambiar a modo '+(dark?'claro':'oscuro');button.setAttribute('aria-label',button.title);
      doc.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#181a20':'#f7f8fa');
    }
    function layout(){
      const small=mobile.matches;
      doc.documentElement.classList.toggle('navigation-collapsed',!small&&prefs.collapsed);
      if(small){if(sidebar.parentElement!==dialog)dialog.append(sidebar);}
      else{if(dialog.open)dialog.close();if(sidebar.parentElement!==shell)shell.prepend(sidebar);}
      const expanded=small?dialog.open:!prefs.collapsed;
      toggle.innerHTML=icon(small?'menu':'fold');toggle.setAttribute('aria-expanded',String(expanded));
      toggle.setAttribute('aria-label',small?'Abrir menú':expanded?'Plegar menú':'Expandir menú');toggle.title=toggle.getAttribute('aria-label');
    }
    toggle.addEventListener('click',()=>{if(mobile.matches){dialog.showModal();layout();}else{prefs.collapsed=!prefs.collapsed;store();layout();}});
    const close=()=>{if(dialog.open)dialog.close();layout();};
    dialog.querySelector('button').addEventListener('click',close);
    dialog.addEventListener('close',layout);
    dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
    // Close before an app action opens its own dialog, avoiding nested modals.
    sidebar.addEventListener('click',event=>{if(mobile.matches&&event.target.closest('button')&&!event.target.closest('#theme-toggle'))close();},true);
    mobile.addEventListener('change',layout);
    doc.querySelector('#theme-toggle').addEventListener('click',()=>{prefs.theme=prefs.theme==='dark'?'light':'dark';store();theme();});
    doc.querySelector('#connections-button').innerHTML=icon('connect');
    doc.querySelectorAll('.primary-navigation [data-page]').forEach(button=>{button.insertAdjacentHTML('afterbegin',icon(button.dataset.page));button.title=button.textContent.trim();button.setAttribute('aria-label',button.title);});
    doc.querySelector('#open-decisions').insertAdjacentHTML('afterbegin',icon('decisions'));
    doc.querySelector('#open-decisions').title='Decisiones';doc.querySelector('#open-decisions').setAttribute('aria-label','Decisiones');
    root.addEventListener('popstate',()=>{const next=readRoute(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota'}).format(new Date()));lastRoute=JSON.stringify(next);navigate?.(next);});
    theme();layout();
  }
  function refresh(current){
    init();
    const doc=root.document;if(!doc)return;
    const names={agenda:'Agenda',goals:'Metas',habits:'Rutinas',decisions:'Decisiones',finance:'Finanzas'};
    doc.querySelector('#navigation-location').textContent=names[current.page];
    doc.querySelectorAll('.primary-navigation button').forEach(button=>{
      const active=(button.dataset.page||'decisions')===current.page;
      button.classList.toggle('active',active);
      if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    });
    const tools={'open-projects':['projects','Proyectos'],'open-repeats':['repeats','Recurrentes'],'open-import':['import','Importar'],'print-button':['print','Imprimir'],'demo-info':['info','Sobre Life']};
    for(const [id,[name,label]] of Object.entries(tools)){
      const button=doc.getElementById(id);if(button&&!button.dataset.decorated){button.innerHTML=icon(name)+'<span class="nav-label">'+label+'</span>';button.dataset.decorated='true';button.title=label;button.setAttribute('aria-label',label);}
    }
    const finance=doc.querySelector('.side-bottom [data-page="finance"]');
    if(!finance.dataset.decorated){finance.insertAdjacentHTML('afterbegin',icon('finance'));finance.dataset.decorated='true';finance.setAttribute('aria-label','Finanzas · Para después');}
    const value=JSON.stringify(current);
    if(value!==lastRoute){
      const url=new URL(root.location.href);for(const key of ['page','view','date','company'])url.searchParams.set(key,current[key]);
      // Do not touch Supabase's authentication fragment or unrelated query parameters.
      root.history[lastRoute?'pushState':'replaceState']({life:true},'',url);
      lastRoute=value;
    }
  }
  const api={preferences,route,readRoute,refresh,init,setNavigate:fn=>{navigate=fn;}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root.document){root.LifeInterface=api;if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});else init();}
})(typeof window!=='undefined'?window:globalThis);
