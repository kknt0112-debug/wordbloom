import { cleanWords, json, subscriptionKey, subscriptions } from "./_shared.mjs";
export default async req=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  try{const body=await req.json(),subscription=body.subscription;if(!subscription?.endpoint||!subscription?.keys?.p256dh||!subscription?.keys?.auth)return json({error:"Invalid subscription"},400);const store=subscriptions(),key=subscriptionKey(subscription.endpoint),old=await store.get(key,{type:"json",consistency:"strong"});await store.setJSON(key,{subscription,words:cleanWords(body.words),timeZone:"America/Los_Angeles",lastSentDate:old?.lastSentDate||null,updatedAt:Date.now()});return json({ok:true})}catch{return json({error:"Could not save notification settings"},500)}
};
export const config={path:"/api/push-subscribe"};
