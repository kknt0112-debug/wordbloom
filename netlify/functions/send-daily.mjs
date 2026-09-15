import webpush from "web-push";
import { getVapidKeys, subscriptions } from "./_shared.mjs";

export default async ()=>{
  const now=new Date(),parts=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"}).formatToParts(now).map(p=>[p.type,p.value]));
  if(Number(parts.hour)!==9)return new Response("Not 9 AM Pacific");
  const today=`${parts.year}-${parts.month}-${parts.day}`,keys=await getVapidKeys(),store=subscriptions(),site=process.env.URL||"https://wordbloom.netlify.app";
  webpush.setVapidDetails(site,keys.publicKey,keys.privateKey);let sent=0;
  for await(const page of store.list({paginate:true}))for(const item of page.blobs){
    const record=await store.get(item.key,{type:"json",consistency:"strong"});if(!record||record.lastSentDate===today||!record.words?.length)continue;
    const due=record.words.filter(w=>w.dueAt<=Date.now()),pool=due.length?due:record.words,word=pool[Math.abs([...today+item.key].reduce((n,c)=>((n*31)+c.charCodeAt(0))|0,0))%pool.length];
    try{await webpush.sendNotification(record.subscription,JSON.stringify({title:`Word of the day: ${word.word}`,body:word.definition,url:`${site}/?word=${encodeURIComponent(word.id)}`}));record.lastSentDate=today;await store.setJSON(item.key,record);sent++}catch(error){if(error.statusCode===404||error.statusCode===410)await store.delete(item.key)}
  }
  return new Response(`Sent ${sent} WordBloom reminders`);
};
export const config={schedule:"0 * * * *"};
