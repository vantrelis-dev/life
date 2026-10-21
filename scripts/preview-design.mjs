// Loopback-only visual QA. scripts/ is not part of Vercel's dist output.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('dist');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://127.0.0.1');
    if(url.pathname==='/mobile'){
      res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
      return res.end('<!doctype html><html lang="es"><meta charset="utf-8"><title>Life · Mobile QA</title><body style="margin:0;background:#d9dce3;display:flex;justify-content:center"><iframe title="Life móvil · datos de prueba" src="/" style="width:390px;height:844px;border:0;background:white"></iframe></body></html>');
    }
    if(url.pathname==='/__qa/preview.js'){
      res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});return res.end(await readFile(new URL('./design-fixture.js',import.meta.url)));
    }
    const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if(!path.startsWith(root+'/')){res.writeHead(404);return res.end();}
    let data=await readFile(path);
    if(path.endsWith('/index.html'))data=data.toString().replace('<script src="config.js" defer></script>','').replace('<script src="cloud-client.js" defer></script>','<script src="/__qa/preview.js" defer></script>');
    res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(8896,'127.0.0.1',()=>console.log('Design QA only: http://127.0.0.1:8896 — no account access or cloud writes.'));
