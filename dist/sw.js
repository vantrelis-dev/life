// Cache only public application files. Never cache Auth, API responses or user data.
const VERSION='life-shell-v1';
const FILES=['/','/index.html','/base.css','/style.css','/brand.css','/notebook.css','/cloud.css','/model.js','/notebook-view.js','/app.js','/config.js','/cloud-client.js','/manifest.webmanifest','/icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('life-shell-')&&key!==VERSION).map(key=>caches.delete(key))))));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!FILES.includes(url.pathname)||url.search)return;
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(VERSION).then(cache=>cache.put(url.pathname,copy)));}return response;}).catch(()=>caches.match(url.pathname)));
});
