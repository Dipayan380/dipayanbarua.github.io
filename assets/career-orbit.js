/* ╔══════════════════════════════════════════════════════════════╗
   ║  Cloud Constellation — Career Orbit Diagram                 ║
   ║  Reusable live 3D competency map for every role page.       ║
   ║  Reads window.CAREER_ORBIT_CONFIG — set that per-page and   ║
   ║  this file needs zero edits to power all 16 role pages.     ║
   ╚══════════════════════════════════════════════════════════════╝ */

(function () {
  'use strict';

  var cfg = window.CAREER_ORBIT_CONFIG;
  var container = cfg && document.getElementById(cfg.mount || 'career-orbit-canvas');
  if (!container || typeof THREE === 'undefined' || !cfg || !cfg.nodes || !cfg.nodes.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    /* Accessible fallback: no 3D, the roadmap list below the diagram
       already carries every link, so nothing is lost — just the
       ambient motion. */
    container.style.background = 'radial-gradient(circle at 50% 45%, rgba(125,171,255,0.08) 0%, transparent 70%)';
    return;
  }

  var isMobile = window.innerWidth < 768;

  /* ─── SCENE ───────────────────────────────────────────────── */
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 2.4, isMobile ? 12 : 10);

  var renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 2 : 3));
  container.appendChild(renderer.domElement);

  var controls = null;
  if (THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI / 3;
    controls.maxPolarAngle = Math.PI / 1.7;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.target.set(0, 0.2, 0);
    controls.update();
  }

  scene.add(new THREE.AmbientLight(0x7DABFF, 0.35));
  var key = new THREE.PointLight(0x7DABFF, 1.1, 40);
  key.position.set(6, 8, 6);
  scene.add(key);

  /* ─── CORE — the role itself ─────────────────────────────── */
  var coreGeo = new THREE.IcosahedronGeometry(0.62, 1);
  var coreMat = new THREE.MeshStandardMaterial({
    color: 0x7DABFF, emissive: 0x7DABFF, emissiveIntensity: 0.55,
    metalness: 0.5, roughness: 0.3, transparent: true, opacity: 0.9,
  });
  var core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);
  var coreEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(coreGeo),
    new THREE.LineBasicMaterial({ color: 0xE8ECF4, transparent: true, opacity: 0.35 })
  );
  core.add(coreEdges);

  /* ─── ORBIT NODES — one per domain this role touches ─────── */
  var radius = isMobile ? 3.1 : 3.6;
  var nodeMeshes = [];
  var hitMeshes = [];
  var lines = [];

  cfg.nodes.forEach(function (n, i) {
    var angle = (i / cfg.nodes.length) * Math.PI * 2;
    var color = new THREE.Color(n.color || 0x7DABFF);

    var geo = new THREE.SphereGeometry(0.26, 24, 24);
    var mat = new THREE.MeshStandardMaterial({
      color: color, emissive: color, emissiveIntensity: 0.6,
      metalness: 0.4, roughness: 0.4, transparent: true, opacity: 0.92,
    });
    var node = new THREE.Mesh(geo, mat);
    node.position.set(Math.cos(angle) * radius, Math.sin(i * 1.7) * 0.5, Math.sin(angle) * radius);
    node.userData = { label: n.label, path: n.path, baseY: node.position.y, angle: angle, speed: 0.08 + (i % 3) * 0.015 };
    scene.add(node);
    nodeMeshes.push(node);

    /* Padded invisible hit target — same forgiving-tap pattern as the homepage stack */
    var hitGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    var hit = new THREE.Mesh(hitGeo, hitMat);
    hit.userData = node.userData;
    node.add(hit);
    hitMeshes.push(hit);

    /* Spoke line back to the core */
    var lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), node.position.clone()]);
    var lineMat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.28 });
    var line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);
    lines.push(line);

    /* Label sprite */
    var c = document.createElement('canvas');
    var ctx = c.getContext('2d');
    c.width = 320; c.height = 56;
    ctx.font = '600 26px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#' + color.getHexString();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.label, 160, 28);
    var tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.95, depthTest: false }));
    sprite.scale.set(1.9, 0.34, 1);
    sprite.position.set(0, 0.5, 0);
    node.add(sprite);
  });

  /* ─── AMBIENT PARTICLES (sparse — this is a diagram, not a hero) ── */
  var PARTICLE_COUNT = isMobile ? 90 : 220;
  var pGeo = new THREE.BufferGeometry();
  var pos = new Float32Array(PARTICLE_COUNT * 3);
  for (var i = 0; i < PARTICLE_COUNT; i++) {
    var r = 5 + Math.random() * 6;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
    pos[i * 3 + 2] = r * Math.cos(phi);
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0x2A3450, size: 0.03, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(particles);

  /* ─── TOOLTIP ─────────────────────────────────────────────── */
  var tooltip = document.createElement('div');
  tooltip.style.cssText = 'position:absolute;pointer-events:none;opacity:0;transition:opacity 0.2s;z-index:20;background:rgba(10,14,24,0.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(125,171,255,0.3);border-radius:8px;padding:6px 12px;font-family:Inter,system-ui,sans-serif;font-size:12px;color:#F0F3F9;white-space:nowrap;';
  container.style.position = 'relative';
  container.appendChild(tooltip);

  /* ─── INTERACTION — same robust pattern as the homepage stack ── */
  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2(-99, -99);
  var hovered = null;
  var downX = 0, downY = 0;

  container.addEventListener('mousemove', function (e) {
    var rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    tooltip.style.left = (e.clientX - rect.left + 14) + 'px';
    tooltip.style.top = (e.clientY - rect.top - 8) + 'px';
  }, { passive: true });

  container.style.touchAction = 'none';
  container.addEventListener('pointerdown', function (e) { downX = e.clientX; downY = e.clientY; }, { passive: true });
  container.addEventListener('pointerup', function (e) {
    var moved = Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY);
    if (moved > 8) return;
    var rect = container.getBoundingClientRect();
    var v = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(v, camera);
    var hits = raycaster.intersectObjects(hitMeshes);
    if (hits.length > 0 && hits[0].object.userData.path) {
      window.location.href = hits[0].object.userData.path;
    }
  });

  /* ─── ANIMATE ─────────────────────────────────────────────── */
  var clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();
    if (controls) controls.update();

    core.rotation.y += 0.003;
    core.rotation.x += 0.0012;

    nodeMeshes.forEach(function (n, i) {
      n.position.y = n.userData.baseY + Math.sin(t * n.userData.speed * 6 + i) * 0.18;
      lines[i].geometry.setFromPoints([new THREE.Vector3(0, 0, 0), n.position.clone()]);
      lines[i].geometry.attributes.position.needsUpdate = true;
    });

    raycaster.setFromCamera(mouse, camera);
    var hits = raycaster.intersectObjects(hitMeshes);
    if (hits.length > 0) {
      var hit = hits[0].object;
      if (hovered !== hit) {
        hovered = hit;
        tooltip.innerHTML = hit.userData.label + ' <span style="color:#727E94;">— click to explore</span>';
        tooltip.style.opacity = '1';
      }
      container.style.cursor = 'pointer';
    } else if (hovered) {
      hovered = null;
      tooltip.style.opacity = '0';
      container.style.cursor = 'grab';
    }

    particles.rotation.y += 0.0004;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', function () {
    var w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
})();
