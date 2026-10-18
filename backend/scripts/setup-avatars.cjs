// Server-only setup. Run from backend/. Never print credentials.
require("dotenv").config({quiet:true})
const {createClient}=require("@supabase/supabase-js")
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}})
async function main(){
 const existing=await db.storage.getBucket("avatars")
 if(!existing.error){if(!existing.data.public)throw new Error("O bucket avatars existente é privado; nenhuma permissão foi alterada.");console.log("Bucket avatars já disponível.");return}
 const result=await db.storage.createBucket("avatars",{public:true,fileSizeLimit:5*1024*1024,allowedMimeTypes:["image/jpeg","image/png","image/webp"]})
 if(result.error)throw new Error("Não foi possível preparar o bucket avatars.")
 console.log("Bucket avatars preparado com limite de 5 MB e escrita pela API autenticada.")
}
main().catch(error=>{console.error(error.message);process.exitCode=1})
