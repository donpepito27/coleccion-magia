const { createHmac, randomBytes, timingSafeEqual, createHash } = require('node:crypto');
const { get, put } = require('@vercel/blob');
const path = 'catalogo/publicado.json';
// Blob reads can return a weak HTTP ETag for the same stored object.
const storageRevision = etag => (etag || '').replace(/^W\//, '');
const cookie = '__Host-propietario';
const failures = new Map();
const digest = value => createHash('sha256').update(value).digest();
const sign = value => createHmac('sha256', process.env.SESSION_SECRET).update(value).digest('hex');
function authenticated(req) {
  const token = (req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookie+'='))?.slice(cookie.length+1) || '';
  const [until, nonce, signature] = token.split('.');
  return !!signature && Number(until)>Date.now() && timingSafeEqual(digest(signature),digest(sign(until+'.'+nonce)));
}
function setSession(res,token,age) {
  res.setHeader('Set-Cookie',cookie+'='+token+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age='+age);
}
module.exports = async (req,res) => {
  res.setHeader('Cache-Control','private, no-store');
  try {
    const owner = authenticated(req);
    if(req.method==='GET'){
      const record = await get(path,{access:'public',useCache:false});
      const catalog = record ? await new Response(record.stream).json() : null;
      return res.json({owner,revision:storageRevision(record?.blob.etag),catalog});
    }
    if(req.method!=='POST')return res.status(405).end();
    if(req.headers.origin !== 'https://'+req.headers.host || !req.headers['content-type']?.startsWith('application/json'))return res.status(403).end();
    const body=req.body || {};
    if(body.action==='login'){
      const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-real-ip']||'unknown').split(',')[0];
      const fail=failures.get(ip);
      if(fail && fail.until>Date.now() && fail.count>=8)return res.status(429).json({error:'Espera unos minutos antes de volver a intentarlo.'});
      if(!process.env.OWNER_PASSWORD || !timingSafeEqual(digest(String(body.password)),digest(process.env.OWNER_PASSWORD))){
        failures.set(ip,{until:Date.now()+300000,count:fail?.until>Date.now()?fail.count+1:1});
        return res.status(401).json({error:'Contraseña incorrecta.'});
      }
      failures.delete(ip);
      const key=(Date.now()+8*3600000)+'.'+randomBytes(18).toString('hex');
      setSession(res,key+'.'+sign(key),28800);
      return res.json({ok:true});
    }
    if(body.action==='logout'){setSession(res,'',0);return res.json({ok:true});}
    if(!owner)return res.status(401).json({error:'Accede para editar.'});
    if(body.action==='photo'){
      const photo = /^data:image\/(webp|png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(body.data||'');
      if(!photo)return res.status(400).end();
      const bytes=Buffer.from(photo[2],'base64');
      const blob=await put('imagenes/'+randomBytes(20).toString('hex')+'.'+photo[1],bytes,{access:'public',contentType:'image/'+photo[1],addRandomSuffix:false});
      return res.json({url:blob.url});
    }
    const c=body.catalog;
    if(body.action!=='publish'||typeof body.revision!=='string'||!Array.isArray(c?.collection)||!Array.isArray(c?.wishlist)||!Array.isArray(c?.hiddenBrands))return res.status(400).end();
    const blob=await put(path,JSON.stringify(c),{access:'public',contentType:'application/json',addRandomSuffix:false,allowOverwrite:!!body.revision,...(body.revision?{ifMatch:storageRevision(body.revision)}:{})});
    return res.json({revision:storageRevision(blob.etag)});
  }catch(err){
    if(/precondition|already exists|etag/i.test(String(err)))return res.status(409).json({error:'El catálogo cambió en otro dispositivo. Recarga la página antes de guardar.'});
    return res.status(503).json({error:'No se pudo acceder al catálogo compartido. Inténtalo de nuevo.'});
  }
};
