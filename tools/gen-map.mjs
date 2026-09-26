import fs from 'fs';
import {geoNaturalEarth1, geoPath, geoCentroid, geoBounds} from 'd3-geo';
import {feature} from 'topojson-client';
const topo=JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json'));const topo110=JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-110m.json'));const bgF=feature(topo110,topo110.objects.countries).features.filter(f=>f.id!=='010');
const all=feature(topo,topo.objects.countries).features.filter(f=>f.id!=='010');
const W=1000,H=520;
const proj=geoNaturalEarth1().fitExtent([[6,6],[W-6,H-6]],{type:'FeatureCollection',features:all});
// simplify precision
const path=geoPath(proj).digits(1);
const want={"231":"ethiopia","887":"yemen","404":"kenya","646":"rwanda","108":"burundi","834":"tanzania","800":"uganda","180":"drc","454":"malawi","170":"colombia","076":"brazil","604":"peru","068":"bolivia","218":"ecuador","591":"panama","188":"costarica","320":"guatemala","222":"elsalvador","340":"honduras","558":"nicaragua","484":"mexico","388":"jamaica","360":"indonesia","156":"china","356":"india","704":"vietnam","598":"png","764":"thailand","104":"myanmar","626":"timor","682":"saudi","608":"philippines","418":"laos","144":"srilanka","524":"nepal","158":"taiwan","192":"cuba","214":"dominican","332":"haiti","630":"puertorico","862":"venezuela","894":"zambia","716":"zimbabwe","120":"cameroon","384":"ivorycoast","694":"sierraleone","450":"madagascar","728":"southsudan"};
const out={bg:[],c:{},cent:{},bbox:{}};
let missing=Object.keys(want).filter(id=>!all.find(f=>f.id===id));
console.error('missing',missing);
for(const f of all){
  const d=path(f); if(!d) continue;
  if(want[f.id]){const k=want[f.id];out.c[k]=d;out.cent[k]=proj(geoCentroid(f)).map(v=>+v.toFixed(1));
    const b=path.bounds(f);out.bbox[k]=b.map(p=>p.map(v=>+v.toFixed(1)));}
}
for(const f of bgF){if(want[f.id])continue;const d=path(f);if(d)out.bg.push(d);
}
// special points
const pts={yunnan:[101.5,24.8],kona:[-155.9,19.6],reunion:[55.5,-21.1],gayo:[96.9,4.6]};
out.pts={};for(const k in pts)out.pts[k]=proj(pts[k]).map(v=>+v.toFixed(1));
// indonesia centroid is off-land sometimes; override with Sulawesi-ish point
out.cent.indonesia=proj([113,-1.5]).map(v=>+v.toFixed(1));
out.cent.china=out.pts.yunnan;
out.bg=out.bg.join('');
fs.writeFileSync('src/data/world-map.json',JSON.stringify(out));
console.error('size',fs.statSync('map.json').size, 'W',W,'H',H);
const t1=proj([0,23.44])[1], t2=proj([0,-23.44])[1];
const o=JSON.parse(fs.readFileSync('src/data/world-map.json'));o.tropics=[+t1.toFixed(1),+t2.toFixed(1)];
fs.writeFileSync('src/data/world-map.json',JSON.stringify(o));console.error(o.tropics,o.pts,o.cent.china,o.bbox.elsalvador,o.bbox.rwanda);
