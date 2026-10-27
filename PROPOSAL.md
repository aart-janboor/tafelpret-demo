# Tafelpret 🐾 — Voorstel & opzet

Een tablet-app waarmee een kind (±9 jaar) de **tafels van 1 t/m 12** leert — van `1 × 1`
tot `12 × 12` — met een **schattig huisdierthema** en **gamification**: munten verdienen,
je huisdier voeren en verzorgen, en leuke kleertjes/accessoires kopen.

Dit document beschrijft **hoe ik de app zou opzetten** als Flutter tablet-app. De
**klikbare mockup** in [`mockups/web-prototype/`](mockups/web-prototype/) laat alle
schermen en de speelmechaniek nu al werkend zien en dient als visuele spec.

---

## 1. Doel & uitgangspunten

| Wat | Keuze |
|---|---|
| Doelgroep | 1 kind, ~9 jaar, Nederlandstalig |
| Platform | Tablet (Android eerst; iPad met dezelfde codebase mogelijk) |
| Oriëntatie | Landscape (tablet in liggende stand) |
| Internet | **Niet nodig** — volledig offline, geen account, geen backend |
| Verdienmodel | Geen. Geen advertenties, geen in-app aankopen, geen tracking |
| Data | Alles lokaal op het toestel |

De pedagogische kern is simpel en bewezen: **veel korte oefenrondes**, directe
positieve feedback, en een extrinsieke beloning (het huisdier) die motiveert om te
blijven oefenen.

---

## 2. Belangrijkste features

1. **Tafels oefenen 1–12**, elke tafel voor vermenigvuldiger 1–12.
2. **Specifieke tafels kiezen** — bv. alleen de tafel van 2, of een combinatie
   (2, 3 en 10). Plus snelkeuzes ("Alles", "Makkelijk: 1, 2, 5, 10").
3. **Rondelengte** kiezen (5 / 10 / 20 vragen).
4. **Munten** verdienen per goed antwoord, met **streak-bonus** bij 3+ op rij.
5. **Huisdier**: kies er een (kat, hond, konijn, vos, draak, pinguïn) en geef het een
   naam. Het heeft een **honger-** en **blijheidsbalk** die langzaam zakken.
6. **Winkel** met drie categorieën:
   - 🍗 **Eten** (verbruik → vult honger),
   - 🎾 **Speelgoed** (verbruik → maakt blij),
   - 👒 **Kleertjes** (koop één keer, daarna aan/uit zetten; verschijnen op het dier).
7. **Voortgang** per tafel met **sterren** (3 niveaus o.b.v. aantal goede antwoorden).

---

## 3. Waarom Flutter (tablet)

- **Één codebase** voor Android-tablet én iPad, plus web voor snelle previews.
- **Uitstekend voor speelse, geanimeerde UI** — precies wat een kinderapp nodig heeft
  (custom painters, impliciete animaties, Rive/Lottie voor het huisdier).
- **Offline-first** past perfect: geen netwerk, lokale opslag, snelle start.
- Jij hebt al een Flutter-tablet-setup (`~/kidsapp`), dus toolchain en workflow zijn
  bekend.

---

## 4. Architectuur

**Feature-first, met een dunne domein-/datalaag.** Geen over-engineering — de app is
offline en klein, dus de complexiteit zit in de *presentatie* (animaties, feedback),
niet in de data.

```
Presentation (screens + widgets)
        │  leest/schrijft via
        ▼
   State (Riverpod providers)   ← pet, wallet, quiz-sessie, inventory, mastery
        │  roept aan
        ▼
   Domain (pure Dart models + regels: QuestionGenerator, MasteryRules, ShopRules)
        │  persist via
        ▼
   Data (Hive/Isar repository)  ← één lokale save-state
```

### State management: **Riverpod**
Licht, testbaar, geen `BuildContext`-gedoe voor logica. Per domein een provider:
- `petProvider` — huisdierstatus (honger, blijheid, naam, soort, gedragen items).
- `walletProvider` — munten.
- `inventoryProvider` — bezit + welke kleertjes aan staan.
- `masteryProvider` — goede antwoorden per tafel → sterren.
- `quizControllerProvider` — de actieve oefenronde (vragen, index, streak, score).

### Persistentie: **Hive** (of Isar)
Eén `SaveState`-object dat na elke relevante actie wordt weggeschreven. Hive is simpel
en snel; Isar als we later queries/statistiek willen. Tijd-verval van de balken wordt
berekend uit `lastSeen` bij het opstarten (zoals in de mockup).

---

## 5. Datamodel (domein)

```dart
enum PetType { cat, dog, rabbit, fox, dragon, penguin }
enum ItemCategory { food, toy, wear }
enum WearSlot { hat, neck, item }

class Pet {
  PetType type;
  String name;
  double food;    // 0..100
  double happy;   // 0..100
}

class ShopItem {
  String id;
  ItemCategory category;
  String label;          // emoji of asset-key
  String name;
  int price;
  int? foodBoost;        // voor food
  int? happyBoost;       // voor toy
  WearSlot? slot;        // voor wear
}

class Inventory {
  Set<String> ownedItemIds;
  Map<WearSlot, String?> worn;   // welke kleertjes het dier draagt
}

class Mastery {
  Map<int, int> correctByTable;  // tafel(1..12) -> aantal goed
  int starsFor(int table);       // 0..3
}

class Question { int a; int b; int get answer => a * b; }

class SaveState {
  Pet? pet;
  int coins;
  Inventory inventory;
  Mastery mastery;
  DateTime lastSeen;
}
```

De domeinregels (puur, los van UI/opslag en dus goed te unit-testen):
- `QuestionGenerator.build(tables, length)` — shuffelt `a×b` voor gekozen tafels.
- `MasteryRules.stars(count)` — `≥10→1`, `≥25→2`, `≥50→3` ster.
- `ShopRules` — koop/draag/verbruik-logica.
- `Decay.apply(state, now)` — honger/blijheid laten zakken over tijd.

Deze regels staan 1-op-1 in de mockup (`js/quiz.js`, `js/shop.js`, `js/pet.js`) en zijn
direct te porten naar Dart.

---

## 6. Schermen (flow)

Alle schermen bestaan al werkend in de mockup; dit is de 1-op-1 Flutter-mapping:

| # | Scherm | Mockup | Flutter widget |
|---|--------|--------|----------------|
| 1 | **Adopteren** (eerste keer) | `screen-adopt` | `AdoptScreen` |
| 2 | **Home / verzorgen** (huisdier + balken) | `screen-home` | `HomeScreen` |
| 3 | **Tafels kiezen** | `screen-practice` | `PracticeSetupScreen` |
| 4 | **Oefenen** (som + cijfertoetsen) | `screen-quiz` | `QuizScreen` |
| 5 | **Resultaat** (score, munten, sterren, confetti) | `screen-result` | `ResultScreen` |
| 6 | **Winkel** (eten/speelgoed/kleertjes) | `screen-shop` | `ShopScreen` |
| 7 | **Voortgang** (sterren per tafel) | `screen-progress` | `ProgressScreen` |

Navigatie met `go_router`. Topbalk (munten + huisdiernaam) is een gedeelde widget.

---

## 7. Didactiek — slim oefenen (fase 2)

MVP oefent willekeurig binnen de gekozen tafels. Daarna een lichte **adaptieve** laag:
- Per som bijhouden hoe vaak goed/fout en hoe snel → **foute/trage sommen vaker**
  terug laten komen (spaced-repetition-light).
- Optioneel "Baas-ronde" per tafel: 12 sommen op tijd → 3e ster + speciaal item.
- Tafel pas als "gehaald" markeren bij consistent goed, niet bij één toevalstreffer.

Dit houdt het leereffect hoog zonder dat het kind het als "toets" ervaart.

---

## 8. Gamification-economie (balans)

Belangrijk dat belonen motiveert maar niet te snel "klaar" is:
- **+1 munt** per goed antwoord, **+2** bij streak ≥ 3.
- Eten 3–10 munten, speelgoed 6–12, kleertjes 12–50 (kroon = duur spaardoel 👑).
- Balken zakken traag (honger ~3/uur, blijheid ~2/uur) → aanleiding om terug te komen,
  maar **nooit straffend**: het huisdier gaat niet "dood", het wordt alleen verdrietig
  en dat is weer snel goed te maken.

Dit zijn startwaarden; makkelijk te tunen na observeren hoe ze speelt.

---

## 9. Kind- & oudervriendelijk

- **Geen** advertenties, in-app aankopen, externe links of dataverzameling.
- Grote knoppen, korte teksten, veel positieve feedback, geluid aan/uit.
- Toegankelijk: duidelijk contrast, groot lettertype; later eventueel voorleesfunctie.
- Optioneel simpel **ouder-slot** (rekensom-poortje) voor instellingen/reset.

---

## 10. Packages (voorstel)

| Doel | Package |
|---|---|
| State management | `flutter_riverpod` |
| Navigatie | `go_router` |
| Lokale opslag | `hive` + `hive_flutter` (of `isar`) |
| Huisdier-animaties | `rive` of `lottie` (fallback: emoji + `AnimatedScale`) |
| Confetti | `confetti` |
| Geluid | `audioplayers` |
| Codegeneratie (models) | `freezed` + `json_serializable` (optioneel) |

---

## 11. Voorgestelde mappenstructuur

```
lib/
├── main.dart
├── app.dart                     # MaterialApp.router + thema
├── core/
│   ├── theme.dart               # kleuren, tekststijlen (pastel, rond)
│   └── router.dart              # go_router routes
├── data/
│   ├── save_state.dart          # Hive model + adapter
│   └── save_repository.dart     # laden/opslaan
├── domain/
│   ├── pet.dart
│   ├── shop_item.dart
│   ├── shop_catalog.dart        # de vaste itemlijst
│   ├── question.dart
│   ├── question_generator.dart
│   ├── mastery_rules.dart
│   └── decay.dart
├── state/
│   ├── pet_provider.dart
│   ├── wallet_provider.dart
│   ├── inventory_provider.dart
│   ├── mastery_provider.dart
│   └── quiz_controller.dart
└── features/
    ├── adopt/adopt_screen.dart
    ├── home/home_screen.dart
    ├── home/widgets/pet_stage.dart
    ├── practice/practice_setup_screen.dart
    ├── quiz/quiz_screen.dart
    ├── quiz/widgets/number_pad.dart
    ├── result/result_screen.dart
    ├── shop/shop_screen.dart
    └── progress/progress_screen.dart
```

Een startpunt (pubspec + domeinmodellen) staat in [`flutter_app/`](flutter_app/).

---

## 12. Roadmap

**MVP (kern)** — speelbaar en leuk:
- [ ] Adopteren + home met levend huisdier (balken, aaien)
- [ ] Tafels kiezen (incl. specifieke tafel) + rondelengte
- [ ] Oefenen met cijfertoetsen, feedback, streak, munten
- [ ] Resultaat met sterren + confetti
- [ ] Winkel: eten, speelgoed, kleertjes (dragen zichtbaar op dier)
- [ ] Voortgang per tafel + lokale opslag

**Fase 2 — verdieping:**
- [ ] Adaptief oefenen (foute sommen vaker, spaced repetition)
- [ ] "Baas-ronde" per tafel op tijd → 3e ster
- [ ] Geluid + Rive-animaties voor het huisdier
- [ ] Meer kleertjes/accessoires en een 2e huisdier vrij te spelen
- [ ] Dag-streak / kleine dagelijkse beloning

**Fase 3 — leuk extra:**
- [ ] Deelbare tafels (delen) en optellen/aftrekken als aparte modus
- [ ] Ouder-dashboardje (welke tafels gaan goed/minder)

---

## 13. Zo begin je

```bash
cd flutter_app
flutter create .            # genereert de platform-mappen (android/ios/…)
flutter pub add flutter_riverpod go_router hive hive_flutter confetti audioplayers
flutter run                 # op aangesloten tablet/emulator
```

De klikbare mockup bekijk je zonder iets te installeren:

```bash
cd mockups/web-prototype
python3 -m http.server 8000     # open daarna http://localhost:8000
```

…of open `mockups/web-prototype/index.html` direct in een browser.
