import { createHash } from "node:crypto";
import { getStore } from "@netlify/blobs";
import webpush from "web-push";

export const subscriptions = () => getStore({ name: "wordbloom-push", consistency: "strong" });
export const subscriptionKey = endpoint => createHash("sha256").update(endpoint).digest("hex");
export async function getVapidKeys(){
  const store=getStore({name:"wordbloom-config",consistency:"strong"});
  let keys=await store.get("vapid",{type:"json",consistency:"strong"});
  if(!keys){keys=webpush.generateVAPIDKeys();await store.setJSON("vapid",keys,{onlyIfNew:true});keys=await store.get("vapid",{type:"json",consistency:"strong"})||keys}
  return keys;
}
export const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
export function cleanWords(words){return (Array.isArray(words)?words:[]).slice(0,500).map(w=>({id:String(w.id||'').slice(0,100),word:String(w.word||'').slice(0,80),definition:String(w.definition||'').slice(0,300),dueAt:Number(w.dueAt)||0})).filter(w=>w.word&&w.definition)}
