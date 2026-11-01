var Me=Object.defineProperty;var Ne=(o,t,r)=>t in o?Me(o,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):o[t]=r;var R=(o,t,r)=>Ne(o,typeof t!="symbol"?t+"":t,r);import{i as xe,H as De,M as jt,R as _e,B as I,A as Ue,W as ze}from"./protocol-DruKBLqt.js";function He(o){return o&&o.__esModule&&Object.prototype.hasOwnProperty.call(o,"default")?o.default:o}var j={},ot,Gt;function qe(){return Gt||(Gt=1,ot=function(){return typeof Promise=="function"&&Promise.prototype&&Promise.prototype.then}),ot}var st={},q={},Kt;function O(){if(Kt)return q;Kt=1;let o;const t=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];return q.getSymbolSize=function(e){if(!e)throw new Error('"version" cannot be null or undefined');if(e<1||e>40)throw new Error('"version" should be in range from 1 to 40');return e*4+17},q.getSymbolTotalCodewords=function(e){return t[e]},q.getBCHDigit=function(r){let e=0;for(;r!==0;)e++,r>>>=1;return e},q.setToSJISFunction=function(e){if(typeof e!="function")throw new Error('"toSJISFunc" is not a valid function.');o=e},q.isKanjiModeEnabled=function(){return typeof o<"u"},q.toSJIS=function(e){return o(e)},q}var at={},Jt;function Ft(){return Jt||(Jt=1,(function(o){o.L={bit:1},o.M={bit:0},o.Q={bit:3},o.H={bit:2};function t(r){if(typeof r!="string")throw new Error("Param is not a string");switch(r.toLowerCase()){case"l":case"low":return o.L;case"m":case"medium":return o.M;case"q":case"quartile":return o.Q;case"h":case"high":return o.H;default:throw new Error("Unknown EC Level: "+r)}}o.isValid=function(e){return e&&typeof e.bit<"u"&&e.bit>=0&&e.bit<4},o.from=function(e,n){if(o.isValid(e))return e;try{return t(e)}catch{return n}}})(at)),at}var lt,Yt;function Fe(){if(Yt)return lt;Yt=1;function o(){this.buffer=[],this.length=0}return o.prototype={get:function(t){const r=Math.floor(t/8);return(this.buffer[r]>>>7-t%8&1)===1},put:function(t,r){for(let e=0;e<r;e++)this.putBit((t>>>r-e-1&1)===1)},getLengthInBits:function(){return this.length},putBit:function(t){const r=Math.floor(this.length/8);this.buffer.length<=r&&this.buffer.push(0),t&&(this.buffer[r]|=128>>>this.length%8),this.length++}},lt=o,lt}var ct,Wt;function Oe(){if(Wt)return ct;Wt=1;function o(t){if(!t||t<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=t,this.data=new Uint8Array(t*t),this.reservedBit=new Uint8Array(t*t)}return o.prototype.set=function(t,r,e,n){const i=t*this.size+r;this.data[i]=e,n&&(this.reservedBit[i]=!0)},o.prototype.get=function(t,r){return this.data[t*this.size+r]},o.prototype.xor=function(t,r,e){this.data[t*this.size+r]^=e},o.prototype.isReserved=function(t,r){return this.reservedBit[t*this.size+r]},ct=o,ct}var dt={},Qt;function $e(){return Qt||(Qt=1,(function(o){const t=O().getSymbolSize;o.getRowColCoords=function(e){if(e===1)return[];const n=Math.floor(e/7)+2,i=t(e),s=i===145?26:Math.ceil((i-13)/(2*n-2))*2,a=[i-7];for(let l=1;l<n-1;l++)a[l]=a[l-1]-s;return a.push(6),a.reverse()},o.getPositions=function(e){const n=[],i=o.getRowColCoords(e),s=i.length;for(let a=0;a<s;a++)for(let l=0;l<s;l++)a===0&&l===0||a===0&&l===s-1||a===s-1&&l===0||n.push([i[a],i[l]]);return n}})(dt)),dt}var ut={},Zt;function Ve(){if(Zt)return ut;Zt=1;const o=O().getSymbolSize,t=7;return ut.getPositions=function(e){const n=o(e);return[[0,0],[n-t,0],[0,n-t]]},ut}var ft={},Xt;function je(){return Xt||(Xt=1,(function(o){o.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};const t={N1:3,N2:3,N3:40,N4:10};o.isValid=function(n){return n!=null&&n!==""&&!isNaN(n)&&n>=0&&n<=7},o.from=function(n){return o.isValid(n)?parseInt(n,10):void 0},o.getPenaltyN1=function(n){const i=n.size;let s=0,a=0,l=0,c=null,d=null;for(let v=0;v<i;v++){a=l=0,c=d=null;for(let p=0;p<i;p++){let u=n.get(v,p);u===c?a++:(a>=5&&(s+=t.N1+(a-5)),c=u,a=1),u=n.get(p,v),u===d?l++:(l>=5&&(s+=t.N1+(l-5)),d=u,l=1)}a>=5&&(s+=t.N1+(a-5)),l>=5&&(s+=t.N1+(l-5))}return s},o.getPenaltyN2=function(n){const i=n.size;let s=0;for(let a=0;a<i-1;a++)for(let l=0;l<i-1;l++){const c=n.get(a,l)+n.get(a,l+1)+n.get(a+1,l)+n.get(a+1,l+1);(c===4||c===0)&&s++}return s*t.N2},o.getPenaltyN3=function(n){const i=n.size;let s=0,a=0,l=0;for(let c=0;c<i;c++){a=l=0;for(let d=0;d<i;d++)a=a<<1&2047|n.get(c,d),d>=10&&(a===1488||a===93)&&s++,l=l<<1&2047|n.get(d,c),d>=10&&(l===1488||l===93)&&s++}return s*t.N3},o.getPenaltyN4=function(n){let i=0;const s=n.data.length;for(let l=0;l<s;l++)i+=n.data[l];return Math.abs(Math.ceil(i*100/s/5)-10)*t.N4};function r(e,n,i){switch(e){case o.Patterns.PATTERN000:return(n+i)%2===0;case o.Patterns.PATTERN001:return n%2===0;case o.Patterns.PATTERN010:return i%3===0;case o.Patterns.PATTERN011:return(n+i)%3===0;case o.Patterns.PATTERN100:return(Math.floor(n/2)+Math.floor(i/3))%2===0;case o.Patterns.PATTERN101:return n*i%2+n*i%3===0;case o.Patterns.PATTERN110:return(n*i%2+n*i%3)%2===0;case o.Patterns.PATTERN111:return(n*i%3+(n+i)%2)%2===0;default:throw new Error("bad maskPattern:"+e)}}o.applyMask=function(n,i){const s=i.size;for(let a=0;a<s;a++)for(let l=0;l<s;l++)i.isReserved(l,a)||i.xor(l,a,r(n,l,a))},o.getBestMask=function(n,i){const s=Object.keys(o.Patterns).length;let a=0,l=1/0;for(let c=0;c<s;c++){i(c),o.applyMask(c,n);const d=o.getPenaltyN1(n)+o.getPenaltyN2(n)+o.getPenaltyN3(n)+o.getPenaltyN4(n);o.applyMask(c,n),d<l&&(l=d,a=c)}return a}})(ft)),ft}var Q={},te;function Pe(){if(te)return Q;te=1;const o=Ft(),t=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],r=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];return Q.getBlocksCount=function(n,i){switch(i){case o.L:return t[(n-1)*4+0];case o.M:return t[(n-1)*4+1];case o.Q:return t[(n-1)*4+2];case o.H:return t[(n-1)*4+3];default:return}},Q.getTotalCodewordsCount=function(n,i){switch(i){case o.L:return r[(n-1)*4+0];case o.M:return r[(n-1)*4+1];case o.Q:return r[(n-1)*4+2];case o.H:return r[(n-1)*4+3];default:return}},Q}var gt={},J={},ee;function Ge(){if(ee)return J;ee=1;const o=new Uint8Array(512),t=new Uint8Array(256);return(function(){let e=1;for(let n=0;n<255;n++)o[n]=e,t[e]=n,e<<=1,e&256&&(e^=285);for(let n=255;n<512;n++)o[n]=o[n-255]})(),J.log=function(e){if(e<1)throw new Error("log("+e+")");return t[e]},J.exp=function(e){return o[e]},J.mul=function(e,n){return e===0||n===0?0:o[t[e]+t[n]]},J}var ne;function Ke(){return ne||(ne=1,(function(o){const t=Ge();o.mul=function(e,n){const i=new Uint8Array(e.length+n.length-1);for(let s=0;s<e.length;s++)for(let a=0;a<n.length;a++)i[s+a]^=t.mul(e[s],n[a]);return i},o.mod=function(e,n){let i=new Uint8Array(e);for(;i.length-n.length>=0;){const s=i[0];for(let l=0;l<n.length;l++)i[l]^=t.mul(n[l],s);let a=0;for(;a<i.length&&i[a]===0;)a++;i=i.slice(a)}return i},o.generateECPolynomial=function(e){let n=new Uint8Array([1]);for(let i=0;i<e;i++)n=o.mul(n,new Uint8Array([1,t.exp(i)]));return n}})(gt)),gt}var ht,ie;function Je(){if(ie)return ht;ie=1;const o=Ke();function t(r){this.genPoly=void 0,this.degree=r,this.degree&&this.initialize(this.degree)}return t.prototype.initialize=function(e){this.degree=e,this.genPoly=o.generateECPolynomial(this.degree)},t.prototype.encode=function(e){if(!this.genPoly)throw new Error("Encoder not initialized");const n=new Uint8Array(e.length+this.degree);n.set(e);const i=o.mod(n,this.genPoly),s=this.degree-i.length;if(s>0){const a=new Uint8Array(this.degree);return a.set(i,s),a}return i},ht=t,ht}var pt={},mt={},bt={},re;function Se(){return re||(re=1,bt.isValid=function(t){return!isNaN(t)&&t>=1&&t<=40}),bt}var N={},oe;function Ae(){if(oe)return N;oe=1;const o="[0-9]+",t="[A-Z $%*+\\-./:]+";let r="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";r=r.replace(/u/g,"\\u");const e="(?:(?![A-Z0-9 $%*+\\-./:]|"+r+`)(?:.|[\r
]))+`;N.KANJI=new RegExp(r,"g"),N.BYTE_KANJI=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g"),N.BYTE=new RegExp(e,"g"),N.NUMERIC=new RegExp(o,"g"),N.ALPHANUMERIC=new RegExp(t,"g");const n=new RegExp("^"+r+"$"),i=new RegExp("^"+o+"$"),s=new RegExp("^[A-Z0-9 $%*+\\-./:]+$");return N.testKanji=function(l){return n.test(l)},N.testNumeric=function(l){return i.test(l)},N.testAlphanumeric=function(l){return s.test(l)},N}var se;function $(){return se||(se=1,(function(o){const t=Se(),r=Ae();o.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},o.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},o.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},o.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},o.MIXED={bit:-1},o.getCharCountIndicator=function(i,s){if(!i.ccBits)throw new Error("Invalid mode: "+i);if(!t.isValid(s))throw new Error("Invalid version: "+s);return s>=1&&s<10?i.ccBits[0]:s<27?i.ccBits[1]:i.ccBits[2]},o.getBestModeForData=function(i){return r.testNumeric(i)?o.NUMERIC:r.testAlphanumeric(i)?o.ALPHANUMERIC:r.testKanji(i)?o.KANJI:o.BYTE},o.toString=function(i){if(i&&i.id)return i.id;throw new Error("Invalid mode")},o.isValid=function(i){return i&&i.bit&&i.ccBits};function e(n){if(typeof n!="string")throw new Error("Param is not a string");switch(n.toLowerCase()){case"numeric":return o.NUMERIC;case"alphanumeric":return o.ALPHANUMERIC;case"kanji":return o.KANJI;case"byte":return o.BYTE;default:throw new Error("Unknown mode: "+n)}}o.from=function(i,s){if(o.isValid(i))return i;try{return e(i)}catch{return s}}})(mt)),mt}var ae;function Ye(){return ae||(ae=1,(function(o){const t=O(),r=Pe(),e=Ft(),n=$(),i=Se(),s=7973,a=t.getBCHDigit(s);function l(p,u,A){for(let T=1;T<=40;T++)if(u<=o.getCapacity(T,A,p))return T}function c(p,u){return n.getCharCountIndicator(p,u)+4}function d(p,u){let A=0;return p.forEach(function(T){const L=c(T.mode,u);A+=L+T.getBitsLength()}),A}function v(p,u){for(let A=1;A<=40;A++)if(d(p,A)<=o.getCapacity(A,u,n.MIXED))return A}o.from=function(u,A){return i.isValid(u)?parseInt(u,10):A},o.getCapacity=function(u,A,T){if(!i.isValid(u))throw new Error("Invalid QR Code version");typeof T>"u"&&(T=n.BYTE);const L=t.getSymbolTotalCodewords(u),x=r.getTotalCodewordsCount(u,A),k=(L-x)*8;if(T===n.MIXED)return k;const P=k-c(T,u);switch(T){case n.NUMERIC:return Math.floor(P/10*3);case n.ALPHANUMERIC:return Math.floor(P/11*2);case n.KANJI:return Math.floor(P/13);case n.BYTE:default:return Math.floor(P/8)}},o.getBestVersionForData=function(u,A){let T;const L=e.from(A,e.M);if(Array.isArray(u)){if(u.length>1)return v(u,L);if(u.length===0)return 1;T=u[0]}else T=u;return l(T.mode,T.getLength(),L)},o.getEncodedBits=function(u){if(!i.isValid(u)||u<7)throw new Error("Invalid QR Code version");let A=u<<12;for(;t.getBCHDigit(A)-a>=0;)A^=s<<t.getBCHDigit(A)-a;return u<<12|A}})(pt)),pt}var yt={},le;function We(){if(le)return yt;le=1;const o=O(),t=1335,r=21522,e=o.getBCHDigit(t);return yt.getEncodedBits=function(i,s){const a=i.bit<<3|s;let l=a<<10;for(;o.getBCHDigit(l)-e>=0;)l^=t<<o.getBCHDigit(l)-e;return(a<<10|l)^r},yt}var vt={},wt,ce;function Qe(){if(ce)return wt;ce=1;const o=$();function t(r){this.mode=o.NUMERIC,this.data=r.toString()}return t.getBitsLength=function(e){return 10*Math.floor(e/3)+(e%3?e%3*3+1:0)},t.prototype.getLength=function(){return this.data.length},t.prototype.getBitsLength=function(){return t.getBitsLength(this.data.length)},t.prototype.write=function(e){let n,i,s;for(n=0;n+3<=this.data.length;n+=3)i=this.data.substr(n,3),s=parseInt(i,10),e.put(s,10);const a=this.data.length-n;a>0&&(i=this.data.substr(n),s=parseInt(i,10),e.put(s,a*3+1))},wt=t,wt}var Et,de;function Ze(){if(de)return Et;de=1;const o=$(),t=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function r(e){this.mode=o.ALPHANUMERIC,this.data=e}return r.getBitsLength=function(n){return 11*Math.floor(n/2)+6*(n%2)},r.prototype.getLength=function(){return this.data.length},r.prototype.getBitsLength=function(){return r.getBitsLength(this.data.length)},r.prototype.write=function(n){let i;for(i=0;i+2<=this.data.length;i+=2){let s=t.indexOf(this.data[i])*45;s+=t.indexOf(this.data[i+1]),n.put(s,11)}this.data.length%2&&n.put(t.indexOf(this.data[i]),6)},Et=r,Et}var Ct,ue;function Xe(){if(ue)return Ct;ue=1;const o=$();function t(r){this.mode=o.BYTE,typeof r=="string"?this.data=new TextEncoder().encode(r):this.data=new Uint8Array(r)}return t.getBitsLength=function(e){return e*8},t.prototype.getLength=function(){return this.data.length},t.prototype.getBitsLength=function(){return t.getBitsLength(this.data.length)},t.prototype.write=function(r){for(let e=0,n=this.data.length;e<n;e++)r.put(this.data[e],8)},Ct=t,Ct}var Bt,fe;function tn(){if(fe)return Bt;fe=1;const o=$(),t=O();function r(e){this.mode=o.KANJI,this.data=e}return r.getBitsLength=function(n){return n*13},r.prototype.getLength=function(){return this.data.length},r.prototype.getBitsLength=function(){return r.getBitsLength(this.data.length)},r.prototype.write=function(e){let n;for(n=0;n<this.data.length;n++){let i=t.toSJIS(this.data[n]);if(i>=33088&&i<=40956)i-=33088;else if(i>=57408&&i<=60351)i-=49472;else throw new Error("Invalid SJIS character: "+this.data[n]+`
Make sure your charset is UTF-8`);i=(i>>>8&255)*192+(i&255),e.put(i,13)}},Bt=r,Bt}var xt={exports:{}},ge;function en(){return ge||(ge=1,(function(o){var t={single_source_shortest_paths:function(r,e,n){var i={},s={};s[e]=0;var a=t.PriorityQueue.make();a.push(e,0);for(var l,c,d,v,p,u,A,T,L;!a.empty();){l=a.pop(),c=l.value,v=l.cost,p=r[c]||{};for(d in p)p.hasOwnProperty(d)&&(u=p[d],A=v+u,T=s[d],L=typeof s[d]>"u",(L||T>A)&&(s[d]=A,a.push(d,A),i[d]=c))}if(typeof n<"u"&&typeof s[n]>"u"){var x=["Could not find a path from ",e," to ",n,"."].join("");throw new Error(x)}return i},extract_shortest_path_from_predecessor_list:function(r,e){for(var n=[],i=e;i;)n.push(i),r[i],i=r[i];return n.reverse(),n},find_path:function(r,e,n){var i=t.single_source_shortest_paths(r,e,n);return t.extract_shortest_path_from_predecessor_list(i,n)},PriorityQueue:{make:function(r){var e=t.PriorityQueue,n={},i;r=r||{};for(i in e)e.hasOwnProperty(i)&&(n[i]=e[i]);return n.queue=[],n.sorter=r.sorter||e.default_sorter,n},default_sorter:function(r,e){return r.cost-e.cost},push:function(r,e){var n={value:r,cost:e};this.queue.push(n),this.queue.sort(this.sorter)},pop:function(){return this.queue.shift()},empty:function(){return this.queue.length===0}}};o.exports=t})(xt)),xt.exports}var he;function nn(){return he||(he=1,(function(o){const t=$(),r=Qe(),e=Ze(),n=Xe(),i=tn(),s=Ae(),a=O(),l=en();function c(x){return unescape(encodeURIComponent(x)).length}function d(x,k,P){const C=[];let M;for(;(M=x.exec(P))!==null;)C.push({data:M[0],index:M.index,mode:k,length:M[0].length});return C}function v(x){const k=d(s.NUMERIC,t.NUMERIC,x),P=d(s.ALPHANUMERIC,t.ALPHANUMERIC,x);let C,M;return a.isKanjiModeEnabled()?(C=d(s.BYTE,t.BYTE,x),M=d(s.KANJI,t.KANJI,x)):(C=d(s.BYTE_KANJI,t.BYTE,x),M=[]),k.concat(P,C,M).sort(function(w,y){return w.index-y.index}).map(function(w){return{data:w.data,mode:w.mode,length:w.length}})}function p(x,k){switch(k){case t.NUMERIC:return r.getBitsLength(x);case t.ALPHANUMERIC:return e.getBitsLength(x);case t.KANJI:return i.getBitsLength(x);case t.BYTE:return n.getBitsLength(x)}}function u(x){return x.reduce(function(k,P){const C=k.length-1>=0?k[k.length-1]:null;return C&&C.mode===P.mode?(k[k.length-1].data+=P.data,k):(k.push(P),k)},[])}function A(x){const k=[];for(let P=0;P<x.length;P++){const C=x[P];switch(C.mode){case t.NUMERIC:k.push([C,{data:C.data,mode:t.ALPHANUMERIC,length:C.length},{data:C.data,mode:t.BYTE,length:C.length}]);break;case t.ALPHANUMERIC:k.push([C,{data:C.data,mode:t.BYTE,length:C.length}]);break;case t.KANJI:k.push([C,{data:C.data,mode:t.BYTE,length:c(C.data)}]);break;case t.BYTE:k.push([{data:C.data,mode:t.BYTE,length:c(C.data)}])}}return k}function T(x,k){const P={},C={start:{}};let M=["start"];for(let g=0;g<x.length;g++){const w=x[g],y=[];for(let f=0;f<w.length;f++){const B=w[f],m=""+g+f;y.push(m),P[m]={node:B,lastCount:0},C[m]={};for(let E=0;E<M.length;E++){const b=M[E];P[b]&&P[b].node.mode===B.mode?(C[b][m]=p(P[b].lastCount+B.length,B.mode)-p(P[b].lastCount,B.mode),P[b].lastCount+=B.length):(P[b]&&(P[b].lastCount=B.length),C[b][m]=p(B.length,B.mode)+4+t.getCharCountIndicator(B.mode,k))}}M=y}for(let g=0;g<M.length;g++)C[M[g]].end=0;return{map:C,table:P}}function L(x,k){let P;const C=t.getBestModeForData(x);if(P=t.from(k,C),P!==t.BYTE&&P.bit<C.bit)throw new Error('"'+x+'" cannot be encoded with mode '+t.toString(P)+`.
 Suggested mode is: `+t.toString(C));switch(P===t.KANJI&&!a.isKanjiModeEnabled()&&(P=t.BYTE),P){case t.NUMERIC:return new r(x);case t.ALPHANUMERIC:return new e(x);case t.KANJI:return new i(x);case t.BYTE:return new n(x)}}o.fromArray=function(k){return k.reduce(function(P,C){return typeof C=="string"?P.push(L(C,null)):C.data&&P.push(L(C.data,C.mode)),P},[])},o.fromString=function(k,P){const C=v(k,a.isKanjiModeEnabled()),M=A(C),g=T(M,P),w=l.find_path(g.map,"start","end"),y=[];for(let f=1;f<w.length-1;f++)y.push(g.table[w[f]].node);return o.fromArray(u(y))},o.rawSplit=function(k){return o.fromArray(v(k,a.isKanjiModeEnabled()))}})(vt)),vt}var pe;function rn(){if(pe)return st;pe=1;const o=O(),t=Ft(),r=Fe(),e=Oe(),n=$e(),i=Ve(),s=je(),a=Pe(),l=Je(),c=Ye(),d=We(),v=$(),p=nn();function u(g,w){const y=g.size,f=i.getPositions(w);for(let B=0;B<f.length;B++){const m=f[B][0],E=f[B][1];for(let b=-1;b<=7;b++)if(!(m+b<=-1||y<=m+b))for(let S=-1;S<=7;S++)E+S<=-1||y<=E+S||(b>=0&&b<=6&&(S===0||S===6)||S>=0&&S<=6&&(b===0||b===6)||b>=2&&b<=4&&S>=2&&S<=4?g.set(m+b,E+S,!0,!0):g.set(m+b,E+S,!1,!0))}}function A(g){const w=g.size;for(let y=8;y<w-8;y++){const f=y%2===0;g.set(y,6,f,!0),g.set(6,y,f,!0)}}function T(g,w){const y=n.getPositions(w);for(let f=0;f<y.length;f++){const B=y[f][0],m=y[f][1];for(let E=-2;E<=2;E++)for(let b=-2;b<=2;b++)E===-2||E===2||b===-2||b===2||E===0&&b===0?g.set(B+E,m+b,!0,!0):g.set(B+E,m+b,!1,!0)}}function L(g,w){const y=g.size,f=c.getEncodedBits(w);let B,m,E;for(let b=0;b<18;b++)B=Math.floor(b/3),m=b%3+y-8-3,E=(f>>b&1)===1,g.set(B,m,E,!0),g.set(m,B,E,!0)}function x(g,w,y){const f=g.size,B=d.getEncodedBits(w,y);let m,E;for(m=0;m<15;m++)E=(B>>m&1)===1,m<6?g.set(m,8,E,!0):m<8?g.set(m+1,8,E,!0):g.set(f-15+m,8,E,!0),m<8?g.set(8,f-m-1,E,!0):m<9?g.set(8,15-m-1+1,E,!0):g.set(8,15-m-1,E,!0);g.set(f-8,8,1,!0)}function k(g,w){const y=g.size;let f=-1,B=y-1,m=7,E=0;for(let b=y-1;b>0;b-=2)for(b===6&&b--;;){for(let S=0;S<2;S++)if(!g.isReserved(B,b-S)){let H=!1;E<w.length&&(H=(w[E]>>>m&1)===1),g.set(B,b-S,H),m--,m===-1&&(E++,m=7)}if(B+=f,B<0||y<=B){B-=f,f=-f;break}}}function P(g,w,y){const f=new r;y.forEach(function(S){f.put(S.mode.bit,4),f.put(S.getLength(),v.getCharCountIndicator(S.mode,g)),S.write(f)});const B=o.getSymbolTotalCodewords(g),m=a.getTotalCodewordsCount(g,w),E=(B-m)*8;for(f.getLengthInBits()+4<=E&&f.put(0,4);f.getLengthInBits()%8!==0;)f.putBit(0);const b=(E-f.getLengthInBits())/8;for(let S=0;S<b;S++)f.put(S%2?17:236,8);return C(f,g,w)}function C(g,w,y){const f=o.getSymbolTotalCodewords(w),B=a.getTotalCodewordsCount(w,y),m=f-B,E=a.getBlocksCount(w,y),b=f%E,S=E-b,H=Math.floor(f/E),K=Math.floor(m/E),Ie=K+1,Ot=H-K,Re=new l(Ot);let et=0;const W=new Array(E),$t=new Array(E);let nt=0;const Le=new Uint8Array(g.buffer);for(let V=0;V<E;V++){const rt=V<S?K:Ie;W[V]=Le.slice(et,et+rt),$t[V]=Re.encode(W[V]),et+=rt,nt=Math.max(nt,rt)}const it=new Uint8Array(f);let Vt=0,U,z;for(U=0;U<nt;U++)for(z=0;z<E;z++)U<W[z].length&&(it[Vt++]=W[z][U]);for(U=0;U<Ot;U++)for(z=0;z<E;z++)it[Vt++]=$t[z][U];return it}function M(g,w,y,f){let B;if(Array.isArray(g))B=p.fromArray(g);else if(typeof g=="string"){let H=w;if(!H){const K=p.rawSplit(g);H=c.getBestVersionForData(K,y)}B=p.fromString(g,H||40)}else throw new Error("Invalid data");const m=c.getBestVersionForData(B,y);if(!m)throw new Error("The amount of data is too big to be stored in a QR Code");if(!w)w=m;else if(w<m)throw new Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: `+m+`.
`);const E=P(w,y,B),b=o.getSymbolSize(w),S=new e(b);return u(S,w),A(S),T(S,w),x(S,y,0),w>=7&&L(S,w),k(S,E),isNaN(f)&&(f=s.getBestMask(S,x.bind(null,S,y))),s.applyMask(f,S),x(S,y,f),{modules:S,version:w,errorCorrectionLevel:y,maskPattern:f,segments:B}}return st.create=function(w,y){if(typeof w>"u"||w==="")throw new Error("No input text");let f=t.M,B,m;return typeof y<"u"&&(f=t.from(y.errorCorrectionLevel,t.M),B=c.from(y.version),m=s.from(y.maskPattern),y.toSJISFunc&&o.setToSJISFunction(y.toSJISFunc)),M(w,B,f,m)},st}var Pt={},St={},me;function Te(){return me||(me=1,(function(o){function t(r){if(typeof r=="number"&&(r=r.toString()),typeof r!="string")throw new Error("Color should be defined as hex string");let e=r.slice().replace("#","").split("");if(e.length<3||e.length===5||e.length>8)throw new Error("Invalid hex color: "+r);(e.length===3||e.length===4)&&(e=Array.prototype.concat.apply([],e.map(function(i){return[i,i]}))),e.length===6&&e.push("F","F");const n=parseInt(e.join(""),16);return{r:n>>24&255,g:n>>16&255,b:n>>8&255,a:n&255,hex:"#"+e.slice(0,6).join("")}}o.getOptions=function(e){e||(e={}),e.color||(e.color={});const n=typeof e.margin>"u"||e.margin===null||e.margin<0?4:e.margin,i=e.width&&e.width>=21?e.width:void 0,s=e.scale||4;return{width:i,scale:i?4:s,margin:n,color:{dark:t(e.color.dark||"#000000ff"),light:t(e.color.light||"#ffffffff")},type:e.type,rendererOpts:e.rendererOpts||{}}},o.getScale=function(e,n){return n.width&&n.width>=e+n.margin*2?n.width/(e+n.margin*2):n.scale},o.getImageWidth=function(e,n){const i=o.getScale(e,n);return Math.floor((e+n.margin*2)*i)},o.qrToImageData=function(e,n,i){const s=n.modules.size,a=n.modules.data,l=o.getScale(s,i),c=Math.floor((s+i.margin*2)*l),d=i.margin*l,v=[i.color.light,i.color.dark];for(let p=0;p<c;p++)for(let u=0;u<c;u++){let A=(p*c+u)*4,T=i.color.light;if(p>=d&&u>=d&&p<c-d&&u<c-d){const L=Math.floor((p-d)/l),x=Math.floor((u-d)/l);T=v[a[L*s+x]?1:0]}e[A++]=T.r,e[A++]=T.g,e[A++]=T.b,e[A]=T.a}}})(St)),St}var be;function on(){return be||(be=1,(function(o){const t=Te();function r(n,i,s){n.clearRect(0,0,i.width,i.height),i.style||(i.style={}),i.height=s,i.width=s,i.style.height=s+"px",i.style.width=s+"px"}function e(){try{return document.createElement("canvas")}catch{throw new Error("You need to specify a canvas element")}}o.render=function(i,s,a){let l=a,c=s;typeof l>"u"&&(!s||!s.getContext)&&(l=s,s=void 0),s||(c=e()),l=t.getOptions(l);const d=t.getImageWidth(i.modules.size,l),v=c.getContext("2d"),p=v.createImageData(d,d);return t.qrToImageData(p.data,i,l),r(v,c,d),v.putImageData(p,0,0),c},o.renderToDataURL=function(i,s,a){let l=a;typeof l>"u"&&(!s||!s.getContext)&&(l=s,s=void 0),l||(l={});const c=o.render(i,s,l),d=l.type||"image/png",v=l.rendererOpts||{};return c.toDataURL(d,v.quality)}})(Pt)),Pt}var At={},ye;function sn(){if(ye)return At;ye=1;const o=Te();function t(n,i){const s=n.a/255,a=i+'="'+n.hex+'"';return s<1?a+" "+i+'-opacity="'+s.toFixed(2).slice(1)+'"':a}function r(n,i,s){let a=n+i;return typeof s<"u"&&(a+=" "+s),a}function e(n,i,s){let a="",l=0,c=!1,d=0;for(let v=0;v<n.length;v++){const p=Math.floor(v%i),u=Math.floor(v/i);!p&&!c&&(c=!0),n[v]?(d++,v>0&&p>0&&n[v-1]||(a+=c?r("M",p+s,.5+u+s):r("m",l,0),l=0,c=!1),p+1<i&&n[v+1]||(a+=r("h",d),d=0)):l++}return a}return At.render=function(i,s,a){const l=o.getOptions(s),c=i.modules.size,d=i.modules.data,v=c+l.margin*2,p=l.color.light.a?"<path "+t(l.color.light,"fill")+' d="M0 0h'+v+"v"+v+'H0z"/>':"",u="<path "+t(l.color.dark,"stroke")+' d="'+e(d,c,l.margin)+'"/>',A='viewBox="0 0 '+v+" "+v+'"',L='<svg xmlns="http://www.w3.org/2000/svg" '+(l.width?'width="'+l.width+'" height="'+l.width+'" ':"")+A+' shape-rendering="crispEdges">'+p+u+`</svg>
`;return typeof a=="function"&&a(null,L),L},At}var ve;function an(){if(ve)return j;ve=1;const o=qe(),t=rn(),r=on(),e=sn();function n(i,s,a,l,c){const d=[].slice.call(arguments,1),v=d.length,p=typeof d[v-1]=="function";if(!p&&!o())throw new Error("Callback required as last argument");if(p){if(v<2)throw new Error("Too few arguments provided");v===2?(c=a,a=s,s=l=void 0):v===3&&(s.getContext&&typeof c>"u"?(c=l,l=void 0):(c=l,l=a,a=s,s=void 0))}else{if(v<1)throw new Error("Too few arguments provided");return v===1?(a=s,s=l=void 0):v===2&&!s.getContext&&(l=a,a=s,s=void 0),new Promise(function(u,A){try{const T=t.create(a,l);u(i(T,s,l))}catch(T){A(T)}})}try{const u=t.create(a,l);c(null,i(u,s,l))}catch(u){c(u)}}return j.create=t.create,j.toCanvas=n.bind(null,r.render),j.toDataURL=n.bind(null,r.renderToDataURL),j.toString=n.bind(null,function(i,s,a){return e.render(i,a)}),j}var ln=an();const cn=He(ln),_={sliceParty:`
    <div class="relative w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-tr from-[#ffe6b3] via-[#ffeedd] to-[#d6f4ff] overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.85)_0%,transparent_75%)] pointer-events-none"></div>
      
      <!-- Centered Graphics Cluster -->
      <div class="relative flex items-center justify-center gap-2 transform group-hover:scale-110 transition-transform duration-300 my-auto">
        <!-- Watermelon Slice SVG -->
        <div class="relative w-14 h-14 flex items-center justify-center drop-shadow-md">
          <svg class="w-full h-full" viewBox="0 0 100 100">
            <path d="M10 50 A40 40 0 0 0 90 50 Z" fill="#22c55e" stroke="#15803d" stroke-width="2"/>
            <path d="M14 50 A36 36 0 0 0 86 50 Z" fill="#fef08a"/>
            <path d="M18 50 A32 32 0 0 0 82 50 Z" fill="#ef4444"/>
            <circle cx="35" cy="58" r="3.5" fill="#1f2937"/>
            <circle cx="50" cy="64" r="3.5" fill="#1f2937"/>
            <circle cx="65" cy="58" r="3.5" fill="#1f2937"/>
          </svg>
        </div>
        <!-- Spinning Orange Slice SVG -->
        <div class="relative w-12 h-12 flex items-center justify-center -ml-3 drop-shadow-md">
          <svg class="w-full h-full animate-[spin_12s_linear_infinite]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="#f97316"/>
            <circle cx="50" cy="50" r="40" fill="#ffedd5"/>
            <circle cx="50" cy="50" r="36" fill="#fb923c"/>
            <path d="M50 14 L50 86 M14 50 L86 50 M24 24 L76 76 M24 76 L76 24" stroke="#ffedd5" stroke-width="4" stroke-linecap="round"/>
          </svg>
        </div>
        <!-- Cyan Splash Splatter -->
        <div class="absolute -right-3 -top-2 opacity-95">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#3cb4e7">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
        </div>
      </div>

      <!-- Centered Title Text -->
      <div class="text-center z-10 pb-4">
        <span style="font-size: 17px; font-weight: 900; color: #ff5722; text-shadow: 0 1px 2px rgba(255,255,255,0.9); letter-spacing: -0.01em;">Slice Party!</span>
      </div>
    </div>
  `,starDefender:`
    <div class="relative w-full h-full flex flex-col items-center justify-between p-3 bg-gradient-to-b from-[#1b2b3a] via-[#101b24] to-[#080d12] text-white overflow-hidden">
      <!-- Star dots -->
      <div class="absolute inset-0 opacity-40 pointer-events-none">
        <div style="position: absolute; top: 15%; left: 20%; width: 2.5px; height: 2.5px; background: white; border-radius: 50%;"></div>
        <div style="position: absolute; top: 35%; right: 25%; width: 3.5px; height: 3.5px; background: #76d1ff; border-radius: 50%;"></div>
        <div style="position: absolute; bottom: 25%; left: 30%; width: 2.5px; height: 2.5px; background: white; border-radius: 50%;"></div>
      </div>
      
      <div class="w-full flex items-center justify-center pt-0.5">
        <span style="font-size: 10px; color: #8bceff; text-transform: uppercase; font-weight: 800; letter-spacing: 0.12em;">Virtual Arc</span>
      </div>

      <!-- Centered Spaceship Cluster -->
      <div class="flex flex-col items-center justify-center my-auto">
        <div class="relative flex flex-col items-center drop-shadow-[0_4px_14px_rgba(95,191,254,0.7)]">
          <!-- Spaceship Vector -->
          <svg class="w-13 h-13 transform -translate-y-0.5 group-hover:-translate-y-1.5 transition-transform" viewBox="0 0 80 80" width="50" height="50">
            <path d="M40 8 L54 50 L40 44 L26 50 Z" fill="#e8f2ff"/>
            <path d="M40 18 L46 44 L40 40 L34 44 Z" fill="#5fbffe"/>
            <path d="M26 50 L18 64 L28 58 Z" fill="#006492"/>
            <path d="M54 50 L62 64 L52 58 Z" fill="#006492"/>
            <circle cx="40" cy="30" r="4.5" fill="#3cb4e7"/>
          </svg>
          <div style="width: 12px; height: 14px; background: #3cb4e7; border-radius: 9999px; filter: blur(3px); margin-top: -4px;"></div>
        </div>
      </div>

      <!-- Centered Title Text -->
      <div class="text-center z-10 pb-4">
        <span style="font-size: 16px; font-weight: 800; color: #f7f9ff; letter-spacing: 0.04em;">Star Defender</span>
      </div>
    </div>
  `,bowlBlitz:`
    <div class="relative w-full h-full flex flex-col items-center justify-between p-3 bg-gradient-to-b from-[#e3efff] via-[#cce0f5] to-[#b3cde3] overflow-hidden">
      <div class="w-full flex items-center justify-center pt-0.5">
        <span style="font-size: 10px; color: #51606a; text-transform: uppercase; font-weight: 800; letter-spacing: 0.12em;">Sports Hub</span>
      </div>

      <!-- Centered Pins & Ball Cluster -->
      <div class="flex flex-col items-center justify-center my-auto">
        <div class="relative flex items-center justify-center gap-1.5 transform group-hover:scale-105 transition-transform">
          <!-- Bowling Pin 1 -->
          <div style="width: 14px; height: 42px; background: #ffffff; border-radius: 9999px; box-shadow: 0 2px 5px rgba(0,0,0,0.18); display: flex; flex-direction: column; align-items: center; border-top: 2.5px solid #ef4444;">
            <div style="width: 100%; height: 3.5px; background: #ef4444; margin: 3.5px 0;"></div>
          </div>
          <!-- Ball -->
          <div class="relative transform group-hover:rotate-45 transition-transform duration-500" style="width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #ffffff 0%, #cfdbeb 50%, #51606a 100%); box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
            <div style="width: 4.5px; height: 4.5px; border-radius: 50%; background: #334155; position: absolute; top: 10px; left: 11px;"></div>
            <div style="width: 4.5px; height: 4.5px; border-radius: 50%; background: #334155; position: absolute; top: 10px; right: 11px;"></div>
            <div style="width: 4.5px; height: 4.5px; border-radius: 50%; background: #334155; position: absolute; bottom: 11px; left: 17px;"></div>
          </div>
          <!-- Bowling Pin 2 -->
          <div style="width: 14px; height: 42px; background: #ffffff; border-radius: 9999px; box-shadow: 0 2px 5px rgba(0,0,0,0.18); display: flex; flex-direction: column; align-items: center; transform: rotate(14deg); margin-top: -6px; border-top: 2.5px solid #ef4444;">
            <div style="width: 100%; height: 3.5px; background: #ef4444; margin: 3.5px 0;"></div>
          </div>
        </div>
      </div>

      <!-- Centered Title Text -->
      <div class="text-center z-10 pb-4">
        <span style="font-size: 16px; font-weight: 800; color: #111d28; letter-spacing: -0.01em;">Bowl Blitz</span>
      </div>
    </div>
  `,settings:`
    <div class="relative w-full h-full flex flex-col items-center justify-between p-3 bg-gradient-to-br from-[#e3efff] via-[#dde9f9] to-[#d7e4f4] overflow-hidden">
      <div class="w-full flex items-center justify-center pt-0.5">
        <span style="font-size: 10px; color: #51606a; text-transform: uppercase; font-weight: 800; letter-spacing: 0.12em;">System</span>
      </div>

      <!-- Centered Ceramic Cog Pod -->
      <div class="flex flex-col items-center justify-center my-auto">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: #ffffff; box-shadow: 0 4px 12px rgba(120,140,160,0.25); display: flex; align-items: center; justify-content: center; border: 1px solid #cfd8e0;" class="group-hover:rotate-90 transition-transform duration-700">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#006688">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
        </div>
      </div>

      <!-- Centered Title Text -->
      <div class="text-center z-10 pb-4">
        <span style="font-size: 16px; font-weight: 800; color: #111d28; letter-spacing: -0.01em;">Settings</span>
      </div>
    </div>
  `,controllerSync:`
    <div class="relative w-full h-full flex flex-col items-center justify-between p-3 bg-gradient-to-br from-[#edf4ff] via-[#e3efff] to-[#dde9f9] overflow-hidden">
      <div class="w-full flex items-center justify-center pt-0.5">
        <span style="font-size: 10px; color: #006688; text-transform: uppercase; font-weight: 800; letter-spacing: 0.12em;">Wireless</span>
      </div>

      <!-- Centered Wireless Wand Pod -->
      <div class="flex flex-col items-center justify-center my-auto">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: #ffffff; box-shadow: 0 4px 12px rgba(120,140,160,0.25); display: flex; align-items: center; justify-content: center; border: 1px solid #cfd8e0;" class="group-hover:scale-110 transition-transform">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#3cb4e7">
            <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4zm0 3.5c3.55 0 6.77 1.45 9.12 3.8L12 18.42 2.88 11.3A12.92 12.92 0 0 1 12 7.5z"/>
          </svg>
        </div>
      </div>

      <!-- Centered Title Text -->
      <div class="text-center z-10 pb-4">
        <span style="font-size: 16px; font-weight: 800; color: #111d28; letter-spacing: -0.01em;">Controller Pairing</span>
      </div>
    </div>
  `,calibration:`
    <div class="relative w-full h-full flex flex-col items-center justify-between p-3 bg-gradient-to-br from-[#f7f9ff] via-[#edf4ff] to-[#dde9f9] overflow-hidden">
      <div class="w-full flex items-center justify-center pt-0.5">
        <span style="font-size: 10px; color: #51606a; text-transform: uppercase; font-weight: 800; letter-spacing: 0.12em;">Sensors</span>
      </div>

      <!-- Centered Reticle Pod -->
      <div class="flex flex-col items-center justify-center my-auto">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: #ffffff; box-shadow: 0 4px 12px rgba(120,140,160,0.25); display: flex; align-items: center; justify-content: center; border: 1px solid #cfd8e0;" class="group-hover:rotate-45 transition-transform duration-500">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#006688">
            <circle cx="12" cy="12" r="9" stroke="#3cb4e7" stroke-width="2" fill="none"/>
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#006688" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="3" fill="#3cb4e7"/>
          </svg>
        </div>
      </div>

      <!-- Centered Title Text -->
      <div class="text-center z-10 pb-4">
        <span style="font-size: 16px; font-weight: 800; color: #111d28; letter-spacing: -0.01em;">Pointer Tuning</span>
      </div>
    </div>
  `,emptySlot:`
    <svg class="absolute bottom-0 left-0 w-full h-1/2 opacity-25 text-surface-container-highest" preserveAspectRatio="none" viewBox="0 0 200 60">
      <path d="M0 30 Q50 10 100 30 T200 30 V60 H0 Z" fill="#cfdbeb"></path>
    </svg>
  `},dn={sliceParty:{id:"sliceParty",title:"Slice Party",category:"Party / Motion Action",rating:"E (Everyone)",revision:"Rev 1.02",bannerGradient:"linear-gradient(135deg, #ffe6b3 0%, #ffedd5 50%, #d6f4ff 100%)",description:"Fling, flick, and slice flying exotic melons, citrus wheels, and berries with precision wand slashing. Watch out for volatile party bombs!",artHtml:_.sliceParty},starDefender:{id:"starDefender",title:"Star Defender",category:"Arcade / Aim & Shoot",rating:"E (Everyone)",revision:"Rev 1.00",bannerGradient:"linear-gradient(180deg, #1b2b3a 0%, #101b24 60%, #080d12 100%)",description:"Aim crosshairs at invading alien fighter fleets with the pointer and unleash rapid laser salvos with the B trigger to defend the orbital ring.",artHtml:_.starDefender},bowlBlitz:{id:"bowlBlitz",title:"Bowl Blitz",category:"Sports / Motion Bowling",rating:"E (Everyone)",revision:"Rev 1.05",bannerGradient:"linear-gradient(135deg, #e3efff 0%, #cce0f5 50%, #b3cde3 100%)",description:"Hold B, swing your arm forward and release at peak acceleration. Add wrist spin to curve the bowling ball directly into the pocket for a strike!",artHtml:_.bowlBlitz}};class un{constructor(t,r){R(this,"stageEl");R(this,"pointerEl");R(this,"currentPage",0);R(this,"maxPages",4);R(this,"activeDialogGame",null);R(this,"activeRoomCode","AUTO");R(this,"pairingUrl","");R(this,"isPointerPressed",!1);this.stageEl=t,this.pointerEl=r,this.initPointerTracking(),this.initClock(),this.renderHomeMenu(),this.initKeyboardShortcuts()}getActiveDialogGame(){return this.activeDialogGame}getIsPointerPressed(){return this.isPointerPressed}updatePairingInfo(t,r){this.activeRoomCode=t,this.pairingUrl=r,this.renderPairingQr()}openLaunchDialog(t){const r=dn[t];if(!r)return;this.activeDialogGame=r;const e=document.getElementById("launch-dialog-overlay"),n=document.getElementById("dialog-game-title"),i=document.getElementById("dialog-game-category"),s=document.getElementById("dialog-game-desc"),a=document.getElementById("dialog-banner-inner");n&&(n.textContent=r.title),i&&(i.textContent=`${r.category} • ${r.revision}`),s&&(s.textContent=r.description),a&&(a.innerHTML=r.artHtml),e&&e.classList.add("open")}closeLaunchDialog(){const t=document.getElementById("launch-dialog-overlay");t&&t.classList.remove("open")}openPairingScreen(){const t=document.getElementById("pairing-overlay");t&&(t.classList.add("open"),this.renderPairingQr())}closePairingScreen(){const t=document.getElementById("pairing-overlay");t&&t.classList.remove("open")}openCalibrationScreen(){const t=document.getElementById("calibration-overlay");t&&t.classList.add("open")}closeCalibrationScreen(){const t=document.getElementById("calibration-overlay");t&&t.classList.remove("open")}togglePauseOverlay(){const t=document.getElementById("pause-overlay");t&&t.classList.toggle("open")}closePauseOverlay(){const t=document.getElementById("pause-overlay");t&&t.classList.remove("open")}initPointerTracking(){window.addEventListener("mousemove",t=>{const r=this.stageEl.getBoundingClientRect(),e=t.clientX-r.left,n=t.clientY-r.top;this.pointerEl.style.transform=`translate3d(${e}px, ${n}px, 0) rotate(-12deg)`,this.pointerEl.style.setProperty("--ptr-x",`${e}px`),this.pointerEl.style.setProperty("--ptr-y",`${n}px`)}),window.addEventListener("mousedown",()=>{this.isPointerPressed=!0,this.pointerEl.classList.add("active-click")}),window.addEventListener("mouseup",()=>{this.isPointerPressed=!1,this.pointerEl.classList.remove("active-click")})}initClock(){const t=()=>{const r=new Date,e=r.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:!1}),i=`${["SUN","MON","TUE","WED","THU","FRI","SAT"][r.getDay()]} ${r.getMonth()+1}/${r.getDate()}`,s=document.querySelectorAll(".clock-time"),a=document.querySelectorAll(".clock-date");s.forEach(l=>{l.textContent=e}),a.forEach(l=>{l.textContent=i})};t(),setInterval(t,1e3)}renderHomeMenu(){const t=document.getElementById("channels-grid");t&&(t.innerHTML=`
      <!-- Slot 1: Slice Party -->
      <div class="channel-tile group" data-action="launch" data-game="sliceParty">
        <div class="tile-specular-glare"></div>
        ${_.sliceParty}
        <div class="tile-bottom-banner">
          <span class="tile-bottom-text">Disc Channel</span>
        </div>
      </div>

      <!-- Slot 2: Star Defender -->
      <div class="channel-tile group" data-action="launch" data-game="starDefender">
        <div class="tile-specular-glare"></div>
        ${_.starDefender}
        <div class="tile-bottom-banner">
          <span class="tile-bottom-text">Arcade</span>
        </div>
      </div>

      <!-- Slot 3: Bowl Blitz -->
      <div class="channel-tile group" data-action="launch" data-game="bowlBlitz">
        <div class="tile-specular-glare"></div>
        ${_.bowlBlitz}
        <div class="tile-bottom-banner">
          <span class="tile-bottom-text">Sports Hub</span>
        </div>
      </div>

      <!-- Slot 4: Settings -->
      <div class="channel-tile group" data-action="settings">
        <div class="tile-specular-glare"></div>
        ${_.settings}
        <div class="tile-bottom-banner">
          <span class="tile-bottom-text">System v3.4</span>
        </div>
      </div>

      <!-- Slot 5: Controller Sync -->
      <div class="channel-tile group" data-action="pairing">
        <div class="tile-specular-glare"></div>
        ${_.controllerSync}
        <div class="tile-bottom-banner">
          <span class="tile-bottom-text">Wireless Link</span>
        </div>
      </div>

      <!-- Slot 6: Pointer Tuning -->
      <div class="channel-tile group" data-action="calibration">
        <div class="tile-specular-glare"></div>
        ${_.calibration}
        <div class="tile-bottom-banner">
          <span class="tile-bottom-text">Sensor Bar</span>
        </div>
      </div>

      <!-- Slots 7 to 12: Empty Slots -->
      ${Array.from({length:6}).map((r,e)=>`
        <div class="channel-tile empty-slot group" data-slot="${e+7}">
          <div class="tile-specular-glare"></div>
          ${_.emptySlot}
        </div>
      `).join("")}
    `,this.bindGridEvents())}bindGridEvents(){this.stageEl.querySelectorAll(".channel-tile").forEach(n=>{n.addEventListener("click",()=>{const i=n.getAttribute("data-action"),s=n.getAttribute("data-game");i==="launch"&&s?this.openLaunchDialog(s):i==="pairing"?this.openPairingScreen():i==="calibration"?this.openCalibrationScreen():i==="settings"&&this.openPairingScreen()})});const r=document.getElementById("btn-page-prev"),e=document.getElementById("btn-page-next");r==null||r.addEventListener("click",()=>this.changePage(-1)),e==null||e.addEventListener("click",()=>this.changePage(1))}changePage(t){this.currentPage=(this.currentPage+t+this.maxPages)%this.maxPages,document.querySelectorAll(".pagination-pips .pip").forEach((e,n)=>{e.classList.toggle("active",n===this.currentPage)})}renderPairingQr(){const t=document.getElementById("pairing-qr-canvas"),r=document.getElementById("pairing-room-code"),e=document.getElementById("pairing-room-url");r&&(r.textContent=this.activeRoomCode),e&&(e.textContent=this.pairingUrl),t&&this.pairingUrl&&cn.toCanvas(t,this.pairingUrl,{width:220,margin:1,color:{dark:"#006688",light:"#ffffff"}},n=>{n&&console.error("[QR] Failed to render pairing QR:",n)})}initKeyboardShortcuts(){window.addEventListener("keydown",t=>{t.key==="Escape"||t.key.toLowerCase()==="h"?this.togglePauseOverlay():t.key.toLowerCase()==="c"?this.openCalibrationScreen():t.key.toLowerCase()==="p"?this.openPairingScreen():t.key==="ArrowLeft"?this.changePage(-1):t.key==="ArrowRight"&&this.changePage(1)})}}class fn{constructor(t,r,e){R(this,"socket",null);R(this,"wsUrl");R(this,"targetRoomId");R(this,"callbacks");R(this,"heartbeatTimer",null);R(this,"reconnectAttempts",0);R(this,"reconnectTimer",null);R(this,"isExplicitlyClosed",!1);this.wsUrl=t,this.targetRoomId=r,this.callbacks=e}connect(){this.isExplicitlyClosed=!1,this.callbacks.onStatusChange("connecting");try{this.socket=new WebSocket(this.wsUrl)}catch(t){this.callbacks.onStatusChange("disconnected",t instanceof Error?t.message:String(t)),this.scheduleReconnect();return}this.socket.onopen=()=>{this.reconnectAttempts=0,this.callbacks.onStatusChange("connected"),this.sendJoinRoom(),this.startHeartbeat()},this.socket.onmessage=t=>{try{const r=JSON.parse(t.data);this.handleMessage(r)}catch(r){console.error("[ConsoleNet] Error parsing message:",r)}},this.socket.onclose=()=>{this.stopHeartbeat(),this.callbacks.onStatusChange("disconnected"),this.isExplicitlyClosed||this.scheduleReconnect()},this.socket.onerror=t=>{console.warn("[ConsoleNet] WebSocket error:",t)}}send(t){this.socket&&this.socket.readyState===WebSocket.OPEN&&this.socket.send(JSON.stringify(t))}disconnect(){this.isExplicitlyClosed=!0,this.stopHeartbeat(),this.reconnectTimer&&(clearTimeout(this.reconnectTimer),this.reconnectTimer=null),this.socket&&(this.socket.close(),this.socket=null),this.callbacks.onStatusChange("disconnected","Explicitly closed")}sendJoinRoom(){const t={type:"JOIN_ROOM",seq:1,timestamp:Date.now(),role:"console",roomId:this.targetRoomId};this.send(t)}handleMessage(t){if(xe(t)){this.callbacks.onMessage(t);return}switch(t.type){case"JOIN_ROOM_ACK":{const r=t;r.success&&(this.targetRoomId=r.roomId,this.callbacks.onRoomJoined(r.roomId),this.callbacks.onPeerStatus(r.peerConnected));break}case"PEER_STATUS":{const r=t;this.callbacks.onPeerStatus(r.status==="connected");break}case"PONG":{const r=t,e=Date.now()-r.clientTimestamp;this.callbacks.onLatencyUpdate(e);break}default:{this.callbacks.onMessage(t);break}}}startHeartbeat(){this.stopHeartbeat(),this.heartbeatTimer=setInterval(()=>{if(this.socket&&this.socket.readyState===WebSocket.OPEN){const t={type:"PING",seq:Date.now(),timestamp:Date.now()};this.send(t)}},De)}stopHeartbeat(){this.heartbeatTimer&&(clearInterval(this.heartbeatTimer),this.heartbeatTimer=null)}scheduleReconnect(){if(this.reconnectAttempts>=jt){this.callbacks.onStatusChange("disconnected","Max reconnect attempts exceeded");return}this.reconnectAttempts++,this.callbacks.onStatusChange("reconnecting",`Attempt ${this.reconnectAttempts}/${jt}`),this.reconnectTimer=setTimeout(()=>{this.connect()},_e)}}class gn{constructor(){R(this,"containerEl",null);R(this,"isVisible",!1);R(this,"state",{isVisible:!1,packetRateHz:0,totalPackets:0,rttMs:0,rotation:[0,0,0],accel:[0,0,9.8],bitmask:0,lastPacketTime:0});R(this,"frameTimestamps",[]);R(this,"rafId",null);R(this,"isDirty",!1);this.createDom(),this.bindKeyboardShortcut(),this.startRenderLoop()}toggle(){this.isVisible=!this.isVisible,this.containerEl&&(this.containerEl.style.display=this.isVisible?"flex":"none")}updateLatency(t){this.state.rttMs=t,this.isDirty=!0}ingestPacket(t){const r=performance.now();for(this.frameTimestamps.push(r);this.frameTimestamps.length>0&&this.frameTimestamps[0]<r-1e3;)this.frameTimestamps.shift();if(this.state.packetRateHz=this.frameTimestamps.length,this.state.totalPackets++,this.state.lastPacketTime=Date.now(),"t"in t&&t.t==="F"){const e=t;this.state.rotation=[...e.r],this.state.accel=[...e.a],this.state.bitmask=e.b}else if("buttons"in t){const e=t;this.state.rotation=[e.rotationRate.alpha,e.rotationRate.beta,e.rotationRate.gamma],this.state.accel=[e.acceleration.x,e.acceleration.y,e.acceleration.z];let n=0;e.buttons.a&&(n|=I.A),e.buttons.b&&(n|=I.B),e.buttons.dpadUp&&(n|=I.DPAD_UP),e.buttons.dpadDown&&(n|=I.DPAD_DOWN),e.buttons.dpadLeft&&(n|=I.DPAD_LEFT),e.buttons.dpadRight&&(n|=I.DPAD_RIGHT),e.buttons.plus&&(n|=I.PLUS),e.buttons.minus&&(n|=I.MINUS),e.buttons.home&&(n|=I.HOME),e.buttons.btn1&&(n|=I.BTN_1),e.buttons.btn2&&(n|=I.BTN_2),this.state.bitmask=n}this.isDirty=!0}getBitmask(){return this.state.bitmask}bindKeyboardShortcut(){window.addEventListener("keydown",t=>{(t.key==="d"||t.key==="D")&&t.target.tagName!=="INPUT"&&this.toggle()})}createDom(){const t=document.createElement("div");t.id="sensor-debug-overlay",t.style.display="none",t.innerHTML=`
      <div class="debug-overlay-card">
        <div class="debug-overlay-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="debug-pulse-dot"></span>
            <span style="font-weight: 800; font-size: 13px; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.08em;">
              Wand Sensor Telemetry [D]
            </span>
          </div>
          <span id="dbg-hz-pill" class="debug-hz-pill">0 Hz</span>
        </div>

        <div class="debug-grid">
          <!-- Latency & Stream Metrics -->
          <div class="debug-metric-box">
            <span class="dbg-label">RTT Latency</span>
            <span id="dbg-rtt" class="dbg-value">-- ms</span>
          </div>
          <div class="debug-metric-box">
            <span class="dbg-label">Packet Count</span>
            <span id="dbg-packets" class="dbg-value">0</span>
          </div>

          <!-- Gyroscope Angular Velocity (deg/s) -->
          <div class="debug-section-full">
            <span class="dbg-label">Gyroscope (deg/s): Yaw (α), Pitch (β), Roll (γ)</span>
            <div class="dbg-axis-row">
              <span class="axis-tag">α</span>
              <span id="dbg-gyro-a" class="axis-num">0.00</span>
              <div class="axis-track"><div id="dbg-bar-gyro-a" class="axis-fill"></div></div>
            </div>
            <div class="dbg-axis-row">
              <span class="axis-tag">β</span>
              <span id="dbg-gyro-b" class="axis-num">0.00</span>
              <div class="axis-track"><div id="dbg-bar-gyro-b" class="axis-fill"></div></div>
            </div>
            <div class="dbg-axis-row">
              <span class="axis-tag">γ</span>
              <span id="dbg-gyro-c" class="axis-num">0.00</span>
              <div class="axis-track"><div id="dbg-bar-gyro-c" class="axis-fill"></div></div>
            </div>
          </div>

          <!-- Accelerometer with Gravity (m/s^2) -->
          <div class="debug-section-full">
            <span class="dbg-label">Acceleration (m/s²): X, Y, Z</span>
            <div class="dbg-axis-row">
              <span class="axis-tag">X</span>
              <span id="dbg-acc-x" class="axis-num">0.00</span>
              <div class="axis-track"><div id="dbg-bar-acc-x" class="axis-fill"></div></div>
            </div>
            <div class="dbg-axis-row">
              <span class="axis-tag">Y</span>
              <span id="dbg-acc-y" class="axis-num">0.00</span>
              <div class="axis-track"><div id="dbg-bar-acc-y" class="axis-fill"></div></div>
            </div>
            <div class="dbg-axis-row">
              <span class="axis-tag">Z</span>
              <span id="dbg-acc-z" class="axis-num">9.80</span>
              <div class="axis-track"><div id="dbg-bar-acc-z" class="axis-fill"></div></div>
            </div>
          </div>

          <!-- Live Multi-Touch Button Pad Matrix -->
          <div class="debug-section-full">
            <span class="dbg-label">Active Virtual Buttons (Bitmask: <span id="dbg-bitmask">0</span>)</span>
            <div class="dbg-button-matrix">
              <span id="btn-ind-a" class="dbg-btn-pill">A</span>
              <span id="btn-ind-b" class="dbg-btn-pill">B Trigger</span>
              <span id="btn-ind-up" class="dbg-btn-pill">↑ Up</span>
              <span id="btn-ind-down" class="dbg-btn-pill">↓ Down</span>
              <span id="btn-ind-left" class="dbg-btn-pill">← Left</span>
              <span id="btn-ind-right" class="dbg-btn-pill">→ Right</span>
              <span id="btn-ind-plus" class="dbg-btn-pill">+ Plus</span>
              <span id="btn-ind-minus" class="dbg-btn-pill">- Minus</span>
              <span id="btn-ind-home" class="dbg-btn-pill">Home</span>
              <span id="btn-ind-1" class="dbg-btn-pill">1</span>
              <span id="btn-ind-2" class="dbg-btn-pill">2</span>
              <span id="btn-ind-recenter" class="dbg-btn-pill">Recenter</span>
            </div>
          </div>
        </div>
      </div>
    `,document.body.appendChild(t),this.containerEl=t}startRenderLoop(){const t=()=>{this.isVisible&&this.isDirty&&(this.renderDom(),this.isDirty=!1),this.rafId=requestAnimationFrame(t)};this.rafId=requestAnimationFrame(t)}renderDom(){if(!this.containerEl)return;const[t,r,e]=this.state.rotation,[n,i,s]=this.state.accel,a=this.state.bitmask,l=document.getElementById("dbg-hz-pill"),c=document.getElementById("dbg-rtt"),d=document.getElementById("dbg-packets"),v=document.getElementById("dbg-bitmask");l&&(l.textContent=`${this.state.packetRateHz} Hz`),c&&(c.textContent=`${this.state.rttMs} ms`),d&&(d.textContent=this.state.totalPackets.toString()),v&&(v.textContent=a.toString(2).padStart(12,"0")),this.updateAxis("dbg-gyro-a","dbg-bar-gyro-a",t,180),this.updateAxis("dbg-gyro-b","dbg-bar-gyro-b",r,180),this.updateAxis("dbg-gyro-c","dbg-bar-gyro-c",e,180),this.updateAxis("dbg-acc-x","dbg-bar-acc-x",n,20),this.updateAxis("dbg-acc-y","dbg-bar-acc-y",i,20),this.updateAxis("dbg-acc-z","dbg-bar-acc-z",s,20),this.updateButtonPill("btn-ind-a",a&I.A),this.updateButtonPill("btn-ind-b",a&I.B),this.updateButtonPill("btn-ind-up",a&I.DPAD_UP),this.updateButtonPill("btn-ind-down",a&I.DPAD_DOWN),this.updateButtonPill("btn-ind-left",a&I.DPAD_LEFT),this.updateButtonPill("btn-ind-right",a&I.DPAD_RIGHT),this.updateButtonPill("btn-ind-plus",a&I.PLUS),this.updateButtonPill("btn-ind-minus",a&I.MINUS),this.updateButtonPill("btn-ind-home",a&I.HOME),this.updateButtonPill("btn-ind-1",a&I.BTN_1),this.updateButtonPill("btn-ind-2",a&I.BTN_2),this.updateButtonPill("btn-ind-recenter",a&I.RECENTER)}updateAxis(t,r,e,n){const i=document.getElementById(t),s=document.getElementById(r);if(i&&(i.textContent=e.toFixed(2)),s){const a=Math.min(Math.max(e/n*50,-50),50);a>=0?(s.style.left="50%",s.style.width=`${a}%`,s.style.background="#38bdf8"):(s.style.left=`${50+a}%`,s.style.width=`${-a}%`,s.style.background="#f43f5e")}}updateButtonPill(t,r){const e=document.getElementById(t);e&&(r?e.classList.add("active"):e.classList.remove("active"))}destroy(){this.rafId!==null&&cancelAnimationFrame(this.rafId),this.containerEl&&this.containerEl.remove()}}let we="AUTO",X=window.location.hostname,ke=window.location.port?Number(window.location.port):5173,Ee=0,tt=null,h=null,D=null,G=!1;const hn=document.getElementById("stage"),pn=document.getElementById("hand-pointer"),Z=document.getElementById("pairing-peer-badge"),Ce=document.getElementById("pairing-rtt-val"),Be=document.getElementById("pairing-frames-val"),F=document.getElementById("pairing-log-box"),Tt=document.getElementById("btn-pairing-test-vibrate"),kt=document.getElementById("header-battery-pill"),It=document.getElementById("btn-dialog-back"),Rt=document.getElementById("btn-dialog-start"),Lt=document.getElementById("btn-pairing-close"),Mt=document.getElementById("disk-settings"),Nt=document.getElementById("disk-messages"),Dt=document.getElementById("btn-pause-resume"),_t=document.getElementById("btn-pause-calibrate"),Ut=document.getElementById("btn-pause-pairing"),zt=document.getElementById("btn-pause-menu"),Ht=document.getElementById("btn-pause-close"),qt=document.getElementById("btn-calib-back");function Y(o){if(!F)return;const t=document.createElement("div");t.style.lineHeight="1.4";const r=new Date().toLocaleTimeString();for(t.innerHTML=`<span style="color: #64748b;">[${r}]</span> ${mn(o)}`,F.appendChild(t);F.children.length>50;)F.removeChild(F.children[0]);F.scrollTop=F.scrollHeight}function mn(o){return o.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}async function bn(){try{const o=await fetch(Ue);if(o.ok){const t=await o.json();X=t.lanIp,ke=t.port}}catch(o){console.warn("[Console] Using fallback hostname for LAN IP:",o)}}function yn(o){const r=window.location.protocol==="https:"?"https":"http",e=X==="localhost"||X==="127.0.0.1"?window.location.hostname:X;return`${r}://${e}:${ke}/controller?room=${o}`}function vn(){const r=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}${ze}`;tt=new fn(r,we,{onStatusChange:(e,n)=>{Y(`[Relay] ${e.toUpperCase()} ${n||""}`)},onPeerStatus:e=>{Z&&(Z.textContent=e?"Connected":"Waiting",Z.style.background=e?"rgba(34, 197, 94, 0.2)":"#e2e8f0",Z.style.color=e?"#22c55e":"#475569"),Y(`[Controller] Peer ${e?"CONNECTED":"DISCONNECTED"}`)},onRoomJoined:e=>{we=e;const n=yn(e);h&&h.updatePairingInfo(e,n),Y(`[Room] Assigned code: ${e}`)},onLatencyUpdate:e=>{Ce&&(Ce.textContent=`${e} ms`),D==null||D.updateLatency(e)},onMessage:e=>{if(Ee++,Be&&(Be.textContent=`${Ee} frames`),xe(e)){D==null||D.ingestPacket(e);const n=(e.b&I.HOME)!==0;n&&!G?(G=!0,h==null||h.togglePauseOverlay()):n||(G=!1);return}if(e.type==="INPUT_FRAME"){const n=e;D==null||D.ingestPacket(n),n.buttons.home&&!G?(G=!0,h==null||h.togglePauseOverlay()):n.buttons.home||(G=!1);return}Y(JSON.stringify(e))}}),tt.connect()}function wn(){It==null||It.addEventListener("click",()=>h==null?void 0:h.closeLaunchDialog()),Rt==null||Rt.addEventListener("click",()=>{alert("Game Launch animation triggered! Game runtime loads in Phase 7."),h==null||h.closeLaunchDialog()}),Lt==null||Lt.addEventListener("click",()=>h==null?void 0:h.closePairingScreen()),Mt==null||Mt.addEventListener("click",o=>{o.preventDefault(),h==null||h.openPairingScreen()}),Nt==null||Nt.addEventListener("click",o=>{o.preventDefault(),h==null||h.togglePauseOverlay()}),kt==null||kt.addEventListener("click",()=>h==null?void 0:h.openPairingScreen()),Dt==null||Dt.addEventListener("click",()=>h==null?void 0:h.closePauseOverlay()),_t==null||_t.addEventListener("click",()=>{h==null||h.closePauseOverlay(),h==null||h.openCalibrationScreen()}),Ut==null||Ut.addEventListener("click",()=>{h==null||h.closePauseOverlay(),h==null||h.openPairingScreen()}),zt==null||zt.addEventListener("click",()=>{h==null||h.closePauseOverlay()}),Ht==null||Ht.addEventListener("click",()=>h==null?void 0:h.closePauseOverlay()),qt==null||qt.addEventListener("click",()=>h==null?void 0:h.closeCalibrationScreen()),Tt==null||Tt.addEventListener("click",()=>{if(tt){const o={type:"COMMAND_HAPTIC",seq:Date.now(),timestamp:Date.now(),pattern:[60,40,60]};tt.send(o),Y("[Action] Sent COMMAND_HAPTIC to controller")}})}async function En(){h=new un(hn,pn),D=new gn,wn(),await bn(),vn()}En();
