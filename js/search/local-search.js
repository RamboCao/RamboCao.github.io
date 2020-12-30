"use strict";function _toConsumableArray(e){if(Array.isArray(e)){for(var t=0,r=Array(e.length);t<e.length;t++)r[t]=e[t];return r}return Array.from(e)}window.addEventListener("load",function(){function e(){var e;document.body.style.cssText="width: 100%;overflow: hidden",document.querySelector("#local-search .search-dialog").style.display="block",document.querySelector("#local-search-input input").focus(),btf.fadeIn(document.getElementById("search-mask"),.5),r||(e=GLOBAL_CONFIG.localSearch.path,fetch(GLOBAL_CONFIG.root+e).then(function(e){return e.text()}).then(function(e){return(new window.DOMParser).parseFromString(e,"text/xml")}).then(function(e){var t=[].concat(_toConsumableArray(e.querySelectorAll("entry"))).map(function(e){return{title:e.querySelector("title").textContent,content:e.querySelector("content").textContent,url:e.querySelector("url").textContent}}),e=document.querySelector("#local-search-input input"),r=document.getElementById("local-search-results");e.addEventListener("input",function(){var d,h='<div class="search-result-list">',m=this.value.trim().toLowerCase().split(/[\s]+/);r.innerHTML="",this.value.trim().length<=0||(d=0,t.forEach(function(e){var r=!0;e.title&&""!==e.title.trim()||(e.title="Untitled");var n,t,c,a,o=e.title.trim().toLowerCase(),l=e.content.trim().replace(/<[^>]+>/g,"").toLowerCase(),s=e.url.startsWith("/")?e.url:GLOBAL_CONFIG.root+e.url,i=-1,u=-1;""!==o||""!==l?m.forEach(function(e,t){n=o.indexOf(e),i=l.indexOf(e),n<0&&i<0?r=!1:(i<0&&(i=0),0===t&&(u=i))}):r=!1,r&&(t=e.content.trim().replace(/<[^>]+>/g,""),0<=u&&(c=u+100,(e=u-30)<0&&(e=0),0===e&&(c=100),c>t.length&&(c=t.length),a=t.substring(e,c),m.forEach(function(e){var t=new RegExp(e,"gi");a=a.replace(t,'<span class="search-keyword">'+e+"</span>"),o=o.replace(t,'<span class="search-keyword">'+e+"</span>")}),h+='<div class="local-search__hit-item"><a href="'+s+'" class="search-result-title">'+o+"</a>",d+=1,""!==l&&(h+='<p class="search-result">'+a+"...</p>")),h+="</div>")}),0===d&&(h+='<div id="local-search__hits-empty">'+GLOBAL_CONFIG.localSearch.languages.hits_empty.replace(/\$\{query}/,this.value.trim())+"</div>"),h+="</div>",r.innerHTML=h,window.pjax&&window.pjax.refresh(r))})}),r=!0),document.addEventListener("keydown",function e(t){"Escape"===t.code&&(n(),document.removeEventListener("keydown",e))})}function t(){document.querySelector("#search-button > .search").addEventListener("click",e),document.getElementById("search-mask").addEventListener("click",n),document.querySelector("#local-search .search-close-button").addEventListener("click",n)}var r=!1,n=function(){document.body.style.cssText="width: '';overflow: ''";var e=document.querySelector("#local-search .search-dialog");e.style.animation="search_close .5s",setTimeout(function(){e.style.cssText="display: none; animation: ''"},500),btf.fadeOut(document.getElementById("search-mask"),.5)};t(),window.addEventListener("pjax:complete",function(){"block"===getComputedStyle(document.querySelector("#local-search .search-dialog")).display&&n(),t()})});