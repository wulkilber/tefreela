const http=require("node:http"),fs=require("node:fs"),path=require("node:path")
const freelancer="22222222-2222-4222-8222-222222222222",client="11111111-1111-4111-8111-111111111111"
const people={freelancer:{id:freelancer,nome:"Marina Silva",tipo_usuario:"freelancer",email:"preview@example.invalid",descricao:"Design com estratégia, cuidado e personalidade. Ajudo marcas a transformar ideias em experiências visuais.",cidade:"Manaus",estado:"AM",saldo_creditos:780},client:{id:client,nome:"Lucas Ferreira",tipo_usuario:"cliente",email:"client@example.invalid",saldo_creditos:1250}}
let role="freelancer"
const categories=["Design","Programação","Marketing","Redação","Tradução","Vídeo e animação","Fotografia","Áudio e música","Consultoria","Arquitetura","Engenharia","Suporte administrativo","Aulas e tutoria","Outros"].map((nome,index)=>({id_categoria:index+1,nome}))
const reviews=[{id_avaliacao:1,nota:5,comentario:"Muito cuidado com cada detalhe. A comunicação foi clara e o resultado ficou exatamente como imaginávamos.",criado_em:"2026-10-10T14:00:00Z"}]
let services=[{titulo:"Identidade visual que conta sua história",descricao:"Da primeira conversa à entrega final, vamos construir uma identidade que traduza a essência do seu negócio.",preco:450,prazo_dias:7},{titulo:"Um site moderno para sua próxima ideia",descricao:"Página responsiva, pensada para comunicar o que seu negócio faz de melhor.",preco:850,prazo_dias:14},{titulo:"Conteúdo criativo para suas redes sociais",descricao:"Peças visuais consistentes e originais para aproximar sua marca das pessoas.",preco:180,prazo_dias:3}].map((item,index)=>({...item,id_servico:index+1,id_freelancer:freelancer,id_categoria:index+1,status:"ativo",categoria:categories[index],freelancer:people.freelancer,imagens:[`/preview-${index+1}.svg`],avaliacoes:reviews,nota:5,total_avaliacoes:1}))
let orders=["solicitado","em_andamento","concluido"].map((status,index)=>({id_pedido:index+1,id_cliente:client,id_freelancer:freelancer,id_servico:index+1,valor:services[index].preco,status,descricao_solicitacao:"Gostaria de criar algo moderno, acolhedor e que valorize a essência do meu negócio. Podemos alinhar os detalhes por mensagem.",criado_em:new Date(2026,9-index,10).toISOString(),servico:services[index],cliente:people.client,freelancer:people.freelancer,avaliacao:status==="concluido"?reviews:[]}))
let portfolio=[{id_portfolio:1,titulo:"Aurora — identidade que inspira",descricao:"Estratégia e design para uma marca feita de novas possibilidades.",imagem:"/preview-1.svg",link:"https://example.com"}]
let notifications=[{id_notificacao:1,titulo:"Uma nova conversa está esperando",mensagem:"Lucas enviou uma mensagem sobre seu projeto de identidade visual.",tipo:"mensagem",lida:false,criado_em:new Date().toISOString()},{id_notificacao:2,titulo:"Você recebeu uma nova solicitação",mensagem:"Veja o pedido e combine os próximos passos com seu cliente.",tipo:"pedido",lida:false,criado_em:new Date().toISOString()},{id_notificacao:3,titulo:"Entrega avaliada",mensagem:"Uma nova avaliação foi adicionada ao seu perfil.",tipo:"avaliacao",lida:true,criado_em:"2026-10-10T14:00:00Z"}]
let messages=[{id_mensagem:1,id_remetente:client,id_destinatario:freelancer,mensagem:"Olá, Marina! Vi seu portfólio e adorei o cuidado com os detalhes. Podemos conversar sobre a identidade visual da minha marca?",data_envio:new Date().toISOString(),lida:false},{id_mensagem:2,id_remetente:freelancer,id_destinatario:client,mensagem:"Olá, Lucas! Que bom que gostou. Vamos criar algo especial. Me conte um pouco sobre a sua marca e o que você tem em mente.",data_envio:new Date().toISOString(),lida:true}]
const avatarFiles=new Map()
const root=path.resolve(__dirname,"../dist")
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,"http://localhost"),route=url.pathname.replace(/^\/api/,""),empty=req.headers.cookie?.includes("scenario=empty"),broken=req.headers.cookie?.includes("scenario=error")
 if(url.pathname.startsWith("/__role/")){role=url.pathname.endsWith("client")?"client":"freelancer";res.writeHead(302,{"Set-Cookie":`previewRole=${role}; Path=/; SameSite=Lax`,Location:"/entrar"});res.end();return}
 if(url.pathname.startsWith("/__scenario/")){res.writeHead(302,{"Set-Cookie":`scenario=${url.pathname.split("/").at(-1)}; Path=/; SameSite=Lax`,Location:"/"});res.end();return}
 if(url.pathname.startsWith("/api")){
  res.setHeader("Content-Type","application/json");const chunks=[];for await(const chunk of req)chunks.push(chunk);const inputBuffer=Buffer.concat(chunks);const body=inputBuffer.toString("utf8")
  const data=body&&req.headers["content-type"]?.includes("application/json")?JSON.parse(body):{}
  if(broken&&!route.startsWith("/auth")){res.statusCode=503;res.end(JSON.stringify({erro:"Não foi possível acessar os dados. Tente novamente."}));return}
  const user=people[role],peer=role==="freelancer"?people.client:people.freelancer
  let result=[]
  if(route==="/auth/login"){role=req.headers.cookie?.includes("previewRole=client")||data.email?.startsWith("client")?"client":"freelancer";result={access_token:"preview-local",refresh_token:"preview-refresh",usuario:people[role]}}
  else if(route==="/auth/me")result={usuario:user}
  else if(route==="/me/avatar"){if(req.headers.cookie?.includes("scenario=avatar-error")){res.statusCode=503;res.end(JSON.stringify({erro:"Não foi possível enviar a foto. Tente novamente."}));return}if(req.method==="DELETE"){user.foto=null;avatarFiles.delete(user.id)}else{avatarFiles.set(user.id,{bytes:inputBuffer,type:req.headers["content-type"]});user.foto=`http://localhost:8445/__avatar/${user.id}?v=${Date.now()}`}result=user}
  else if(route==="/me/perfil"){if(req.method==="PATCH")Object.assign(user,data);result=user}
  else if(route==="/categorias")result=categories
  else if(route==="/servicos"||route==="/me/servicos"){if(req.method==="POST"){result={...data,id_freelancer:freelancer,id_servico:services.length+1,imagens:[],freelancer:people.freelancer,categoria:categories.find(c=>c.id_categoria===data.id_categoria)};services.push(result)}else result=empty?[]:services}
  else if(/^\/servicos\/\d+\/imagens\//.test(route))result={imagens:["/preview-1.svg"]}
  else if(/^\/servicos\/\d+$/.test(route)){result=services.find(item=>item.id_servico===Number(route.split("/")[2]));if(req.method==="PATCH")Object.assign(result,data)}
  else if(route.startsWith("/perfis/"))result={...people.freelancer,portfolio:empty?[]:portfolio}
  else if(route==="/me/portfolio")result=empty?[]:portfolio
  else if(route==="/portfolio"&&req.method==="POST"){result={...data,id_portfolio:portfolio.length+1};portfolio.push(result)}
  else if(route.startsWith("/portfolio/")){result=portfolio.find(p=>p.id_portfolio===Number(route.split("/")[2]));if(req.method==="PATCH")Object.assign(result,data);if(req.method==="DELETE")portfolio=portfolio.filter(p=>p!==result)}
  else if(route==="/pedidos")result=empty?[]:orders
  else if(route.startsWith("/pedidos/")){result=orders.find(o=>o.id_pedido===Number(route.split("/")[2]));if(req.method==="PATCH")Object.assign(result,data)}
  else if(route==="/notificacoes")result=empty?[]:notifications
  else if(route.startsWith("/notificacoes/")){result=notifications.find(n=>n.id_notificacao===Number(route.split("/")[2]));result.lida=true}
  else if(route==="/creditos")result={saldo:user.saldo_creditos,movimentacoes:[],pagamentos:empty?[]:[{id_pagamento:1,id_pedido:3,valor_servico:180,valor_taxa:9,valor_freelancer:171,status:"processado"}]}
  else if(route==="/conversas")result=empty?[]:[{...peer,ultima:messages.at(-1),nao_lidas:1}]
  else if(route.startsWith("/conversas/"))result=peer
  else if(route.endsWith("/lidas")){messages.forEach(m=>m.lida=true);result={}}
  else if(route.startsWith("/mensagens/"))result=empty?[]:messages
  else if(route==="/mensagens"&&req.method==="POST"){result={...data,id_mensagem:messages.length+1,id_remetente:user.id,data_envio:new Date().toISOString(),lida:false};messages.push(result)}
  res.end(JSON.stringify(result||{}));return
 }
 if(url.pathname.startsWith("/__avatar/")){const avatar=avatarFiles.get(url.pathname.split("/").at(-1));if(!avatar){res.statusCode=404;res.end();return}res.setHeader("Content-Type",avatar.type);res.end(avatar.bytes);return}
 const candidate=/^\/preview-[1-3]\.svg$/.test(url.pathname)?path.resolve(__dirname,"fixtures",url.pathname.slice(1)):path.resolve(root,"."+decodeURIComponent(url.pathname)),file=(candidate.startsWith(root+path.sep)||candidate.startsWith(path.resolve(__dirname,"fixtures")+path.sep))&&fs.existsSync(candidate)&&fs.statSync(candidate).isFile()?candidate:path.join(root,"index.html")
 res.setHeader("Content-Type",{".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".jpg":"image/jpeg"}[path.extname(file)]||"application/octet-stream");fs.createReadStream(file).pipe(res)
}catch{res.statusCode=500;res.end(JSON.stringify({erro:"Erro no ambiente de teste"}))}}).listen(8445,"127.0.0.1",()=>console.log("Preview isolado em http://localhost:8445 — contas fictícias; nunca usar como servidor de produção"))
