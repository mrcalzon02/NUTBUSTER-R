from pathlib import Path
from hashlib import sha256
root=Path(__file__).resolve().parents[1]
def patch(path, swaps):
    p=root/path
    data=p.read_text()
    oldhash=sha256(data.encode()).hexdigest()
    for a,b in swaps:
        count=data.count(a)
        if count!=1:raise RuntimeError(f'{path}: expected one occurrence, found {count}: {a[:90]}')
        data=data.replace(a,b)
    p.write_text(data)
    print(f'{path}: {oldhash[:10]} → {sha256(data.encode()).hexdigest()[:10]} ({len(data)} chars)')
patch('web/audio.js',[
("let voicesOn=true,musicOn=true,unlocked=false,gruntIndex=0,lastVoice=0;", "let voicesOn=true,musicOn=true,unlocked=false,gruntIndex=0,lastVoice=0;\nlet voiceLevel=0.90,musicLevel=0.28,reactionLevel=0.38;"),
("function unduck(){if(music)music.volume=.28;}", "function unduck(){if(music)music.volume=musicLevel;}\nfunction setLevels(levels){\n const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(Number(v))?Number(v):0));\n if('voice' in levels)voiceLevel=clamp(levels.voice);\n if('music' in levels)musicLevel=clamp(levels.music);\n if('reactions' in levels)reactionLevel=clamp(levels.reactions);\n if(speaker)speaker.volume=voiceLevel;\n if(reaction)reaction.volume=reactionLevel;\n if(music)music.volume=musicLevel;\n return getLevels();\n}\nfunction getLevels(){return {voice:voiceLevel,music:musicLevel,reactions:reactionLevel};}"),
("if(music&&!music.paused)music.volume=.11;", "if(music&&!music.paused)music.volume=musicLevel*.39;"),
("function grunt(){if(!voicesOn||!reaction||speaker&&!speaker.paused)return false;", "function grunt(){if(!voicesOn||!reaction)return false;"),
("root.NutAudio={unlock,voice,grunt,setVoiceEnabled,setMusicEnabled,", "root.NutAudio={unlock,voice,grunt,setVoiceEnabled,setMusicEnabled,setLevels,getLevels,")
])
patch('web/game.js',[
("sound:true,music:true,completed:0", "sound:true,music:true,levels:{voice:.9,music:.28,reactions:.38},completed:0"),
("window.NutAudio.setMusicEnabled(state.music);}", "window.NutAudio.setMusicEnabled(state.music);window.NutAudio.setLevels?.(saved.levels||{voice:.9,music:.28,reactions:.38});}"),
("function home(){return `${banner", "function uiIcon(name,alt=''){return `<img src=\"art/additions/ui/${name}.png\" class=\"ui-icon\" alt=\"${alt}\">`;}\nfunction home(){return `${banner"),
("<button class=\"btn green\" data-action=\"play\" data-level=\"${Math.min(30,saved.unlocked)}\">▶ PLAY NOW</button><button class=\"btn secondary\" data-nav=\"campaign\">LEVEL MAP</button><button class=\"btn secondary\" data-nav=\"shop\">GET FREE NUTS</button>", "<button class=\"btn green\" data-action=\"play\" data-level=\"${Math.min(30,saved.unlocked)}\">${uiIcon('play')}PLAY NOW</button><button class=\"btn secondary\" data-nav=\"campaign\">${uiIcon('campaign-map')}LEVEL MAP</button><button class=\"btn secondary\" data-nav=\"shop\">${uiIcon('store')}SHOP</button><button class=\"btn secondary\" data-nav=\"settings\">${uiIcon('settings')}SETTINGS</button>"),
("function render(){counters();screen.innerHTML=state.page==='home'?home():state.page==='campaign'?campaign():state.page==='game'?game():state.page==='shop'?shop():rewards();}", "function settings(){const lev=saved.levels||{voice:.9,music:.28,reactions:.38};return `<div class=\"topline\"><h2>${uiIcon('settings')} AUDIO & SETTINGS</h2><button class=\"btn ghost\" data-nav=\"home\">BACK</button></div><div class=\"panel audio-settings\"><p class=\"muted\">Separate levels for the announcer, music and compulsory little grunts.</p>${[['voice','Announcer'],['music','Music'],['reactions','Click grunts']].map(([id,label])=>`<label>${label}<input type=\"range\" data-volume=\"${id}\" min=\"0\" max=\"100\" value=\"${Math.round(lev[id]*100)}\"><output>${Math.round(lev[id]*100)}%</output></label>`).join('')}<div class=\"actions\"><button class=\"btn secondary\" data-action=\"sound\">${state.sound?'Mute voice':'Unmute voice'}</button><button class=\"btn secondary\" data-action=\"music\">${state.music?'Mute music':'Unmute music'}</button></div></div>`;}\nfunction render(){counters();screen.innerHTML=state.page==='home'?home():state.page==='campaign'?campaign():state.page==='game'?game():state.page==='shop'?shop():state.page==='settings'?settings():rewards();}"),
("screen.addEventListener('click',e=>{window.NutAudio?.unlock();", "screen.addEventListener('click',e=>{window.NutAudio?.unlock();window.NutAudio?.grunt();"),
("window.NutAudio?.unlock();nav(b.dataset.nav)", "window.NutAudio?.unlock();window.NutAudio?.grunt();nav(b.dataset.nav)"),
("screen.addEventListener('pointerup',e=>{window.NutAudio?.unlock();", "screen.addEventListener('pointerup',e=>{window.NutAudio?.unlock();"),
("window.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.page==='game')nav('campaign');});", "screen.addEventListener('input',e=>{const id=e.target?.dataset?.volume;if(!id||!['voice','music','reactions'].includes(id))return;saved.levels={...saved.levels,[id]:Number(e.target.value)/100};window.NutAudio?.setLevels?.(saved.levels);persist();const out=e.target.parentElement?.querySelector('output');if(out)out.textContent=e.target.value+'%';});\nwindow.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.page==='game')nav('campaign');});")
])
patch('web/style.css',[
("/* Owner-generated original sprite art is authoritative; fallback glyphs are secondary. */", "/* Supplementary interface icons are independent of original playable nut sprites. */\n.ui-icon{width:26px;height:26px;object-fit:contain;vertical-align:middle;flex-shrink:0}.btn{gap:6px}.topline .ui-icon{width:28px;height:28px;margin-right:5px}.audio-settings{max-width:540px;margin:auto}.audio-settings label{display:grid;grid-template-columns:115px 1fr 46px;gap:12px;align-items:center;margin:16px 0}.audio-settings input{width:100%;accent-color:#efb547}.audio-settings output{text-align:right;font-variant-numeric:tabular-nums}\n/* Owner-generated original sprite art is authoritative; fallback glyphs are secondary. */")
])
