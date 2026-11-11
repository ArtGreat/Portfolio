(() => {
  "use strict";
  if (window.amPortfolioReady) return;
  window.amPortfolioReady = true;

  const contacts = {
    email: { label: "Почта", value: "hello@makovsky.example" },
    phone: { label: "Телефон", value: "+7 (000) 000-00-00" },
    telegram: { label: "Telegram", value: "@makovsky_demo" },
    whatsapp: { label: "WhatsApp", value: "+7 (000) 000-00-00" },
    max: { label: "MAX", value: "@makovsky_demo" }
  };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let motionOff = reducedMotion.matches;
  try {
    if (localStorage.getItem("am-motion") === "off") motionOff = true;
  } catch {}
  let motionButton;
  let lastTrigger = null;
  let dialog;

  function updateMotion() {
    document.documentElement.classList.toggle("am-motion-off", motionOff);
    if (motionButton) {
      motionButton.textContent = motionOff ? "Анимация выключена" : "Анимация включена";
      motionButton.setAttribute("aria-pressed", String(!motionOff));
    }
  }

  function createDialog() {
    const el = document.createElement("dialog");
    el.className = "am-dialog";
    el.setAttribute("aria-labelledby", "am-dialog-title");
    el.innerHTML = '<div class="am-kicker" id="am-dialog-channel"></div><h2 id="am-dialog-title"></h2><p>Это пример контакта для макета. Его можно заменить при настройке сайта.</p><div class="am-dialog-controls"><button type="button" class="am-btn am-btn--fill" data-copy>Скопировать</button><button type="button" class="am-btn" data-close>Закрыть</button></div><span role="status" aria-live="polite" class="am-kicker" data-status></span>';
    document.body.append(el);
    el.querySelector("[data-close]").addEventListener("click", () => el.close());
    el.querySelector("[data-copy]").addEventListener("click", async () => {
      const value = el.querySelector("h2").textContent;
      let copied = false;
      try {
        await navigator.clipboard.writeText(value);
        copied = true;
      } catch {
        const range = document.createRange();
        range.selectNodeContents(el.querySelector("h2"));
        const selection = getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        try { copied = document.execCommand("copy"); } catch {}
      }
      const status = el.querySelector("[data-status]");
      status.textContent = copied ? "Скопировано" : "Выделите контакт и скопируйте его";
      status.style.display = "block";
      status.style.marginTop = "15px";
    });
    el.addEventListener("click", event => {
      if (event.target !== el) return;
      const b = el.getBoundingClientRect();
      if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) el.close();
    });
    el.addEventListener("close", () => { if (lastTrigger?.isConnected) lastTrigger.focus({ preventScroll: true }); });
    return el;
  }

  function showContact(trigger, key) {
    if (!contacts[key]) return;
    if (!dialog) dialog = createDialog();
    lastTrigger = trigger;
    dialog.querySelector("#am-dialog-channel").textContent = contacts[key].label + " / пример";
    dialog.querySelector("h2").textContent = contacts[key].value;
    dialog.querySelector("[data-status]").textContent = "";
    if (!dialog.open) dialog.showModal();
    dialog.querySelector("[data-close]").focus();
  }

  function bindCycle(node, words) {
    if (node.dataset.amCycleBound || words.length < 2) return;
    node.dataset.amCycleBound = "1";
    node.classList.add("am-cycle");
    let index = 0;
    let visible = true;
    const observer = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
    }) : null;
    observer?.observe(node);
    window.setInterval(() => {
      if (motionOff || reducedMotion.matches || document.hidden || !visible) return;
      node.classList.add("am-out");
      window.setTimeout(() => {
        index = (index + 1) % words.length;
        node.textContent = words[index];
        node.classList.remove("am-out");
        node.classList.add("am-in");
        requestAnimationFrame(() => requestAnimationFrame(() => node.classList.remove("am-in")));
      }, 240);
    }, 3900);
  }

  function localHash(link) {
    try {
      const url = new URL(link.getAttribute("href"), document.baseURI);
      if (url.origin === location.origin && url.pathname.replace(/\/$/,"") === location.pathname.replace(/\/$/,"")) return url.hash;
    } catch {}
    return "";
  }

  function activate(root = document) {
    root.querySelectorAll("[data-am-words]").forEach(node => bindCycle(node, node.dataset.amWords.split("|")));
    motionButton = document.querySelector("[data-am-motion]");
    if (motionButton && !motionButton.dataset.amBound) {
      motionButton.dataset.amBound = "1";
      motionButton.addEventListener("click", () => {
        motionOff = !motionOff;
        try { localStorage.setItem("am-motion", motionOff ? "off" : "on"); } catch {}
        updateMotion();
      });
    }
    updateMotion();
  }

  // The HTML importer can convert the layout to native Tilda elements.
  // Stable links and visible words also let the optional effects work on native layers.
  function enhanceNative() {
    const atoms = [...document.querySelectorAll(".t396__artboard .tn-atom")];
    if (!atoms.length) return;
    const label = node => (node.innerText || "").trim().replace(/\s+/g, " ");
    const sections = { "am-about":"Обо мне", "am-services":"Услуги", "am-works":"Работы", "am-contacts":"Контакты" };
    Object.entries(sections).forEach(([id, name]) => {
      if (document.getElementById(id) || document.querySelector('[name="' + id + '"]')) return;
      const heading = atoms.find(el => label(el) === name && !el.closest("a") && !el.querySelector("a"));
      if (heading) heading.id = id;
    });
    const first = document.querySelector(".t396__artboard");
    if (first && !document.getElementById("am-top")) { const top = document.createElement("span"); top.id = "am-top"; first.before(top); }
    atoms.forEach(atom => {
      const word = label(atom);
      const leaf = atom.matches("span") ? atom : [...atom.querySelectorAll("span")].reverse().find(s => ["характером.","сильное."].includes(label(s)));
      if (leaf && label(leaf) === "характером.") bindCycle(leaf, ["характером.","ритмом.","голосом."]);
      if (leaf && label(leaf) === "сильное.") bindCycle(leaf, ["сильное.","громкое.","смелое."]);
      if (!leaf && ["характером.","сильное."].includes(word)) bindCycle(atom, word === "характером." ? ["характером.","ритмом.","голосом."] : ["сильное.","громкое.","смелое."]);
      if (atom.matches("a") && atom.parentElement?.matches('[data-elem-type="button"]')) atom.classList.add("am-native-action");
      if (atom.matches("a") && /\/am-(rossa|komu|sever|mira|noir|ost|yasno|volna)(?:[./?#]|$)/.test(atom.pathname) &&
          (atom.querySelector("img") || getComputedStyle(atom).backgroundImage !== "none")) atom.classList.add("am-native-cover");
    });
  }

  function setupPointer() {
    if (!matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    document.documentElement.classList.add("am-cursor-ready");
    const spot = document.createElement("div");
    spot.className = "am-pointer";
    spot.setAttribute("aria-hidden", "true");
    spot.textContent = "Смотреть";
    document.body.append(spot);
    document.addEventListener("pointermove", event => {
      const hit = event.target.closest?.(".am-thumb,.am-native-cover");
      spot.classList.toggle("am-shown", Boolean(hit));
      if (hit) {
        spot.style.left = event.clientX + "px";
        spot.style.top = event.clientY + "px";
      }
    }, { passive: true });
    const hide = () => spot.classList.remove("am-shown");
    document.documentElement.addEventListener("pointerleave", hide);
    window.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("blur", hide);
  }

  document.addEventListener("click", event => {
    const a = event.target.closest?.("a[href]");
    if (!a || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = localHash(a);
    if (hash.startsWith("#am-demo-")) {
      event.preventDefault();
      showContact(a, hash.slice(9));
    }
  }, true);

  function start() {
    activate(); enhanceNative(); setupPointer();
    if (document.querySelector(".t396__artboard")) {
      window.addEventListener("load", enhanceNative, { once: true });
    }
    reducedMotion.addEventListener?.("change", e => { motionOff = e.matches; updateMotion(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();
})();

(() => {
  "use strict";
  const init = () => {
    const host = document.querySelector(".am-root");
    if (!host || document.documentElement.dataset.amGallery) return;
    document.documentElement.dataset.amGallery = "1";
    const root = document;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const motionAllowed = () => !reduce.matches && !document.documentElement.classList.contains("am-motion-off");
    const playTriangle = "▶";
    let popup, previousTrigger, imageIndex = 0, slides = [];
    function createViewer() {
      popup = document.createElement("dialog");
      popup.className = "am-media-dialog";
      popup.setAttribute("aria-labelledby", "am-view-title");
      popup.innerHTML = '<div class="am-media-bar"><strong id="am-view-title"></strong><button type="button" data-close>Закрыть ×</button></div><div data-stage></div><div class="am-view-controls" hidden><button data-prev aria-label="Предыдущее изображение">←</button><span aria-live="polite"></span><button data-next aria-label="Следующее изображение">→</button></div>';
      document.body.append(popup);
      popup.querySelector("[data-close]").onclick=()=>popup.close();
      popup.querySelector("[data-prev]").onclick=()=>setSlide(imageIndex-1);
      popup.querySelector("[data-next]").onclick=()=>setSlide(imageIndex+1);
      popup.addEventListener("keydown",event=>{
        if (popup.querySelector(".am-view-controls").hidden) return;
        if (event.key==="ArrowLeft") {event.preventDefault();setSlide(imageIndex-1);}
        if (event.key==="ArrowRight") {event.preventDefault();setSlide(imageIndex+1);}
      });
      popup.addEventListener("close",()=>{
        popup.querySelector("video")?.pause();
        popup.querySelector("[data-stage]").replaceChildren();
        previousTrigger?.focus({preventScroll:true});
      });
      popup.addEventListener("click",e=>{
        if (e.target!==popup) return;
        const box=popup.getBoundingClientRect();
        if (e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom) popup.close();
      });
    }
    function openViewer(trigger,title) {
      if (!popup) createViewer();
      previousTrigger=trigger;
      popup.querySelector("#am-view-title").textContent=title;
      if (!popup.open) popup.showModal();
      popup.querySelector("[data-close]").focus();
    }
    function setSlide(n) {
      imageIndex=(n+slides.length)%slides.length;
      const source=slides[imageIndex].querySelector("img");
      const photo=document.createElement("img");
      photo.alt=source.alt;
      photo.src=source.currentSrc||source.src;
      popup.querySelector("[data-stage]").replaceChildren(photo);
      popup.querySelector(".am-view-controls span").textContent=(imageIndex+1)+" / "+slides.length+" · "+source.alt;
      popup.querySelector("#am-view-title").textContent="Галерея кейса";
    }
    function showVideo(trigger,src,title,poster,muted=false) {
      openViewer(trigger,title);
      popup.querySelector(".am-view-controls").hidden=true;
      const video=document.createElement("video");
      video.controls=true;video.playsInline=true;video.muted=muted;video.preload="metadata";
      if(poster)video.poster=poster;
      video.src=src;popup.querySelector("[data-stage]").replaceChildren(video);
      video.play().catch(()=>{});
    }
    root.addEventListener("click",e=>{
      const play=e.target.closest("[data-am-video]");
      if(play){e.preventDefault();showVideo(play,play.dataset.amVideo,play.dataset.amName||"Видео",play.dataset.amPoster);return;}
      const image=e.target.closest("[data-am-image]");
      if(image){slides=[...root.querySelectorAll("[data-am-image]")];openViewer(image,"Галерея кейса");popup.querySelector(".am-view-controls").hidden=false;setSlide(slides.indexOf(image));}
    });

    const sections = root.querySelector("#am-works");
    if(sections?.querySelector(".am-works-grid") && sections.querySelector("[data-am-count]")){
      const cards=[...sections.querySelectorAll(".am-work")], filters=[...sections.querySelectorAll("[data-am-filter]")];
      const grid=sections.querySelector(".am-works-grid"), button=sections.querySelector("[data-am-more]"), count=sections.querySelector("[data-am-count]");
      let group="all", limit=8;
      function update() {
        const eligible=cards.filter(c=>group==="all"||c.dataset.amGroup===group);
        const visible=new Set(eligible.slice(0,limit));
        cards.forEach(c=>{c.hidden=!visible.has(c);if(c.hidden)c.querySelector("video")?.pause();});
        filters.forEach(f=>f.setAttribute("aria-pressed",String(f.dataset.amFilter===group)));
        grid.classList.toggle("am-filtered",group!=="all");
        count.textContent="Показано "+visible.size+" из "+eligible.length;
        button.hidden=eligible.length<=8;
        button.textContent=limit<eligible.length?"Смотреть ещё ("+Math.min(8,eligible.length-limit)+")":"Свернуть галерею";
      }
      const select=key=>{group=key;limit=8;update();};
      filters.forEach(f=>f.addEventListener("click",()=>select(f.dataset.amFilter)));
      root.querySelectorAll("[data-am-service]").forEach(a=>a.addEventListener("click",()=>select(a.dataset.amService)));
      button?.addEventListener("click",()=>{
        const n=cards.filter(c=>group==="all"||c.dataset.amGroup===group).length;
        if(limit<n){const firstHidden=cards.find(c=>c.hidden&&(group==="all"||c.dataset.amGroup===group));limit+=8;update();firstHidden?.querySelector("a")?.focus({preventScroll:true});}
        else{limit=8;update();sections.querySelector(".am-filterbar")?.scrollIntoView({block:"start"});filters.find(f=>f.dataset.amFilter===group)?.focus({preventScroll:true});}
      });
      update();
    }
    const stage=root.querySelector(".am-reel-player"), reel=stage?.querySelector("video");
    if(reel) {
      const play=stage.querySelector("[data-am-play]");
      let inView=false, userPaused=false;
      const playState=()=>{
        play.textContent=reel.paused?playTriangle+" Шоурил":"Ⅱ Пауза";
        play.setAttribute("aria-label",reel.paused?"Воспроизвести шоурил":"Приостановить шоурил");
      };
      const autoplay=()=>{
        if(inView&&motionAllowed()&&!userPaused&&!document.hidden&&!navigator.connection?.saveData) {
          reel.play().catch(()=>playState());
        } else reel.pause();
      };
      play.addEventListener("click",()=>{
        if(reel.paused){userPaused=false;reel.play().catch(()=>playState());}
        else{userPaused=true;reel.pause();}
      });
      stage.querySelector("[data-am-expand]").onclick=e=>{userPaused=true;reel.pause();showVideo(e.currentTarget,reel.currentSrc||reel.src,"Шоурил · Александр Маковский",reel.poster,true);};
      reel.addEventListener("play",playState);reel.addEventListener("pause",playState);playState();
      if("IntersectionObserver" in window){new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;autoplay();},{threshold:.2}).observe(stage);}
      new MutationObserver(autoplay).observe(document.documentElement,{attributes:true,attributeFilter:["class"]});
      document.addEventListener("visibilitychange",autoplay);
    }
    const fine=matchMedia("(hover:hover) and (pointer:fine)");
    root.querySelectorAll(".am-thumb video").forEach(video=>{
      const thumb=video.closest(".am-thumb"),link=video.closest("a");
      const start=()=>{if(!motionAllowed()||!fine.matches||navigator.connection?.saveData)return;if(!video.src)video.src=video.dataset.preview;thumb.classList.add("am-previewing");video.play().catch(()=>thumb.classList.remove("am-previewing"));};
      const stop=()=>{video.pause();thumb.classList.remove("am-previewing");};
      link.addEventListener("pointerenter",start);link.addEventListener("pointerleave",stop);link.addEventListener("focus",start);link.addEventListener("blur",stop);
    });
    if("IntersectionObserver" in window&&motionAllowed()){
      const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add("am-revealed");observer.unobserve(entry.target);}}},{rootMargin:"0px 0px 24px 0px",threshold:.025});
      root.querySelectorAll(".am-section-head,.am-about-line,.am-about-body,.am-service,.am-intro-row,.am-contact-card,.am-case-story,.am-result,.am-case-rail,.am-cinema-card,.am-work").forEach(node=>{
        const rect=node.getBoundingClientRect();
        if(rect.height&&rect.top<innerHeight-10)return;
        node.classList.add("am-reveal-ready");observer.observe(node);
      });
    }
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();

/* Browser inference for the portfolio's two trained, quantized intent classifiers. */
(function (host) {
  "use strict";
  const packed = {"size":3072,"stop":["a","an","at","for","i","my","of","our","please","the","to","us","with","your","бы","в","вам","ваш","вы","для","его","же","за","и","из","к","ли","меня","мне","мой","моя","мы","на","наша","наши","о","об","от","плиз","по","пожалуйста","с","то","у","уже","это","я"],"intentThreshold":0.32,"disciplineThreshold":0.4,"heads":[{"names":["brief","contact","cost","greeting","process","services","timeline","unknown","work"],"bias":[-1.02932,-0.65842,-0.42641,0.34611,-0.92271,2.30258,-0.46161,0.53965,0.31015],"scale":[0.060601,0.048529,0.057113,0.055359,0.044048,0.042957,0.048307,0.031203,0.048151],"idf":"/7L/y8D/////////////yf/m/+7////xzf//9//8//+M/////77//8v//8j//////+6////v/+b7/////+X///////7////9uv///6L4/8////+89/qi//T///P/+v///6H/uf//wLed//H////////J///H///L///o/6j/6P//tv//xf/u/////f/95+z/////3f//5dL////////C//+iwv/////5///////a4LD/9//c4fmM/9L///P////8///D+bzI//////////////j/////zP//vf//wfr///X//////+q1vv//8////8n///W64//h/5z////////////////////////1//z//+Pk//////H////47/f/5////////////9///////v////////+/wf/////3/////////////9Xs/////////97////m////7v+e2////7v////////r////5vz/////6v/Q////7///3W/5/8T//////+j///r//////////P///7L///+51v//8f//vf//37fS4vn/////0////7r//9X////z//+5///e////uv+1//f///v/////2P//2f/r/////////8z////3/5L/////2v//////+P7//9T//////////////8L/////0///////7N3/4r3R8/////u5/////////////////83/w///4f///9343P/q/////+3u//////n//P//zP/aof///////9vB/////////8z///////j/yf///////+D////b////xP//7v///97P/Vv/////////////1//i6uv////Z/P/NrP//////////7P///+7/0v/X0v/v+P///+H/8tb//9//6f////////////b/zvH//6z//+f/////////////0tH/////vf//zv/z///a///M///////v/////////+/y////4f////////n//////5P/////////////+///7f////+d//////////////+e///5//////////////////L//9H//+v26+rP///////////k////8f/C//+b//////////nt//////n////////j////sf/////hyP////+j/5n//f///+X////7/v/r///////I///X////tf///////////////9P1///z/+f+9f///77/////2v/////p/////////////////+v///7/////////zZ3//P/e///F6v/KvP+o5/z////K8v/d5MPj0P///////8/Bu////////+nz0v///+L9////6v/z////1Z7/3P/////////4//+4/93///Pu6//i9v/////P//////////+H////////////6////////7P//P//6P/C+v+J/9v///////////+5///////V///+//D/0uj/0///3Oz/////////4f//3/////+qyP/////A////0v//////88rM///////S5v////////+j6f/////r/+z///+0x/////Ko8N3e///N/8zD//+fwf/////l//////+///z////////S8P/e///////r//////////X/6v////+a0v//zP///vb////z36b/zOz/+f/////U////xf//////3Ov/wP/hnv//6sT//6L//9r///n////o////4//2////5f///+T//P//7P//////3f/81v/Q0v/////a3//x///j/6X/7P///9L//////////5H////////Qnv////fQ/8H///3/6///////u+f////V/8H/////utlszf///8jC/9D////F//H///++////5v///7L/////////e/////+8/4n/6///////1u3Xzv///////8j///2n7P///////////9fS1//l/f/x/6f/+f////+9///g0f//0v////93x////+X////x//Hibf//+f/M89j/////5uD/////7ND///f///j/////////3P//9v///66///r/yf///////P/v0ev/1f//////////qf/////////////////////R/7j/wP//////2f///////9j/78j/95We////6f////H//+/////////C///x//////D////r8f///////////+P/2f/Q///8///t/P//+uz///////j/////xP/n///D/////////+PV////y//S/////+z/1P/////////////1vP/////q////////6v////X///n/stX/////+P////X/8rb8///////////+////5f///+T/////////6v////////+/////////////////6v///f//8ef///////////P/9P////////f/5uz/////1v/////P/7v////////////I/+H/tf/l//j//7jk4Nrz7v//////v+j/rv/p5f//yf/My///////4f//////////9er///n////6///A///z///3////5//////////f///////i/////Or/1uX/2v+l///////r///Bov+Q////l////////////6b/ov/3///r/93/8P/z//////v////3//TS///////////////Z/////////9b/vZ71////wPb///75vP//v//r//////////H/7fX////Gw6r//7n///+11P//////////5+f//////5P//8f/3////9Ky1v////+27//U/////6zmzv///////////9D//////////////6j/////////y///4/H/////7//a/////////72q/////7/c//rS9eG0+v//5//0////5Mf/3cz///+6///z//H/////////7Lzezfn2/9H//+D/8Lr/+Ozd////////4/n////Z/////8z//8v/////38n/8f//7tz/////5P/Z//j/7/////////z//7f/3v/////d+f/5////////////////4KX///////f//////+7////////////+/////73/qfv//////7v///////////////+Z8f///6396f+9//X////v//////n1///////w/6D/+vz/5f/1////////6KT////////m////////7P///7zn7P/////c/+f/3////////////////////+//z///5v/////////P//LV/////////+r////Y4+T/9f/k//////+tsP/////////////b/+fc//zG///8////////++v/8////+P///+o/////8r///X/////////8f////Pb///////OdP/////n/9q5/////P///4n/vfz////t///////G///i/8b//5W////m8f+u//T///+P/brz//////+ix//3///s6//l/Mz/4v7////eyP+zwv//9b//+P//r4T//////8T///zz///////////////////////F///O/578///////////3////7P//i+T/////z//////////X////7//3///////////t4f///////9Oq////+//5//T/+KP//////8Hg4///////teK6///U7v/l+f/x//////n////m+/+s////////7f//8//Gxv//0f///////+v/////ssj/9P+6///N//XL//////////v/rP/////////u4OT//////////63/5///sf/F////////4P//w////+z//////+b/7OCj/+/O7////////+7a///Z/////////8X/9////////////P///////////+//8u3/9P/////83P//1v/////88f////7Yy////9L//+T/////1P3Y///////+/9T//+f///+l/7+u//+m/+///9D/4v/////+/8X+2bD5s+H//+z////////g//+I////zfH/uur//////////////////8P//9f///3/////2ND/6v//////5f//2////////+n//9b//////////8r/+v/N////","weights":"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/zz//TX5/N8S9P7//Pz8+RcA/AAP+fH/+PAV9Pz0+Pr8+/st+PkS/fT7APod+gD2+/76/xD8APX8+/z4+/z//fv//S4H/fr98Pn3/vj2AP3z9/z99PP8//v///v+AP/79//3+/8Y/f39/wD7APL6Di37Bvzy/v7///oA9v/5/fn8+vn9+v3x9P4V//0OGv39/Rn/+f79APkf//f9FPf//Pr/+Rj9/vcL+fQM//z+//7//Psg+/3/+P/+/PkS/Pv/AP77+vz//f4AAPv2/vwM//79+QAAAPz9+v39AgX++fb7/Rb9/P30/gj/+gD9///+/AcA+Q///f7+9P/7BP3+//j7/v3+/vj9/v76+hT5Af/6/fr9/PQA9/f1+i/6+vv8APgZ9fv27/4w9/kE9/wALAD+8v76/v/8+/oA+hIR//ZT9/z6/fnz9//zB//0/k/6+v4d+xL////5/fz9/wD5//z3C/f49vn9/AHk+QgA/vn6APz26vvs/f3+8f8L+/79Hv7//vH/8/3zE/j4+wL/+Pn4//78+SoA/f75/vD3/f0A/v39Ewn+/f/5+vsI+Pv4/+799fn6//v89/kA/vT69gD+9fv4/PX/+f37APf7+Pf/AP338fT++fD+/A7+9wf1+vr+/P377/r6/v7/APX/GAb88fv+Bvjw8f79Dv3z+v70APz7+PX6BQAR/fv8/P/4+vT++gAIBRMX/P/7/j///v33CP4A8QD+Ffr9Dv799gD2APsZAAoA//3h//8GCPj1/fj59vkC+vr99wD+/f398ff8+Pn/8v74+v74HQD/HP38AP3++vX3AvweAPf6//QADfr/9/brAP36/P7/6Av9/zj3+/8I//L+/PcAMf/5EfYABPz8+Pf8AAL/8v7q/vgi9Pn/AP/+//r/9vb7B////wD4I/32Dvz7/Pv8/v74APr/DNL9/AD++vX+/fr9/fz9AAP99wP9/vj6/An9+Oz9/gH8/vsAAPb///36///89hgL/v7x+v7+APX6+QTt//T/+vr3//8M/PL6/P/8/gD6/vH99vv+I/f4/fz+AAAE+eL9///9AP/v/v7+Dvz++v8A+/X6+fn7Cwv4D/v89PsA//0f+/38/f/+/f7+//f+9AD89/v9//37/f/0/fv3+vwA//7+/vcb/g/38/cA+v/4/vv///719Fn5/fz7///9Bf74+/n6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"},{"names":["3d","ai","brand","identity","motion","none","packaging","slides","web"],"bias":[-0.56626,-0.66562,-1.11881,-0.17098,-0.51293,4.34629,-0.27213,-0.74954,-0.29002],"scale":[0.096439,0.067662,0.049501,0.058609,0.055914,0.032655,0.048485,0.069729,0.058316],"idf":"/7L/t8b/////////////zf/j/+T////zx///9v/+//+Q/////7j//9L//8j//////+e0///z/+bx/////9r///////D/9vz9tv///5v2/8r///+t+fSj//z///X/8f///5//tf//wK6c/+v////////E///C//+8///a/6H/1v//sP//wv/t/////f/82e39////1v//2Mb///////a+//uczv/////////////b7qn/7vnezPaC/87///n////k///A77zF//////////////////P/1///vvj/xfj//+/////u/+O9wf//9v///9b//++96P/e/5v////////////////////////3/////9za+P////H////r7ff/2f///////////+b/////+f/5/////P+6sf/////t/////////////8nz/////////+Hx///q//n/1/+k1f///7X////////y////4fn/////6//S////6P//0XD5/8X//////+j///z/////////8v///7D///+o2P//4P//uv//4LjM9v//////3////7f//8n////7//+7///T///9w/+0/+b///z/////0P//2P/V/////////8z////7/5j////52/////////j//8L8/////////////8f/////2v//////2dD/78HQ9f///+2z///////////8/////8r/xf//5v//9ufv2f/W//////b2////////////2P/Unv///////9y+/////////9Hx//////H/zf///////9D///vX////x///+////9fL+WH/////////+///3P/b6+3////V/v/Xq///////////8//9/+v/3//I0v/p9P///+v/5Nj//9T/4f///////////+T/wO///7L//9H/////////8v//yMv/////uP//zvXm///Q///I///////q//////////Xo////9f///////+///////5T/////////////+f//8v////+l//////////////+Y///7/v///////////////+L//8D//+j88+vV///////////U////+//H//+b//////////3p+f////3/+v////3b////tf/////kvf////+x/5v//////+T////z+f/z///////K///S////sP///////////////9b8///p/9b9+f///7n/////1//////i/////////////////+r////////t////woz////c///D7//LuP+l5P/////E8+/Q7cbe3P///////8i6sv////////Pmxf///93/////5P/v///405z/2//////////z//+//+39/9/o6P/V+//////E//////////+N////////////4f////n//6z/////8//I8f+H+tj///////////+89P/////V///2/+D/1Or/0f//1uz/////+f//4f//4/////+tzf//7/+0////wv/+////6s7C///////F3f////////+k5//////4//H8//+zvv////mm7u/W///C/8S///+YuP/////e//////+7//D////////d4f/W///////n//////////j/4f////+f1v//vv///+r///Xt1Kj/1+z////////V////wv//////x/H/sv/qkv//2LX//6r//8///+j////y///53P/s////4P////b/9P//5vj/////0P/z0v/Ryv/////Y3//q///b/6b/8v/1/8b//////////5b////////Tjf/////L/77///H/7P//////udv////P/7z/////stZzvf///8XK/8j2///E/fL///+w////3////7D///////P/iP//+f+x/4b/8v//////1+3Gzv/9/////8H/+P+e+f///////P///+TT1v/i6f/r/6v///////+t///a2///1/////+Dy/////H////u/+bZc///6v/J8eH/////5Nv/////58z//+3//+//////////4P///////6fF//D/uv//////8f/gyun/4v//////////qv/////////7/v////7////S/7v/vf////P/1v///////9P/877/6puc////2v//+fH//+v///////+1/P/g/////+z68//x6v////f//////+H/0v/N///////t+P//8/D///////j/////uP/g///O/////////+PY///2z+ra/////+H/zP/5///////////3vP/////r////////8////+7///L/uN7//////P//////6bj9////////////////3f///9z/////////4P////////+8////////////////6P//////7vP9///////9//T/7/////////H/3e3/////2P/////D/8f7///////////O/8z/uv/k/+7//73X6M/i6///////vdz/m//j5f//zvnJ1v//////4P////////7/9vL///H////1///J///h///x///92//////////X///////U////7uH/3N3/3v+s//////Pk///Fnv+V////jP///////////6j/p//////f/+T/7P/////+//////////zM///////////////L/////////8b/sqLx////uvr//+zwuP//v//r////+P///+3/5PD////CyKT//7H///+t1P//////////8t3//////4v//8b/3////9yxx/////bB9f/Q//z//5rYxv///////////9H////////////9/5//////////wf//6PT////04//i//z//////8my/////6vP//bW89mp8f//7v//////2cf/3MX///+w///x/+r/+P//////7cTYwP32/9b//97/9b//+NTr////////6/D////V/////83//9D////42sv/+P/+8dL/////5f/i//3/3f///////////7r/5f/////I9//4//T/////////////5q////////3//////+r/////9P/////7///6/73/rf///////8T///////////////+X+////7H/3f+2///////1//////b2///////w/5n/+P3/5v//////////4KL////////v////////7////7vs9f/////h/97/3////////////////////+z/v///9//////////M/+7I/////////+T////d9dj/5f/Z//////+vt//////////////m/+be//vF///v/+//////8fT/+v///93///+h/////8r//+f/////////6/////bG///////Vgf/////q/+LA/v//9f///5H/zPX////0///////J///v/8L//5u9///x8f+u//P///+P6MLk//////+gzv/x///56v/j+cv/5P/////awv+yt///9bf/+v/+tHz//////8T////t////////+P/////////////J//+//5/2///////////l////7v//kOT/////1//////////W////5//o////+v/////n5P///////9yy////9v7q/+T//6L//////7jS4f//////pee////N5//h+f/6//////f////t8/+4////////6v//8P/Otv//2v//////9tv/////p9L/8f+////Q/+nV////////////mf////////jk1Nb//////////67/7///s/+9////////2v//s////+L//////9755vWl//PH8v////////Tb///V/////////8D//f/////////////////0//////X86P//6P/////23P//vv//////8//////N1v/+/93//9f/////0vbX/////////8z//+jv//+d/8Ww//+s/+T//9v/4f/////7/9Dr3Kv2udn//+L////////k//+E////z/3/uN/////9/////////////73//9P7///5////0tv/8f//////8v//4v///////+7//9j//////////8H/+P/I////","weights":"/fz+Af4AABkDB/7///8V/wD/DwH+AP0G9v/1+/3/APgC//8A/w3+AAD+////AAAA//n4AAcCAPv8BfwAFgf+/wAAAAYA+xf9+v/+AP0P//f///4a/AsB/f/9AAD+EP4AB/n++v0AAPoAAAb//wAA/v3+/BgV/v8R/v75/PUAAAABB//9/gADAAEA/QH++//9/w7//fUA+g4AAP0AAPoE//j0AAAG/v3++wEA///6//0A/fz++A4J/gH///77AP8G/f77AwQC//z+/v8A/QH+/P7/B/v9BP3+BB8A/f/9/fj//gAC//z7/QX/APwBBP39/v3+/f/9/ff7AAAB//v+/wr+EAEHAP0A/gkB/h8A/Af+9wD/AfwB/v8AAf7///0A/f7//gIO/f8C//4AAAT8/QAAAf/8BgAAAv77/QAA/P8kAP8AB/wA/wD//wAA/gMF/wX8AAr+/gUE//8Q//j+//7/AAD+AP/+Lv///wAJCv/3/QAD+/8A+QoB/wsAAf8CAPz/AP8ABf8AAPv//AAA/xX8+wDv+v7/+v7+AP8A/QUQ//z9AB0R/wD+Bu4AJQX//QD//f39AP76/gj8/P8L+v8B//n+AAL9+wD+/gb5+/8C/P/+//v/APwA/wX+AAD7/wD/+v39Bv7//vcN/vr/Bf////3//wT6DQD88gP1AAEAFvf9+wECA//7/v36/v/9+v3//P/8AAD///L/BP4AAPz//P7/A/0KCv7//vwH/f0HAAf//gAA//0HAP8AAP0AAAv//wEA//8A/wH7DwAAAP8A/v78/xT+/AMAAAAA///+/QAB/AD/ABQD/v78//z+/gAA9/7///78Bf3/AAD8+/7//v/+AA/+/v0AAP8cEf4AAPwC/f/6APv7APcACP4ADAQA9f//AP7/AP3+/vv9+f3+APv//wUA/v4AAP7//f8A9vkHAP//9f//AQUF//sH/f/7/QAA//0F/QD9/wAAAP/3A/8BAQAA/P8AAP/+AAH+Afv/AP4A/wEAAP8AAAj//P7//wAJ///7APYA//8A//36/wweC/8B/QD//f/+/BMFAAn/CQQC//8A/P38AP4A/gD+/v8LEf4AAQAA/wIP//7///4A/gkqBP78APz//gf+/Cr8+v37AP7/CP8B/f0AAxH+C/79Ev4A//sBAgQW/////f0ACPn/+/8q/v8bCwX+/wD/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/AD6/PkAAAj9Av8j/v/2/Pz+EwD5/wv8/if/+v///AEA9g0U+voB9/38IPv/APgAEv///wABDP/6EgD9/wH+9ycE/f75/fn//vgC/voA/v3+///+CvUC9/j5+Pr3+wT39vr+Cf75AP7/Fwb++f4O///4AAD3/QH5+wn4/vX/Afz9+voUHvsD/vgA//72/wj/+gcG/wH9AAD9APLv9//0///8/xX8/gABAPkI/f4dBAv//hD9/QEA/AD0///9Bv77/fzs//7///oS/v/8//f/AP/6AAX+///7GAT//vz8A/n9+f4A9QACF/37/v3//fv8+ff/+v//AfgH//z+APv8/P79+/wAAfYw/wL6//v3+gAAAP/+//sBIvv+/vn7/P/3A/s3/wr+9gAHAAD//P8C+/kKL/z9+gD1/v/+//T6/v39/vb+AP/9VPP39AAd//X+/f329/j2Dfv2/wT88vQC7vn3/f79BxD7DPYAAf///v8DAgAGCvYA//n5/fkXI/cCHgj5//vn+woOAvj2+/3+8/3/CP73//v7AP8qAPgF+f71+fYIBf/6AP4A/vYaAPoG+/QAAPgPB/8d+/7//v/+Avj//QPz/ff+AvkE/AD6/yASHPkADv74BPoC/v8A/v//AAD7/P8M+vsTAgr3AO38EgwF/PX7/v4ANO0KBQD9/vgA/v7/B/39AAD/+vf/AP/3/QEACPgVAf3/9hv3//P+Mgj//vf//v////H/+vr4BAP///8K+P8J/PkA/P4KAPgA9vAX+f8A+/n/Bf35+v3//QD6/gMB+P/1//T//v0EAf4AdQD8+v33/P/59f8HAP38AP///Pr7/QX/+/II/PP3/vgEAwD//AD6/AL97/34Jv7/+w0L9gP++/v8B/n5AAEBBPz8+gEoChf6/wcAAff//vL//xf/+xv/Dfj8//v7+wD//vYAFf3/D/70+/cB+wFdChEGAP38/f8J+/v/bvb//yr//hwS+grx/fwA/wAA9P74/RkK+QL9+/0D/woA+gP6+v/9AAIG+vf9GP7+AAH//vkBCwEM/P/6ARX+CP8BAvoAAP7///8EAP77DPwG/v0J/fz8APoM/PcBAAIB+wED//4L+v8FBAD8+QD/+gss8gH9+P3+ICv//wAH9/T8//4A//8JAv0r/f38BQAA+v4NAPv6/wAG//j78wcA/vsB/vv+/gD+Af/2/wP6f/0CAQT9/vsRB/7+//729vwA/wT///f6/goC+/cACP8A+f/+//wGAPr3+v7/Jv///xb5Hf3/AwD8Af78AfX//P/7AgAA/wD///cJ/vr4+f7///f9/Qb9/QEF/AD++hn3+wT1/f8DDAv8BQz8EAEHAPr/8vkI8/IB/QP+AQL9Bjr6/fn+/Pn1AP79BPP+GA/7AfoADf7/AAEA/gMG/fvq//v87wD0A/1GLv//9f/9Dfn8/wH//BAR9gD77/z8/AEA+f8A/gsMAf39/Pzt+/z+Afv2/wACB/34AP78+AD9/Qf7+QDoA/0BAfwAAP/4AP75/wAD/v0A/gD+/P0A//7+//3/ABHzAP7+8vsFDAD8BvAAAvz0/P7++wD++gED/Br9+/LyAP/9/gYbAAD++PP3/wkq/P/+A/z5AP799hL/AQD//v/+//749/769//0Avz9+fn99/33/gD+8/8A+////xn79i38AR8B6/z++AAG//z///sABPr9//v9/vv+DvsA+v3z+PT79vb8AP79/Pb9APz6/P75/Ab3AP8CC/URDAT79v8C/fr3APz+CPj6CQD7+f9z+PkA//v+/P70/Bch/f/+AAH+AP39A/v6//j4/vsA/gT+/wAXAPrv+vD6/P7/8/0A/Pj9Cgf8GP4N/jH7+f38/f379gcEAP/7GQ38/wH/DiMA+P0I/P78+w8F/fYM/v8DAAQp/Pr//wb8Af75/f0BAP9c/fcD/A79+foA9QP8Afz///76+wkaBf4A/vn5/e3+9/P/AAv9Ah78+/3++wEA/vkK/Pv4NwH/Av/+BPf+/yP//fn2/Av9/QEA/QEA/fj9/QD8AP8A+fwA/wAECf78"}]};
  const decode = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));
  const size = packed.size;
  const heads = packed.heads.map(head => ({
    ...head,
    weights: new Int8Array(decode(head.weights).buffer),
    idf: decode(head.idf)
  }));
  const stop = new Set(packed.stop);
  const pleas = /^(?:добрый день|добрый вечер|доброе утро|здравствуйте|привет|приветствую|спасибо|hello|please|hi)[\s,.!?—–-]+(?=.{5,})/;
  function normalize(text) {
    return String(text || "").toLowerCase().slice(0, 1400).replace(/ё/g, "е")
      .replace(pleas, "")
      .replace(/(^|\s)не (?!только )(?:[^,;.!?]{1,52}?)\s*,?\s+(?:а|но нужны|но нужна|но нужен|но хочу)\s+/g, "$1 ")
      .replace(/(^|\s)(?:не (?:хочу|нужны|нужна|нужен|нужно|интересуют|интересует|показывай)|без|кроме) [^,;.!?]{1,50}(?=[,;.!?]|$)/g, "$1 ")
      .replace(/3\s*[- ]?\s*(?:д|d)(?=$|[^а-яa-z])/g, "3d")
      .replace(/[^a-zа-я0-9]+/g, " ").trim().replace(/\s+/g, " ");
  }
  function bucket(str) {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) hash = Math.imul(hash ^ str.charCodeAt(i), 16777619);
    return (hash >>> 0) % size;
  }
  function features(text) {
    const words = normalize(text).split(" ").filter(w => w && !stop.has(w));
    const values = new Map();
    const add = (feature, weight) => {
      const col = bucket(feature);
      values.set(col, Math.max(weight, values.get(col) || 0));
    };
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      add("w" + w, 2);
      if (w.length >= 4) add("p" + w.slice(0, 4), 1.3);
      if (w.length >= 6) add("q" + w.slice(0, 6), 1.15);
      if (i) add("b" + words[i-1] + "." + w, 1.15);
      const bounded = "^" + w + "$";
      for (let j = 0; j < bounded.length - 2; j++) {
        add("t" + bounded.slice(j, j+3), .62);
        if (j+4 <= bounded.length) add("f" + bounded.slice(j,j+4), .55);
      }
    }
    return values;
  }
  // Curated high-precision vocabulary complements the learned subword scores on
  // short questions and on product terminology sparsely represented in training.
  const intentCues = {
    cost: /(?:цен[ауыник]|прайс|стоим|стоит|стоят|стои[тм]ь|бюджет|день[гж]|денег|расцен|смет[ауе]|оплат|сколько (?:бер|руб|ден)|во сколько обойд|price|cost|budget|pricing|how much|estimate|quote)/,
    timeline: /(?:срок|дедлайн|успе|займет|займут|дней|недел|по времени|за месяц|к (?:пятниц|понедельник|запуск)|когда (?:буд|гото|получ|нач|смож)|времени|как долго|скоро (?:старт|запуск)|deadline|timeline|how (?:long|fast)|when .*(?:start|ready|finish)|turnaround|days|week)/,
    brief: /(?:бриф|(?:^| )тз(?: |$)|техзадан|техническ[a-я]+ задани|анкет|опросник|формулир[a-я]* задач|описать (?:проект|задач)|brief|questionnaire|project outline)/,
    contact: /(?:контакт|написать (?:дизайнер|александр|в лич)|связатьс|почт[ауыeе]|телефон|мессенджер|телега|телеграм|ватсап|связи|созвон|куда (?:напис|пис|отправ|сброс|отосл)|кому (?:пис|напис|отправ|пере)|обсудить (?:лично|непосредствен)|reach (?:alex|you)|contact|get in touch|email|call (?:you|the design)|telegram|whatsapp)/,
    process: /(?:этап|процесс|согласов|согласуе|правк|исходник|подготовить (?:для старта|заранее)|с чего начин|как (?:строитс|работаете|ведете|проходит|передае)|порядок работ|раундов|после (?:первого |брифа|договора)|process|revision|deliverable|workflow|steps|how (?:do|does) .*(?:work|start))/,
    work: /(?:покаж|показать|показыва|посмотр|смотрет|полист|глянут|взглян|прим[еэ]р|образц|кейс|портфол|рефер[еэ]н|шоурил|галере|откро[йие]|открой|подбери|подобрать (?:работ|проект)|готовые работ|экспозиц|samples?|examples?|showreel|show |work samples|case stud|portfolio|can i see|see your|have a look)/,
    greeting: /^(?:прив[еэ][етдтик]*|превед|здравств[a-я]*|хай|хелло|салют|спасиб[a-я]*|благодарю|добры[йе] (?:утро|день|вечер)|спс|hello|hi|hey|thank[s ]*you|thanks)(?: |$)/,
    services: /(?:услуг|занимаетесь|делаете ли|делаете|предлага[ею]|специализ|направлен|формат[ыа] работ|заказать|что входит|нуж(?:ен|на|ны|но)|нарисуете|берите ли|берете ли|services?|do you (?:offer|design)|i need|specializ|can you (?:make|design))/
  };
  const domainCues = {
    identity: /(?:айд[еэ]нт|логотип|(?:^| )лого(?: |$)|фирстил|фирменн[a-я]* (?:стил|знак)|брендбук|гайдлайн|монограмм|эмблем|wordmark|identity|logo|style guide|brand guidelines)/,
    packaging: /(?:упаков|этикет|короб[коч]|оберт|обечайк|футляр|пачк[аиуе]|тара|packag|label|wrapping|bottle label|tea box|coffee bag)/,
    web: /(?:веб|сайт|лендинг|лендос|тильд|интерфейс|интернет магазин|ux ui|ui ux|website|landing|web |^web$|interface|tilda|app ui)/,
    brand: /(?:под ключ|брендинг|ребрендинг|нейминг|позиционир|бренд[a-я]* (?:с нуля|цел|стратеги)|платформа бренда|brand strategy|full (?:brand|rebrand)|turnkey|brand launch|brand from scratch|naming|brand positioning)/,
    slides: /(?:през[еэ]нт|през[уаые](?: |$)|слайд|питч|пауэрпоинт|кейноут|pitch|deck|slide|presentation|powerpoint|keynote)/,
    "3d": /(?:3d|рендер|трехмер|моделир|цифровая скульптур|объемн[a-я]* (?:модел|граф|объект)|архвиз|блендер|визуализац|render|blender|\bcgi\b|three dimensional|3d model)/,
    motion: /(?:моуш|анимац|анимир|титр[а-я]*|кинети[кч]|заставк|ролик|видеоанонс|motion|animat|kinetic|title sequence|moving typ)/,
    ai: /(?:нейро[сф]|генератив|генераци[яюи] (?:фото|изображ|визуал)|генерир|(?:^| )ии(?: |$)|миджорни|искусственн[a-я]* интеллект|synthetic imag|generative|midjourney|(?:^| )ai(?: |$))/
  };
  const unrelated = /(?:погод|метео|температур[ауеы]|прогноз погод|бензин|биткоин|бирж[аеуи]|футбол|кулинар|рецепт|духовк|борщ|аптек|симптом|лечить|грипп|удобрени|премьер минис|мэром|маршрут|расписание (?:поезд|автобус)|stock price|weather|jupiter|recipe|football|flight price)/;
  function priors(text, patterns, domain) {
    const boost = {};
    for (const [name, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) boost[name] = domain ? 3.3 : (name==="services" ? 1.55 : 3.3);
    }
    if (domain) {
      if (boost.brand && (boost.web || boost.packaging) && !/бренд|ребрен|позициони|brand|naming/.test(text)) delete boost.brand;
      if (boost.brand && boost.identity && /под ключ|с нуля|нейминг|позиционир|brand launch|brand from scratch/.test(text)) boost.brand += 1.5;
    } else {
      if (boost.work && boost.cost && !/(?:пример|референс|кейс|samples?|portfolio|case stud)/.test(text)) boost.work -= 2.4;
      if (boost.brief && boost.contact && /(?:куда|кому|where|send|отправ|отосл)/.test(text)) boost.contact += 1.6;
      if (boost.greeting && Object.keys(boost).length>1) delete boost.greeting;
    }
    return boost;
  }

  function predict(values, head, boost) {
    const sparse = [];
    let square = 0;
    for (const [col, value] of values) {
      const weighted = value * (1 + head.idf[col] / 255 * 4);
      sparse.push([col, weighted]); square += weighted * weighted;
    }
    const norm = Math.sqrt(square) || 1;
    const scores = head.names.map((_, i) => {
      let dot = 0;
      for (const [col, v] of sparse) dot += head.weights[i*size+col] * v;
      return head.bias[i] + dot / norm * head.scale[i] + (boost[head.names[i]] || 0);
    });
    const maximum = Math.max(...scores);
    const sum = scores.reduce((s, n) => s + Math.exp(n-maximum), 0);
    const i = scores.indexOf(maximum);
    const confidence = 1 / sum;
    return { label: head.names[i], confidence };
  }
  function classify(text) {
    const f = features(text);
    if (!f.size) return { intent:"unknown", discipline:null, intentConfidence:0, disciplineConfidence:0 };
    const clean = normalize(text);
    const ip = priors(clean, intentCues, false), dp = priors(clean, domainCues, true);
    const i = predict(f, heads[0], ip), d = predict(f, heads[1], dp);
    let intent = i.confidence >= packed.intentThreshold ? i.label : "unknown";
    let discipline = d.label !== "none" && d.confidence >= packed.disciplineThreshold ? d.label : null;
    const offTopic = unrelated.test(clean) && !Object.keys(dp).length;
    if (offTopic || (!ip[i.label] && !discipline && i.confidence < .70)) intent = "unknown";
    if (intent === "unknown") discipline = null;
    return { intent, discipline, intentConfidence:+i.confidence.toFixed(3), disciplineConfidence:+d.confidence.toFixed(3) };
  }
  host.AMIntent = Object.freeze({ classify });
})(typeof window !== "undefined" ? window : globalThis);

/* Local portfolio concierge. The catalogue and the optional answer endpoint are supplied by the page. */
(function (host) {
  "use strict";

  const groups = {
    identity: ["Айдентика", /айд[еэ]нтик|логотип|фирменн.{0,4} стил|брендбук|монограмм|фирстиль|identity|brand identity|logo/, "Знак, надпись, палитра и правила применения на носителях."],
    packaging: ["Упаковка", /упаков|этикет|коробк|футляр|обечайк|пакет для|packaging|wrapper/, "Конструкция графики для этикетки, коробки или линейки, проверка читаемости и подготовка макетов."],
    web: ["Веб-дизайн", /веб|сайт|лендинг|тильд|тилд|интерфейс|landing|website|tilda|ux.ui/, "Структура страницы, визуальная концепция и адаптивные экраны."],
    brand: ["Бренд под ключ", /бренд.{0,4} (?:целиком|под ключ|с нуля)|брендинг|ребрендинг|нейминг|позиционир|стратегия бренда|turnkey|brand strategy/, "Позиционирование, визуальный язык и применение айдентики на основных носителях."],
    slides: ["Презентации", /презент|слайд|питч|презу|pptx|pitch|deck|slide|keynote|powerpoint/, "Сценарий выступления, композиция слайдов, диаграммы и редактируемые мастер-слайды."],
    "3d": ["3D-графика", /(?:^| )(?:3 ?[dд]|cgi)(?: |$)|рендер|трехмер|моделирован|блендер|архвиз|преломлен|render|blender/, "Модель, материал, свет и серия ракурсов для предметной графики."],
    motion: ["Моушн-дизайн", /моуш|моушен|моушн|анимац|анимир|кинетич|титр|заставк|motion|animat|title sequence/, "Кинетическая типографика, анимированный знак, титры и короткие петли."],
    ai: ["ИИ-контент", /нейросет|генератив|генераци.{0,5} (?:изображ|контент|фото)|ии контент|ии визуал|нейроарт|midjourney|ai content|generative/, "Арт-дирекшн и сборка серии изображений под единый визуальный характер."],
    print: ["Полиграфия", /полиграф|тираж|печат|печать|журнал|типографи[ию]|визитк|листовк|брошюр|буклет|каталог продукц|разворот|зин(?:а|ов| )|print|booklet|magazine/, "Сетка издания, вёрстка, варианты разворотов и подготовка к печати."],
    social: ["Соцсети", /соц ?сет|соц ?меди|сторис|сториз|карусел|пост.{0,4} (?:для|в )|контент.{0,3}план|smm|social|stories|carousel/, "Шаблоны постов, карусели и сторис с адаптацией под форматы ленты."],
    product: ["Карточки товара", /карточк.{0,7} (?:товар|маркет|продукт)|маркетплейс|инфографик.{0,12}товар|вайлдбер|wildberr|озон|ozon|главн.{0,5} фото товар|product card|marketplace/, "Обложка карточки, инфографика свойств, детали и галерея ракурсов."],
    stickers: ["Стикеры", /стикер|наклейк|эмод[жз]|персонаж.{0,12}пак|sticker|emoji/, "Персонаж, характерные эмоции и набор выразительных поз или коротких петель."],
    coding: ["Код и интерактив", /кодинг|котинг|программир|фронтенд|верстк.{0,9}сайт|калькулятор|генератор сеток|виджет|код.{0,5} инструмент|разработк.{0,12} (?:сервис|веб)|coding|frontend|front end|calculator/, "Небольшие цифровые инструменты, интерактивные калькуляторы и генераторы для веба."],
    agents: ["ИИ-агенты", /ии .{0,9}агент|ai .{0,9}agent|ии ассистент|ии помощник|интеллектуальн.{0,5} помощник|нейроассистент|нейроагент|агент.{0,7} для|умн.{0,4} помощник|семантическ.{0,6} поиск|чат с ии|ai assistant/, "Помощник с понятной задачей, базой знаний и сценарием диалога, например подбор материалов или подготовка брифа."],
    bots: ["Telegram-боты", /(?:telegram|телег[ра]{1,3}м|телега|тг)[а-я ]{0,14}бот|бот.{0,18}(?:телеграм|telegram|тг)|чат.{0,2}бот|тгбот|бот.{0,7}(?:запис|брон|мероприят)|телебот|telegram bot/, "Сценарии записи, бронирования, расписания и кнопки внутри Telegram."],
    editing: ["Видеомонтаж", /монтаж|склейк|рилс|р[ие]лз|рлс|reels?|shorts|нарезк|вертикальн.{0,9} видео|видеопортфолио|editing|video edit/, "Монтаж вертикальных роликов, ритм склеек, звук, титры и адаптации для Reels."],
  };

  const specificity = ["bots","agents","editing","stickers","product","social","coding","slides","3d","packaging","print","motion","ai","brand","identity","web"];
  const briefSteps = [
    ["Задача", "Какой результат нужен и для какого проекта?", "Например, представить новую коллекцию на выставке."],
    ["Результат и объём", "Что должно получиться и в каком объёме?", "Например, презентация на 12 слайдов и две короткие версии."],
    ["Аудитория", "Для кого этот материал и где его увидят?", "Например, байеры на стенде и партнёры в почтовой рассылке."],
    ["Срок", "К какой дате нужен готовый результат?", "Можно указать дату события или приблизительный ориентир."],
    ["Материалы и ограничения", "Что уже есть и что важно учесть?", "Например, брендбук, фотографии, бюджет или технические требования."]
  ];
  const MAX_QUESTION = 1000;
  const MAX_TRANSCRIPT = 20;
  const STORE_KEY = "makovsky-portfolio-chat-v2";

  function normalized(value) {
    return String(value || "").toLowerCase().replace(/ё/g,"е").replace(/[\u00c0-\u024f]/g, ch => ch.normalize("NFD").replace(/[\u0300-\u036f]/g,""))
      .replace(/(?:^|\s)не (?!только)[^,;.!?]{1,54}?\s*,?\s+а\s+/g," ")
      .replace(/(?:^|\s)(?:кроме|без|не показывай) [^,;.!?]{1,42}(?=[,;.!?]|$)/g," ")
      .replace(/[^а-яa-z0-9]+/g," ").trim().replace(/\s+/g," ");
  }

  function matchesGroups(text) {
    return specificity.filter(name => groups[name][1].test(text));
  }

  function intentFor(raw, previousGroups) {
    const text = normalized(raw);
    const learned = host.AMIntent?.classify?.(raw) || {};
    const explicit = matchesGroups(text);
    const more = /^(?:еще|дальше|другие|больше|еще пример|покажи еще|что еще|давай еще)(?: |$)/.test(text);
    const choices = explicit.length ? explicit.slice(0,3) : (learned.discipline && groups[learned.discipline] ? [learned.discipline] : []);
    if (!choices.length && (more || /а (?:сколько|какой|как|срок)|а по времени|и по цене|и цена|это стоит|это займет|похожие/.test(text))) choices.push(...previousGroups);
    const sampleCue = /покаж|показать|откр[оы]|смотр|посмотр|кейс|пример|портфол|образец|подбер|подбор|подбери|полист|showreel|examples?|portfolio/.test(text);
    const priceCue = /сколько (?:стоит|денег)|стоит ли дорого|бюджет|стоимост|цен[ауыеник]|прайс|смет|оплата|pricing|how much/.test(text);
    const timeCue = /срок|дедлайн|по времени|займе?т|займ[уё]т|успе|как долго|дней|недел|за какое время|deadline|timeline/.test(text);
    const contactCue = /как (?:написать|связаться)|куда (?:написать|отправить)|контакт|адрес почты|почта|телефон|reach you/.test(text);
    const briefCue = /(?:заполн|состав|подготов|начн|начат|собра|сдела|созда).{0,16}бриф|^бриф$|техзадани/.test(text);
    const compare = /чем отлич|что лучше|почему|как выбрать|подойдет ли|какой .* выбрать|посовет|сравни|как сочетать/.test(text);
    let intent = learned.intent || "unknown";
    if (contactCue && !explicit.includes("bots")) intent = "contact";
    else if (priceCue) intent = "cost";
    else if (timeCue) intent = "timeline";
    else if (more && !priceCue && !timeCue) intent = "more";
    else if (sampleCue) intent = "work";
    else if (briefCue && !explicit.includes("agents")) intent = "brief";
    else if (compare) intent = "open";
    else if (explicit.length && (intent === "unknown" || intent === "contact" || intent === "brief" || intent === "greeting")) intent = "services";
    else if (/все направлен|список услуг|какие услуги|все услуги/.test(text)) intent = "services";
    return { intent, groups:choices, explicit, text };
  }

  function allowedLink(value) {
    if (typeof value !== "string" || !value || value.length>1800) return null;
    try {
      const url = new URL(value, host.location.href);
      if (url.protocol === "https:" || url.protocol === "http:") return url.href;
      if (url.protocol === "file:" && host.location.protocol === "file:" && !/^[a-z][a-z0-9+.-]*:/i.test(value)) return url.href;
    } catch {}
    return null;
  }

  const plain = value => String(value || "").trim().slice(0, MAX_QUESTION);
  const groupLabel = key => groups[key]?.[0] || key;
  function works() {
    return (Array.isArray(host.AM_CHAT_WORKS) ? host.AM_CHAT_WORKS : []).filter(item => item && typeof item.id === "string" && item.title && allowedLink(item.href));
  }
  function exactWorks(text, catalogue) {
    if (!text) return [];
    const full = " " + text + " ";
    return catalogue.filter(p => {
      const title = normalized(p.title);
      return title.length>2 && (full.includes(" " + title + " ") || (p.id.length>3 && full.includes(" " + normalized(p.id) + " ")));
    });
  }
  function groupOf(work) {
    return groups[work.group] ? work.group : matchesGroups(normalized(work.type))[0];
  }
  function selectWorks(catalogue, selected, last = []) {
    const pool = selected.length ? catalogue.filter(p => selected.includes(groupOf(p))) : catalogue;
    const choose = [];
    const add = p => { if (p && !last.includes(p.id) && !choose.includes(p)) choose.push(p); };
    selected.forEach(group => add(pool.find(p => groupOf(p) === group && !last.includes(p.id))));
    if (!selected.length) {
      const seen = new Set();
      pool.forEach(p => { const key=groupOf(p); if (!seen.has(key) && !last.includes(p.id)) { add(p); seen.add(key); } });
    }
    pool.forEach(add);
    return { items:choose.slice(0,3), total:pool.length };
  }

  function createNode(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function button(label, action, style) {
    const node = createNode("button", style || "am-chat-chip", label);
    node.type = "button";
    node.addEventListener("click", action);
    return node;
  }
  function glyph(kind) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.setAttribute("viewBox","0 0 24 24"); svg.setAttribute("aria-hidden","true"); svg.setAttribute("fill","none");
    const paths = {
      arrow:"M5 12h14m-6-6 6 6-6 6",
      close:"m7 7 10 10M17 7 7 17",
      send:"M12 19.5V4.5m-6 6 6-6 6 6",
      chat:"M5 4.5h14A1.5 1.5 0 0 1 20.5 6v9a1.5 1.5 0 0 1-1.5 1.5h-7.5L7 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V6A1.5 1.5 0 0 1 5 4.5Zm3 5.6h8"
    };
    const path = document.createElementNS(svg.namespaceURI,"path");
    path.setAttribute("d",paths[kind]); path.setAttribute("stroke","currentColor"); path.setAttribute("stroke-width","1.65");
    path.setAttribute("stroke-linecap","round"); path.setAttribute("stroke-linejoin","round"); svg.append(path);
    return svg;
  }
  function readSession() {
    const blank = { messages:[], brief:Array(briefSteps.length).fill(""), step:null, editing:false, seen:[], groups:[], finished:false };
    try {
      const raw = JSON.parse(sessionStorage.getItem(STORE_KEY) || "null");
      if (!raw || !Array.isArray(raw.brief) || raw.brief.length!==briefSteps.length) return blank;
      return {
        ...blank, brief:raw.brief.map(plain),
        step:Number.isInteger(raw.step) && raw.step>=0 && raw.step<briefSteps.length ? raw.step : null,
        finished:raw.finished===true, editing:raw.editing===true,
        seen:Array.isArray(raw.seen)?raw.seen.filter(id=>typeof id==="string").slice(0,64):[],
        groups:Array.isArray(raw.groups)?raw.groups.filter(id=>groups[id]).slice(0,3):[],
        messages:Array.isArray(raw.messages)?raw.messages.filter(m => m && ["user","assistant"].includes(m.role) && typeof m.text==="string").slice(-MAX_TRANSCRIPT).map(m => ({
          role:m.role, text:m.text.slice(0,1700), cases:Array.isArray(m.cases)?m.cases.filter(id=>typeof id==="string").slice(0,3):[], contact:m.contact===true
        })):[]
      };
    } catch { return blank; }
  }

  function boot() {
    if (document.getElementById("am-portfolio-assistant")) return;
    const state = readSession();
    let connectedHistory = [];
    let controller = null;
    let remotePending = false;
    let opened = false;
    let opener = null;
    let liveActions = null;
    let liveBrief = null;
    const root = createNode("aside","am-chat-root");
    root.id="am-portfolio-assistant"; root.lang="ru";
    root.setAttribute("aria-label","Помощник портфолио");
    const launch = button("",() => setOpen(!opened),"am-chat-launch");
    launch.append(glyph("chat"),createNode("span","","Помощник"));
    launch.setAttribute("aria-expanded","false"); launch.setAttribute("aria-controls","am-chat-panel");
    const panel = createNode("section","am-chat-panel");
    panel.id = "am-chat-panel"; panel.hidden=true; panel.setAttribute("role","dialog"); panel.setAttribute("aria-modal","false"); panel.setAttribute("aria-labelledby","am-chat-title");
    const header=createNode("header","am-chat-header");
    const badge=createNode("span","am-chat-badge"); badge.setAttribute("aria-hidden","true");
    const symbol = String(host.AM_CHAT_SYMBOL || "");
    if (symbol && (allowedLink(symbol) || /^data:image\/(?:webp|png);base64,/i.test(symbol))) {
      const image=createNode("img"); image.src=symbol; image.alt=""; image.addEventListener("error",()=>badge.replaceChildren(glyph("chat"))); badge.append(image);
    } else badge.append(glyph("chat"));
    const names=createNode("div","am-chat-names");
    const title=createNode("h2","","Помощник"); title.id="am-chat-title"; title.tabIndex=-1;
    names.append(title,createNode("span","","Портфолио Александра Маковского"));
    const close=button("",()=>setOpen(false),"am-chat-close");close.append(glyph("close"));close.setAttribute("aria-label","Закрыть помощника");
    header.append(badge,names,close);
    const feed=createNode("div","am-chat-feed"); feed.setAttribute("role","log");feed.setAttribute("aria-live","polite");feed.setAttribute("aria-relevant","additions text");feed.setAttribute("aria-label","История диалога");
    const form=createNode("form","am-chat-form");
    const lab=createNode("label","am-chat-visually-hidden","Сообщение помощнику");lab.htmlFor="am-chat-question";
    const input=createNode("textarea","am-chat-question");input.id="am-chat-question";input.rows=1;input.maxLength=MAX_QUESTION;input.placeholder="Спросите о проекте…";input.autocomplete="off";
    const send=createNode("button","am-chat-send");send.type="submit";send.setAttribute("aria-label","Отправить сообщение");send.append(glyph("send"));send.disabled=true;
    form.append(lab,input,send);panel.append(header,feed,form);root.append(panel,launch);document.body.append(root);

    function save() {
      try { sessionStorage.setItem(STORE_KEY, JSON.stringify({...state,messages:state.messages.slice(-MAX_TRANSCRIPT)})); } catch {}
    }
    function scroll() { feed.scrollTop = feed.scrollHeight; }
    function setOpen(yes) {
      if (yes===opened) return;
      opened=yes;
      if (yes) opener=document.activeElement;
      panel.hidden=!yes;launch.setAttribute("aria-expanded",String(yes));root.classList.toggle("am-chat-open",yes);
      if (yes) {
        const target=host.matchMedia?.("(max-width:600px)").matches ? title : input;
        target.focus({preventScroll:true});requestAnimationFrame(scroll);
      } else {
        (opener?.isConnected ? opener : launch).focus({preventScroll:true});
      }
    }
    function stopPending() {
      controller?.abort(); controller=null;remotePending=false;
      root.removeAttribute("data-waiting");
      feed.querySelector(".am-chat-wait")?.remove();
    }
    function clearActions() { liveActions?.remove();liveActions=null; }
    function appendActions(choices) {
      clearActions();
      if (!choices.length) return;
      liveActions=createNode("div","am-chat-actions");
      for(const [label,action] of choices) liveActions.append(button(label,()=>{stopPending();action();}));
      feed.append(liveActions);scroll();
    }
    function caseCard(p) {
      const url=allowedLink(p.href);
      if (!url) return null;
      const a=createNode("a","am-chat-case");a.href=url;
      const desc=createNode("span","am-chat-card-label");
      desc.append(createNode("strong","",p.title),createNode("small","",p.type || groupLabel(p.group) || "Кейс"));
      a.append(desc,glyph("arrow"));
      a.setAttribute("aria-label","Открыть кейс "+p.title);
      return a;
    }
    function contactCard() {
      const link=document.querySelector('a[href$="#am-contacts"]:not(.am-chat-case)');
      const value=host.AM_CHAT_CONTACT_HREF || link?.getAttribute("href") || (document.getElementById("am-contacts")?"#am-contacts":"index.html#am-contacts");
      const url=allowedLink(value);
      if (!url) return null;
      const a=createNode("a","am-chat-case am-chat-contact","Открыть контакты");a.href=url;a.append(glyph("arrow"));
      a.addEventListener("click",()=>setOpen(false));return a;
    }
    function renderMessage(record) {
      const item=createNode("div","am-chat-message am-chat-"+record.role);
      item.setAttribute("aria-label",record.role==="user"?"Вы":"Помощник");
      item.append(createNode("p","",record.text));
      if (record.cases?.length) {
        const available=works(),list=createNode("div","am-chat-cases");
        for(const id of record.cases) {const p=available.find(w=>w.id===id); if (p) {const card=caseCard(p);if(card)list.append(card);}}
        if(list.childElementCount)item.append(list);
      }
      if(record.contact){const c=contactCard();if(c)item.append(c);}
      feed.append(item);
    }
    function message(role,text,extra={},persistent=true) {
      clearActions();liveBrief?.remove();liveBrief=null;
      const record={role,text:String(text).slice(0,1700),...extra};
      if(persistent){state.messages.push(record);if(state.messages.length>MAX_TRANSCRIPT)state.messages.splice(0,state.messages.length-MAX_TRANSCRIPT);save();}
      renderMessage(record);scroll();
    }
    const say=(text,extra={},persist=true)=>message("assistant",text,extra,persist);
    const user=(text,persist=true)=>message("user",text,{},persist);
    function starter() {
      appendActions([["Подобрать кейсы",()=>{user("Подобрать кейсы");groupChoices();}],["Собрать бриф",()=>{user("Собрать бриф");startBrief();}],["Как проходит работа",()=>{user("Как проходит работа?");answerLocal("process",[]);} ]]);
    }
    function afterAnswer(selected=[]) {
      const arr=[];
      if(selected.length) arr.push(["Показать кейсы",()=>{user("Примеры по направлению");recommend(selected);}]);
      arr.push(["Все направления",()=>{user("Все направления");groupChoices();}],["Собрать бриф",()=>{user("Собрать бриф");startBrief();}]);
      appendActions(arr);
    }
    function groupChoices() {
      say("Выберите направление или опишите задачу своими словами.");
      const catalogue=works();
      const cats=Object.keys(groups).filter(key=>catalogue.some(p=>groupOf(p)===key));
      appendActions(cats.map(key=>[groupLabel(key),()=>{user(groupLabel(key));recommend([key]);}]));
      if (cats.length>8) liveActions?.classList.add("am-chat-actions-wide");
    }
    function recommend(selected, more=false, exact=[]) {
      const list=works();
      const result=exact.length?{items:exact.slice(0,3),total:exact.length}:selectWorks(list,selected,more?state.seen:[]);
      const {items,total}=result;
      if(!items.length) {
        say(total?"Все кейсы этого направления уже показаны. Можно выбрать другое направление.":"В этом разделе пока нет опубликованных примеров. Могу подобрать смежное направление.");
        appendActions([["Выбрать направление",groupChoices],["Собрать бриф",startBrief]]);
        return;
      }
      state.groups=selected;
      state.seen=[...new Set([...(more?state.seen:[]),...items.map(p=>p.id)])];
      const line=items.length===1 ? (items[0].pitch || "У этого кейса есть отдельная страница с задачей, решением и галереей.") :
        (selected.length ? "Подходящие кейсы. В каждом — задача, решение и примеры применения." : "Вот несколько работ из разных направлений. Откройте карточку, чтобы посмотреть детали.");
      say(line,{cases:items.map(p=>p.id)});
      const options=[];
      if(!exact.length&&state.seen.length<total)options.push(["Показать ещё",()=>{user("Показать ещё");recommend(selected,true);}]);
      options.push(["Другие направления",groupChoices],["Собрать бриф",startBrief]);
      appendActions(options);
    }

    function briefSummaryText() {
      return ["Бриф для Александра Маковского","",...briefSteps.map(([label],i)=>label+"\n"+(state.brief[i] || "Пока не указано")+"\n")].join("\n").trim();
    }
    async function copyBrief() {
      const text=briefSummaryText();
      try {
        if (!navigator.clipboard?.writeText) throw Error();
        await navigator.clipboard.writeText(text);
      } catch {
        const tmp=createNode("textarea","am-chat-copy-area");tmp.value=text;panel.append(tmp);tmp.select();
        let copied=false;try{copied=document.execCommand("copy");}catch{} tmp.remove();
        if(!copied){const status=feed.querySelector(".am-chat-brief-status");if(status)status.textContent="Скачайте текстовый файл или выделите текст в карточке.";return;}
      }
      const status=feed.querySelector(".am-chat-brief-status");if(status)status.textContent="Бриф скопирован.";
    }
    function downloadBrief() {
      const blob=new Blob(["\uFEFF"+briefSummaryText()],{type:"text/plain;charset=utf-8"});
      const url=URL.createObjectURL(blob),a=createNode("a");a.href=url;a.download="Makovsky-Brief.txt";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
      const status=feed.querySelector(".am-chat-brief-status");if(status)status.textContent="Текстовый файл подготовлен.";
    }
    function review(first=true) {
      stopPending();state.step=null;state.editing=false;state.finished=true;save();
      if(first)say("Бриф собран. Проверьте ответы и сохраните текст, чтобы передать Александру.",{},false);
      clearActions();liveBrief?.remove();
      liveBrief=createNode("div","am-chat-brief");
      const dl=createNode("dl","");
      briefSteps.forEach(([label],i)=>{
        const line=createNode("div","am-chat-brief-line");const dt=createNode("dt","",label);
        const edit=button("Изменить",()=>{state.step=i;state.editing=true;save();askStep();},"am-chat-edit");edit.setAttribute("aria-label","Изменить поле «"+label+"»");
        const dd=createNode("dd","",state.brief[i] || "Пока не указано");line.append(dt,edit,dd);dl.append(line);
      });
      const buttons=createNode("div","am-chat-review-buttons");
      buttons.append(button("Скопировать",copyBrief),button("Скачать .txt",downloadBrief));
      const target=contactCard();if(target)buttons.append(target);
      const status=createNode("div","am-chat-brief-status");status.setAttribute("role","status");
      liveBrief.append(dl,buttons,status);feed.append(liveBrief);
      appendActions([["Новый бриф",()=>{state.brief.fill("");state.finished=false;state.step=0;askStep();}],["Подобрать кейсы",groupChoices]]);scroll();
    }
    function askStep() {
      const step=state.step;
      if (step===null)return;
      save();const [label,q,hint]=briefSteps[step];
      say("Бриф · "+(step+1)+" из "+briefSteps.length+" · "+label+"\n"+q+"\n"+hint,{},false);
      const choices=[];
      if(step>0 && !state.editing)choices.push(["Назад",()=>{state.step=step-1;askStep();}]);
      if(step>0)choices.push(["Пока не знаю",()=>takeBrief("",false)]);
      if(state.editing)choices.push(["Оставить как было",()=>review(false)]);
      else choices.push(["Отложить",()=>{state.step=null;save();say("Черновик остался в этой вкладке.");starter();}]);
      appendActions(choices);
    }
    function startBrief() {
      stopPending();
      if(state.finished){review();return;}
      if(state.step===null){const empty=state.brief.findIndex(x=>!x);state.step=empty>=0?empty:0;}
      askStep();
    }
    function takeBrief(value,echo=true) {
      const i=state.step;if(i===null)return;
      if(echo&&value)user(value,false);
      state.brief[i]=plain(value);
      if(state.editing||i===briefSteps.length-1){review();return;}
      state.step=i+1;askStep();
    }

    function answerLocal(intent,selected) {
      const field=selected[0];
      if(selected.length && intent!=="more")state.groups=selected;
      switch(intent) {
        case "brief":startBrief();return;
        case "greeting":say("Здравствуйте! Какой проект планируете? Подберу похожие работы или помогу собрать бриф.");starter();return;
        case "more":recommend(state.groups,true);return;
        case "work":recommend(selected);return;
        case "contact":say("Для обсуждения проекта откройте раздел контактов Александра. Короткое описание задачи и желаемый срок помогут начать разговор.",{contact:true});afterAnswer();return;
        case "cost":say("Стоимость рассчитывается по задаче. Важны "+(field==="editing"?"длительность ролика, объём исходников и число версий":field==="print"?"формат, количество полос и состав печатных макетов":field==="coding"||field==="bots"||field==="agents"?"сценарии, интеграции и требования к запуску":"объём, форматы носителей и готовность материалов")+". Укажите эти детали в брифе, чтобы Александр мог дать оценку.");break;
        case "timeline":say("Срок зависит от объёма, готовности материалов и числа согласований. Запишите желаемую дату запуска в брифе — Александр сможет предложить этапы под неё.");break;
        case "process":say("Сначала формулируются задача и аудитория. Затем выбираются направление и носители, готовятся рабочие варианты, а после согласования — итоговые материалы.");break;
        case "services":
          if(!selected.length){groupChoices();return;}
          say(selected.map(key=>groupLabel(key)+". "+groups[key][2]).join("\n\n"));
          break;
        default:
          if(field){say(groupLabel(field)+". "+groups[field][2]+" Могу показать примеры реализации.");}
          else{say("Я знаю услуги, работы и этапы проекта. Например, спросите «Покажи монтаж Reels» или «Что подготовить для презентации?».");starter();return;}
      }
      afterAnswer(selected);
    }
    function endpoint() {
      const value=host.AM_CHAT_ENDPOINT;
      if(!value)return null;
      const url=allowedLink(value);
      if(!url)return null;
      const parsed=new URL(url);
      return parsed.protocol==="https:" || (parsed.protocol==="http:" && ["localhost","127.0.0.1","[::1]"].includes(parsed.hostname)) ? parsed.href : null;
    }
    async function remoteAnswer(question, info) {
      const url=endpoint();
      if(!url){answerLocal(info.intent,info.groups);return;}
      stopPending();
      const request=new AbortController();
      controller=request;remotePending=true;
      root.dataset.waiting="true";
      const waiting=createNode("div","am-chat-wait","Подбираю ответ…");waiting.setAttribute("role","status");feed.append(waiting);scroll();
      const related=selectWorks(works(),info.groups).items;
      const timeout=setTimeout(()=>request.abort(),7500);
      let answer="";
      try{
        const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"omit",referrerPolicy:"no-referrer",signal:request.signal,
          body:JSON.stringify({question:question.slice(0,MAX_QUESTION),history:connectedHistory.slice(-4),caseIds:related.map(p=>p.id)})});
        if(res.ok){const data=await res.json();if(typeof data.answer==="string")answer=data.answer.trim().slice(0,1500);}
      }catch{}finally{clearTimeout(timeout);}
      if(controller!==request)return;
      stopPending();
      if(!answer){answerLocal(info.intent,info.groups);return;}
      connectedHistory.push({role:"user",content:question.slice(0,600)},{role:"assistant",content:answer.slice(0,790)});
      connectedHistory=connectedHistory.slice(-4);
      say(answer,info.groups.length?{cases:related.slice(0,2).map(p=>p.id)}:{});
      afterAnswer(info.groups);
    }
    function onQuestion(value) {
      const question=plain(value);if(!question)return;
      stopPending();
      if(state.step!==null){
        const cmd=normalized(question);
        if(/^(?:назад|предыдущий шаг)$/.test(cmd)&&state.step>0&&!state.editing){state.step--;askStep();return;}
        if(/^(?:отложить|выход|отмена|прервать бриф)$/.test(cmd)){
          if(state.editing){review(false);return;}
          state.step=null;save();say("Черновик сохранён в этой вкладке.");starter();return;
        }
        if(/^(?:пропустить|пока не знаю)$/.test(cmd)&&state.step>0){takeBrief("",false);return;}
        takeBrief(question);return;
      }
      user(question);
      const info=intentFor(question,state.groups);
      const explicitCase=exactWorks(info.text,works());
      if(explicitCase.length && !["cost","timeline","contact","brief","open","process"].includes(info.intent)){
        recommend(info.groups.length?info.groups:[groupOf(explicitCase[0])].filter(Boolean),false,explicitCase);return;
      }
      if(["open","unknown"].includes(info.intent)&&endpoint()) {remoteAnswer(question,info);return;}
      answerLocal(info.intent,info.groups);
    }
    form.addEventListener("submit",event=>{event.preventDefault();const value=input.value;input.value="";send.disabled=true;onQuestion(value);});
    input.addEventListener("input",()=>{send.disabled=!input.value.trim();});
    input.addEventListener("keydown",event=>{if(event.key==="Enter"&&!event.shiftKey&&!event.isComposing){event.preventDefault();form.requestSubmit();}});
    document.addEventListener("keydown",event=>{if(event.key==="Escape"&&opened&&(root.contains(document.activeElement)||document.activeElement===document.body)){event.preventDefault();setOpen(false);}});
    document.addEventListener("click",event=>{
      const trigger=event.target.closest?.("[data-am-chat-open]");
      if(!trigger)return;
      event.preventDefault();openFrom(trigger.dataset.amChatOpen);
    });
    function openFrom(mode) {
      setOpen(true);
      if(mode==="brief")startBrief();
      else if(mode==="projects"||mode==="works")groupChoices();
      else if(groups[mode])recommend([mode]);
    }
    if(state.messages.length)state.messages.forEach(renderMessage);
    else say("Помогу подобрать работы, разобраться в услугах и составить бриф для Александра.");
    if(state.step!==null)askStep();else if(state.finished)review(false);else starter();
    host.AMPortfolioChat=Object.freeze({open:openFrom,close:()=>setOpen(false)});
  }

  // The import pack can load the helper before or after the page body.
  if (typeof document !== "undefined") {
    if (document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true}); else boot();
  }
  if (typeof module!=="undefined" && module.exports) module.exports={intentFor,selectWorks,exactWorks,normalized,groups};
})(typeof window!=="undefined"?window:globalThis);
