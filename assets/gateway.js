/* ╔══════════════════════════════════════════════════════════════╗
   ║  dipayanbarua.com.au — The Gateway · 10-Layer 3D Stack      ║
   ║  Pure Three.js · Emissive Glow · No Post-Processing         ║
   ║  Neon Palette B · 1200 Particles · 8K-Ready                 ║
   ╚══════════════════════════════════════════════════════════════╝ */

(function () {
  'use strict';

  var container = document.getElementById('gateway-canvas');
  if (!container) return;

  /* ─── CONFIG ──────────────────────────────────────────────── */
  var LAYER_COUNT = 10;
  var PARTICLE_COUNT = 1200;
  var LINE_DISTANCE = 2.5;
  var AUTO_ROTATE_SPEED = 0.003;
  var PARALLAX_STRENGTH = 0.15;

  var DOMAINS = [
    { name: 'THE STACK FLOOR',        color: 0xA0AEC0 },
    { name: 'COMPUTE',                color: 0xFF6B00 },
    { name: 'STORAGE & DATA',         color: 0x00FFD1 },
    { name: 'NETWORKING',             color: 0x00E5FF },
    { name: 'IDENTITY & SECURITY',    color: 0x4D7DFF },
    { name: 'OPERATIONS',             color: 0x00FF88 },
    { name: 'IAC & DEVOPS',           color: 0xBF5AF2 },
    { name: 'RESILIENCE',             color: 0xFF3B3B },
    { name: 'HYBRID & WORKPLACE',     color: 0xFF2D78 },
    { name: 'AI, DATA & IOT',        color: 0xFFD60A },
  ];

  /* ─── REDUCED MOTION CHECK ────────────────────────────────── */
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(125,171,255,0.3);font-size:0.875rem;">3D visualisation paused — reduced motion enabled</div>';
    return;
  }

  /* ─── THREE.JS CHECK ──────────────────────────────────────── */
  if (typeof THREE === 'undefined') {
    console.warn('Three.js not loaded');
    return;
  }

  /* ─── SCENE ───────────────────────────────────────────────── */
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060810, 0.025);

  /* ─── CAMERA ──────────────────────────────────────────────── */
  var camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    200
  );
  camera.position.set(0, 3, 18);
  camera.lookAt(0, 1.5, 0);

  /* ─── RENDERER ────────────────────────────────────────────── */
  var renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
  renderer.toneMapping = THREE.ACESFilmicToneMapping || 4;
  renderer.toneMappingExposure = 1.4;
  if (renderer.outputEncoding !== undefined) {
    renderer.outputEncoding = THREE.sRGBEncoding || 3001;
  }
  container.appendChild(renderer.domElement);

  /* ─── LIGHTING ────────────────────────────────────────────── */
  /* Ambient — subtle overall fill */
  scene.add(new THREE.AmbientLight(0x7DABFF, 0.2));

  /* Key light — top right, Phantom Blue */
  var keyLight = new THREE.PointLight(0x7DABFF, 1.0, 60);
  keyLight.position.set(8, 12, 10);
  scene.add(keyLight);

  /* Fill light — bottom left, dimmer blue */
  var fillLight = new THREE.PointLight(0x4D7DFF, 0.4, 50);
  fillLight.position.set(-10, -5, 6);
  scene.add(fillLight);

  /* Rim light — behind, warm accent */
  var rimLight = new THREE.PointLight(0xBF5AF2, 0.3, 40);
  rimLight.position.set(0, 0, -12);
  scene.add(rimLight);

  /* ─── STACK GROUP ─────────────────────────────────────────── */
  var stackGroup = new THREE.Group();
  scene.add(stackGroup);

  var layerMeshes = [];
  var layerSpacing = 0.65;
  var totalHeight = (LAYER_COUNT - 1) * layerSpacing;
  var startY = -totalHeight / 2;

  DOMAINS.forEach(function (domain, i) {
    var color = new THREE.Color(domain.color);

    /* ── Layer slab ── */
    var geo = new THREE.BoxGeometry(4.5, 0.16, 2.2);
    var mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.45,
      metalness: 0.4,
      roughness: 0.45,
      transparent: true,
      opacity: 0.6,
    });

    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = startY + i * layerSpacing;
    stackGroup.add(mesh);
    layerMeshes.push(mesh);

    /* ── Edge wireframe ── */
    var edgeGeo = new THREE.EdgesGeometry(geo);
    var edgeMat = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5,
    });
    mesh.add(new THREE.LineSegments(edgeGeo, edgeMat));

    /* ── Domain label (canvas texture → sprite) ── */
    var canvas2d = document.createElement('canvas');
    var ctx = canvas2d.getContext('2d');
    canvas2d.width = 512;
    canvas2d.height = 64;
    ctx.clearRect(0, 0, 512, 64);

    /* Number */
    ctx.font = 'bold 24px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#' + color.getHexString();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i).padStart(2, '0'), 10, 32);

    /* Name */
    ctx.font = '500 18px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(domain.name, 50, 32);

    var tex = new THREE.CanvasTexture(canvas2d);
    tex.minFilter = THREE.LinearFilter;
    var spriteMat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
    });
    var sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(4.5, 0.56, 1);
    sprite.position.set(3.2, 0, 0);
    mesh.add(sprite);
  });

  /* Centre stack slightly above visual centre */
  stackGroup.position.y = 1.2;

  /* ─── PARTICLES ───────────────────────────────────────────── */
  var pGeo = new THREE.BufferGeometry();
  var pos = new Float32Array(PARTICLE_COUNT * 3);
  var vel = new Float32Array(PARTICLE_COUNT * 3);
  var col = new Float32Array(PARTICLE_COUNT * 3);

  var accentCol = new THREE.Color(0x7DABFF);
  var dimCol = new THREE.Color(0x2A3450);

  for (var i = 0; i < PARTICLE_COUNT; i++) {
    var i3 = i * 3;
    var r = 10 + Math.random() * 20;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);

    pos[i3]     = r * Math.sin(phi) * Math.cos(theta);
    pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i3 + 2] = r * Math.cos(phi);

    vel[i3]     = (Math.random() - 0.5) * 0.003;
    vel[i3 + 1] = (Math.random() - 0.5) * 0.003;
    vel[i3 + 2] = (Math.random() - 0.5) * 0.003;

    var c = Math.random() > 0.65 ? accentCol : dimCol;
    col[i3]     = c.r;
    col[i3 + 1] = c.g;
    col[i3 + 2] = c.b;
  }

  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  var pMat = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  var particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* ─── CONNECTING LINES ────────────────────────────────────── */
  var maxLines = 180;
  var lGeo = new THREE.BufferGeometry();
  var lPos = new Float32Array(maxLines * 6);
  var lCol = new Float32Array(maxLines * 6);
  lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3));
  lGeo.setAttribute('color', new THREE.BufferAttribute(lCol, 3));
  lGeo.setDrawRange(0, 0);

  var lMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  var lines = new THREE.LineSegments(lGeo, lMat);
  scene.add(lines);

  /* ─── MOUSE ───────────────────────────────────────────────── */
  var mouse = { x: 0, y: 0 };
  var targetRot = { x: 0, y: 0 };
  var isDragging = false;
  var dragStart = { x: 0, y: 0 };
  var dragRot = { x: 0, y: 0 };

  container.addEventListener('mousemove', function (e) {
    var rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    if (isDragging) {
      dragRot.y = (e.clientX - dragStart.x) * 0.005;
      dragRot.x = (e.clientY - dragStart.y) * 0.003;
    }
  }, { passive: true });

  container.addEventListener('mousedown', function (e) {
    isDragging = true;
    dragStart.x = e.clientX - dragRot.y / 0.005;
    dragStart.y = e.clientY - dragRot.x / 0.003;
  });

  document.addEventListener('mouseup', function () { isDragging = false; });

  container.addEventListener('touchmove', function (e) {
    if (e.touches.length === 1) {
      var t = e.touches[0];
      var rect = container.getBoundingClientRect();
      mouse.x = ((t.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((t.clientY - rect.top) / rect.height) * 2 + 1;
    }
  }, { passive: true });

  /* ─── ANIMATION ───────────────────────────────────────────── */
  var clock = new THREE.Clock();
  var autoAngle = 0;
  var frame = 0;

  function animate() {
    requestAnimationFrame(animate);
    var elapsed = clock.getElapsedTime();
    frame++;

    /* Auto-rotate */
    autoAngle += AUTO_ROTATE_SPEED;

    /* Stack rotation = auto + parallax + drag */
    targetRot.x = mouse.y * PARALLAX_STRENGTH + dragRot.x;
    targetRot.y = autoAngle + mouse.x * PARALLAX_STRENGTH + dragRot.y;

    stackGroup.rotation.y += (targetRot.y - stackGroup.rotation.y) * 0.03;
    stackGroup.rotation.x += (targetRot.x - stackGroup.rotation.x) * 0.03;

    /* Layer float animation */
    for (var li = 0; li < layerMeshes.length; li++) {
      var floatY = Math.sin(elapsed * 0.5 + li * 0.4) * 0.03;
      layerMeshes[li].position.y = startY + li * layerSpacing + floatY;
    }

    /* Subtle emissive pulse on layers */
    for (var ei = 0; ei < layerMeshes.length; ei++) {
      var pulse = 0.35 + Math.sin(elapsed * 0.8 + ei * 0.6) * 0.1;
      layerMeshes[ei].material.emissiveIntensity = pulse;
    }

    /* Move particles */
    var pArr = pGeo.getAttribute('position').array;
    for (var pi = 0; pi < PARTICLE_COUNT; pi++) {
      var p3 = pi * 3;
      pArr[p3]     += vel[p3];
      pArr[p3 + 1] += vel[p3 + 1];
      pArr[p3 + 2] += vel[p3 + 2];

      var dist = Math.sqrt(pArr[p3] * pArr[p3] + pArr[p3+1] * pArr[p3+1] + pArr[p3+2] * pArr[p3+2]);
      if (dist > 30) {
        pArr[p3]     *= 0.4;
        pArr[p3 + 1] *= 0.4;
        pArr[p3 + 2] *= 0.4;
      }
    }
    pGeo.getAttribute('position').needsUpdate = true;

    /* Slow cloud rotation */
    particles.rotation.y += 0.0002;
    particles.rotation.x += 0.0001;

    /* Update connecting lines every 3 frames */
    if (frame % 3 === 0) {
      var lineIdx = 0;
      var lpArr = lGeo.getAttribute('position').array;
      var lcArr = lGeo.getAttribute('color').array;
      var step = Math.max(1, Math.floor(PARTICLE_COUNT / 120));

      for (var a = 0; a < PARTICLE_COUNT && lineIdx < maxLines; a += step) {
        for (var b = a + step; b < PARTICLE_COUNT && lineIdx < maxLines; b += step) {
          var a3 = a * 3, b3 = b * 3;
          var dx = pArr[a3] - pArr[b3];
          var dy = pArr[a3+1] - pArr[b3+1];
          var dz = pArr[a3+2] - pArr[b3+2];
          var d = Math.sqrt(dx*dx + dy*dy + dz*dz);

          if (d < LINE_DISTANCE) {
            var idx6 = lineIdx * 6;
            lpArr[idx6]     = pArr[a3];
            lpArr[idx6 + 1] = pArr[a3+1];
            lpArr[idx6 + 2] = pArr[a3+2];
            lpArr[idx6 + 3] = pArr[b3];
            lpArr[idx6 + 4] = pArr[b3+1];
            lpArr[idx6 + 5] = pArr[b3+2];

            var alpha = 1 - d / LINE_DISTANCE;
            lcArr[idx6]     = 0.49 * alpha;
            lcArr[idx6 + 1] = 0.67 * alpha;
            lcArr[idx6 + 2] = 1.0  * alpha;
            lcArr[idx6 + 3] = 0.49 * alpha;
            lcArr[idx6 + 4] = 0.67 * alpha;
            lcArr[idx6 + 5] = 1.0  * alpha;

            lineIdx++;
          }
        }
      }
      lGeo.setDrawRange(0, lineIdx * 2);
      lGeo.getAttribute('position').needsUpdate = true;
      lGeo.getAttribute('color').needsUpdate = true;
    }

    /* Render */
    renderer.render(scene, camera);
  }

  animate();

  /* ─── RESIZE ──────────────────────────────────────────────── */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var w = container.clientWidth;
      var h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
    }, 100);
  });

})();
