/* ═══════════════════════════════════════════════════════════
   THE GATEWAY — Three.js Cloud Stack + Particles
   Homepage centerpiece · dipayanbarua.com.au
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

const container = document.getElementById('gateway-canvas');
if(!container) return;

let W = container.clientWidth, H = container.clientHeight;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x04060C, 0.014);

const camera = new THREE.PerspectiveCamera(38, W/H, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
renderer.setSize(W, H);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// lighting
scene.add(new THREE.AmbientLight(0x404a6b, 1.0));
const keyLight = new THREE.PointLight(0x00E5FF, 0.7, 100);
keyLight.position.set(10,16,12); scene.add(keyLight);
const fillLight = new THREE.PointLight(0x7C5CFF, 0.5, 100);
fillLight.position.set(-12,6,-8); scene.add(fillLight);
scene.add(new THREE.DirectionalLight(0xffffff, 0.25));

// grid floor
const grid = new THREE.GridHelper(80,50,0x1A2238,0x0E1525);
grid.position.y = -9; grid.material.transparent = true; grid.material.opacity = 0.35;
scene.add(grid);

// PILLARS
const PILLARS = [
  {name:'Entra ID',color:0x00E5FF},{name:'Azure',color:0x3B82F6},
  {name:'Intune',color:0x60A5FA},{name:'Exchange',color:0x7C5CFF},
  {name:'SharePoint',color:0x9F7CFF},{name:'OneDrive',color:0xC4B5FD},
  {name:'Defender',color:0x00FFA3},{name:'Purview',color:0x34D399}
];

const stack = new THREE.Group(); scene.add(stack);
const LH = 1.0, GAP = 0.7;
const totalH = PILLARS.length*(LH+GAP)-GAP;
const baseY = -totalH/2 + LH/2;

PILLARS.forEach((p,i)=>{
  const g = new THREE.Group();
  g.position.y = baseY + i*(LH+GAP);
  const geo = new THREE.BoxGeometry(7.5, LH, 7.5);
  const mat = new THREE.MeshStandardMaterial({
    color:p.color, transparent:true, opacity:0.14,
    emissive:p.color, emissiveIntensity:0.3,
    metalness:0.3, roughness:0.4
  });
  g.add(new THREE.Mesh(geo, mat));
  g.add(new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({color:p.color, transparent:true, opacity:0.8})
  ));
  // top face glow
  const topGeo = new THREE.PlaneGeometry(7*0.9, 7*0.9);
  const topMat = new THREE.MeshBasicMaterial({color:p.color, transparent:true, opacity:0.05, side:THREE.DoubleSide});
  const topFace = new THREE.Mesh(topGeo, topMat);
  topFace.rotation.x = -Math.PI/2; topFace.position.y = LH/2+0.001;
  g.add(topFace);
  stack.add(g);
});

// base glow
const baseGlow = new THREE.Mesh(
  new THREE.PlaneGeometry(16,16),
  new THREE.MeshBasicMaterial({color:0x00E5FF, transparent:true, opacity:0.04, side:THREE.DoubleSide})
);
baseGlow.rotation.x = -Math.PI/2;
baseGlow.position.y = baseY - LH/2 - 0.5;
scene.add(baseGlow);

// PARTICLES
const PC = 500;
const positions = new Float32Array(PC*3);
const colors = new Float32Array(PC*3);
const speeds = new Float32Array(PC);
const pColors = [{r:0,g:0.898,b:1},{r:0.486,g:0.361,b:1},{r:0,g:1,b:0.639},{r:0.231,g:0.51,b:0.965}];

for(let i=0;i<PC;i++){
  positions[i*3]=(Math.random()-0.5)*70;
  positions[i*3+1]=(Math.random()-0.5)*45;
  positions[i*3+2]=(Math.random()-0.5)*70;
  const c=pColors[Math.floor(Math.random()*pColors.length)];
  colors[i*3]=c.r; colors[i*3+1]=c.g; colors[i*3+2]=c.b;
  speeds[i] = 0.2 + Math.random()*0.8;
}

const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(positions,3));
pGeo.setAttribute('color', new THREE.BufferAttribute(colors,3));
const pMat = new THREE.PointsMaterial({size:0.1, vertexColors:true, transparent:true, opacity:0.65, sizeAttenuation:true});
const particles = new THREE.Points(pGeo, pMat);
scene.add(particles);

// connecting lines
const linePos = [];
for(let i=0;i<PC;i++){
  for(let j=i+1;j<Math.min(i+6,PC);j++){
    const dx=positions[i*3]-positions[j*3], dy=positions[i*3+1]-positions[j*3+1], dz=positions[i*3+2]-positions[j*3+2];
    if(Math.sqrt(dx*dx+dy*dy+dz*dz)<5.5){
      linePos.push(positions[i*3],positions[i*3+1],positions[i*3+2]);
      linePos.push(positions[j*3],positions[j*3+1],positions[j*3+2]);
    }
  }
}
const lGeo = new THREE.BufferGeometry();
lGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos,3));
scene.add(new THREE.LineSegments(lGeo, new THREE.LineBasicMaterial({color:0x00E5FF, transparent:true, opacity:0.05})));

// Camera orbit
let radius=28, theta=0.5, phi=1.2;
const target = new THREE.Vector3(2,0,0); // offset slightly right so stack is on the right side

function updateCam(){
  camera.position.set(
    target.x + radius*Math.sin(phi)*Math.sin(theta),
    target.y + radius*Math.cos(phi),
    target.z + radius*Math.sin(phi)*Math.cos(theta)
  );
  camera.lookAt(target);
}
updateCam();

// mouse parallax (subtle, not full drag)
let mouseX=0, mouseY=0;
if(window.matchMedia('(pointer:fine)').matches){
  window.addEventListener('mousemove', e=>{
    mouseX = (e.clientX/window.innerWidth - 0.5)*2;
    mouseY = (e.clientY/window.innerHeight - 0.5)*2;
  }, {passive:true});
}

// resize
window.addEventListener('resize', ()=>{
  W=container.clientWidth; H=container.clientHeight;
  camera.aspect=W/H; camera.updateProjectionMatrix();
  renderer.setSize(W,H);
});

// reduced motion
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// animate
const clock = new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  if(!prefersReduced){
    // auto rotate + mouse parallax
    theta += 0.0015;
    const targetPhi = 1.2 - mouseY*0.08;
    const targetTheta2 = theta - mouseX*0.06;
    phi += (targetPhi - phi)*0.03;
    updateCam();
    camera.position.x += mouseX*0.5;
    camera.position.y += mouseY*0.3;
    camera.lookAt(target);

    // stack gentle float
    stack.rotation.y = t*0.25;
    stack.position.y = Math.sin(t*0.5)*0.3;

    // particle drift
    const pos = pGeo.attributes.position.array;
    for(let i=0;i<PC;i++){
      pos[i*3+1] += Math.sin(t*0.5+i*0.1)*0.002*speeds[i];
    }
    pGeo.attributes.position.needsUpdate = true;
    particles.rotation.y = t*0.015;
  }

  renderer.render(scene, camera);
}
animate();

})();
