const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript')
const code=name=>ts.transpileModule(fs.readFileSync(name,'utf8').replaceAll('import.meta.env','({})'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
const response=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}})
const makeStorage=map=>({getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)})
const sample={access_token:'token-a',refresh_token:'refresh-a',usuario:{id:'user-a',nome:'Ana',tipo_usuario:'cliente'}}
function tab({shared=new Map(),legacy=new Map(),fetch=async()=>response(200,{})}={}){const callbacks=new Map(),notices=[];const context={exports:{},require:()=>({notify:(...values)=>notices.push(values)}),fetch,Response,Blob,AbortSignal,Error,localStorage:makeStorage(shared),sessionStorage:makeStorage(legacy),window:{addEventListener:(name,fn)=>callbacks.set(name,fn)}};vm.runInNewContext(code('src/lib/session.ts'),context);return {...context.exports,context,shared,legacy,notices,storage:()=>callbacks.get('storage')?.({key:'tefreela.session'})}}
test('sessão persiste entre abas e recarga e migra a sessão antiga da aba',()=>{
 const shared=new Map(),legacy=new Map([['tefreela.session',JSON.stringify(sample)]]),first=tab({shared,legacy})
 assert.equal(first.getSession().usuario.id,'user-a');assert.equal(legacy.has('tefreela.session'),false)
 assert.equal(tab({shared}).getSession().access_token,'token-a')
 first.saveSession({...sample,access_token:'novo'})
 assert.equal(tab({shared}).getSession().access_token,'novo')
})
test('logout em outra aba invalida consumidores e limpa tokens e favoritos do usuário',()=>{
 const shared=new Map(),a=tab({shared}),b=tab({shared});a.saveSession(sample)
 shared.set('tefreela.favorites.user-a','[1]');let updates=0;b.subscribeSession(()=>updates++)
 a.clearSession();b.storage();assert.equal(b.getSession(),null);assert.equal(updates,1);assert.equal(shared.has('tefreela.favorites.user-a'),false)
})
test('armazenamento bloqueado mantém login e logout em memória',()=>{
 const a=tab();a.context.localStorage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}}
 a.saveSession(sample);assert.equal(a.getSession().usuario.id,'user-a');a.clearSession();assert.equal(a.getSession(),null)
})
test('resposta da conta anterior não aparece após troca de usuário',async()=>{
 let finish;const a=tab({fetch:()=>new Promise(resolve=>finish=resolve)});a.saveSession(sample)
 const pending=a.api('/pedidos');a.saveSession({...sample,usuario:{...sample.usuario,id:'user-b'}});finish(response(200,[{privado:true}]))
 await assert.rejects(pending,error=>error.status===401)
})
test('falha temporária de rede preserva a sessão persistida',async()=>{
 const a=tab({fetch:async()=>{throw Error('network')}});a.saveSession(sample)
 await assert.rejects(a.api('/auth/me'),error=>error.status===0);assert.equal(tab({shared:a.shared}).getSession().usuario.id,'user-a')
})
test('renovação de outra aba é usada sem renovar novamente',async()=>{
 let a,renewals=0; a=tab({fetch:async(url,options)=>{if(url.endsWith('/auth/refresh'))renewals++;if(options.headers.Authorization==='Bearer token-a'){a.saveSession({...sample,access_token:'token-b'});return response(401,{})}return response(200,{ok:true})}});a.saveSession(sample)
 assert.equal((await a.api('/pedidos')).ok,true);assert.equal(renewals,0)
})
test('menu permanece dentro da viewport e abre para cima quando necessário',()=>{
 const context={exports:{}};vm.runInNewContext(code('src/lib/menu-position.ts'),context);const place=context.exports.placeMenu
 for(const width of [320,375,390,430,768,1024,1280,1440,1920])for(const height of [180,360,844])for(const anchor of [{left:width-40,right:width-5,top:height-50,bottom:height-15},{left:5,right:40,top:8,bottom:42}]){
  const p=place(anchor,{left:0,top:0,width,height},650)
  assert.ok(p.left>=8&&p.left+p.width<=width-8+.1)
  assert.ok(p.top>=8&&p.top+Math.min(650,p.maxHeight)<=height-8+.1)
  assert.ok(p.maxHeight<=400)
 }
 assert.equal(place({left:280,right:315,top:750,bottom:785},{left:0,top:0,width:320,height:844},380).direction,'up')
})
test('menu respeita a área visual reduzida pelo teclado',()=>{
 const context={exports:{}};vm.runInNewContext(code('src/lib/menu-position.ts'),context)
 const p=context.exports.placeMenu({left:280,right:315,top:360,bottom:400},{left:0,top:180,width:320,height:300},500)
 assert.ok(p.top>=188);assert.ok(p.top+p.maxHeight<=472)
})
function theme({saved=null,dark=false}={}){const store=new Map(saved?[['tefreela.theme',saved]]:[]),events=new Map(),media={matches:dark,addEventListener:(name,fn)=>events.set('system',fn)},root={dataset:{},style:{}};const context={exports:{},require:()=>({useSyncExternalStore(){}}),localStorage:makeStorage(store),document:{documentElement:root,querySelector:()=>({setAttribute(){}})},window:{matchMedia:()=>media,addEventListener:(name,fn)=>events.set(name,fn)}};vm.runInNewContext(code('src/lib/theme.ts'),context);return {...context.exports,store,events,root,media}}
test('tema inicial respeita o sistema e acompanha suas mudanças sem escolha explícita',()=>{const t=theme({dark:true});assert.equal(t.root.dataset.theme,'dark');t.media.matches=false;t.events.get('system')();assert.equal(t.root.dataset.theme,'light')})
test('tema escolhido permanece após recarga e prevalece sobre o sistema',()=>{const t=theme();t.setTheme('dark');assert.equal(t.store.get('tefreela.theme'),'dark');assert.equal(theme({saved:t.store.get('tefreela.theme'),dark:false}).root.dataset.theme,'dark');t.media.matches=true;t.events.get('system')();assert.equal(t.root.dataset.theme,'dark')})
