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
const rows=[['Rider Back','Bicycle',6.5,2],['Diamond Back','Bee',8,1],['Circle Back','Tally-Ho',9.5,3],['Black Tiger','Bicycle',14,1],['Forest Green','Bicycle',8.5,2],['Fan Back','Tally-Ho',10,1]];
function seeds(){return (wish?[rows[3],rows[5]]:rows).map(([name,brand,price,qty],i)=>({id:'sample'+i,name,brand,price,qty:wish?1:qty,num:i+1,date:wish?'':'2025-'+String(i+1).padStart(2,'0')+'-12',desc:'Baraja de muestra con estuche ilustrado para probar la colección.',style:wish?i+3:i,photos:[]}))}
let decks=[],active,origin,index=0,editing,db,known=['Bicycle','Bee','Tally-Ho'];const eur=n=>n.toLocaleString('es-ES',{style:'currency',currency:'EUR'}),opts=(el,items)=>el.replaceChildren(...items.map(([label,value])=>new Option(label,value)));
function dbCall(mode,fn){return new Promise((resolve,reject)=>{const tx=db.transaction('data',mode),req=fn(tx.objectStore('data'));tx.oncomplete=()=>resolve(req.result);tx.onerror=tx.onabort=()=>reject(tx.error)})}
async function init(){const req=indexedDB.open('Naipes-prototipo',1);req.onupgradeneeded=()=>req.result.createObjectStore('data');db=await new Promise((res,rej)=>{req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error)});decks=await dbCall('readonly',s=>s.get(section))||seeds();known=[...new Set([...known,...decks.map(d=>d.brand),...(await dbCall('readonly',s=>s.get('brands'))||[])])];render()}
function photo(d,i){return d.photos.length?d.photos[i]:art(d,!!i)}
function render(){let f=$('filter').value;opts($('filter'),[['Todas las marcas',''],...known.map(b=>[b,b])]);$('filter').value=known.includes(f)?f:'';let list=decks.filter(d=>!$('filter').value||d.brand===$('filter').value);let sort=$('sort').value;list.sort((a,b)=>{if(sort.toLowerCase()==='d'){if(!a.date||!b.date)return Number(!a.date)-Number(!b.date);return a.date.localeCompare(b.date)*(sort==='D'?-1:1)}const k={p:'price',q:'qty'}[sort.toLowerCase()]||'num';return (a[k]-b[k])*(sort==='P'||sort==='Q'?-1:1)});$('count').textContent=list.length+' '+(list.length===1?'baraja':'barajas');$('shelf').replaceChildren();for(const d of list){const t=document.createElement('button');t.className='tile';t.innerHTML='<span class="stand"><img alt="" class="pack"></span><span class="caption"><strong></strong><span class="price"></span></span><span class="meta"></span>';t.querySelector('img').src=photo(d,0);t.querySelector('strong').textContent=d.name;t.querySelector('.price').textContent=eur(d.price);t.querySelector('.meta').textContent='N.º '+String(d.num).padStart(3,'0')+'  /  '+d.brand.toUpperCase();t.onclick=()=>openDeck(d,t);$('shelf').append(t)}if(!list.length)$('shelf').innerHTML='<p class="empty">Sin barajas para esta selección.</p>'}
$('filter').onchange=$('sort').onchange=render;
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
let moving=false;async function openDeck(d,t){active=d;origin=t;index=0;$('name').textContent=d.name;$('maker').textContent=d.brand.toUpperCase();$('desc').textContent=d.desc;$('ref').textContent='N.º '+String(d.num).padStart(3,'0');$('facts').replaceChildren();for(const [k,v] of [['Precio',eur(d.price)],['Fecha de compra',d.date?new Date(d.date+'T12:00').toLocaleDateString('es-ES'):'Pendiente'],['Ejemplares',d.qty]]){const row=document.createElement('div');row.innerHTML='<dt></dt><dd></dd>';row.firstChild.textContent=k;row.lastChild.textContent=v;$('facts').append(row)}gallery();$('detail').className='preparing';$('detail').showModal();moving=true;try{await $('hero').decode().catch(()=>{});await fly(false)}finally{moving=false}}
async function closeDeck(){if(moving)return;moving=true;index=0;gallery();await $('hero').decode().catch(()=>{});try{await fly(true)}finally{$('detail').close();$('detail').className='';moving=false}} $('back').onclick=closeDeck;$('detail').oncancel=e=>{e.preventDefault();closeDeck()};
$('replay').onclick=async()=>{
  if(moving)return;
  moving=true;
  try{index=0;gallery();await $('hero').decode().catch(()=>{});await fly(false)}
  finally{moving=false}
};
const form=$('form'),fields=form.elements;
function brands(){let fresh=fields.brand.value==='+';$('newlabel').hidden=!fresh;fields.custom.required=fresh}
function edit(d){editing=d;$('deleteDeck').hidden=!d;form.reset();$('error').textContent='';$('formtitle').textContent=d?'Editar baraja':'Añadir baraja';opts(fields.brand,[...known.map(b=>[b,b]),['＋ Nueva marca','+']]);fields.brand.value=d?.brand||known[0];brands();for(const k of ['name','desc','price','date','qty','num'])fields[k].value=d?.[k]??({qty:1,num:1+decks.reduce((m,v)=>Math.max(m,v.num),0)}[k]??'');$('photosLabel').firstChild.textContent=d?'Sustituir fotografías (opcional)':'Importar fotografías';$('editor').showModal()}
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
      else updated=[...records,deck];
      brands=[...new Set([...known,...(brandList.result||[]),deck.brand])];
      store.put(updated,section);
      store.put(brands,'brands');
    };
    tx.oncomplete=resolve;
    tx.onabort=()=>reject(missing?new Error('Esta baraja ya se ha eliminado en otra pestaña.'):tx.error);
  });
  decks=updated;known=brands;
}
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
form.onsubmit=async e=>{e.preventDefault();const btn=form.querySelector('[type=submit]');btn.disabled=true;try{const brand=(fields.brand.value==='+'?fields.custom.value:fields.brand.value).trim(),name=fields.name.value.trim();if(!name||!brand)throw Error('Introduce un nombre y una marca.');const d={id:editing?.id||crypto.randomUUID(),name,brand,price:+fields.price.value,qty:+fields.qty.value,num:+fields.num.value,date:fields.date.value,desc:fields.desc.value,style:editing?.style??decks.length,photos:fields.files.files.length?await Promise.all(Array.from(fields.files.files,readPhoto)):editing?.photos||[]};await changeDeck(d,editing?'edit':'add');$('filter').value='';render();$('editor').close()}catch(err){$('error').textContent=err.message||'No se pudo guardar. Comprueba las fotos y el espacio disponible.'}finally{btn.disabled=false}};
init().catch(()=>{decks=seeds();render();$('count').textContent+=' · almacenamiento desactivado'});
