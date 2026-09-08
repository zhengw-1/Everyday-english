// V56: keep only the icon cached. HTML, JavaScript, CSS, and lesson audio use the network path.
const CACHE='elder-english-static-v56';
const ROOT=new URL(self.registration.scope).pathname.replace(/\/$/,'');
const STATIC_ASSETS=[`${ROOT}/icon.svg`];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC_ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('elder-english-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const request=event.request;const url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin)return;if(request.mode==='navigate')return;if(!STATIC_ASSETS.includes(url.pathname))return;event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));});
