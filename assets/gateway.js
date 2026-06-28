/* ╔══════════════════════════════════════════════════════════════╗
   ║  dipayanbarua.com.au — The Gateway · 10-Layer 3D Stack      ║
   ║  OrbitControls · Raycaster · Role Highlighting              ║
   ║  Full-Page Canvas · Emissive Glow · 1200 Particles          ║
   ╚══════════════════════════════════════════════════════════════╝ */

(function () {
  'use strict';

  var container = document.getElementById('gateway-canvas');
  if (!container || typeof THREE === 'undefined') return;

  /* ─── REDUCED MOTION ──────────────────────────────────────── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    container.style.background = '#060810';
    return;
  }

  /* ─── CONFIG ──────────────────────────────────────────────── */
  var PARTICLE_COUNT = 1200;
  var LINE_DISTANCE = 2.5;

  var DOMAINS = [
    { name: 'THE STACK FLOOR',     color: 0xA0AEC0, clusters: 11, path: '/0-stack-floor/' },
    { name: 'COMPUTE',             color: 0xFF6B00, clusters: 5,  path: '/1-compute/' },
    { name: 'STORAGE & DATA',      color: 0x00FFD1, clusters: 5,  path: '/2-storage/' },
    { name: 'NETWORKING',          color: 0x00E5FF, clusters: 5,  path: '/3-networking/' },
    { name: 'IDENTITY & SECURITY', color: 0x4D7DFF, clusters: 6,  path: '/4-identity-security/' },
    { name: 'OPERATIONS',          color: 0x00FF88, clusters: 5,  path: '/5-operations/' },
    { name: 'IAC & DEVOPS',        color: 0xBF5AF2, clusters: 5,  path: '/6-iac-devops/' },
    { name: 'RESILIENCE',          color: 0xFF3B3B, clusters: 4,  path: '/7-resilience/' },
    { name: 'HYBRID & WORKPLACE',  color: 0xFF2D78, clusters: 6,  path: '/8-hybrid-workplace/' },
    { name: 'AI, DATA & IOT',     color: 0xFFD60A, clusters: 4,  path: '/9-ai-iot/' },
  ];

  /* Role → domain index mapping */
  var ROLES = {
    'cloud-engineer':       [0,1,2,3,4,5,6,7,8],
    'solutions-architect':  [1,2,3,4,5,6,7,8,9],
    'devops-engineer':      [0,1,4,5,6,8],
    'security-engineer':    [0,3,4],
    'sre':                  [0,1,3,5,6,7],
    'iam-engineer':         [0,4],
    'network-engineer':     [0,3],
    'endpoint-engineer':    [0,5,8],
    'systems-admin':        [0,1,2,5,6,8],
    'it-support':           [0,8],
    'data-engineer':        [2,9],
    'ai-ml-engineer':       [2,9],
    'dba':                  [2],
    'governance':           [3,4,5,7],
    'backup-dr':            [7],
    'cloud-infra':          [1,2,3,5,6,7],
  };

  /* ─── SCENE ───────────────────────────────────────────────── */
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060810, 0.018);

  /* ─── CAMERA ──────────────────────────────────────────────── */
  var camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 200);
  camera.position.set(0, 4, 16);

  /* ─── RENDERER ────────────────────────────────────────────── */
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
  renderer.toneMapping = THREE.ACESFilmicToneMapping || 4;
  renderer.toneMappingExposure = 1.5;
  if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding || 3001;
  container.appendChild(renderer.domElement);

  /* ─── ORBIT CONTROLS ──────────────────────────────────────── */
  var controls = null;
  if (THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 8;
    controls.maxDistance = 30;
    controls.target.set(0, 1.5, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;
    controls.update();
  }

  /* ─── LIGHTING ────────────────────────────────────────────── */
  scene.add(new THREE.AmbientLight(0x7DABFF, 0.2));
  var keyLight = new THREE.PointLight(0x7DABFF, 1.2, 60);
  keyLight.position.set(8, 14, 10);
  scene.add(keyLight);
  var fillLight = new THREE.PointLight(0x4D7DFF, 0.4, 50);
  fillLight.position.set(-10, -5, 6);
  scene.add(fillLight);
  var rimLight = new THREE.PointLight(0xBF5AF2, 0.3, 40);
  rimLight.position.set(0, 0, -12);
  scene.add(rimLight);

  /* ─── STACK ───────────────────────────────────────────────── */
  var stackGroup = new THREE.Group();
  scene.add(stackGroup);

  var layerMeshes = [];
  var layerSpacing = 0.7;
  var totalHeight = 9 * layerSpacing;
  var startY = -totalHeight / 2;

  DOMAINS.forEach(function (d, i) {
    var color = new THREE.Color(d.color);

    /* Slab — bigger than before */
    var geo = new THREE.BoxGeometry(5.5, 0.18, 2.8);
    var mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.4,
      metalness: 0.4,
      roughness: 0.45,
      transparent: true,
      opacity: 0.6,
    });

    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = startY + i * layerSpacing;
    mesh.userData = { domainIndex: i, domain: d, baseEmissive: 0.4, baseOpacity: 0.6 };
    stackGroup.add(mesh);
    layerMeshes.push(mesh);

    /* Edge wireframe */
    var edgeGeo = new THREE.EdgesGeometry(geo);
    var edgeMat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.5 });
    mesh.add(new THREE.LineSegments(edgeGeo, edgeMat));

    /* Label sprite */
    var canvas2d = document.createElement('canvas');
    var ctx = canvas2d.getContext('2d');
    canvas2d.width = 512;
    canvas2d.height = 64;
    ctx.clearRect(0, 0, 512, 64);
    ctx.font = 'bold 24px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#' + color.getHexString();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i).padStart(2, '0'), 10, 32);
    ctx.font = '500 18px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(d.name, 50, 32);

    var tex = new THREE.CanvasTexture(canvas2d);
    tex.minFilter = THREE.LinearFilter;
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.9, depthTest: false }));
    sprite.scale.set(5, 0.62, 1);
    sprite.position.set(3.8, 0, 0);
    mesh.add(sprite);
  });

  stackGroup.position.y = 1.5;

  /* ─── TOOLTIP (HTML overlay) ──────────────────────────────── */
  var tooltip = document.createElement('div');
  tooltip.className = 'stack-tooltip';
  tooltip.style.cssText = 'position:absolute;pointer-events:none;opacity:0;transition:opacity 0.2s;z-index:100;background:rgba(10,14,24,0.9);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:0.5px solid rgba(125,171,255,0.2);border-radius:8px;padding:8px 14px;font-family:Inter,system-ui,sans-serif;white-space:nowrap;';
  container.appendChild(tooltip);

  /* ─── RAYCASTER (hover + click) ───────────────────────────── */
  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();
  var hoveredLayer = null;

  container.addEventListener('mousemove', function (e) {
    var rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    /* Position tooltip */
    tooltip.style.left = (e.clientX - rect.left + 16) + 'px';
    tooltip.style.top = (e.clientY - rect.top - 10) + 'px';
  }, { passive: true });

  container.addEventListener('click', function () {
    if (hoveredLayer && hoveredLayer.userData.domain) {
      window.location.href = hoveredLayer.userData.domain.path;
    }
  });

  /* ─── ROLE HIGHLIGHTING ───────────────────────────────────── */
  var activeRole = null;

  window.setStackRole = function (roleKey) {
    if (activeRole === roleKey) {
      activeRole = null;
      layerMeshes.forEach(function (m) {
        m.userData.targetOpacity = m.userData.baseOpacity;
        m.userData.targetEmissive = m.userData.baseEmissive;
      });
      return;
    }

    activeRole = roleKey;
    var activeDomains = ROLES[roleKey] || [];

    layerMeshes.forEach(function (m) {
      var idx = m.userData.domainIndex;
      if (activeDomains.indexOf(idx) >= 0) {
        m.userData.targetOpacity = 0.85;
        m.userData.targetEmissive = 0.7;
      } else {
        m.userData.targetOpacity = 0.12;
        m.userData.targetEmissive = 0.05;
      }
    });
  };

  /* Initialise targets */
  layerMeshes.forEach(function (m) {
    m.userData.targetOpacity = m.userData.baseOpacity;
    m.userData.targetEmissive = m.userData.baseEmissive;
  });

  /* ─── PARTICLES ───────────────────────────────────────────── */
  var pGeo = new THREE.BufferGeometry();
  var pos = new Float32Array(PARTICLE_COUNT * 3);
  var vel = new Float32Array(PARTICLE_COUNT * 3);
  var col = new Float32Array(PARTICLE_COUNT * 3);
  var accentCol = new THREE.Color(0x7DABFF);
  var dimCol = new THREE.Color(0x2A3450);

  for (var i = 0; i < PARTICLE_COUNT; i++) {
    var i3 = i * 3;
    var r = 10 + Math.random() * 22;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    pos[i3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i3+1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i3+2] = r * Math.cos(phi);
    vel[i3] = (Math.random() - 0.5) * 0.003;
    vel[i3+1] = (Math.random() - 0.5) * 0.003;
    vel[i3+2] = (Math.random() - 0.5) * 0.003;
    var c = Math.random() > 0.65 ? accentCol : dimCol;
    col[i3] = c.r; col[i3+1] = c.g; col[i3+2] = c.b;
  }

  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  var particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.045, vertexColors: true, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  scene.add(particles);

  /* ─── CONNECTING LINES ────────────────────────────────────── */
  var maxLines = 180;
  var lGeo = new THREE.BufferGeometry();
  var lPos = new Float32Array(maxLines * 6);
  var lCol = new Float32Array(maxLines * 6);
  lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3));
  lGeo.setAttribute('color', new THREE.BufferAttribute(lCol, 3));
  lGeo.setDrawRange(0, 0);
  var lines = new THREE.LineSegments(lGeo, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.2,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(lines);

  /* ─── ANIMATION ───────────────────────────────────────────── */
  var clock = new THREE.Clock();
  var frame = 0;

  function animate() {
    requestAnimationFrame(animate);
    var elapsed = clock.getElapsedTime();
    frame++;

    if (controls) controls.update();

    /* Layer float + emissive pulse */
    for (var li = 0; li < layerMeshes.length; li++) {
      var m = layerMeshes[li];
      var floatY = Math.sin(elapsed * 0.5 + li * 0.4) * 0.04;
      m.position.y = startY + li * layerSpacing + floatY;

      /* Smooth transition to target opacity/emissive */
      var tO = m.userData.targetOpacity;
      var tE = m.userData.targetEmissive;
      m.material.opacity += (tO - m.material.opacity) * 0.08;
      var pulse = tE + Math.sin(elapsed * 0.8 + li * 0.6) * 0.06;
      m.material.emissiveIntensity += (pulse - m.material.emissiveIntensity) * 0.08;
    }

    /* Raycaster — hover detection */
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(layerMeshes);

    if (intersects.length > 0) {
      var hit = intersects[0].object;
      if (hoveredLayer !== hit) {
        /* Restore previous */
        if (hoveredLayer && !activeRole) {
          hoveredLayer.userData.targetEmissive = hoveredLayer.userData.baseEmissive;
        }
        hoveredLayer = hit;
        /* Highlight current */
        if (!activeRole) {
          hoveredLayer.userData.targetEmissive = 0.8;
        }
        /* Update tooltip */
        var d = hit.userData.domain;
        tooltip.innerHTML = '<span style="color:#' + new THREE.Color(d.color).getHexString() + ';font-weight:600;font-size:13px;">' + d.name + '</span><br><span style="color:#8892A4;font-size:11px;">' + d.clusters + ' clusters — click to enter</span>';
        tooltip.style.opacity = '1';
      }
      container.style.cursor = 'pointer';
    } else {
      if (hoveredLayer && !activeRole) {
        hoveredLayer.userData.targetEmissive = hoveredLayer.userData.baseEmissive;
      }
      hoveredLayer = null;
      tooltip.style.opacity = '0';
      container.style.cursor = 'grab';
    }

    /* Particles */
    var pArr = pGeo.getAttribute('position').array;
    for (var pi = 0; pi < PARTICLE_COUNT; pi++) {
      var p3 = pi * 3;
      pArr[p3] += vel[p3]; pArr[p3+1] += vel[p3+1]; pArr[p3+2] += vel[p3+2];
      var dist = Math.sqrt(pArr[p3]*pArr[p3] + pArr[p3+1]*pArr[p3+1] + pArr[p3+2]*pArr[p3+2]);
      if (dist > 32) { pArr[p3] *= 0.4; pArr[p3+1] *= 0.4; pArr[p3+2] *= 0.4; }
    }
    pGeo.getAttribute('position').needsUpdate = true;
    particles.rotation.y += 0.0002;
    particles.rotation.x += 0.0001;

    /* Connecting lines every 3 frames */
    if (frame % 3 === 0) {
      var lineIdx = 0;
      var lpArr = lGeo.getAttribute('position').array;
      var lcArr = lGeo.getAttribute('color').array;
      var step = Math.max(1, Math.floor(PARTICLE_COUNT / 120));
      for (var a = 0; a < PARTICLE_COUNT && lineIdx < maxLines; a += step) {
        for (var b = a + step; b < PARTICLE_COUNT && lineIdx < maxLines; b += step) {
          var a3 = a*3, b3 = b*3;
          var dx = pArr[a3]-pArr[b3], dy = pArr[a3+1]-pArr[b3+1], dz = pArr[a3+2]-pArr[b3+2];
          var dd = Math.sqrt(dx*dx+dy*dy+dz*dz);
          if (dd < LINE_DISTANCE) {
            var idx6 = lineIdx * 6;
            lpArr[idx6]=pArr[a3]; lpArr[idx6+1]=pArr[a3+1]; lpArr[idx6+2]=pArr[a3+2];
            lpArr[idx6+3]=pArr[b3]; lpArr[idx6+4]=pArr[b3+1]; lpArr[idx6+5]=pArr[b3+2];
            var al = 1 - dd/LINE_DISTANCE;
            lcArr[idx6]=0.49*al; lcArr[idx6+1]=0.67*al; lcArr[idx6+2]=1.0*al;
            lcArr[idx6+3]=0.49*al; lcArr[idx6+4]=0.67*al; lcArr[idx6+5]=1.0*al;
            lineIdx++;
          }
        }
      }
      lGeo.setDrawRange(0, lineIdx * 2);
      lGeo.getAttribute('position').needsUpdate = true;
      lGeo.getAttribute('color').needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  animate();

  /* ─── RESIZE ──────────────────────────────────────────────── */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
    }, 100);
  });

})();
