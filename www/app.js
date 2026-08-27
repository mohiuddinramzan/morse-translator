const MORSE_MAP = {
  A:'.-', B:'-...', C:'-.-.', D:'-..', E:'.', F:'..-.', G:'--.', H:'....',
  I:'..', J:'.---', K:'-.-', L:'.-..', M:'--', N:'-.', O:'---', P:'.--.',
  Q:'--.-', R:'.-.', S:'...', T:'-', U:'..-', V:'...-', W:'.--', X:'-..-',
  Y:'-.--', Z:'--..', '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-',
  '5':'.....','6':'-....','7':'--...','8':'---..','9':'----.',
  '.':'.-.-.-', ',':'--..--', '?':'..--..', "'":'.----.', '!':'-.-.--',
  '/':'-..-.', '(':'-.--.', ')':'-.--.-', '&':'.-...', ':':'---...',
  ';':'-.-.-.', '=':'-...-', '+':'.-.-.', '-':'-....-', '_':'..--.-',
  '"':'.-..-.', '$':'...-..-', '@':'.--.-.'
};
const REVERSE_MAP = Object.fromEntries(Object.entries(MORSE_MAP).map(([k,v])=>[v,k]));

function textToMorse(text){
  return text.toUpperCase().trim().split(/\s+/).map(word =>
    word.split('').map(ch => MORSE_MAP[ch] || '').filter(Boolean).join(' ')
  ).join(' / ');
}
function morseToText(morse){
  return morse.trim().split(' / ').map(word =>
    word.trim().split(/\s+/).map(code => REVERSE_MAP[code] || '').join('')
  ).join(' ');
}

// ---- Tabs ----
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    stopSound(); stopFlash();
  });
});

// ---- Convert tab ----
const textInput = document.getElementById('textInput');
const morseInput = document.getElementById('morseInput');
let lock = false;
textInput.addEventListener('input', ()=>{ if(lock)return; lock=true; morseInput.value = textToMorse(textInput.value); lock=false; });
morseInput.addEventListener('input', ()=>{ if(lock)return; lock=true; textInput.value = morseToText(morseInput.value); lock=false; });
document.getElementById('clearBtn').addEventListener('click', ()=>{ textInput.value=''; morseInput.value=''; });

// ---- Segment builder (shared by sound + flash) ----
function buildSegments(morse, unit){
  const tokens = morse.trim().split(' ');
  const segments = [];
  tokens.forEach((tok, idx)=>{
    if(tok === '/'){
      segments.push({on:false, duration: unit*7});
      return;
    }
    tok.split('').forEach((sym,i)=>{
      segments.push({on:true, duration: sym==='.' ? unit : unit*3});
      if(i < tok.length-1) segments.push({on:false, duration:unit});
    });
    if(idx < tokens.length-1 && tokens[idx+1] !== '/'){
      segments.push({on:false, duration: unit*3});
    }
  });
  return segments;
}

// ---- Sound tab ----
let audioCtx = null;
let soundStopFlag = false;

function wpmToUnit(wpm){ return 1200 / wpm; }

document.getElementById('wpmSound').addEventListener('input', e=>{
  document.getElementById('wpmValSound').textContent = e.target.value;
});

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function playSound(){
  stopSound();
  soundStopFlag = false;
  const text = document.getElementById('soundText').value;
  const morse = textToMorse(text);
  document.getElementById('morsePreviewSound').textContent = morse;
  const unit = wpmToUnit(Number(document.getElementById('wpmSound').value));
  const segments = buildSegments(morse, unit);
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  for(const seg of segments){
    if(soundStopFlag) break;
    if(seg.on){
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = 600;
      osc.connect(gain); gain.connect(audioCtx.destination);
      gain.gain.value = 0.25;
      osc.start();
      await sleep(seg.duration);
      osc.stop();
    } else {
      await sleep(seg.duration);
    }
  }
}
function stopSound(){ soundStopFlag = true; }

document.getElementById('playSoundBtn').addEventListener('click', playSound);
document.getElementById('stopSoundBtn').addEventListener('click', stopSound);

// ---- Flashlight tab ----
let flashStopFlag = false;
let TorchPlugin = null;
const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

if(isNative){
  import('@capawesome/capacitor-torch').then(mod=>{ TorchPlugin = mod.Torch; }).catch(()=>{});
}

document.getElementById('wpmFlash').addEventListener('input', e=>{
  document.getElementById('wpmValFlash').textContent = e.target.value;
});

async function torchSet(on){
  if(isNative && TorchPlugin){
    try{ on ? await TorchPlugin.enable() : await TorchPlugin.disable(); return; }catch(e){}
  }
  // Browser fallback: flash the screen instead of real torch
  document.getElementById('flashOverlay').style.opacity = on ? '1' : '0';
}

async function playFlash(){
  stopFlash();
  flashStopFlag = false;
  const hint = document.getElementById('flashHint');
  hint.textContent = isNative ? '' : 'ব্রাউজারে টেস্ট মোড: স্ক্রিন ফ্ল্যাশ হবে। APK-তে আসল ফ্ল্যাশলাইট জ্বলবে।';
  const text = document.getElementById('flashText').value;
  const morse = textToMorse(text);
  const unit = wpmToUnit(Number(document.getElementById('wpmFlash').value));
  const segments = buildSegments(morse, unit);

  for(const seg of segments){
    if(flashStopFlag) break;
    await torchSet(seg.on);
    await sleep(seg.duration);
  }
  await torchSet(false);
}
function stopFlash(){ flashStopFlag = true; torchSet(false); }

document.getElementById('playFlashBtn').addEventListener('click', playFlash);
document.getElementById('stopFlashBtn').addEventListener('click', stopFlash);
