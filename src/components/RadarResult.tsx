import { Scores } from '../logic/scoring';
import { QRCodeSVG } from 'qrcode.react';
const axes=['love','family','career','other'] as const;
function polygon(values:number[], c=150,r=104){return values.map((v,i)=>{const angle=-Math.PI/2+i*Math.PI/2; const d=r*v/100; return `${c+Math.cos(angle)*d},${c+Math.sin(angle)*d}`}).join(' ')}
export function RadarResult({scores,compact=false}:{scores:Scores;compact?:boolean}){const labels=['爱情','亲情','事业','其他'];const size=compact?250:300,c=size/2,r=size*.35;const grid=[25,50,75,100]; const appetite=axes.map(x=>scores.categories[x]); const danger=axes.map(x=>scores.alarms[x]); return <div className="radar"><svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="胃口与雷点雷达图">
 {grid.map(x=><polygon key={x} points={polygon([x,x,x,x],c,r)} fill="none" stroke="#c7b8a6" strokeWidth=".7"/>)}
 {axes.map((_,i)=>{const a=-Math.PI/2+i*Math.PI/2;return <line key={i} x1={c} y1={c} x2={c+Math.cos(a)*r} y2={c+Math.sin(a)*r} stroke="#c7b8a6" strokeWidth=".7"/>})}
 <polygon points={polygon(appetite,c,r)} fill="rgba(111,36,39,.22)" stroke="#702c32" strokeWidth="2"/>
 <polygon points={polygon(danger,c,r)} fill="rgba(75,65,105,.10)" stroke="#4b4169" strokeWidth="2" strokeDasharray="5 4"/>
 {labels.map((label,i)=>{const a=-Math.PI/2+i*Math.PI/2;return <text key={label} x={c+Math.cos(a)*(r+19)} y={c+Math.sin(a)*(r+19)+4} textAnchor="middle" className="radar-label">{label}</text>})}
 </svg>{!compact&&<a className="result-qr" href="https://lizhao077-netizen.github.io/jubensha-appetite-test/" aria-label="扫码再次测试"><QRCodeSVG value="https://lizhao077-netizen.github.io/jubensha-appetite-test/" size={58} marginSize={1}/><small>扫码再测</small></a>}<div className="legend"><span><i className="wine"/>胃口</span><span><i className="violet"/>雷点</span></div></div>}
