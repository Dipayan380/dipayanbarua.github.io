/* ╔══════════════════════════════════════════════════════════════╗
   ║  dipayanbarua.com.au — The Gateway · 10-Layer 3D Stack      ║
   ║  Three.js · EffectComposer · UnrealBloom · FXAA             ║
   ║  Neon Palette B · 1000+ Particles · 8K-Ready                ║
   ╚══════════════════════════════════════════════════════════════╝ */

(function () {
  'use strict';

  var container = document.getElementById('gateway-canvas');
  if (!container) return;

  /* ─── CONFIG ──────────────────────────────────────────────── */
  var LAYER_COUNT = 10;
  var PARTICLE_COUNT = 1200;
  var LINE_DISTANCE = 2.8;
  var AUTO_ROTATE_SPEED = 0.003;
  var PARALLAX_STRENGTH = 0.15;

  var DOMAINS = [
    { name: 'THE STACK FLOOR',              color: 0xA0AEC0 },
    { name: 'COMPUTE',                       color: 0xFF6B00 },
    { name: 'STORAGE & DATA',                color: 0x00FFD1 },
    { name: 'NETWORKING',                    color: 0x00E5FF },
    { name: 'IDENTITY & SECURITY',           color: 0x4D7DFF },
    { name: 'OPERATIONS',                    color: 0x00FF88 },
    { name: 'IAC & DEVOPS',                  color: 0xBF5AF2 },
    { name: 'RESILIENCE',                    color: 0xFF3B3B },
    { name: 'HYBRID & WORKPLACE',            color: 0xFF2D78 },
    { name: 'AI, DATA & IOT',               color: 0xFFD60A },
  ];

  /* ─── REDUCED MOTION CHECK ────────────────────────────────── */
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(125,171,255,0.3);font-size:0.875rem;font-family:var(--font-body);">3D visualisation paused — reduced motion enabled</div>';
    return;
  }

  /* ─── THREE.JS IMPORTS (from CDN via script tags in HTML) ── */
  var THREE = window.THREE;
  if (!THREE) {
    console.warn('Three.js not loaded');
    return;
  }

  var EffectComposer = window.EffectComposer;
  var RenderPass = window.RenderPass;
  var UnrealBloomPass = window.UnrealBloomPass;
  var ShaderPass = window.ShaderPass;
  var FXAAShader = window.FXAAShader;

  /* ─── SCENE SETUP ─────────────────────────────────────────── */
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060810, 0.035);

  var camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 200);
  camera.position.set(0, 3, 18);
  camera.lookAt(0, 1.5, 0);

  var renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  /* ─── POST-PROCESSING ─────────────────────────────────────── */
  var composer = null;
  if (EffectComposer && RenderPass && UnrealBloomPass) {
    composer = new EffectComposer(renderer);
    var renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    var bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.8,   /* strength */
      0.4,   /* radius */
      0.85   /* threshold */
    );
    composer.addPass(bloomPass);

    if (ShaderPass && FXAAShader) {
      var fxaaPass = new ShaderPass(FXAAShader);
      fxaaPass.material.uniforms['resolution'].value.set(
        1 / (container.clientWidth * renderer.getPixelRatio()),
        1 / (container.clientHeight * renderer.getPixelRatio())
      );
      composer.addPass(fxaaPass);
    }
  }

  /* ─── LIGHTING ────────────────────────────────────────────── */
  var ambientLight = new THREE.AmbientLight(0x7DABFF, 0.15);
  scene.add(ambientLight);

  var pointLight = new THREE.PointLight(0x7DABFF, 0.6, 50);
  pointLight.position.set(5, 10, 8);
  scene.add(pointLight);

  var pointLight2 = new THREE.PointLight(0x4D7DFF, 0.3, 40);
  pointLight2.position.set(-8, -3, 5);
  scene.add(pointLight2);

  /* ─── STACK LAYERS ────────────────────────────────────────── */
  var stackGroup = new THREE.Group();
  scene.add(stackGroup);

  var layerMeshes = [];
  var layerSpacing = 0.65;
  var totalHeight = (LAYER_COUNT - 1) * layerSpacing;
  var startY = -totalHeight / 2;

  DOMAINS.forEach(function (domain, i) {
    var color = new THREE.Color(domain.color);

    /* Layer box — rounded appearance via bevelled geometry */
    var geometry = new THREE.BoxGeometry(4.5, 0.18, 2.2, 1, 1, 1);
    var material = new THREE.MeshPhysicalMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.25,
      metalness: 0.3,
      roughness: 0.5,
      transparent: true,
      opacity: 0.55,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
    });

    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = startY + i * layerSpacing;
    mesh.userData = { domain: domain, index: i };
    stackGroup.add(mesh);
    layerMeshes.push(mesh);

    /* Edge glow outline */
    var edgeGeometry = new THREE.EdgesGeometry(geometry);
    var edgeMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.4,
    });
    var edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    mesh.add(edges);

    /* Domain label — created as sprite */
    var canvas2d = document.createElement('canvas');
    var ctx = canvas2d.getContext('2d');
    canvas2d.width = 512;
    canvas2d.height = 64;
    ctx.clearRect(0, 0, 512, 64);

    /* Domain number */
    ctx.font = 'bold 22px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#' + color.getHexString();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(i.toString().padStart(2, '0'), 10, 32);

    /* Domain name */
    ctx.font = '500 18px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'left';
    ctx.fillText(domain.name, 48, 32);

    var labelTexture = new THREE.CanvasTexture(canvas2d);
    labelTexture.minFilter = THREE.LinearFilter;
    labelTexture.magFilter = THREE.LinearFilter;

    var labelMaterial = new THREE.SpriteMaterial({
      map: labelTexture,
      transparent: true,
      opacity: 0.85,
      depthTest: false,
    });

    var sprite = new THREE.Sprite(labelMaterial);
    sprite.scale.set(4.5, 0.56, 1);
    sprite.position.set(3.2, 0, 0);
    mesh.add(sprite);
  });

  /* Centre the stack slightly above centre for visual balance */
  stackGroup.position.y = 1.2;

  /* ─── PARTICLES ───────────────────────────────────────────── */
  var particleGeometry = new THREE.BufferGeometry();
  var positions = new Float32Array(PARTICLE_COUNT * 3);
  var velocities = new Float32Array(PARTICLE_COUNT * 3);
  var colors = new Float32Array(PARTICLE_COUNT * 3);
  var sizes = new Float32Array(PARTICLE_COUNT);

  var accentColor = new THREE.Color(0x7DABFF);
  var dimColor = new THREE.Color(0x3A4258);

  for (var i = 0; i < PARTICLE_COUNT; i++) {
    var i3 = i * 3;
    /* Distribute in a sphere */
    var radius = 12 + Math.random() * 18;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);

    positions[i3]     = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    velocities[i3]     = (Math.random() - 0.5) * 0.002;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.002;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.002;

    /* Mix of accent and dim particles */
    var mixFactor = Math.random();
    var c = mixFactor > 0.7 ? accentColor : dimColor;
    colors[i3]     = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;

    sizes[i] = 0.02 + Math.random() * 0.06;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  var particleMaterial = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  var particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  /* ─── CONNECTING LINES ────────────────────────────────────── */
  var lineGeometry = new THREE.BufferGeometry();
  var maxLines = 200;
  var linePositions = new Float32Array(maxLines * 6);
  var lineColors = new Float32Array(maxLines * 6);
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
  lineGeometry.setDrawRange(0, 0);

  var lineMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  var lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lines);

  /* ─── MOUSE INTERACTION ───────────────────────────────────── */
  var mouse = { x: 0, y: 0 };
  var targetRotation = { x: 0, y: 0 };
  var isDragging = false;
  var dragStart = { x: 0, y: 0 };
  var dragRotation = { x: 0, y: 0 };

  container.addEventListener('mousemove', function (e) {
    var rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (isDragging) {
      dragRotation.y = (e.clientX - dragStart.x) * 0.005;
      dragRotation.x = (e.clientY - dragStart.y) * 0.003;
    }
  }, { passive: true });

  container.addEventListener('mousedown', function (e) {
    isDragging = true;
    dragStart.x = e.clientX - dragRotation.y / 0.005;
    dragStart.y = e.clientY - dragRotation.x / 0.003;
  });

  document.addEventListener('mouseup', function () {
    isDragging = false;
  });

  /* Touch support */
  container.addEventListener('touchmove', function (e) {
    if (e.touches.length === 1) {
      var touch = e.touches[0];
      var rect = container.getBoundingClientRect();
      mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    }
  }, { passive: true });

  /* ─── ANIMATION LOOP ──────────────────────────────────────── */
  var clock = new THREE.Clock();
  var autoRotateAngle = 0;
  var frameCount = 0;

  function animate() {
    requestAnimationFrame(animate);
    var delta = clock.getDelta();
    var elapsed = clock.getElapsedTime();
    frameCount++;

    /* Auto-rotation */
    autoRotateAngle += AUTO_ROTATE_SPEED;

    /* Stack rotation — combines auto-rotate + parallax + drag */
    targetRotation.x = mouse.y * PARALLAX_STRENGTH + dragRotation.x;
    targetRotation.y = autoRotateAngle + mouse.x * PARALLAX_STRENGTH + dragRotation.y;

    stackGroup.rotation.y += (targetRotation.y - stackGroup.rotation.y) * 0.03;
    stackGroup.rotation.x += (targetRotation.x - stackGroup.rotation.x) * 0.03;

    /* Layer hover effect — gentle float */
    layerMeshes.forEach(function (mesh, idx) {
      var floatOffset = Math.sin(elapsed * 0.5 + idx * 0.4) * 0.03;
      var baseY = startY + idx * layerSpacing + 1.2;
      mesh.position.y = baseY - stackGroup.position.y + floatOffset;
    });

    /* Update particles */
    var posAttr = particleGeometry.getAttribute('position');
    var posArray = posAttr.array;
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var i3 = i * 3;
      posArray[i3]     += velocities[i3];
      posArray[i3 + 1] += velocities[i3 + 1];
      posArray[i3 + 2] += velocities[i3 + 2];

      /* Wrap particles within sphere */
      var dist = Math.sqrt(
        posArray[i3] * posArray[i3] +
        posArray[i3 + 1] * posArray[i3 + 1] +
        posArray[i3 + 2] * posArray[i3 + 2]
      );
      if (dist > 30) {
        posArray[i3]     *= 0.4;
        posArray[i3 + 1] *= 0.4;
        posArray[i3 + 2] *= 0.4;
      }
    }
    posAttr.needsUpdate = true;

    /* Slow particle cloud rotation */
    particles.rotation.y += 0.0002;
    particles.rotation.x += 0.0001;

    /* Update connecting lines (every 3rd frame for performance) */
    if (frameCount % 3 === 0) {
      var lineIdx = 0;
      var lPos = lineGeometry.getAttribute('position').array;
      var lCol = lineGeometry.getAttribute('color').array;
      var step = Math.max(1, Math.floor(PARTICLE_COUNT / 150));

      for (var a = 0; a < PARTICLE_COUNT && lineIdx < maxLines; a += step) {
        for (var b = a + step; b < PARTICLE_COUNT && lineIdx < maxLines; b += step) {
          var a3 = a * 3;
          var b3 = b * 3;
          var dx = posArray[a3] - posArray[b3];
          var dy = posArray[a3 + 1] - posArray[b3 + 1];
          var dz = posArray[a3 + 2] - posArray[b3 + 2];
          var d = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (d < LINE_DISTANCE) {
            var li = lineIdx * 6;
            lPos[li]     = posArray[a3];
            lPos[li + 1] = posArray[a3 + 1];
            lPos[li + 2] = posArray[a3 + 2];
            lPos[li + 3] = posArray[b3];
            lPos[li + 4] = posArray[b3 + 1];
            lPos[li + 5] = posArray[b3 + 2];

            var alpha = 1 - d / LINE_DISTANCE;
            lCol[li]     = 0.49 * alpha;
            lCol[li + 1] = 0.67 * alpha;
            lCol[li + 2] = 1.0 * alpha;
            lCol[li + 3] = 0.49 * alpha;
            lCol[li + 4] = 0.67 * alpha;
            lCol[li + 5] = 1.0 * alpha;

            lineIdx++;
          }
        }
      }
      lineGeometry.setDrawRange(0, lineIdx * 2);
      lineGeometry.getAttribute('position').needsUpdate = true;
      lineGeometry.getAttribute('color').needsUpdate = true;
    }

    /* Render */
    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  animate();

  /* ─── RESIZE HANDLER ──────────────────────────────────────── */
  var resizeTimeout;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      var w = container.clientWidth;
      var h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));

      if (composer) {
        composer.setSize(w, h);
        if (composer.passes[2] && composer.passes[2].material) {
          composer.passes[2].material.uniforms['resolution'].value.set(
            1 / (w * renderer.getPixelRatio()),
            1 / (h * renderer.getPixelRatio())
          );
        }
      }
    }, 100);
  });

})();
