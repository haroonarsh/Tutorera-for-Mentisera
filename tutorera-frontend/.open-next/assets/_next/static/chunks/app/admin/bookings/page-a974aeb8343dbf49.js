(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6907],{1792:(e,t,r)=>{"use strict";r.d(t,{EZ:()=>o});let o=23},16827:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>p});var o=r(95155),i=r(12115),a=r(61763),s=r(19402),n=r(1792);let l="#1a1a2e",d="#6b7280",c=n.EZ;function p(){let[e,t]=(0,i.useState)([]),[r,n]=(0,i.useState)(!0),[p,u]=(0,i.useState)("all"),[m,f]=(0,i.useState)(null);(0,i.useEffect)(()=>{let e="all"===p?"/admin/bookings":`/admin/bookings?status=${p}`;a.A.get(e).then(e=>t(e.data.bookings)).catch(console.error).finally(()=>n(!1))},[p]);let g={upcoming:{bg:"#eff6ff",color:"#2563eb"},ongoing:{bg:"#fffbeb",color:"#d97706"},completed:{bg:"#f0fdf4",color:"#16a34a"},cancelled:{bg:"#fef2f2",color:"#ef4444"}},h={pending:{bg:"#fffbeb",color:"#d97706"},received:{bg:"#eff6ff",color:"#2563eb"},confirmed:{bg:"#f0fdf4",color:"#16a34a"},refunded:{bg:"#fef2f2",color:"#ef4444"}},y=async(e,r)=>{f(e);try{await a.A.patch(`/admin/bookings/${e}/status`,{status:r}),t(t=>t.map(t=>t._id===e?{...t,status:r}:t))}catch{(0,s.Q)("Failed to update status.")}finally{f(null)}};return(0,o.jsxs)("div",{style:{padding:"2rem",maxWidth:"100%",overflowX:"hidden"},children:[(0,o.jsxs)("div",{style:{marginBottom:"2rem"},children:[(0,o.jsx)("h1",{style:{fontSize:"1.5rem",fontWeight:"800",color:l},children:"Bookings"}),(0,o.jsx)("p",{style:{color:d,fontSize:"0.875rem"},children:"Manage all platform bookings and sessions."})]}),(0,o.jsx)("div",{style:{display:"flex",gap:"0.5rem",marginBottom:"1.5rem",flexWrap:"wrap"},children:["all","upcoming","ongoing","completed","cancelled"].map(e=>(0,o.jsx)("button",{onClick:()=>u(e),style:{padding:"0.5rem 1rem",borderRadius:"999px",border:p===e?"none":"1px solid #e5e7eb",cursor:"pointer",fontSize:"0.8rem",fontWeight:"600",textTransform:"capitalize",backgroundColor:p===e?l:"white",color:p===e?"white":d},children:e},e))}),r?(0,o.jsxs)("div",{style:{textAlign:"center",padding:"4rem"},children:[(0,o.jsx)("div",{style:{width:"36px",height:"36px",border:"3px solid #2563eb",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto"}}),(0,o.jsx)("style",{children:"@keyframes spin{to{transform:rotate(360deg)}}"})]}):0===e.length?(0,o.jsx)("div",{style:{backgroundColor:"white",borderRadius:"0.875rem",padding:"4rem",textAlign:"center",border:"1px solid #e5e7eb"},children:(0,o.jsx)("p",{style:{color:d},children:"No bookings found."})}):(0,o.jsx)("div",{style:{display:"flex",flexDirection:"column",gap:"1rem"},children:e.map(e=>{var t;let r,{platformFee:i,tutorPayout:a}={platformFee:r=Math.round((t=e.amount)*c/100),tutorPayout:t-r};return(0,o.jsx)("div",{style:{backgroundColor:"white",borderRadius:"0.875rem",padding:"1.5rem",border:"1px solid #e5e7eb"},children:(0,o.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:"1rem",alignItems:"start"},children:[(0,o.jsxs)("div",{children:[(0,o.jsx)("p",{style:{fontSize:"0.75rem",color:"#9ca3af",marginBottom:"0.5rem",textTransform:"uppercase",fontWeight:"600"},children:"Student → Tutor"}),(0,o.jsx)("p",{style:{fontSize:"0.9rem",fontWeight:"700",color:l},children:e.student?.name}),(0,o.jsx)("p",{style:{fontSize:"0.8rem",color:d},children:e.student?.email}),(0,o.jsx)("p",{style:{fontSize:"0.8rem",color:"#9ca3af",margin:"0.25rem 0"},children:"↓"}),(0,o.jsx)("p",{style:{fontSize:"0.9rem",fontWeight:"700",color:l},children:e.tutor?.name}),(0,o.jsx)("p",{style:{fontSize:"0.8rem",color:d},children:e.tutor?.email})]}),(0,o.jsxs)("div",{style:{backgroundColor:"#f9fafb",borderRadius:"0.5rem",padding:"1rem"},children:[(0,o.jsx)("p",{style:{fontSize:"0.75rem",color:"#9ca3af",marginBottom:"0.5rem",textTransform:"uppercase",fontWeight:"600"},children:"Financials"}),(0,o.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"0.35rem"},children:[(0,o.jsxs)("div",{style:{display:"flex",justifyContent:"space-between"},children:[(0,o.jsx)("span",{style:{fontSize:"0.8rem",color:d},children:"Total Amount"}),(0,o.jsxs)("span",{style:{fontSize:"0.8rem",fontWeight:"700",color:l},children:["Rs. ",e.amount?.toLocaleString()]})]}),(0,o.jsxs)("div",{style:{display:"flex",justifyContent:"space-between"},children:[(0,o.jsxs)("span",{style:{fontSize:"0.8rem",color:d},children:["Platform Fee (",c,"%)"]}),(0,o.jsxs)("span",{style:{fontSize:"0.8rem",fontWeight:"600",color:"#d97706"},children:["Rs. ",i.toLocaleString()]})]}),(0,o.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",borderTop:"1px solid #e5e7eb",paddingTop:"0.35rem"},children:[(0,o.jsx)("span",{style:{fontSize:"0.8rem",color:d},children:"Tutor Payout"}),(0,o.jsxs)("span",{style:{fontSize:"0.8rem",fontWeight:"700",color:"#16a34a"},children:["Rs. ",a.toLocaleString()]})]})]})]}),(0,o.jsxs)("div",{children:[(0,o.jsx)("p",{style:{fontSize:"0.75rem",color:"#9ca3af",marginBottom:"0.5rem",textTransform:"uppercase",fontWeight:"600"},children:"Status"}),(0,o.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem"},children:[(0,o.jsxs)("div",{children:[(0,o.jsx)("p",{style:{fontSize:"0.75rem",color:"#9ca3af",marginBottom:"0.3rem"},children:"Booking"}),(0,o.jsxs)("select",{title:"status",value:e.status,onChange:t=>y(e._id,t.target.value),disabled:m===e._id,style:{padding:"0.35rem 0.6rem",borderRadius:"0.4rem",border:"1px solid #e5e7eb",fontSize:"0.78rem",fontWeight:"600",cursor:m===e._id?"not-allowed":"pointer",backgroundColor:g[e.status]?.bg,color:g[e.status]?.color,textTransform:"capitalize",outline:"none"},children:[(0,o.jsx)("option",{value:"upcoming",children:"Upcoming"}),(0,o.jsx)("option",{value:"ongoing",children:"Ongoing"}),(0,o.jsx)("option",{value:"completed",children:"Completed"}),(0,o.jsx)("option",{value:"cancelled",children:"Cancelled"})]})]}),(0,o.jsxs)("div",{children:[(0,o.jsx)("p",{style:{fontSize:"0.75rem",color:"#9ca3af",marginBottom:"0.2rem"},children:"Payment"}),(0,o.jsx)("span",{style:{padding:"0.2rem 0.6rem",borderRadius:"999px",fontSize:"0.75rem",fontWeight:"600",backgroundColor:h[e.paymentStatus]?.bg,color:h[e.paymentStatus]?.color,textTransform:"capitalize"},children:e.paymentStatus})]})]}),(0,o.jsx)("p",{style:{fontSize:"0.75rem",color:"#9ca3af",marginTop:"0.5rem"},children:new Date(e.createdAt).toLocaleDateString()})]})]})},e._id)})})]})}},19402:(e,t,r)=>{"use strict";r.d(t,{Q:()=>a,T:()=>i});var o=r(38434);let i=e=>o.Ay.success(e),a=(e,t="Something went wrong. Please try again.")=>{o.Ay.error(e?.response?.data?.message||t)}},23112:(e,t,r)=>{Promise.resolve().then(r.bind(r,16827))},38434:(e,t,r)=>{"use strict";let o,i;r.d(t,{Toaster:()=>ee,Ay:()=>et});var a,s=r(12115);let n={data:""},l=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,d=/\/\*[^]*?\*\/|  +/g,c=/\n+/g,p=(e,t)=>{let r="",o="",i="";for(let a in e){let s=e[a];"@"==a[0]?"i"==a[1]?r=a+" "+s+";":o+="f"==a[1]?p(s,a):a+"{"+p(s,"k"==a[1]?"":t)+"}":"object"==typeof s?o+=p(s,t?t.replace(/([^,])+/g,e=>a.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):a):null!=s&&(a="-"==a[1]?a:a.replace(/[A-Z]/g,"-$&").toLowerCase(),i+=p.p?p.p(a,s):a+":"+s+";")}return r+(t&&i?t+"{"+i+"}":i)+o},u={},m=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+m(e[r]);return t}return e};function f(e){let t,r,o=this||{},i=e.call?e(o.p):e;return((e,t,r,o,i)=>{var a;let s=m(e),n=u[s]||(u[s]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return"go"+r})(s));if(!u[n]){let t=s!==e?e:(e=>{let t,r,o=[{}];for(;t=l.exec(e.replace(d,""));)t[4]?o.shift():t[3]?(r=t[3].replace(c," ").trim(),o.unshift(o[0][r]=o[0][r]||{})):o[0][t[1]]=t[2].replace(c," ").trim();return o[0]})(e);u[n]=p(i?{["@keyframes "+n]:t}:t,r?"":"."+n)}let f=r&&u.g;return r&&(u.g=u[n]),a=u[n],f?t.data=t.data.replace(f,a):-1===t.data.indexOf(a)&&(t.data=o?a+t.data:t.data+a),n})(i.unshift?i.raw?(t=[].slice.call(arguments,1),r=o.p,i.reduce((e,o,i)=>{let a=t[i];if(a&&a.call){let e=a(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;a=t?"."+t:e&&"object"==typeof e?e.props?"":p(e,""):!1===e?"":e}return e+o+(null==a?"":a)},"")):i.reduce((e,t)=>Object.assign(e,t&&t.call?t(o.p):t),{}):i,(e=>{if("object"==typeof window){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||n})(o.target),o.g,o.o,o.k)}f.bind({g:1});let g,h,y,b=f.bind({k:1});function x(e,t){let r=this||{};return function(){let o=arguments;function i(a,s){let n=Object.assign({},a),l=n.className||i.className;r.p=Object.assign({theme:h&&h()},n),r.o=/go\d/.test(l),n.className=f.apply(r,o)+(l?" "+l:""),t&&(n.ref=s);let d=e;return e[0]&&(d=n.as||e,delete n.as),y&&d[0]&&y(n),g(d,n)}return t?t(i):i}}var v=(e,t)=>"function"==typeof e?e(t):e,j=(o=0,()=>(++o).toString()),w=()=>{if(void 0===i&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");i=!e||e.matches}return i},k="default",S=(e,t)=>{let{toastLimit:r}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,r)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:o}=t;return S(e,{type:+!!e.toasts.find(e=>e.id===o.id),toast:o});case 3:let{toastId:i}=t;return{...e,toasts:e.toasts.map(e=>e.id===i||void 0===i?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let a=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+a}))}}},z=[],C={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},E={},A=(e,t=k)=>{E[t]=S(E[t]||C,e),z.forEach(([e,r])=>{e===t&&r(E[t])})},T=e=>Object.keys(E).forEach(t=>A(e,t)),$=(e=k)=>t=>{A(t,e)},_={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},D=e=>(t,r)=>{let o,i=((e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(null==r?void 0:r.id)||j()}))(t,e,r);return $(i.toasterId||(o=i.id,Object.keys(E).find(e=>E[e].toasts.some(e=>e.id===o))))({type:2,toast:i}),i.id},N=(e,t)=>D("blank")(e,t);N.error=D("error"),N.success=D("success"),N.loading=D("loading"),N.custom=D("custom"),N.dismiss=(e,t)=>{let r={type:3,toastId:e};t?$(t)(r):T(r)},N.dismissAll=e=>N.dismiss(void 0,e),N.remove=(e,t)=>{let r={type:4,toastId:e};t?$(t)(r):T(r)},N.removeAll=e=>N.remove(void 0,e),N.promise=(e,t,r)=>{let o=N.loading(t.loading,{...r,...null==r?void 0:r.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let i=t.success?v(t.success,e):void 0;return i?N.success(i,{id:o,...r,...null==r?void 0:r.success}):N.dismiss(o),e}).catch(e=>{let i=t.error?v(t.error,e):void 0;i?N.error(i,{id:o,...r,...null==r?void 0:r.error}):N.dismiss(o)}),e};var O=1e3,P=b`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,I=b`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,R=b`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,W=x("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${P} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${I} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${R} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,L=b`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,B=x("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${L} 1s linear infinite;
`,F=b`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,M=b`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,U=x("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${F} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${M} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,H=x("div")`
  position: absolute;
`,Z=x("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,q=b`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Q=x("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${q} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,X=({toast:e})=>{let{icon:t,type:r,iconTheme:o}=e;return void 0!==t?"string"==typeof t?s.createElement(Q,null,t):t:"blank"===r?null:s.createElement(Z,null,s.createElement(B,{...o}),"loading"!==r&&s.createElement(H,null,"error"===r?s.createElement(W,{...o}):s.createElement(U,{...o})))},Y=x("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,G=x("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,J=s.memo(({toast:e,position:t,style:r,children:o})=>{let i=e.height?((e,t)=>{let r=e.includes("top")?1:-1,[o,i]=w()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[`
0% {transform: translate3d(0,${-200*r}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*r}%,-1px) scale(.6); opacity:0;}
`];return{animation:t?`${b(o)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${b(i)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(e.position||t||"top-center",e.visible):{opacity:0},a=s.createElement(X,{toast:e}),n=s.createElement(G,{...e.ariaProps},v(e.message,e));return s.createElement(Y,{className:e.className,style:{...i,...r,...e.style}},"function"==typeof o?o({icon:a,message:n}):s.createElement(s.Fragment,null,a,n))});a=s.createElement,p.p=void 0,g=a,h=void 0,y=void 0;var K=({id:e,className:t,style:r,onHeightUpdate:o,children:i})=>{let a=s.useCallback(t=>{if(t){let r=()=>{o(e,t.getBoundingClientRect().height)};r(),new MutationObserver(r).observe(t,{subtree:!0,childList:!0,characterData:!0})}},[e,o]);return s.createElement("div",{ref:a,className:t,style:r},i)},V=f`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,ee=({reverseOrder:e,position:t="top-center",toastOptions:r,gutter:o,children:i,toasterId:a,containerStyle:n,containerClassName:l})=>{let{toasts:d,handlers:c}=((e,t="default")=>{let{toasts:r,pausedAt:o}=((e={},t=k)=>{let[r,o]=(0,s.useState)(E[t]||C),i=(0,s.useRef)(E[t]);(0,s.useEffect)(()=>(i.current!==E[t]&&o(E[t]),z.push([t,o]),()=>{let e=z.findIndex(([e])=>e===t);e>-1&&z.splice(e,1)}),[t]);let a=r.toasts.map(t=>{var r,o,i;return{...e,...e[t.type],...t,removeDelay:t.removeDelay||(null==(r=e[t.type])?void 0:r.removeDelay)||(null==e?void 0:e.removeDelay),duration:t.duration||(null==(o=e[t.type])?void 0:o.duration)||(null==e?void 0:e.duration)||_[t.type],style:{...e.style,...null==(i=e[t.type])?void 0:i.style,...t.style}}});return{...r,toasts:a}})(e,t),i=(0,s.useRef)(new Map).current,a=(0,s.useCallback)((e,t=O)=>{if(i.has(e))return;let r=setTimeout(()=>{i.delete(e),n({type:4,toastId:e})},t);i.set(e,r)},[]);(0,s.useEffect)(()=>{if(o)return;let e=Date.now(),i=r.map(r=>{if(r.duration===1/0)return;let o=(r.duration||0)+r.pauseDuration-(e-r.createdAt);if(o<0){r.visible&&N.dismiss(r.id);return}return setTimeout(()=>N.dismiss(r.id,t),o)});return()=>{i.forEach(e=>e&&clearTimeout(e))}},[r,o,t]);let n=(0,s.useCallback)($(t),[t]),l=(0,s.useCallback)(()=>{n({type:5,time:Date.now()})},[n]),d=(0,s.useCallback)((e,t)=>{n({type:1,toast:{id:e,height:t}})},[n]),c=(0,s.useCallback)(()=>{o&&n({type:6,time:Date.now()})},[o,n]),p=(0,s.useCallback)((e,t)=>{let{reverseOrder:o=!1,gutter:i=8,defaultPosition:a}=t||{},s=r.filter(t=>(t.position||a)===(e.position||a)&&t.height),n=s.findIndex(t=>t.id===e.id),l=s.filter((e,t)=>t<n&&e.visible).length;return s.filter(e=>e.visible).slice(...o?[l+1]:[0,l]).reduce((e,t)=>e+(t.height||0)+i,0)},[r]);return(0,s.useEffect)(()=>{r.forEach(e=>{if(e.dismissed)a(e.id,e.removeDelay);else{let t=i.get(e.id);t&&(clearTimeout(t),i.delete(e.id))}})},[r,a]),{toasts:r,handlers:{updateHeight:d,startPause:l,endPause:c,calculateOffset:p}}})(r,a);return s.createElement("div",{"data-rht-toaster":a||"",style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...n},className:l,onMouseEnter:c.startPause,onMouseLeave:c.endPause},d.map(r=>{let a,n,l=r.position||t,d=c.calculateOffset(r,{reverseOrder:e,gutter:o,defaultPosition:t}),p=(a=l.includes("top"),n=l.includes("center")?{justifyContent:"center"}:l.includes("right")?{justifyContent:"flex-end"}:{},{left:0,right:0,display:"flex",position:"absolute",transition:w()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${d*(a?1:-1)}px)`,...a?{top:0}:{bottom:0},...n});return s.createElement(K,{id:r.id,key:r.id,onHeightUpdate:c.updateHeight,className:r.visible?V:"",style:p},"custom"===r.type?v(r.message,r):i?i(r):s.createElement(J,{toast:r,position:l}))}))},et=N},61763:(e,t,r)=>{"use strict";r.d(t,{A:()=>s});var o=r(21338),i=r(41463);let a=o.A.create({baseURL:i.env.NEXT_PUBLIC_API_URL||"http://localhost:5000/api/v1",withCredentials:!0});a.interceptors.request.use(e=>{{let t=localStorage.getItem("token");t&&(e.headers.Authorization=`Bearer ${t}`)}return e}),a.interceptors.response.use(e=>e,e=>(e.response?.status===401&&(e.config?.url?.includes("/auth/login")||e.config?.url?.includes("/auth/register")||(localStorage.removeItem("token"),"/login"!==window.location.pathname&&(window.location.href="/login"))),Promise.reject(e)));let s=a}},e=>{e.O(0,[1338,8441,3794,7358],()=>e(e.s=23112)),_N_E=e.O()}]);