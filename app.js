const STORE = 'wordbloom-data-v1';
const DAY = 86400000;
const sampleWords = [
  {id:crypto.randomUUID(),word:'serendipity',definition:'The pleasant discovery of something valuable or interesting by chance.',part:'Noun',pronunciation:'/ˌser.ənˈdɪp.ə.ti/',example:'Finding that little bookshop was pure serendipity.',createdAt:Date.now()-DAY*2,dueAt:Date.now(),level:1},
  {id:crypto.randomUUID(),word:'resilient',definition:'Able to recover quickly from difficulties or change.',part:'Adjective',pronunciation:'/rɪˈzɪl.i.ənt/',example:'She remained resilient despite the setback.',createdAt:Date.now()-DAY,dueAt:Date.now(),level:0}
];
let state = load(); let reviewQueue=[]; let reviewIndex=0; let currentReview=null;
const $ = s => document.querySelector(s); const $$ = s => [...document.querySelectorAll(s)];
function load(){try{return JSON.parse(localStorage.getItem(STORE))||{words:sampleWords,reviewDates:[]}}catch{return {words:sampleWords,reviewDates:[]}}}
function save(){localStorage.setItem(STORE,JSON.stringify(state));render()}
function localDay(ts=Date.now()){const d=new Date(ts);return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`}
function streak(){const dates=new Set(state.reviewDates||[]);let n=0,d=new Date();if(!dates.has(localDay(d))){d.setDate(d.getDate()-1)}while(dates.has(localDay(d))){n++;d.setDate(d.getDate()-1)}return n}
function escapeHTML(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function render(){
  const query=$('#searchInput').value.trim().toLowerCase(), filter=$('#filterSelect').value;
  const words=state.words.filter(w=>(w.word+' '+w.definition).toLowerCase().includes(query)).filter(w=>filter==='all'||(filter==='mastered'?w.level>=4:w.level<4));
  $('#wordsCount').textContent=state.words.length;$('#streakCount').textContent=streak();$('#masteredCount').textContent=state.words.filter(w=>w.level>=4).length;$('#dueCount').textContent=state.words.filter(w=>w.dueAt<=Date.now()).length;
  $('#wordGrid').innerHTML=words.map(w=>`<article class="vocab-card"><span class="tag">${escapeHTML(w.part)}</span><h3>${escapeHTML(w.word)}</h3><span class="pron">${escapeHTML(w.pronunciation)}${w.audio?`<button class="listen-button" data-audio="${escapeHTML(w.audio)}" aria-label="Hear ${escapeHTML(w.word)}">▶ Listen</button>`:''}</span><p class="definition">${escapeHTML(w.definition)}</p><div class="card-bottom">${w.level>=4?'<span class="mastered-badge">✓ Mastered</span>':`<span class="level">Learning · level ${w.level+1}</span>`}<div class="card-menu"><button data-edit="${w.id}" aria-label="Edit ${escapeHTML(w.word)}">✎</button><button data-delete="${w.id}" aria-label="Delete ${escapeHTML(w.word)}">×</button></div></div></article>`).join('');
  $('#emptyState').hidden=words.length>0;
}
function openWord(w){$('#editId').value=w?.id||'';$('#wordInput').value=w?.word||'';$('#definitionInput').value=w?.definition||'';$('#partInput').value=w?.part||'Noun';$('#pronunciationInput').value=w?.pronunciation||'';$('#exampleInput').value=w?.example||'';$('#wordForm').dataset.audio=w?.audio||'';setLookupStatus('');$('#wordDialog').showModal();setTimeout(()=>$('#wordInput').focus(),50)}
function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2200)}
function setLookupStatus(text,error=false){const el=$('#lookupStatus');el.textContent=text;el.className=`lookup-status${text?' visible':''}${error?' error':''}`}
async function lookupWord(){
  const word=$('#wordInput').value.trim();if(!word){setLookupStatus('Type a word first.',true);$('#wordInput').focus();return}
  const btn=$('#lookupBtn');btn.disabled=true;btn.textContent='Finding…';setLookupStatus('Searching the dictionary…');
  let timer;
  try{
    const controller=new AbortController();timer=setTimeout(()=>controller.abort(),10000);
    const response=await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,{signal:controller.signal});
    if(!response.ok)throw new Error(response.status===404?'Word not found. Check the spelling or enter the details yourself.':'Dictionary is unavailable right now. Please try again.');
    const [entry]=await response.json(),meanings=entry.meanings||[];
    const meaning=meanings.find(m=>m.definitions?.some(d=>d.example))||meanings[0],definition=meaning?.definitions?.find(d=>d.example)||meaning?.definitions?.[0];
    if(!definition?.definition)throw new Error('No definition was found for this word.');
    const allowed=['noun','verb','adjective','adverb','phrase'],part=(meaning.partOfSpeech||'').toLowerCase();
    $('#definitionInput').value=definition.definition;$('#partInput').value=allowed.includes(part)?part[0].toUpperCase()+part.slice(1):'Other';
    $('#pronunciationInput').value=entry.phonetic||entry.phonetics?.find(p=>p.text)?.text||'';$('#exampleInput').value=definition.example||'';
    const audio=entry.phonetics?.find(p=>p.audio)?.audio||'';$('#wordForm').dataset.audio=audio.startsWith('//')?`https:${audio}`:audio;
    setLookupStatus(definition.example?'Found it! You can edit any field before saving.':'Definition found. This entry has no example, so you can add your own.');
  }catch(error){setLookupStatus(error.name==='AbortError'?'The lookup took too long. Check your connection and try again.':error.message,true)}finally{clearTimeout(timer);btn.disabled=false;btn.textContent='⌕ Find meaning'}
}
function startReview(){reviewQueue=state.words.filter(w=>w.dueAt<=Date.now()).sort(()=>Math.random()-.5).slice(0,10);if(!reviewQueue.length){toast(state.words.length?'You are all caught up for today!':'Add a word first.');return}reviewIndex=0;$('#reviewDialog').showModal();showReview()}
function showReview(){currentReview=reviewQueue[reviewIndex];$('#flashcard').classList.remove('flipped');$('#reviewProgress').textContent=`${reviewIndex+1} of ${reviewQueue.length}`;$('#progressBar').style.width=`${(reviewIndex/reviewQueue.length)*100}%`;$('#reviewPart').textContent=currentReview.part.toUpperCase();$('#reviewWord').textContent=currentReview.word;$('#reviewPronunciation').textContent=currentReview.pronunciation||'';$('#reviewDefinition').textContent=currentReview.definition;$('#reviewExample').textContent=currentReview.example?`“${currentReview.example}”`:''}
function rate(rating){const w=state.words.find(x=>x.id===currentReview.id);const days={again:1,good:3,easy:7}[rating];w.dueAt=Date.now()+DAY*days;w.level=rating==='again'?Math.max(0,w.level-1):Math.min(4,w.level+(rating==='easy'?2:1));reviewIndex++;if(reviewIndex>=reviewQueue.length){const today=localDay();if(!state.reviewDates.includes(today))state.reviewDates.push(today);save();$('#reviewDialog').close();toast(`Review complete — ${reviewQueue.length} words practiced!`)}else{save();showReview()}}
$('#todayLabel').textContent=new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric'}).format(new Date()).toUpperCase();
$('#addHeaderBtn').onclick=()=>openWord();$('#emptyAddBtn').onclick=()=>openWord();$$('.close-modal').forEach(b=>b.onclick=()=>$('#wordDialog').close());$('#searchInput').oninput=render;$('#filterSelect').onchange=render;
$('#lookupBtn').onclick=lookupWord;$('#wordInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();lookupWord()}});
$('#wordForm').addEventListener('submit',e=>{e.preventDefault();const id=$('#editId').value;const data={word:$('#wordInput').value.trim(),definition:$('#definitionInput').value.trim(),part:$('#partInput').value,pronunciation:$('#pronunciationInput').value.trim(),example:$('#exampleInput').value.trim(),audio:e.target.dataset.audio||''};if(id){Object.assign(state.words.find(w=>w.id===id),data);toast('Word updated.')}else{state.words.unshift({id:crypto.randomUUID(),...data,createdAt:Date.now(),dueAt:Date.now(),level:0});toast('New word planted!')}save();$('#wordDialog').close();e.target.reset()});
$('#wordGrid').onclick=e=>{const edit=e.target.dataset.edit,del=e.target.dataset.delete,audio=e.target.dataset.audio;if(audio){new Audio(audio).play().catch(()=>toast('Audio could not be played.'));return}if(edit)openWord(state.words.find(w=>w.id===edit));if(del&&confirm('Delete this word?')){state.words=state.words.filter(w=>w.id!==del);save();toast('Word deleted.')}};
$('#startReviewBtn').onclick=startReview;$('#closeReview').onclick=()=>$('#reviewDialog').close();$('#flashcard').onclick=()=>$('#flashcard').classList.toggle('flipped');$$('[data-rating]').forEach(b=>b.onclick=()=>rate(b.dataset.rating));
$('#exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='wordbloom-backup.json';a.click();URL.revokeObjectURL(a.href)};
$('#importInput').onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text());if(!Array.isArray(data.words))throw Error();state=data;save();toast('Vocabulary imported!')}catch{toast('That backup file is not valid.')}e.target.value=''};
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});render();
