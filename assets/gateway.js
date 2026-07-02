/* ╔══════════════════════════════════════════════════════════════╗
   ║  Cloud Constellation — The Gateway · 10-Layer 3D Stack      ║
   ║  OrbitControls · Raycaster · Role Highlighting              ║
   ║  Full-Page Canvas · Emissive Glow · 1200 Particles          ║
   ║  Session 3 — camera dive transitions                        ║
   ╚══════════════════════════════════════════════════════════════╝ */

(function () {
  'use strict';

  var container = document.getElementById('gateway-canvas');
  if (!container || typeof THREE === 'undefined') return;

  /* ─── REDUCED MOTION ──────────────────────────────────────── */
  /* IMPORTANT: this must only tone down decorative animation
     (autorotate, idle float, particle drift, the flashy fly-through
     dive), never skip building the scene itself — the stack still
     needs to render and stay clickable for anyone with this
     preference on. An earlier version of this file bailed out
     completely here, which silently killed the whole homepage. */
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── MOBILE DETECTION ────────────────────────────────────── */
  var isMobile = window.innerWidth < 768;

  /* ─── CONFIG ──────────────────────────────────────────────── */
  var PARTICLE_COUNT = isMobile ? 450 : 1200;
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
  camera.position.set(0, 5, 17);

  /* ─── RENDERER ────────────────────────────────────────────── */
  var renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 2 : 3));
  renderer.toneMapping = THREE.ACESFilmicToneMapping || 4;
  renderer.toneMappingExposure = 1.5;
  if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding || 3001;
  container.appendChild(renderer.domElement);

  /* ─── ORBIT CONTROLS ──────────────────────────────────────── */
  var controls = null;
  if (THREE.OrbitControls) {
    /* Attach to stack-zone (center 50%) so scroll works outside it */
    var controlTarget = document.getElementById('stack-zone') || renderer.domElement;
    controls = new THREE.OrbitControls(camera, controlTarget);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 8;
    controls.maxDistance = 30;
    controls.target.set(0, 1.5, 0);
    controls.autoRotate = !reducedMotion;
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
  var hitMeshes = [];   // padded, invisible tap targets — see below
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

    /* Padded invisible hitbox — the real slab is only 0.18 units tall,
       far too thin to click/tap reliably. This is 0.6 tall (still less
       than the 0.7 layer spacing, so neighbours never overlap) and wider
       on X/Z, giving mouse and finger input a generous, forgiving target
       while the visible slab stays exactly as designed. Shares userData
       by reference so hover/emissive/dive logic needs zero other changes. */
    var hitGeo = new THREE.BoxGeometry(6.4, 0.6, 3.4);
    var hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    var hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.userData = mesh.userData;
    mesh.add(hitMesh);
    hitMeshes.push(hitMesh);

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

  /* ─── CAMERA DIVE TRANSITION ──────────────────────────────── */
  /* Click a layer → camera accelerates through the particle tunnel,
     punches through the slab, colour-washes to the domain accent, then
     hands off to the domain page (which blooms in from the same colour
     via the inbound fade in app.js). */

  var DIVE_DURATION = 1100;      // ms
  var BASE_FOV = camera.fov;     // 50
  var MAX_FOV = 92;              // speed-line punch
  var diving = false;            // read by animate()
  var reversing = false;         // true while flying back OUT of a dive (bfcache return)
  var warp = 0;                  // 0..1 particle amplification, read by animate()
  var navigated = false;

  var HOME_POS = new THREE.Vector3(0, 5, 17);
  var HOME_LOOK = new THREE.Vector3(0, 1.5, 0);

  var diveStart = 0;
  var camStart = new THREE.Vector3();
  var camEnd = new THREE.Vector3();
  var lookStart = new THREE.Vector3();
  var lookEnd = new THREE.Vector3();
  var lookCur = new THREE.Vector3();
  var diveMesh = null;
  var divePath = null;
  var diveHex = '#7DABFF';

  /* Easing */
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function easeInCubic(t) { return t * t * t; }
  function easeInQuart(t) { return t * t * t * t; }
  function easeInQuint(t) { return t * t * t * t * t; }
  function easeOutQuad(t) { return 1 - (1 - t) * (1 - t); }
  function smoothstep(a, b, x) {
    var t = clamp01((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  }

  /* Full-screen warp/colour overlay (built once, reused) */
  function buildDiveGradient(hex) {
    return 'radial-gradient(circle at 50% 45%, #ffffff 0%, ' + hex + ' 32%, rgba(4,6,14,0.96) 100%)';
  }
  var diveOverlay = document.createElement('div');
  diveOverlay.setAttribute('aria-hidden', 'true');
  diveOverlay.style.cssText = 'position:fixed;inset:0;z-index:100000;pointer-events:none;opacity:0;will-change:opacity;';
  document.body.appendChild(diveOverlay);

  function startDive(mesh) {
    if (diving || !mesh || !mesh.userData.domain) return;
    diving = true;
    navigated = false;
    diveStart = performance.now();
    diveMesh = mesh;
    divePath = mesh.userData.domain.path;
    diveHex = '#' + new THREE.Color(mesh.userData.domain.color).getHexString();

    /* Freeze orbit input */
    if (controls) { controls.enabled = false; controls.autoRotate = false; }
    tooltip.style.opacity = '0';
    container.style.cursor = 'default';

    /* Camera path: from where we are, straight through the slab and out
       the far side (overshoot along the view axis into the tunnel). */
    camStart.copy(camera.position);
    var P = mesh.getWorldPosition(new THREE.Vector3());
    var dir = P.clone().sub(camStart).normalize();
    camEnd.copy(P).addScaledVector(dir, 2.4);        // punch through
    lookStart.copy(controls ? controls.target : new THREE.Vector3(0, 1.5, 0));
    lookEnd.copy(P).addScaledVector(dir, 8);          // aim down the tunnel

    /* Spotlight the chosen layer, recede the rest for tunnel focus.
       Compare by domainIndex, not object identity — `mesh` here is
       whichever object the raycaster hit (the padded hitbox), while
       this loop walks the *visible* slabs. */
    var chosenIndex = mesh.userData.domainIndex;
    layerMeshes.forEach(function (m) {
      if (m.userData.domainIndex === chosenIndex) {
        m.userData.targetEmissive = 1.6;
        m.userData.targetOpacity = 1.0;
      } else {
        m.userData.targetEmissive = 0.04;
        m.userData.targetOpacity = 0.06;
      }
    });

    /* Prime the overlay + arm the inbound bloom on the destination page */
    diveOverlay.style.background = buildDiveGradient(diveHex);
    try {
      sessionStorage.setItem('cc-dive', JSON.stringify({ c: diveHex, ts: Date.now() }));
    } catch (e) {}
  }

  function updateDive(now) {
    var duration = reducedMotion ? 380 : DIVE_DURATION;
    var t = clamp01((now - diveStart) / duration);

    if (reducedMotion) {
      /* No camera movement, no FOV punch — just a clean colour fade.
         This is the motion reduced-motion is meant to prevent, so we
         skip it entirely rather than tone it down partway. */
      diveOverlay.style.opacity = String(easeOutQuad(t));
      if (!navigated && t >= 1) {
        navigated = true;
        window.location.href = divePath;
      }
      return;
    }

    /* Position accelerates (easeInCubic); aim locks onto the slab fast */
    camera.position.lerpVectors(camStart, camEnd, easeInCubic(t));
    lookCur.lerpVectors(lookStart, lookEnd, easeOutQuad(t));
    camera.lookAt(lookCur);

    /* FOV punch in the back half → speed-line rush */
    var fovT = t < 0.45 ? 0 : easeInQuint((t - 0.45) / 0.55);
    camera.fov = BASE_FOV + (MAX_FOV - BASE_FOV) * fovT;
    camera.updateProjectionMatrix();

    /* Particle amplification (read in the particle block) */
    warp = easeInQuart(t);

    /* Colour wash slams in over the final ~40% */
    diveOverlay.style.opacity = String(smoothstep(0.58, 1.0, t));

    /* Hand off at peak — the new page load hides behind the flash */
    if (!navigated && t >= 0.985) {
      navigated = true;
      window.location.href = divePath;
    }
  }

  /* ─── REVERSE DIVE — flying back OUT, on return via Back button ──
     The browser's bfcache restores this page as a frozen snapshot
     exactly as it looked the instant we navigated away: mid-flash,
     camera punched through the slab, diveOverlay near-opaque. Rather
     than just snapping that back to normal, animate it in reverse —
     camera retreats from the punched-through position back to the
     resting pose while the colour wash fades out, so returning feels
     like flying back out of the tunnel instead of a jarring reset. */
  var reverseStart = 0;
  var reverseCamFrom = new THREE.Vector3();
  var reverseLookFrom = new THREE.Vector3();

  function startReverseDive() {
    reversing = true;
    diving = false;
    navigated = false;
    reverseStart = performance.now();
    reverseCamFrom.copy(camera.position);
    reverseLookFrom.copy(lookCur);
    tooltip.style.opacity = '0';
  }

  function updateReverseDive(now) {
    var duration = reducedMotion ? 380 : DIVE_DURATION;
    var t = clamp01((now - reverseStart) / duration);

    if (reducedMotion) {
      diveOverlay.style.opacity = String(1 - easeOutQuad(t));
      layerMeshes.forEach(function (m) {
        m.userData.targetEmissive = m.userData.baseEmissive;
        m.userData.targetOpacity = m.userData.baseOpacity;
      });
      if (t >= 1) {
        reversing = false;
        diveOverlay.style.opacity = '0';
        camera.position.copy(HOME_POS);
        camera.lookAt(HOME_LOOK);
        if (controls) {
          controls.target.copy(HOME_LOOK);
          controls.enabled = true;
          controls.autoRotate = !reducedMotion;
          controls.update();
        }
        container.style.cursor = 'grab';
      }
      return;
    }

    var e = easeOutQuad(t);

    camera.position.lerpVectors(reverseCamFrom, HOME_POS, e);
    lookCur.lerpVectors(reverseLookFrom, HOME_LOOK, e);
    camera.lookAt(lookCur);

    camera.fov = BASE_FOV + (MAX_FOV - BASE_FOV) * (1 - easeInQuart(t));
    camera.updateProjectionMatrix();

    warp = 1 - easeInQuart(t);
    diveOverlay.style.opacity = String(1 - smoothstep(0, 0.55, t));

    /* Layers ease back to their normal resting glow together */
    layerMeshes.forEach(function (m) {
      m.userData.targetEmissive = m.userData.baseEmissive;
      m.userData.targetOpacity = m.userData.baseOpacity;
    });

    if (t >= 1) {
      reversing = false;
      diveOverlay.style.opacity = '0';
      camera.fov = BASE_FOV;
      camera.updateProjectionMatrix();
      if (controls) {
        controls.target.copy(HOME_LOOK);
        controls.enabled = true;
        controls.autoRotate = !reducedMotion;
        controls.update();
      }
      container.style.cursor = 'grab';
    }
  }

  /* If this page is being restored from bfcache mid-dive (the normal
     case — we navigate away right at the peak of the flash), play the
     reverse animation instead of leaving a frozen, stuck-looking
     overlay on screen. A fresh (non-bfcache) load never has diving
     true at this point, so this only fires on an actual Back return. */
  window.addEventListener('pageshow', function (ev) {
    if (ev.persisted && (diving || diveOverlay.style.opacity !== '0')) {
      startReverseDive();
    }
  });

  /* Robust click: unified Pointer Events (covers mouse, touch, and pen
     in one code path — no more separate mouse/touch listeners to keep
     in sync). Raycast fresh from the pointer-up point against the
     padded hitboxes, with a drag guard so rotating the stack never
     fires a dive. */
  var downX = 0, downY = 0;
  function onPointerDown(e) {
    downX = e.clientX; downY = e.clientY;
  }
  function onPointerUp(e) {
    if (diving || reversing) return;
    var moved = Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY);
    if (moved > 8) return;  // was a drag/orbit, not a tap/click
    var rect = container.getBoundingClientRect();
    var v = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(v, camera);
    var hits = raycaster.intersectObjects(hitMeshes);
    if (hits.length > 0) startDive(hits[0].object);
  }

  var zone = document.getElementById('stack-zone');
  [container, zone].forEach(function (el) {
    if (!el) return;
    el.style.touchAction = 'none';   // stop mobile browsers hijacking the gesture as scroll/zoom
    el.addEventListener('pointerdown', onPointerDown, { passive: true });
    el.addEventListener('pointerup', onPointerUp);
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

    var now = performance.now();
    if (diving) updateDive(now);
    else if (reversing) updateReverseDive(now);
    else if (controls) controls.update();

    /* Layer float + emissive pulse */
    for (var li = 0; li < layerMeshes.length; li++) {
      var m = layerMeshes[li];
      if (!diving && !reducedMotion) {
        var floatY = Math.sin(elapsed * 0.5 + li * 0.4) * 0.04;
        m.position.y = startY + li * layerSpacing + floatY;
      } else if (!diving) {
        m.position.y = startY + li * layerSpacing;   // reduced motion: stay put, no bob
      }

      /* Smooth transition to target opacity/emissive (faster during a dive) */
      var lerpK = diving ? 0.2 : 0.08;
      var tO = m.userData.targetOpacity;
      var tE = m.userData.targetEmissive;
      m.material.opacity += (tO - m.material.opacity) * lerpK;
      var pulse = (diving || reducedMotion) ? tE : tE + Math.sin(elapsed * 0.8 + li * 0.6) * 0.06;
      m.material.emissiveIntensity += (pulse - m.material.emissiveIntensity) * lerpK;
    }

    /* Raycaster — hover detection (skipped during a dive or its reverse) */
    if (!diving && !reversing) {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(hitMeshes);

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
        tooltip.innerHTML = '<span style="color:#' + new THREE.Color(d.color).getHexString() + ';font-weight:600;font-size:13px;">' + d.name + '</span><br><span style="color:#A3AEC2;font-size:11px;">' + d.clusters + ' clusters — click to enter</span>';
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
    }

    /* Particles (skipped for reduced-motion — static field, no drift) */
    if (!reducedMotion) {
      var pArr = pGeo.getAttribute('position').array;
      for (var pi = 0; pi < PARTICLE_COUNT; pi++) {
        var p3 = pi * 3;
        pArr[p3] += vel[p3]; pArr[p3+1] += vel[p3+1]; pArr[p3+2] += vel[p3+2];
        var dist = Math.sqrt(pArr[p3]*pArr[p3] + pArr[p3+1]*pArr[p3+1] + pArr[p3+2]*pArr[p3+2]);
        if (dist > 32) { pArr[p3] *= 0.4; pArr[p3+1] *= 0.4; pArr[p3+2] *= 0.4; }
      }
      pGeo.getAttribute('position').needsUpdate = true;
      particles.rotation.y += 0.0002 + warp * 0.02;
      particles.rotation.x += 0.0001 + warp * 0.012;
    }

    /* Warp amplification — particles bloom + streak as speed builds */
    particles.material.size = 0.045 + warp * 0.14;
    particles.material.opacity = 0.7 + warp * 0.3;
    lines.material.opacity = 0.2 + warp * 0.5;

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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 2 : 3));
    }, 100);
  });

})();
