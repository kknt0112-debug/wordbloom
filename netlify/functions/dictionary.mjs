import { json } from "./_shared.mjs";

const parts={Noun:"noun",Proper_noun:"noun",Verb:"verb",Adjective:"adjective",Adverb:"adverb",Phrase:"phrase",Interjection:"other",Preposition:"other"};
const entities={amp:"&",quot:'"',apos:"'",lt:"<",gt:">",nbsp:" ",ndash:"–",mdash:"—",rsquo:"’",lsquo:"‘",rdquo:"”",ldquo:"“"};
const decode=value=>String(value||"").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,(_,code)=>code[0]==="#"?String.fromCodePoint(code[1].toLowerCase()==="x"?parseInt(code.slice(2),16):parseInt(code.slice(1),10)):entities[code.toLowerCase()]||`&${code};`);
const text=value=>decode(String(value||"").replace(/<(ul|ol|dl|table)\b[\s\S]*?<\/\1>/gi," ").replace(/<sup\b[\s\S]*?<\/sup>/gi," ").replace(/<[^>]+>/g," ")).replace(/\[[^\]]*\]/g," ").replace(/\s+/g," ").trim();
const absolute=value=>value?.startsWith("//")?`https:${value}`:value?.startsWith("/")?`https://en.wiktionary.org${value}`:value||"";

export default async req=>{
  const word=new URL(req.url).searchParams.get("word")?.trim();
  if(!word||word.length>80)return json({error:"Enter a valid word."},400);
  try{
    const api=new URL("https://en.wiktionary.org/w/api.php");
    api.search=new URLSearchParams({action:"parse",page:word,prop:"text",format:"json",formatversion:"2",redirects:"1"});
    const response=await fetch(api,{headers:{"Api-User-Agent":"WordBloom/1.0 (educational vocabulary app)"}});
    if(!response.ok)throw Error("Wiktionary request failed");
    const data=await response.json(),html=data?.parse?.text;if(!html)throw Error("No entry");
    const english=html.search(/id=["']English["']/i);if(english<0)throw Error("No English entry");
    const headingStart=html.lastIndexOf("<h2",english),headingEnd=html.indexOf("</h2>",english),after=html.slice(headingEnd+5),nextHeading=after.search(/<h2\b/i),section=nextHeading<0?after:after.slice(0,nextHeading);
    const foundParts=[...section.matchAll(/id=["'](Noun|Proper_noun|Verb|Adjective|Adverb|Phrase|Interjection|Preposition)(?:_\d+)?["']/gi)].sort((a,b)=>a.index-b.index),selected=foundParts[0],part=selected?parts[selected[1]]:"other",definitionArea=selected?section.slice(selected.index):section;
    const definitionMatch=definitionArea.match(/<ol\b[^>]*>[\s\S]*?<li\b[^>]*>([\s\S]*?)<\/li>/i),definition=text(definitionMatch?.[1]);if(!definition)throw Error("No definition");
    const ipaMatch=section.match(/class=["'][^"']*\bIPA\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i),pronunciation=text(ipaMatch?.[1]);
    const audioMatch=section.match(/<source\b[^>]*src=["']([^"']+)["']/i)||section.match(/<audio\b[^>]*src=["']([^"']+)["']/i);
    return json({definition,part,pronunciation,audio:absolute(decode(audioMatch?.[1])),example:"",source:"Wiktionary",sourceUrl:`https://en.wiktionary.org/wiki/${encodeURIComponent(word.replace(/ /g,"_"))}`});
  }catch{return json({error:"No English definition was found on Wiktionary."},404)}
};

export const config={path:"/api/dictionary"};
