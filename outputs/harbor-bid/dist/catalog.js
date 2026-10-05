'use strict';
const money=n=>'◈ '+n.toLocaleString('zh-CN'),pick=a=>a[Math.floor(Math.random()*a.length)],rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const escapeHTML=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
