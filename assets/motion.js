(() => {
    'use strict';
    // One rendering-only snapshot; never duplicate live controls or media requests.
    window.StorifyMotion = {
        snapshot(stage) {
            const clone = stage.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true'); clone.inert = true;
            clone.classList.add('storify-motion-ghost');
            clone.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
            clone.querySelectorAll('button,input,select,textarea,a').forEach(n => { n.tabIndex = -1; n.removeAttribute('name'); });
            const originals = stage.querySelectorAll('video,canvas');
            clone.querySelectorAll('video,canvas').forEach((node, i) => {
                const source = originals[i], canvas = document.createElement('canvas');
                canvas.width = source.videoWidth || source.width || 1; canvas.height = source.videoHeight || source.height || 1;
                canvas.className = node.className; canvas.style.cssText = node.style.cssText;
                try { canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height); } catch {}
                node.removeAttribute('src'); node.querySelectorAll('source').forEach(n => n.remove()); node.replaceWith(canvas);
            });
            return clone;
        },
        async run(stage, outgoing, {type='cube', duration=360, direction=1}={}) {
            if (!outgoing) return;
            if (matchMedia('(prefers-reduced-motion: reduce)').matches || !stage.isConnected) { outgoing.remove(); return; }
            const ms = Math.max(100, Math.min(800, Number(duration)||360)), d=direction<0?-1:1;
            const parent=stage.parentElement;
            Object.assign(outgoing.style,{position:'absolute',inset:'0',width:'100%',height:'100%',margin:'0',pointerEvents:'none',zIndex:'10'});
            parent.append(outgoing);
            const width=stage.getBoundingClientRect().width, depth=type==='real-cube'?width/2:0;
            const turn=(angle)=>`perspective(1100px) translateZ(${-depth}px) rotateY(${angle}deg) translateZ(${depth}px)`;
            const incoming = type==='fade'?'none':type==='slide'?`translateX(${d*100}%)`:turn(d*90);
            const leaving = type==='fade'?'none':type==='slide'?`translateX(${-d*100}%)`:turn(-d*90);
            const origin=type==='cube'?(d>0?'left center':'right center'):'center center';
            const options={duration:ms,easing:'cubic-bezier(.22,.72,.18,1)',fill:'both'};
            const a=stage.animate([{opacity:type==='fade'?0:1,transform:incoming,transformOrigin:origin},{opacity:1,transform:'none',transformOrigin:origin}],options);
            const b=outgoing.animate([{opacity:1,transform:'none',transformOrigin:origin},{opacity:type==='fade'?0:.2,transform:leaving,transformOrigin:origin}],options);
            try { await Promise.allSettled([a.finished,b.finished]); } finally { a.cancel(); b.cancel(); outgoing.remove(); }
        }
    };
})();
