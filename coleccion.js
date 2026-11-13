// Interactive shelf movement adapted from Product Shelf by Aakash Mehra.
const $=id=>document.getElementById(id), wish=location.pathname.toLowerCase().endsWith('wishlist.html'), section=wish?'wishlist':'collection';
$(wish?'wishes':'collection').className='active'; $('title').innerHTML=wish?'Mi <i>Wishlist</i>':'Mi <i>colección</i>';document.title='Colección · '+$('title').textContent;
const styles=[['#923129','#f6e8c6','♠'],['#efe4cb','#302921','♣'],['#213e54','#e5cfa0','♦'],['#272827','#d7aa63','♠'],['#344638','#d8ca9a','♥'],['#a8583c','#f3e4bf','♦']];
const artCache=new Map;
function art(d,reverse=false){
const key=JSON.stringify([d.brand,d.name,d.style,reverse]);if(artCache.has(key))return artCache.get(key);
const c=document.createElement('canvas');c.width=432;c.height=590;const g=c.getContext('2d'),[bg,ink,suit]=styles[d.style%styles.length];
g.fillStyle='#131211';g.fillRect(12,10,414,576);g.fillStyle=bg;g.fillRect(5,6,408,578);g.strokeStyle=ink;g.fillStyle=ink;
for(const n of [9,16,21,32]){g.lineWidth=n===16?3:1;g.strokeRect(n+5,n+6,408-2*n,578-2*n)}
function rosette(x,y,r,k){g.save();g.translate(x,y);g.lineWidth=.85;for(let j=0;j<14;j++){g.beginPath();for(let i=0;i<=480;i++){const a=i*Math.PI/240,rho=r*(.81+.17*Math.cos(k*a+j*.29));const X=rho*Math.cos(a),Y=rho*Math.sin(a);if(i)g.lineTo(X,Y);else g.moveTo(X,Y)}g.closePath();g.stroke()}g.restore()}
function type(s,y,size,font='Georgia'){g.font='bold '+size+'px '+font;g.textAlign='center';g.fillText(s,209,y,338)}
for(const x of [54,364])for(const y of [53,537])rosette(x,y,19,8);
if(reverse){rosette(209,177,124,12);rosette(209,413,124,12);type(suit,208,93);type(suit,444,93)}else{
type('P L A Y I N G   C A R D S',77,15);type(d.brand.toUpperCase(),153,65);
rosette(209,303,121,9+d.style%5);g.fillStyle=bg;g.beginPath();g.ellipse(209,303,66,82,0,0,Math.PI*2);g.fill();g.stroke();g.fillStyle=ink;type(suit,339,111);
type(d.name,477,32);type('F I N I S H   •   5 2   C A R D S',521,13)}
g.fillStyle='#ffffff24';g.fillRect(7,8,4,571);const url=c.toDataURL();artCache.set(key,url);return url}
function seeds(key=section){return structuredClone(catalogoPublicado[key])}
let decks=[],active,origin,index=0,editing,db,known=['Bicycle','Bee','Tally-Ho'];
const exchangeRate = 1.1081; // ECB reference rate, 12 November 2026, USD per EUR.
const formats = Object.fromEntries(['EUR','USD'].map(currency=>[currency,new Intl.NumberFormat('es-ES',{style:'currency',currency})]));
function centsIn(price, original='EUR', target='EUR') {
  const cents=Math.round(price*100);
  if(original===target)return cents;
  return Math.round(target==='EUR'?cents/exchangeRate:cents*exchangeRate);
}
function dualPrice(price,currency) {
  return formats.EUR.format(centsIn(price,currency,'EUR')/100)+' · '+formats.USD.format(centsIn(price,currency,'USD')/100);
}
function totalPrice(items) {
  const euros=items.reduce((sum,d)=>sum+centsIn(d.price,d.currency,'EUR')*d.qty,0);
  const dollars=items.reduce((sum,d)=>sum+centsIn(d.price,d.currency,'USD')*d.qty,0);
  return formats.EUR.format(euros/100)+' · '+formats.USD.format(dollars/100);
}
function searchable(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
}
const opts=(el,items)=>el.replaceChildren(...items.map(([label,value])=>new Option(label,value)));
function dbCall(mode,fn){return new Promise((resolve,reject)=>{const tx=db.transaction('data',mode),req=fn(tx.objectStore('data'));tx.oncomplete=()=>resolve(req.result);tx.onerror=tx.onabort=()=>reject(tx.error)})}
async function init(){const req=indexedDB.open('Naipes-prototipo',1);req.onupgradeneeded=()=>req.result.createObjectStore('data');db=await new Promise((res,rej)=>{req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error)});await new Promise((resolve,reject)=>{
  const tx=db.transaction('data','readwrite'),store=tx.objectStore('data');
  for(const key of ['collection','wishlist']){
    const current=store.get(key),version=store.get(key+'-catalog-version');
    version.onsuccess=()=>{
      let records=current.result??seeds(key);
      if(!['capturas-2026-11-12','theory11-1'].includes(version.result)){
        const custom=(current.result||[]).filter(d=>!d.id.startsWith('sample')||d.photos?.length||d.desc!=='Baraja de muestra con estuche ilustrado para probar la colección.');
        const imported=seeds(key),ids=new Set(imported.map(d=>d.id));
        records=[...imported,...custom.filter(d=>!ids.has(d.id))];
        store.put(records,key);
        store.put('capturas-2026-11-12',key+'-catalog-version');
      }
      if (key === 'wishlist' && version.result !== 'theory11-1') {
        const ids = new Set(records.map(deck => deck.id));
        let lastNumber = records.reduce((max, deck) => Math.max(max, Number(deck.num) || 0), 0);
        const additions = theory11Wishlist.filter(deck => !ids.has(deck.id))
          .map(deck => ({...deck, num: ++lastNumber}));
        records = [...records, ...additions];
        store.put(records, key);
        store.put('theory11-1', key + '-catalog-version');
      }
      if(key===section)decks=records;
    };
  }
  tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
});known=[...new Set([...known,...decks.map(d=>d.brand),...(await dbCall('readonly',s=>s.get('brands'))||[])])];render()}
function photo(d,i){return d.photos.length?d.photos[i]:art(d,!!i)}
function render(){known.sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));let f=$('filter').value;opts($('filter'),[['Todas las marcas',''],...known.map(b=>[b,b])]);$('filter').value=known.includes(f)?f:'';const query=searchable($('search').value);
let list=decks.filter(d=>(!$('filter').value||d.brand===$('filter').value)&&searchable(d.brand+' '+d.name).includes(query));let sort=$('sort').value;list.sort((a,b)=>{if(sort.toLowerCase()==='d'){if(!a.date||!b.date)return Number(!a.date)-Number(!b.date);return a.date.localeCompare(b.date)*(sort==='D'?-1:1)}if(sort.toLowerCase()==='p')return (centsIn(a.price,a.currency)-centsIn(b.price,b.currency))*(sort==='P'?-1:1);const k={p:'price',q:'qty'}[sort.toLowerCase()]||'num';return (a[k]-b[k])*(sort==='P'||sort==='Q'?-1:1)});$('count').textContent=(list.length===decks.length?String(decks.length):list.length+' de '+decks.length)+' '+(decks.length===1?'ficha':'fichas');
$('total').textContent='Total '+totalPrice(decks);$('shelf').replaceChildren();for(const d of list){const t=document.createElement('button');t.className='tile';t.innerHTML='<span class="stand"><img alt="" class="pack"></span><span class="caption"><strong></strong><span class="price"></span></span><span class="meta"></span>';t.querySelector('img').src=photo(d,0);t.querySelector('img').loading='lazy';t.querySelector('strong').textContent=d.name;t.querySelector('.price').textContent=dualPrice(d.price,d.currency);t.querySelector('.meta').textContent='N.º '+String(d.num).padStart(3,'0')+'  /  '+d.brand.toUpperCase();t.onclick=()=>openDeck(d,t);
  const wrapper=document.createElement('div');wrapper.className='wish-item';
  const tick=document.createElement('button');tick.className='wish-tick';tick.type='button';tick.textContent=wish?'✓':'♡';
  tick.title=wish?'Pasar '+d.name+' a Mi colección':'Copiar '+d.name+' a Wishlist';tick.setAttribute('aria-label',tick.title);
  tick.onclick=()=>transferDeck(d.id,tick);
  wrapper.append(t,tick);$('shelf').append(wrapper);
}if(!list.length)$('shelf').innerHTML='<p class="empty">Sin barajas para esta selección.</p>'}
$('filter').onchange=$('sort').onchange=render;$('search').oninput=render;
function gallery(){const n=active.photos.length||2;$('hero').src=photo(active,index);$('hero').alt=active.name+', imagen '+(index+1);$('page').textContent=(index+1)+' / '+n;$('prev').disabled=$('next').disabled=n<2}
function shift(delta){if(moving)return;index=(index+delta+(active.photos.length||2))%(active.photos.length||2);gallery()}$('prev').onclick=()=>shift(-1);$('next').onclick=()=>shift(1);
function fit(el){const r=el.getBoundingClientRect(),ratio=el.naturalWidth/el.naturalHeight||432/590,w=Math.min(r.width,r.height*ratio),h=w/ratio;return {x:r.x+(r.width-w)/2,y:r.y+(r.height-h)/2,w,h}}
async function fly(reverse){
  const dialog=$('detail');
  dialog.className=reverse?'leaving':'entering';
  const small=origin.querySelector('img'),large=$('hero');
  const flight=document.createElement('div');
  try{
    const a=fit(reverse?large:small), b=fit(reverse?small:large);
    flight.id='flight';flight.setAttribute('aria-hidden','true');
    Object.assign(flight.style,{left:a.x+'px',top:a.y+'px',width:a.w+'px',height:a.h+'px'});
    const box=document.createElement('div');box.className='turn';flight.append(box);
    const depth=a.w*.12;
    function face(src,transform){
      const img=new Image();img.className='face';img.alt='';img.src=src;img.style.transform=transform;box.append(img);
    }
    face(small.src,'translateZ(0px)');
    face(active.photos.length ? (active.photos[1]||small.src) : art(active,true),'translateZ(-'+depth+'px) rotateY(180deg)');
    for(const side of [-1,1]){
      const edge=document.createElement('div');edge.className='edge';
      Object.assign(edge.style,{width:depth+'px',left:((side===1?a.w:0)-depth/2)+'px',transform:'translateZ(-'+depth/2+'px) rotateY('+side*90+'deg)'});box.append(edge);
    }
    dialog.append(flight);
    small.style.visibility=large.style.visibility='hidden';
    const travel=flight.animate([{transform:'none'},{transform:'translate('+(b.x-a.x)+'px,'+(b.y-a.y)+'px) scale('+b.w/a.w+','+b.h/a.h+')'}],{duration:reverse?750:550,easing:'cubic-bezier(.17,.83,.24,1)',fill:'forwards'});
    const animations=[travel.finished];
    animations.push(box.animate([{transform:'rotateY(0deg)'},{transform:reverse?'rotateY(-360deg)':'rotateY(360deg)'}],{delay:reverse?0:100,duration:reverse?750:1100,easing:'cubic-bezier(.25,.1,.25,1)',fill:'both'}).finished);
    await Promise.all(animations);
  }finally{
    flight.remove();small.style.visibility=large.style.visibility='';
    if(!reverse)dialog.className='';
  }
}
let moving=false;async function openDeck(d,t){active=d;origin=t;index=0;$('name').textContent=d.name;$('maker').textContent=d.brand.toUpperCase();$('desc').textContent=d.desc||'';
const sources=$('sources');sources.replaceChildren();
for(const source of d.sources||[]){
  if(!/^https?:\/\//.test(source.url))continue;
  const link=document.createElement('a');link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';
  link.textContent=sourceLabel(source,d.currency);
  sources.append(link);
}$('ref').textContent='N.º '+String(d.num).padStart(3,'0');$('facts').replaceChildren();for(const [k,v] of [['Precio',dualPrice(d.price,d.currency)],['Fecha de compra',d.date?new Date(d.date+'T12:00').toLocaleDateString('es-ES'):(wish?'Pendiente':'Sin fecha indicada')],['Ejemplares',d.qty]]){const row=document.createElement('div');row.innerHTML='<dt></dt><dd></dd>';row.firstChild.textContent=k;row.lastChild.textContent=v;$('facts').append(row)}gallery();$('detail').className='preparing';$('detail').showModal();moving=true;try{await $('hero').decode().catch(()=>{});await fly(false)}finally{moving=false}}
async function closeDeck(){if(moving)return;moving=true;index=0;gallery();await $('hero').decode().catch(()=>{});try{await fly(true)}finally{$('detail').close();$('detail').className='';moving=false}} $('back').onclick=closeDeck;$('detail').oncancel=e=>{e.preventDefault();closeDeck()};
$('replay').onclick=async()=>{
  if(moving)return;
  moving=true;
  try{index=0;gallery();await $('hero').decode().catch(()=>{});await fly(false)}
  finally{moving=false}
};
const form=$('form'),fields=form.elements;
const hiddenBrandKey = 'coleccion-marcas-ocultas';
function hiddenBrands() {
  return new Set(JSON.parse(localStorage.getItem(hiddenBrandKey) || '[]'));
}
function chooseBrand(value) {
  fields.brand.value = value;
  brands();
  const picker = $('brandPicker');
  picker.querySelector('summary').textContent = value === '+' ? 'Nueva marca' : value;
  picker.open = false;
}
function drawBrandChoices() {
  const choices = $('brandChoices');
  const hidden = hiddenBrands();
  choices.replaceChildren();
  for (const brand of known.filter(name => !hidden.has(name))) {
    const row = document.createElement('div');
    const select = document.createElement('button');
    select.type = 'button';
    select.textContent = brand;
    select.onclick = () => chooseBrand(brand);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', 'Quitar ' + brand + ' del selector');
    remove.onclick = () => {
      const excluded = hiddenBrands();
      excluded.add(brand);
      localStorage.setItem(hiddenBrandKey, JSON.stringify([...excluded]));
      if (!editing && fields.brand.value === brand) {
        chooseBrand(known.find(name => !excluded.has(name)) || '+');
        $('brandPicker').open = true;
      }
      drawBrandChoices();
      choices.querySelector('button').focus();
    };
    row.append(select, remove);
    choices.append(row);
  }
  const add = document.createElement('button');
  add.type = 'button';
  add.textContent = '＋ Nueva marca';
  add.onclick = () => { chooseBrand('+'); fields.custom.focus(); };
  choices.append(add);
}
function brands(){let fresh=fields.brand.value==='+';$('newlabel').hidden=!fresh;fields.custom.required=fresh}
function sourceLabel(source,currency){
  if(source.label)return source.label;
  if(!source.shop)return source.url;
  const prefix=source.lookup?'Buscar en ':'Ver en ';
  return prefix+source.shop+(source.price===undefined?'':' · '+dualPrice(source.price,currency));
}
function appendLink(source){
  const row=$('linkTemplate').content.firstElementChild.cloneNode(true);
  row.querySelector('[name="hrefUrl"]').value=source?.url||'';
  row.querySelector('[name="hrefText"]').value=source?sourceLabel(source,editing?.currency):'';
  $('linkRows').append(row);
}
function readLinks(){
  const sources=[];
  for(const [i,row] of Array.from($('linkRows').children).entries()){
    const url=row.querySelector('[name="hrefUrl"]').value.trim();
    const label=row.querySelector('[name="hrefText"]').value.trim();
    if(!url && !label)continue;
    if(!/^https?:\/\//i.test(url))throw Error('Escribe un enlace que empiece por https:// o http://.');
    const previous=editing?.sources?.[i];
    const source=previous?.url===url?{...previous}:{url};
    if(label!==sourceLabel(previous||{url},editing?.currency)||!source.shop)source.label=label||url;
    sources.push(source);
  }
  return sources;
}
$('moreLinks').onclick=()=>appendLink();
let draftPhotos = [];
let pasteSession = 0;

function clearDraftPhotos() {
  pasteSession++;
  for (const photo of draftPhotos) {
    if (photo.blob) URL.revokeObjectURL(photo.url);
  }
  draftPhotos = [];
  $('pastePreview').replaceChildren();
  $('pasteStatus').textContent = '';
}

function renderDraftPhotos() {
  const gallery = $('pastePreview');
  gallery.replaceChildren();
  if (!draftPhotos.length) {
    gallery.textContent = 'Sin fotos.';
    return;
  }
  for (const [index, photo] of draftPhotos.entries()) {
    const item = document.createElement('div');
    const img = document.createElement('img');
    img.src = photo.url;
    img.alt = 'Foto ' + (index + 1);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Quitar';
    remove.setAttribute('aria-label', 'Quitar foto ' + (index + 1));
    remove.onclick = () => {
      draftPhotos.splice(index, 1);
      if (photo.blob) URL.revokeObjectURL(photo.url);
      renderDraftPhotos();
      $('pasteStatus').textContent = 'Foto quitada. Guarda la baraja para aplicar el cambio.';
      const buttons = gallery.querySelectorAll('button');
      (buttons[Math.min(index, buttons.length - 1)] || $('pastePhotos')).focus();
    };
    item.append(img, remove);
    gallery.append(item);
  }
}

function addPasted(blobs) {
  for (const blob of blobs) {
    draftPhotos.push({blob, url: URL.createObjectURL(blob)});
  }
  renderDraftPhotos();
  $('pasteStatus').textContent = blobs.length === 1 ? 'Foto añadida.' : 'Fotos añadidas.';
}

fields.files.onchange = () => {
  if (fields.files.files.length) addPasted(Array.from(fields.files.files));
  fields.files.value = '';
};

$('editor').addEventListener('paste',e=>{const files=Array.from(e.clipboardData?.files||[]).filter(f=>f.type.startsWith('image/'));if(files.length){e.preventDefault();addPasted(files)}});
$('pastePhotos').onclick=async()=>{const session=pasteSession;try{if(!navigator.clipboard?.read)throw Error();const items=await navigator.clipboard.read(),blobs=[];for(const item of items){const type=item.types.find(t=>t.startsWith('image/'));if(type)blobs.push(await item.getType(type))}if(session!==pasteSession||!$('editor').open)return;if(blobs.length)addPasted(blobs);else $('pasteStatus').textContent='No hay imágenes en el portapapeles. Copia una foto primero.'}catch{if(session===pasteSession)$('pasteStatus').textContent='No se pudo leer el portapapeles. Prueba con Ctrl+V o ⌘V.'}};
$('editor').addEventListener('close',clearDraftPhotos);
function edit(d){clearDraftPhotos();draftPhotos=(d?.photos||[]).map(url=>({url}));renderDraftPhotos();editing=d;$('deleteDeck').hidden=!d;form.reset();$('linkRows').replaceChildren();for(const s of d?.sources?.length?d.sources:[null])appendLink(s);$('error').textContent='';$('formtitle').textContent=d?'Editar baraja':'Añadir baraja';opts(fields.brand,[...known.map(b=>[b,b]),['＋ Nueva marca','+']]);fields.currency.value=d?.currency||'EUR';drawBrandChoices();chooseBrand(d?.brand||known.find(name=>!hiddenBrands().has(name))||'+');for(const k of ['name','desc','price','date','qty','num'])fields[k].value=d?.[k]??({qty:1,num:1+decks.reduce((m,v)=>Math.max(m,v.num),0)}[k]??'');$('photosLabel').firstChild.textContent='Añadir fotografías';$('editor').showModal()}
fields.brand.onchange=brands;$('add').onclick=()=>edit(null);$('edit').onclick=()=>{if(moving)return;$('detail').close();edit(active)};$('cancel').onclick=()=>$('editor').close();
function readPhoto(f){return new Promise((resolve,reject)=>{let reader=new FileReader();reader.onerror=reject;reader.onload=()=>{let im=new Image();im.onerror=reject;im.onload=()=>{let scale=Math.min(1,1500/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));c.getContext('2d').drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL('image/webp',.88))};im.src=reader.result};reader.readAsDataURL(f)})}
// Read and modify within one transaction so another tab's changes survive.
async function changeDeck(deck, action) {
  let updated, brands, missing=false;
  await new Promise((resolve,reject)=>{
    const tx=db.transaction('data','readwrite'), store=tx.objectStore('data');
    const current=store.get(section), brandList=store.get('brands');
    brandList.onsuccess=()=>{
      const records=current.result ?? seeds();
      const exists=records.some(item=>item.id===deck.id);
      if(action==='edit' && !exists){missing=true;tx.abort();return}
      if(action==='delete')updated=records.filter(item=>item.id!==deck.id);
      else if(action==='edit')updated=records.map(item=>item.id===deck.id?deck:item);
      else {
        const occupied = records.some(item => Number(item.num) === deck.num);
        updated = records.map(item => occupied && Number(item.num) >= deck.num
          ? {...item, num: Number(item.num) + 1}
          : item);
        updated.push(deck);
      }
      brands=[...new Set([...known,...(brandList.result||[]),deck.brand])];
      store.put(updated,section);
      store.put(brands,'brands');
    };
    tx.oncomplete=resolve;
    tx.onabort=()=>reject(missing?new Error('Esta baraja ya se ha eliminado en otra pestaña.'):tx.error);
  });
  decks=updated;known=brands;
}
async function refreshShelf(){
  if(!db)return;
  const saved=await dbCall('readonly',store=>store.get(section));
  if(saved){
    decks=saved;known=[...new Set([...known,...saved.map(deck=>deck.brand)])];render();
  }
}
const transfers=typeof BroadcastChannel==='function'?new BroadcastChannel('coleccion-movimientos'):null;
if(transfers)transfers.onmessage=refreshShelf;
window.addEventListener('pageshow',event=>{if(event.persisted)refreshShelf()});

async function transferDeck(id,button){
  button.disabled=true;
  let pending,added;
  try{
    await new Promise((resolve,reject)=>{
      const tx=db.transaction('data','readwrite'),store=tx.objectStore('data');
      const target=wish?'collection':'wishlist';
      const source=store.get(section),destination=store.get(target);
      destination.onsuccess=()=>{
        pending=source.result;
        const original=pending.find(deck=>deck.id===id);
        if(!original)return;
        const targetDecks=destination.result;
        if(!wish && targetDecks.some(deck=>deck.copiedFrom===original.id))return;
        const num=targetDecks.reduce((max,deck)=>Math.max(max,Number(deck.num)||0),0)+1;
        added={...original,id:crypto.randomUUID(),num};
        if(wish){
          delete added.copiedFrom;
          pending=pending.filter(deck=>deck.id!==id);
          store.put(pending,section);
        }else added.copiedFrom=original.id;
        store.put([...targetDecks,added],target);
      };
      tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
    });
    if($('detail').open)$('detail').close();
    decks=pending;render();
    $('transferStatus').textContent=added?'✓ '+added.name+' se ha añadido a '+(wish?'Mi colección':'Wishlist')+' con el n.º '+added.num+'.':(wish?'Esta ficha ya ha salido de la Wishlist.':'Esta ficha ya está en la Wishlist o ha cambiado en otra pestaña.');
    if(added)transfers?.postMessage('transfer');
  }catch{
    $('transferStatus').textContent='No se ha podido guardar el cambio. Inténtalo de nuevo.';
    if($('detail').open)$('detail').close();
  }finally{button.disabled=false}
}
$('collectDeck').onclick=()=>{if(!moving)transferDeck(active.id,$('collectDeck'))};

const confirmation=$('confirmDelete');
$('deleteDeck').onclick=()=>{
  if(!editing)return;
  $('deletePrompt').textContent='¿Quieres eliminar «'+editing.name+'» de '+(wish?'tu Wishlist':'tu colección')+'?';
  $('deleteError').textContent='';
  confirmation.showModal();
  $('keepDeck').focus();
};
$('keepDeck').onclick=()=>confirmation.close();
$('confirmRemoval').onclick=async()=>{
  const button=$('confirmRemoval');
  button.disabled=true;
  try{
    await changeDeck(editing,'delete');
    confirmation.close();
    $('editor').close();
    editing=null;
    render();
    $('add').focus();
  }catch{
    $('deleteError').textContent='No se ha podido eliminar la baraja. Vuelve a intentarlo.';
  }finally{button.disabled=false}
};
form.onsubmit=async e=>{e.preventDefault();const btn=form.querySelector('[type=submit]');btn.disabled=true;try{const brand=(fields.brand.value==='+'?fields.custom.value:fields.brand.value).trim(),name=fields.name.value.trim();if(!name||!brand)throw Error('Introduce un nombre y una marca.');const d={...(editing||{}),sources:readLinks(),currency:fields.currency.value,id:editing?.id||crypto.randomUUID(),name,brand,price:+fields.price.value,qty:+fields.qty.value,num:+fields.num.value,date:fields.date.value,desc:fields.desc.value,style:editing?.style??decks.length,photos:await Promise.all(draftPhotos.map(photo => photo.blob ? readPhoto(photo.blob) : photo.url))};await changeDeck(d,editing?'edit':'add');
if(fields.brand.value === '+'){
  const excluded = hiddenBrands();
  if(excluded.delete(brand))localStorage.setItem(hiddenBrandKey,JSON.stringify([...excluded]));
}
transfers?.postMessage(section);$('filter').value='';render();$('editor').close()}catch(err){$('error').textContent=err.message||'No se pudo guardar. Comprueba las fotos y el espacio disponible.'}finally{btn.disabled=false}};
init().catch(()=>{decks=seeds();render();$('count').textContent+=' · almacenamiento desactivado'});
