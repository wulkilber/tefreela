const http = require("node:http")
const fs = require("node:fs")
const path = require("node:path")
const user = {id:"22222222-2222-4222-8222-222222222222",nome:"Marina Silva",tipo_usuario:"freelancer",email:"preview@example.invalid"}
const peer = "11111111-1111-4111-8111-111111111111"
const contact = {id:peer,nome:"Lucas Ferreira",tipo_usuario:"cliente"}
const messages = [{id_mensagem:1,id_remetente:peer,id_destinatario:user.id,mensagem:"Olá, Marina! Podemos conversar sobre a identidade visual da minha marca?",data_envio:new Date().toISOString(),lida:false}]
let services = [{id_servico:1,id_freelancer:user.id,id_categoria:1,titulo:"Identidade visual para sua marca",descricao:"Logotipo e materiais para destacar seu negócio.",preco:150,prazo_dias:5,status:"ativo",categoria:{id_categoria:1,nome:"Design"},imagens:["/service-placeholder.svg"]}]
const categories = ["Design","Programação","Marketing","Redação","Tradução","Vídeo e animação","Fotografia","Áudio e música","Consultoria","Arquitetura","Engenharia","Suporte administrativo","Aulas e tutoria","Outros"].map((nome,index)=>({id_categoria:index+1,nome}))
const root = path.resolve(__dirname,"../dist")
http.createServer(async(req,res)=>{
 const url=new URL(req.url,"http://localhost")
 if(url.pathname.startsWith("/api")) {
  res.setHeader("Content-Type","application/json")
  let body="";for await(const chunk of req) body+=chunk
  const data=body?JSON.parse(body):{}, route=url.pathname.slice(4)
  let result=[]
  if(route==="/auth/login") result={access_token:"preview-local",refresh_token:"preview-refresh",usuario:user}
  else if(route==="/auth/me") result={usuario:user}
  else if(route==="/categorias") result=categories
  else if(route==="/me/servicos") result=services
  else if(route==="/conversas") result=[{...contact,ultima:messages.at(-1),nao_lidas:messages.filter(m=>!m.lida&&m.id_remetente===peer).length}]
  else if(route===`/conversas/${peer}`) result=contact
  else if(route===`/mensagens/${peer}`) result=messages
  else if(route.endsWith("/lidas")){messages.forEach(m=>m.lida=true);result={}}
  else if(route==="/mensagens"&&req.method==="POST"){result={...data,id_mensagem:messages.length+1,id_remetente:user.id,data_envio:new Date().toISOString(),lida:false};messages.push(result)}
  res.end(JSON.stringify(result));return
 }
 const file=path.join(root,url.pathname==="/"?"index.html":url.pathname)
 const target=fs.existsSync(file)&&fs.statSync(file).isFile()?file:path.join(root,"index.html")
 const type={".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml"}[path.extname(target)]||"application/octet-stream"
 res.setHeader("Content-Type",type);fs.createReadStream(target).pipe(res)
}).listen(8445,"127.0.0.1",()=>console.log("Preview local isolado em http://localhost:8445"))
