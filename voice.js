/* Language Portal voice controller v0.4.
   Uses the device's installed TTS voices; never claims cloud-quality audio. */
(function(){
"use strict";
var STORE="language-portal-voice-v2";
var prefs={rate:1,selected:{}};
try{var old=JSON.parse(localStorage.getItem(STORE)||"null");if(old&&typeof old==="object"){if(typeof old.rate==="number"&&old.rate>=.7&&old.rate<=1.4)prefs.rate=old.rate;if(old.selected&&typeof old.selected==="object")prefs.selected=old.selected;}}catch(_){}
var ui=null,lastSpoken="",lastLocale="en-US";
function el(id){return document.getElementById(id);}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(prefs));}catch(_){}}
function synth(){return window.speechSynthesis||null;}
function language(){try{return window.PORTAL_GAME&&window.PORTAL_GAME.getContext().lang.locale||"en-US";}catch(_){return "en-US";}}
function sameBase(a,b){return String(a).split("-")[0].toLowerCase()===String(b).split("-")[0].toLowerCase();}
function options(lang){var t=synth();if(!t||!t.getVoices)return[];var all=t.getVoices()||[];
var matching=all.filter(function(v){return sameBase(v.lang,lang);});
matching.sort(function(a,b){return rank(b,lang)-rank(a,lang)||String(a.name).localeCompare(String(b.name));});
return matching;}
function rank(v,lang){var score=0;if(v.lang.toLowerCase()===lang.toLowerCase())score+=120;
var name=(v.name||"").toLowerCase();if(/neural|natural|enhanced|premium|高质量|自然|高清/.test(name))score+=50;
if(/google|microsoft|samsung/.test(name))score+=12;
if(v.localService===false)score+=5;
if(v.default)score+=2;
return score;}
function matched(lang){var candidates=options(lang),saved=prefs.selected[lang];
var found=saved&&candidates.find(function(v){return (v.voiceURI||v.name)===saved;});
return found||candidates[0]||null;}
function note(t,bad){if(ui){ui.note.textContent=t;ui.note.style.color=bad?"#ffb8a5":"#bfdbb5";}}
function speak(text,locale){
var t=synth(),lang=locale||language();if(!text||!String(text).trim())return false;
if(!t||typeof window.SpeechSynthesisUtterance==="undefined"){note("这个浏览器不支持系统朗读。",true);return false;}
try{
 var voice=matched(lang),utterance=new SpeechSynthesisUtterance(String(text));
 utterance.lang=voice?voice.lang:lang;utterance.voice=voice||null;
 utterance.rate=prefs.rate;utterance.pitch=1;utterance.volume=1;
 utterance.onerror=function(e){if(e.error!=="interrupted"&&e.error!=="canceled")note("播放失败："+(e.error||"未知原因")+"。请检查手机的 TTS 语言包。",true);};
 t.cancel();lastSpoken=String(text);lastLocale=lang;t.speak(utterance);
 if(!voice)note("当前系统没有报告可用的 "+lang+" 声音。已尝试按语言标签播放；听起来不对的话，请在系统设置中安装对应语音包。",true);
 else note("正在使用："+voice.name+"（"+voice.lang+"），语速 "+prefs.rate.toFixed(2)+"×。",false);
 return true;
}catch(e){note("无法播放："+e.message,true);return false;}
}
function refresh(){
if(!ui)return;
var lang=language(),current=ui.select.value,voice=options(lang);
ui.tag.textContent=lang;ui.select.replaceChildren();
var automatic=document.createElement("option");automatic.value="";automatic.textContent="自动选择（优先同语种较自然音色）";ui.select.appendChild(automatic);
voice.forEach(function(v){var option=document.createElement("option");option.value=v.voiceURI||v.name;option.textContent=v.name+" · "+v.lang+(v.localService===false?" · 在线":"");ui.select.appendChild(option);});
var saved=prefs.selected[lang]||"";
ui.select.value=voice.some(function(v){return (v.voiceURI||v.name)===saved;})?saved:"";
ui.speed.value=String(prefs.rate);ui.speedText.textContent=prefs.rate.toFixed(2)+"×";
if(!synth())note("浏览器未开放系统朗读功能。",true);
else if(!voice.length)note("未找到 "+lang+" 可选音色。请检查手机「文字转语音」设置并安装该语种语音包。",true);
else note("找到 "+voice.length+" 个同语种音色。试听后可以固定一个；不同手机的可选音色会不同。",false);
}
var tests={"en":"Hello! Welcome to the language portal.","ja":"こんにちは。ようこそ、言葉の世界へ。","ko":"안녕하세요. 언어의 세계에 오신 것을 환영해요.","fr":"Bonjour et bienvenue dans notre monde.","es":"Hola, bienvenido a nuestro mundo.","de":"Hallo und willkommen in unserer Welt."};
function mount(){
if(el("voiceSettings"))return;
var style=document.createElement("style");style.textContent=".voice-action{border:1px solid #66875d;background:#2d4431;color:#e6f7dd;border-radius:11px;padding:9px 12px;font-size:12px;font-weight:800}.voice-settings{max-width:600px;margin:0 0 20px auto;background:#1b2b22;border:1px solid #6b8966;border-radius:16px;padding:18px;box-shadow:0 15px 40px #080e092b}.voice-settings.hidden{display:none}.voice-fields{display:flex;flex-wrap:wrap;gap:12px;margin-top:13px}.voice-fields label{flex:1 1 200px;color:#c6d8c0;font-size:12px}.voice-fields select,.voice-fields input{display:block;width:100%;margin-top:7px;background:#111c16;border:1px solid #486345;color:#f1f8ec;padding:12px;border-radius:10px}.voice-settings p{line-height:1.6;margin:11px 0;color:#bdcdb6;font-size:12px}.voice-buttons{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0 0}.voice-settings .tinyheading{font-weight:850;font-size:15px;color:#f0f8eb}.voice-status{padding:10px 12px;border-radius:10px;background:#243a29;line-height:1.55;font-size:12px}@media(max-width:460px){.voice-settings{margin:0 0 14px;padding:14px}.voice-action{padding:8px;font-size:11px}}";
document.head.appendChild(style);
var bar=document.querySelector(".topstats")||document.querySelector(".topbar");
var btn=document.createElement("button");btn.type="button";btn.className="voice-action";btn.textContent="🎙 音色设置";btn.id="voiceOpen";bar.appendChild(btn);
var panel=document.createElement("section");panel.id="voiceSettings";panel.className="voice-settings hidden";
panel.setAttribute("aria-label","语音音色设置");
panel.innerHTML='<div class="tinyheading">语音工作台 <span id="voiceLocale" style="float:right;color:#c0f77d;font-size:12px"></span></div><p>游戏使用手机浏览器的系统朗读，不是 ElevenLabs。不同语言可能调用不同语音包；可以切换音色并试听。</p><div class="voice-fields"><label>当前语言的音色<select id="voiceSelect" aria-label="选择音色"></select></label><label>朗读语速 <span id="voiceSpeedText">1.00×</span><input id="voiceSpeed" aria-label="语音速度" type="range" min="0.85" max="1.20" step="0.05" value="1"></label></div><div class="voice-buttons"><button class="voice-action" id="voiceTest">▶ 试听一句</button><button class="voice-action" id="voiceStop">■ 停止</button><button class="voice-action" id="voiceClose">收起</button></div><p id="voiceStatus" class="voice-status" role="status"></p>';
var main=document.querySelector("main");main.insertBefore(panel,document.getElementById("hub"));
ui={panel:panel,select:el("voiceSelect"),speed:el("voiceSpeed"),speedText:el("voiceSpeedText"),note:el("voiceStatus"),tag:el("voiceLocale")};
function open(){panel.classList.toggle("hidden");if(!panel.classList.contains("hidden"))refresh();}
btn.addEventListener("click",open);
el("voiceClose").addEventListener("click",function(){panel.classList.add("hidden");});
ui.select.addEventListener("change",function(){prefs.selected[language()]=ui.select.value;persist();refresh();});
ui.speed.addEventListener("input",function(){prefs.rate=Math.max(.85,Math.min(1.2,Number(ui.speed.value)||1));ui.speedText.textContent=prefs.rate.toFixed(2)+"×";persist();});
el("voiceTest").addEventListener("click",function(){var lang=language(),key=lang.split("-")[0];var text=tests[key]||"Hello!";speak(text,lang);});
el("voiceStop").addEventListener("click",function(){var t=synth();if(t)t.cancel();note("已停止播放。",false);});
if(synth()&&typeof synth().addEventListener==="function")synth().addEventListener("voiceschanged",refresh);
else if(synth()&&"onvoiceschanged" in synth())synth().onvoiceschanged=refresh;
}
window.PortalVoice={speak:speak,mount:mount,refresh:refresh,getPreferences:function(){return JSON.parse(JSON.stringify(prefs));},getAvailableVoices:options};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();