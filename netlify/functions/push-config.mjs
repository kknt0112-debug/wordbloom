import { getVapidKeys, json } from "./_shared.mjs";
export default async ()=>{try{const keys=await getVapidKeys();return json({publicKey:keys.publicKey,time:"9:00 AM",timeZone:"America/Los_Angeles"})}catch{return json({error:"Push service is not ready"},503)}};
export const config={path:"/api/push-config"};
