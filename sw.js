/*
 * Servicewerker van Denkwerk. Dit is het sjabloon; bron/bouw.py vult het
 * versienummer in en schrijft publiceren/sw.js.
 *
 * Netwerk eerst, cache als terugval: met bereik krijg je altijd de nieuwste
 * versie, zonder bereik de laatste die je hebt gezien. De passages (data.json)
 * worden bij het installeren meteen meegenomen, zodat de hele app na één keer
 * openen ook in de trein werkt.
 *
 * Let op: gertveurink.github.io is ook het adres van Dagstart en De Dag. Deze
 * werker ruimt daarom alleen caches op die met 'denkwerk-' beginnen. Maak daar
 * nooit "alle oude caches" van — dan gooi je die van de andere apps weg.
 */
const VERSIE = 'denkwerk-8199109a88';
const BESTANDEN = ['./', './index.html', './data.json', './manifest.webmanifest',
                   './icoon-180.png', './icoon-192.png', './icoon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSIE);
    await cache.addAll(BESTANDEN);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const namen = await caches.keys();
    await Promise.all(namen.filter((n) => n.startsWith('denkwerk-') && n !== VERSIE)
                           .map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const verzoek = e.request;
  if (verzoek.method !== 'GET' || new URL(verzoek.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSIE);
    try {
      // 'no-cache': eerst bij de server navragen, ook als de browser het
      // bestand nog bewaard heeft. GitHub Pages zegt "tien minuten bewaren",
      // en zonder dit kreeg je na een nieuwe versie nog zo lang de oude. Is er
      // niets veranderd, dan antwoordt de server met een kaal "304" en kost
      // het vrijwel niets.
      const vers = await fetch(verzoek, { cache: 'no-cache' });
      if (vers.ok) cache.put(verzoek, vers.clone());
      return vers;
    } catch (fout) {
      const bewaard = await cache.match(verzoek, { ignoreSearch: true });
      if (bewaard) return bewaard;
      throw fout;
    }
  })());
});
