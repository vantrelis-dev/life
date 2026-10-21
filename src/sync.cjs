'use strict';
const clone=value=>JSON.parse(JSON.stringify(value));
const MAX_BYTES=4_000_000;
function readDraft(storage,key,validate){
  try{const value=JSON.parse(storage.getItem(key));return value&&Number.isSafeInteger(value.revision)&&value.revision>=0&&validate(value.body)?value:null;}catch{return null;}
}
function parseBackup(text,validate){
  if(new TextEncoder().encode(text).length>MAX_BYTES)throw Error('La copia supera 4 MB.');
  const parsed=JSON.parse(text),body=parsed?.state||parsed?.body||parsed;
  if(!validate(body))throw Error('La copia no tiene el formato de esta agenda.');
  return clone(body);
}
// A single-owner document with compare-and-swap. Never force a conflicting write.
class SyncEngine{
  constructor({transport,storage,key,validate,body,revision=0,onStatus=()=>{},delay=500}){
    Object.assign(this,{transport,storage,key,validate,revision,onStatus,delay});
    this.body=clone(body);this.pending=null;this.conflict=false;this.busy=null;this.cacheOK=true;this.timer=null;this.halted=false;
  }
  status(kind){this.onStatus({kind,cacheOK:this.cacheOK,revision:this.revision});}
  cache(body,pending){
    try{this.storage.setItem(this.key,JSON.stringify({revision:this.revision,pending,body}));this.cacheOK=true;}
    catch{this.cacheOK=false;}
  }
  save(body){
    if(this.halted)throw Error('Vuelve a iniciar sesión para guardar.');
    if(!this.validate(body)||new TextEncoder().encode(JSON.stringify(body)).length>MAX_BYTES)throw Error('No se pudo guardar: revisa el formato o el límite de 4 MB. Exporta una copia.');
    this.body=clone(body);this.pending={body:clone(body)};this.cache(this.body,true);
    this.status(this.conflict?'conflict':'pending');clearTimeout(this.timer);
    if(!this.conflict)this.timer=setTimeout(()=>{this.flush();},this.delay);
  }
  dirty(){return !!(this.pending||this.busy||this.conflict);}
  flush(){
    clearTimeout(this.timer);
    if(this.busy)return this.busy;
    this.busy=this.run().finally(()=>{this.busy=null;});return this.busy;
  }
  async run(){
    while(this.pending&&!this.conflict&&!this.halted){
      const current=this.pending;
      try{
        const result=await this.transport.write(current.body,this.revision);
        if(!result){this.conflict=true;this.status('conflict');break;}
        if(result.revision!==this.revision+1)throw Error('Revisión inesperada del servidor.');
        this.revision=result.revision;if(this.pending===current)this.pending=null;
        this.cache(this.body,!!this.pending);this.status(this.pending?'pending':'saved');
      }catch{this.status('offline');break;}
    }
  }
  async refresh(){
    if(this.dirty())return null;
    const remote=await this.transport.read();
    if(!remote||remote.revision===this.revision)return null;
    if(this.dirty())return null; // A local edit may have arrived during the request.
    if(!this.validate(remote.body))throw Error('El servidor devolvió una agenda inválida.');
    this.revision=remote.revision;this.body=clone(remote.body);this.cache(this.body,false);this.status('saved');
    return clone(this.body);
  }
  stop(){clearTimeout(this.timer);this.halted=true;}
}
module.exports={SyncEngine,readDraft,parseBackup,MAX_BYTES};
