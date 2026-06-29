/* ╔══════════════════════════════════════════════════════════════╗
   ║  dipayanbarua.com.au — Persistent Particle Background       ║
   ║  Lightweight · Every Page · Mobile-Aware · Phantom Blue     ║
   ╚══════════════════════════════════════════════════════════════╝ */

(function () {
  'use strict';

  var container = document.getElementById('particles-bg');
  if (!container || typeof THREE === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* Mobile detection — reduce particle count */
  var isMobile = window.innerWidth < 768;
  var PARTICLE_COUNT = isMobile ? 200 : 500;
  var LINE_DISTANCE = 2.8;

  /* Scene */
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 200);
  camera.position.set(0, 0, 20);

  var renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 2 : 3));
  container.appendChild(renderer.domElement);

  /* Particles */
  var pGeo = new THREE.BufferGeometry();
  var pos = new Float32Array(PARTICLE_COUNT * 3);
  var vel = new Float32Array(PARTICLE_COUNT * 3);
  var col = new Float32Array(PARTICLE_COUNT * 3);
  var accent = new THREE.Color(0x7DABFF);
  var dim = new THREE.Color(0x1E2840);

  for (var i = 0; i < PARTICLE_COUNT; i++) {
    var i3 = i * 3;
    var r = 8 + Math.random() * 20;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    pos[i3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i3+1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i3+2] = r * Math.cos(phi);
    vel[i3] = (Math.random() - 0.5) * 0.002;
    vel[i3+1] = (Math.random() - 0.5) * 0.002;
    vel[i3+2] = (Math.random() - 0.5) * 0.002;
    var c = Math.random() > 0.75 ? accent : dim;
    col[i3] = c.r; col[i3+1] = c.g; col[i3+2] = c.b;
  }

  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  var particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.04, vertexColors: true, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  scene.add(particles);

  /* Connecting lines (skip on mobile for performance) */
  var lines = null;
  if (!isMobile) {
    var maxLines = 100;
    var lGeo = new THREE.BufferGeometry();
    var lPos = new Float32Array(maxLines * 6);
    var lCol = new Float32Array(maxLines * 6);
    lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3));
    lGeo.setAttribute('color', new THREE.BufferAttribute(lCol, 3));
    lGeo.setDrawRange(0, 0);
    lines = new THREE.LineSegments(lGeo, new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.12,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    scene.add(lines);
  }

  /* Mouse parallax (desktop only) */
  var mouseX = 0, mouseY = 0;
  if (!isMobile) {
    document.addEventListener('mousemove', function (e) {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });
  }

  /* Animation */
  var frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    frame++;

    /* Subtle camera sway */
    camera.position.x += (mouseX * 2 - camera.position.x) * 0.01;
    camera.position.y += (mouseY * 1.5 - camera.position.y) * 0.01;
    camera.lookAt(0, 0, 0);

    /* Move particles */
    var pArr = pGeo.getAttribute('position').array;
    for (var pi = 0; pi < PARTICLE_COUNT; pi++) {
      var p3 = pi * 3;
      pArr[p3] += vel[p3]; pArr[p3+1] += vel[p3+1]; pArr[p3+2] += vel[p3+2];
      var dist = Math.sqrt(pArr[p3]*pArr[p3] + pArr[p3+1]*pArr[p3+1] + pArr[p3+2]*pArr[p3+2]);
      if (dist > 28) { pArr[p3] *= 0.4; pArr[p3+1] *= 0.4; pArr[p3+2] *= 0.4; }
    }
    pGeo.getAttribute('position').needsUpdate = true;
    particles.rotation.y += 0.0001;

    /* Lines (desktop, every 4 frames) */
    if (lines && frame % 4 === 0) {
      var lineIdx = 0;
      var lpArr = lines.geometry.getAttribute('position').array;
      var lcArr = lines.geometry.getAttribute('color').array;
      var step = Math.max(1, Math.floor(PARTICLE_COUNT / 80));
      for (var a = 0; a < PARTICLE_COUNT && lineIdx < 100; a += step) {
        for (var b = a + step; b < PARTICLE_COUNT && lineIdx < 100; b += step) {
          var a3=a*3, b3=b*3;
          var dx=pArr[a3]-pArr[b3], dy=pArr[a3+1]-pArr[b3+1], dz=pArr[a3+2]-pArr[b3+2];
          var dd=Math.sqrt(dx*dx+dy*dy+dz*dz);
          if (dd < LINE_DISTANCE) {
            var idx6=lineIdx*6;
            lpArr[idx6]=pArr[a3]; lpArr[idx6+1]=pArr[a3+1]; lpArr[idx6+2]=pArr[a3+2];
            lpArr[idx6+3]=pArr[b3]; lpArr[idx6+4]=pArr[b3+1]; lpArr[idx6+5]=pArr[b3+2];
            var al=1-dd/LINE_DISTANCE;
            lcArr[idx6]=0.49*al; lcArr[idx6+1]=0.67*al; lcArr[idx6+2]=1.0*al;
            lcArr[idx6+3]=0.49*al; lcArr[idx6+4]=0.67*al; lcArr[idx6+5]=1.0*al;
            lineIdx++;
          }
        }
      }
      lines.geometry.setDrawRange(0, lineIdx * 2);
      lines.geometry.getAttribute('position').needsUpdate = true;
      lines.geometry.getAttribute('color').needsUpdate = true;
    }

    renderer.render(scene, camera);
  }
  animate();

  /* Resize */
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }, 150);
  });

})();
