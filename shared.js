/* ==========================================================
   VAULT — shared data, state, and helpers
   Loaded by every page. State persists across pages via
   localStorage so Shop -> Rip -> Collection stays in sync.
   ========================================================== */

const RARITIES = [
  { id:"common",    label:"Common",    glyphs:["●","▪","○"], valueRange:[8,20]    },
  { id:"rare",      label:"Rare",      glyphs:["◆","✦","◈"], valueRange:[25,60]   },
  { id:"epic",      label:"Epic",      glyphs:["✷","❖","✸"], valueRange:[70,160]  },
  { id:"legendary", label:"Legendary", glyphs:["★","☆","✹"], valueRange:[200,450] },
  { id:"mythic",    label:"Mythic",    glyphs:["◉","✺","❉"], valueRange:[600,1500]}
];
const RARITY_ORDER = ["mythic","legendary","epic","rare","common"];

const NAME_PARTS = {
  prefix:["Iron","Void","Solar","Ashen","Crimson","Gilded","Hollow","Storm","Obsidian","Wraith","Ember","Frost","Rogue","Sable","Verdant"],
  noun:["Warden","Cipher","Relic","Sentinel","Oracle","Marauder","Construct","Effigy","Harbinger","Specter","Engine","Totem","Wyrm","Vanguard","Idol"]
};

function makeCardPool(){
  const pool = [];
  RARITIES.forEach(r=>{
    NAME_PARTS.prefix.forEach((p,i)=>{
      const step = r.id==="mythic"?5: r.id==="legendary"?3: r.id==="epic"?2:1;
      if (i % step === 0){
        const n = NAME_PARTS.noun[(i+RARITIES.indexOf(r)) % NAME_PARTS.noun.length];
        pool.push({ id:r.id+"-"+p+"-"+n, name:p+" "+n, rarity:r.id, glyph:r.glyphs[i % r.glyphs.length] });
      }
    });
  });
  return pool;
}
const CARD_POOL = makeCardPool();

const PACKS = [
  { id:"standard", name:"Standard Pack", tier:"Entry",      price:50,  ceiling:60,   odds:{common:70,rare:23,epic:6,legendary:0.9,mythic:0.1} },
  { id:"premium",  name:"Premium Pack",  tier:"Mid-Tier",   price:150, ceiling:450,  odds:{common:45,rare:35,epic:16,legendary:3.5,mythic:0.5} },
  { id:"elite",    name:"Elite Pack",    tier:"High Roller",price:400, ceiling:1500, odds:{common:20,rare:35,epic:32,legendary:11,mythic:2} }
];

/* ---------------- State persistence ---------------- */
const STORAGE_KEY = "vault_state_v1";

function defaultState(){
  return {
    balance: 1000,
    collection: [],   // [{uid,name,rarity,glyph,value,ts}]
    unopened: [],     // [{uid,packId}]
    firstVisit: true
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  } catch(e){
    return defaultState();
  }
}

function saveState(state){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch(e){ /* storage unavailable — state just won't persist */ }
}

/* ---------------- Helpers ---------------- */
function fmt(n){ return n.toLocaleString(); }
function rarityMeta(id){ return RARITIES.find(r=>r.id===id); }
function randRange([a,b]){ return Math.floor(a + Math.random()*(b-a)); }
function uid(){ return Date.now()+"-"+Math.random().toString(36).slice(2,7); }

function pullCard(pack){
  const roll = Math.random()*100;
  let acc = 0, chosenRarity = "common";
  for (const r of RARITIES){
    acc += pack.odds[r.id];
    if (roll <= acc){ chosenRarity = r.id; break; }
  }
  const candidates = CARD_POOL.filter(c=>c.rarity===chosenRarity);
  const base = candidates[Math.floor(Math.random()*candidates.length)];
  const meta = rarityMeta(chosenRarity);
  return {
    uid: uid(),
    name: base.name,
    rarity: chosenRarity,
    glyph: base.glyph,
    value: randRange(meta.valueRange),
    ts: Date.now()
  };
}

function toast(msg){
  let t = document.getElementById("toast");
  if (!t){
    t = document.createElement("div");
    t.id = "toast"; t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._h);
  toast._h = setTimeout(()=>t.classList.remove("show"), 1800);
}

/* ---------------- HUD (shared header, injected on every page) ---------------- */
function renderHud(state, currentPage){
  const mount = document.getElementById("hud");
  if (!mount) return;
  const pages = [
    {id:"start", href:"start.html", label:"Start"},
    {id:"shop", href:"shop.html", label:"Pack Shop"},
    {id:"rip", href:"rip.html", label:"Rip Pack"},
    {id:"collection", href:"collection.html", label:"Collection"}
  ];
  mount.innerHTML = `
    <div class="brand">
      <span class="mark">Zetsumetsu Arcade</span>
      <h1>VAULT<span>.</span></h1>
    </div>
    <nav>
      ${pages.map(p=>`<a class="navlink ${p.id===currentPage?'current':''}" href="${p.href}">${p.label}</a>`).join("")}
    </nav>
    <div class="balance">
      <div class="label">Chips</div>
      <div class="amt mono">${fmt(state.balance)}</div>
    </div>
  `;
}
