# Tafelpret 🐾 — opzet (PWA)

Een app waarmee een kind (±9 jaar) de **tafels van 1 t/m 12** leert — van `1 × 1`
tot `12 × 12` — met een **schattig huisdierthema** en **gamification**: munten
verdienen, je huisdier voeren en verzorgen, en leuke kleertjes/accessoires kopen.

Gebouwd als **PWA (Progressive Web App)**: een website die je op de Android-tablet
kunt **installeren** als een echte app, volledig **offline** werkt en de spelstand
lokaal op het toestel bewaart.

> Live & installeerbaar: **https://aart-janboor.github.io/tafelpret-demo/**

---

## 1. Waarom een PWA (en niet Flutter)

Voor één Android-tablet van je eigen kind is een PWA de praktischste keuze:

| | PWA | Flutter |
|---|---|---|
| Installeren | Chrome → "App installeren", icoon op startscherm | APK bouwen + sideloaden, of Play Store |
| Store/account nodig | Nee | Play Store-account voor distributie |
| Signing-certificaat | Nee | Ja (keystore beheren) |
| Updates uitrollen | `git push` → app herladen | elke keer nieuwe APK overzetten |
| Offline | Ja (service worker) | Ja |
| Al gehost | Ja (GitHub Pages, gratis HTTPS) | Nee |

De spel-logica en schermen waren al als web-app gebouwd, dus de PWA is de kortste
weg naar iets dat je dochter **nu** op haar tablet kan installeren en gebruiken.

De keerzijde (minder "native" gevoel, geen Play Store-aanwezigheid) is voor een
persoonlijk app'je niet relevant.

---

## 2. Belangrijkste features

1. **Tafels oefenen 1–12**, elke tafel voor vermenigvuldiger 1–12.
2. **Specifieke tafels kiezen** — bv. alleen de tafel van 2, of een combinatie.
   Plus snelkeuzes ("Alles", "Makkelijk: 1, 2, 5, 10").
3. **Rondelengte** kiezen (5 / 10 / 20 vragen).
4. **Munten** verdienen per goed antwoord, met **streak-bonus** bij 3+ op rij.
5. **Huisdier**: kies er een (kat, hond, konijn, vos, draak, pinguïn) en geef het een
   naam. Het heeft een honger- en blijheidsbalk die langzaam zakken.
6. **Winkel**: 🍗 eten (vult honger), 🎾 speelgoed (maakt blij), 👒 kleertjes
   (koop één keer, daarna aan/uit; verschijnen op het dier).
7. **Voortgang** per tafel met sterren (3 niveaus).
8. **Geluid**: vrolijke geluidjes bij goed/fout, munten, voeren en een fanfare bij een
   mooi resultaat — met een mute-knop.

---

## 3. Installeren op de tablet

1. Open **https://aart-janboor.github.io/tafelpret-demo/** in **Chrome** op de tablet.
2. Chrome toont "App installeren" (of menu ⋮ → *Toevoegen aan startscherm* /
   *App installeren*). De app krijgt een eigen icoon en opent fullscreen, liggend.
3. Daarna werkt het **offline** — geen internet meer nodig.

De layout is **responsive** en schaalt mee met het scherm: op een tablet in
liggende stand (bv. 11 inch) komt het huisdier naast de knoppen te staan en worden de
tekst/knoppen groter. Op een telefoon valt alles terug naar één kolom.

---

## 4. Opslag van de spelstand (kind-proof)

De spelstand (huisdier, munten, bezit, voortgang) staat **lokaal op het toestel**;
geen account, geen server, geen internet.

- **IndexedDB** als hoofdopslag (robuuster dan localStorage).
- **`navigator.storage.persist()`** vraagt Android om de opslag niet op te ruimen bij
  opslagdruk — zodat het huisdier niet "zomaar verdwijnt".
- **localStorage** als goedkope spiegel + automatische migratie van een oude save.
- **Back-up / herstel**: exporteer de spelstand als bestandje en zet 'm terug
  (handig bij een nieuwe tablet). Knoppen staan onderaan het home-scherm.

Zie [`js/storage.js`](js/storage.js).

---

## 5. Geluid

Alle geluidjes worden **live gesynthetiseerd** met de Web Audio API
([`js/sound.js`](js/sound.js)) — geen audiobestanden, dus niets te downloaden en het
werkt offline. De AudioContext wordt ontgrendeld bij de eerste aanraking (browser-eis).
Een 🔊/🔇-knop in de balk zet geluid aan/uit; die keuze wordt onthouden.

---

## 6. Offline (service worker)

[`sw.js`](sw.js) cachet de app-shell (HTML/CSS/JS/icons) bij de installatie en serveert
die daarna **cache-first** met netwerk-fallback. Daardoor start de app direct en werkt
ze zonder internet. Bij een nieuwe versie wordt de `CACHE`-naam opgehoogd zodat oude
bestanden worden opgeruimd.

---

## 7. Bestandsstructuur

```
.
├── index.html            # de app (schermen)
├── manifest.json         # PWA-manifest (naam, icons, standalone, landscape)
├── sw.js                 # service worker (offline cache)
├── icons/                # app-icons (192, 512, maskable)
├── css/styles.css        # pastel, kindvriendelijk, responsive thema
└── js/
    ├── storage.js        # IndexedDB + persist + back-up/herstel
    ├── sound.js          # Web Audio geluidjes
    ├── pet.js            # huisdier: weergave, stats, praatjes
    ├── shop.js           # winkel: eten/speelgoed/kleertjes
    ├── quiz.js           # sommen genereren, antwoorden, munten, sterren
    └── app.js            # schermnavigatie + alles aan elkaar knopen
```

Bewust **vanilla HTML/CSS/JS**, geen build-stap en geen externe dependencies: makkelijk
te onderhouden, snel, en werkt gegarandeerd offline.

---

## 8. Didactiek — slim oefenen (volgende stap)

Nu oefent de app willekeurig binnen de gekozen tafels. Daarna een lichte **adaptieve**
laag: foute/trage sommen vaker terug laten komen (spaced-repetition-light), en een
"baas-ronde" per tafel op tijd voor de 3e ster. Zo blijft het leereffect hoog zonder
dat het als toets voelt.

---

## 9. Roadmap

**Klaar (MVP):**
- [x] Adopteren + home met levend huisdier (balken, aaien)
- [x] Tafels kiezen (incl. specifieke tafel) + rondelengte
- [x] Oefenen met cijferpad, feedback, streak, munten
- [x] Resultaat met sterren + confetti
- [x] Winkel: eten, speelgoed, kleertjes (zichtbaar op het dier)
- [x] Voortgang per tafel
- [x] Geluid + mute-knop
- [x] Installeerbaar (PWA) + offline + IndexedDB-opslag + back-up
- [x] Responsive layout (telefoon → tablet landscape)

**Volgende stappen:**
- [ ] Adaptief oefenen (foute sommen vaker, spaced repetition)
- [ ] "Baas-ronde" per tafel op tijd → 3e ster + speciaal item
- [ ] Meer kleertjes/accessoires en een 2e huisdier vrij te spelen
- [ ] Dag-streak / kleine dagelijkse beloning
- [ ] Optioneel ouder-slot (rekensom-poortje) voor instellingen/reset
- [ ] Deelbare tafels / optellen-aftrekken als extra modus

---

## 10. Privacy

Geen advertenties, geen in-app aankopen, geen tracking, geen account. Alle gegevens
blijven lokaal op de tablet.
