/* shop.js — de winkel: eten (verbruik), speelgoed (verbruik) en kleertjes (bezit + dragen). */

const SHOP_CATALOG = [
  // Eten — vult honger, wordt verbruikt
  { id: 'apple',  cat: 'food', emoji: '🍎', name: 'Appel',   price: 3,  food: 15 },
  { id: 'fish',   cat: 'food', emoji: '🐟', name: 'Visje',   price: 5,  food: 25 },
  { id: 'bone',   cat: 'food', emoji: '🦴', name: 'Botje',   price: 5,  food: 25 },
  { id: 'carrot', cat: 'food', emoji: '🥕', name: 'Wortel',  price: 4,  food: 20 },
  { id: 'cake',   cat: 'food', emoji: '🍰', name: 'Taart',   price: 10, food: 50 },
  { id: 'cookie', cat: 'food', emoji: '🍪', name: 'Koekje',  price: 4,  food: 18 },

  // Speelgoed — maakt blij, wordt verbruikt
  { id: 'ball',   cat: 'toy', emoji: '🎾', name: 'Bal',      price: 6,  happy: 25 },
  { id: 'yarn',   cat: 'toy', emoji: '🧶', name: 'Bol wol',  price: 6,  happy: 25 },
  { id: 'frisbee',cat: 'toy', emoji: '🥏', name: 'Frisbee',  price: 8,  happy: 35 },
  { id: 'teddy',  cat: 'toy', emoji: '🧸', name: 'Knuffel',  price: 12, happy: 50 },

  // Kleertjes — koop één keer, daarna aan/uit zetten. 'slot' bepaalt de plek.
  { id: 'tophat', cat: 'wear', emoji: '🎩', name: 'Hoge hoed', price: 20, slot: 'hat' },
  { id: 'crown',  cat: 'wear', emoji: '👑', name: 'Kroon',     price: 50, slot: 'hat' },
  { id: 'party',  cat: 'wear', emoji: '🥳', name: 'Feesthoed', price: 15, slot: 'hat' },
  { id: 'bow',    cat: 'wear', emoji: '🎀', name: 'Strik',     price: 15, slot: 'neck' },
  { id: 'scarf',  cat: 'wear', emoji: '🧣', name: 'Sjaal',     price: 18, slot: 'neck' },
  { id: 'glasses',cat: 'wear', emoji: '🕶️', name: 'Zonnebril', price: 22, slot: 'item' },
  { id: 'flower', cat: 'wear', emoji: '🌸', name: 'Bloemetje', price: 12, slot: 'item' },
  { id: 'balloon',cat: 'wear', emoji: '🎈', name: 'Ballon',    price: 14, slot: 'item' },
];

const SHOP_INDEX = Object.fromEntries(SHOP_CATALOG.map(i => [i.id, i]));

let currentShopTab = 'food';

function renderShop() {
  const wrap = document.getElementById('shopItems');
  wrap.innerHTML = '';
  SHOP_CATALOG.filter(i => i.cat === currentShopTab).forEach(item => {
    const card = document.createElement('div');
    card.className = 'shop-card';

    const isWear = item.cat === 'wear';
    const owned = State.owned[item.id];
    const worn = isWear && State.worn[item.slot] === item.id;

    let btnLabel, btnClass = 'shop-buy', disabled = false;
    if (isWear && worn) { btnLabel = 'Aan ✓'; btnClass += ' worn'; }
    else if (isWear && owned) { btnLabel = 'Draag'; btnClass += ' owned'; }
    else {
      btnLabel = `🪙 ${item.price}`;
      disabled = State.coins < item.price;
    }

    card.innerHTML = `
      <div class="shop-emoji">${item.emoji}</div>
      <div class="shop-name">${item.name}</div>
      <button class="${btnClass}" ${disabled ? 'disabled' : ''}>${btnLabel}</button>
    `;
    card.querySelector('button').onclick = () => handleShopClick(item);
    wrap.appendChild(card);
  });
}

function handleShopClick(item) {
  if (item.cat === 'wear') {
    if (State.worn[item.slot] === item.id) {          // al aan -> uitdoen
      State.worn[item.slot] = null;
    } else if (State.owned[item.id]) {                // bezit -> aandoen
      State.worn[item.slot] = item.id;
    } else if (State.coins >= item.price) {           // kopen + aandoen
      State.coins -= item.price;
      State.owned[item.id] = true;
      State.worn[item.slot] = item.id;
    }
    saveState(State);
    renderShop();
    renderPet();
    return;
  }

  // Eten of speelgoed: kopen en meteen gebruiken
  if (State.coins < item.price) return;
  State.coins -= item.price;
  if (item.food) feedPet(item.food);
  if (item.happy) playWithPet(item.happy);
  saveState(State);
  bounceShopPet(item);
  renderShop();
  document.getElementById('coinCount').textContent = State.coins;
}

function bounceShopPet(item) {
  // Korte vreugde-flits in de topbar bij consumptie
  const tag = document.getElementById('topPetFace');
  tag.textContent = item.food ? '😋' : '🥰';
  setTimeout(() => { tag.textContent = State.pet.face; }, 900);
}
