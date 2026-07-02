/* ╔══════════════════════════════════════════════════════════════╗
   ║  Cloud Constellation — Interaction Layer                    ║
   ║  Command Palette · Search · Scroll Reveals · Cursor Glow   ║
   ║  Inbound dive-bloom handoff (pairs with gateway.js)         ║
   ╚══════════════════════════════════════════════════════════════╝ */

(function () {
  'use strict';

  /* ─── INBOUND DIVE BLOOM ──────────────────────────────────── */
  /* If we arrived via a camera dive from the homepage, the destination
     page blooms in from the exact domain colour the dive flashed to —
     so the page swap reads as one continuous motion, not a hard cut. */
  (function inboundBloom() {
    var raw;
    try { raw = sessionStorage.getItem('cc-dive'); } catch (e) { return; }
    if (!raw) return;
    try { sessionStorage.removeItem('cc-dive'); } catch (e) {}
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var data;
    try { data = JSON.parse(raw); } catch (e) { return; }
    if (!data || !data.c || (Date.now() - data.ts) > 4000) return;  // stale/ignore

    var hex = data.c;
    var gradient = 'radial-gradient(circle at 50% 45%, #ffffff 0%, ' + hex + ' 32%, rgba(4,6,14,0.96) 100%)';

    function mount() {
      var ov = document.createElement('div');
      ov.setAttribute('aria-hidden', 'true');
      ov.style.cssText = 'position:fixed;inset:0;z-index:100000;pointer-events:none;opacity:1;' +
        'background:' + gradient + ';transition:opacity 0.75s cubic-bezier(0.22,1,0.36,1);will-change:opacity;';
      document.body.appendChild(ov);
      /* Two RAFs so the initial opacity:1 paints before we fade out */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { ov.style.opacity = '0'; });
      });
      setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 900);
    }

    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount);
  })();

  /* ─── SEARCH INDEX ────────────────────────────────────────── */
  const SEARCH_INDEX = [
    // Domain 0 — The Stack Floor
    { title: 'The Stack Floor', path: '/0-stack-floor/', domain: 'Domain 0', type: 'domain' },
    { title: 'Desktop & Server OS Administration', path: '/0-stack-floor/os-admin.html', domain: 'Domain 0', type: 'cluster', keywords: 'windows 10 11 server linux ubuntu rhel' },
    { title: 'On-Premises Identity & Directory Services', path: '/0-stack-floor/on-prem-identity.html', domain: 'Domain 0', type: 'cluster', keywords: 'active directory gpo group policy users groups' },
    { title: 'Core Network Services', path: '/0-stack-floor/core-network-services.html', domain: 'Domain 0', type: 'cluster', keywords: 'dns dhcp' },
    { title: 'Network Theory & Protocols', path: '/0-stack-floor/network-theory.html', domain: 'Domain 0', type: 'cluster', keywords: 'osi model tcp ip subnetting nat' },
    { title: 'Routing, Switching & VLANs', path: '/0-stack-floor/routing-switching-vlans.html', domain: 'Domain 0', type: 'cluster', keywords: 'routing switching vlans layer 2 3' },
    { title: 'Network Security & Firewalls', path: '/0-stack-floor/network-security.html', domain: 'Domain 0', type: 'cluster', keywords: 'firewalls vpn wireshark troubleshooting' },
    { title: 'Virtualisation', path: '/0-stack-floor/virtualisation.html', domain: 'Domain 0', type: 'cluster', keywords: 'vmware esxi hyper-v virtual machines snapshots' },
    { title: 'High Availability & Clustering Fundamentals', path: '/0-stack-floor/ha-clustering.html', domain: 'Domain 0', type: 'cluster', keywords: 'clustering failover ha basics' },
    { title: 'IT Support Essentials', path: '/0-stack-floor/it-support-essentials.html', domain: 'Domain 0', type: 'cluster', keywords: 'troubleshooting hardware anydesk teamviewer remote' },
    { title: 'Cloud & Workplace Orientation', path: '/0-stack-floor/cloud-workplace-orientation.html', domain: 'Domain 0', type: 'cluster', keywords: 'm365 basics entra intune defender orientation' },
    { title: 'Scripting Fundamentals', path: '/0-stack-floor/scripting-fundamentals.html', domain: 'Domain 0', type: 'cluster', keywords: 'powershell python scripting basic automation' },

    // Domain 1 — Compute & Application Platform
    { title: 'Compute & Application Platform', path: '/1-compute/', domain: 'Domain 1', type: 'domain' },
    { title: 'Virtual Machines & Compute', path: '/1-compute/virtual-machines.html', domain: 'Domain 1', type: 'cluster', keywords: 'azure vm scale sets availability dedicated hosts' },
    { title: 'Serverless & Event-Driven', path: '/1-compute/serverless.html', domain: 'Domain 1', type: 'cluster', keywords: 'azure functions logic apps event grid event hubs service bus' },
    { title: 'Containers', path: '/1-compute/containers.html', domain: 'Domain 1', type: 'cluster', keywords: 'docker aci acr container apps instances registry' },
    { title: 'Kubernetes (AKS)', path: '/1-compute/aks.html', domain: 'Domain 1', type: 'cluster', keywords: 'aks kubernetes node pools ingress helm autoscaler' },
    { title: 'Scalability & Elasticity', path: '/1-compute/scalability.html', domain: 'Domain 1', type: 'cluster', keywords: 'vm scale sets autoscaling keda scale out up' },

    // Domain 2 — Storage & Data
    { title: 'Storage & Data', path: '/2-storage/', domain: 'Domain 2', type: 'domain' },
    { title: 'Object & File Storage', path: '/2-storage/object-file-storage.html', domain: 'Domain 2', type: 'cluster', keywords: 'blob azure files archive storage accounts lifecycle' },
    { title: 'Disk & Block Storage', path: '/2-storage/disk-storage.html', domain: 'Domain 2', type: 'cluster', keywords: 'managed disks ultra premium ssd snapshots' },
    { title: 'Relational Databases', path: '/2-storage/relational-databases.html', domain: 'Domain 2', type: 'cluster', keywords: 'azure sql database managed instance postgresql mysql' },
    { title: 'NoSQL Databases', path: '/2-storage/nosql-databases.html', domain: 'Domain 2', type: 'cluster', keywords: 'cosmos db table storage mongodb api' },
    { title: 'Data & Analytics', path: '/2-storage/data-analytics.html', domain: 'Domain 2', type: 'cluster', keywords: 'synapse analytics data lake data factory big data warehouse' },

    // Domain 3 — Networking
    { title: 'Networking', path: '/3-networking/', domain: 'Domain 3', type: 'domain' },
    { title: 'Core Networking', path: '/3-networking/core-networking.html', domain: 'Domain 3', type: 'cluster', keywords: 'vnets subnets peering nsg route tables private endpoints service endpoints' },
    { title: 'Connectivity', path: '/3-networking/connectivity.html', domain: 'Domain 3', type: 'cluster', keywords: 'vpn gateway expressroute virtual wan bastion' },
    { title: 'Delivery & Load Balancing', path: '/3-networking/delivery-load-balancing.html', domain: 'Domain 3', type: 'cluster', keywords: 'load balancer application gateway front door cdn traffic manager dns' },
    { title: 'Firewall & Network Security', path: '/3-networking/firewall-network-security.html', domain: 'Domain 3', type: 'cluster', keywords: 'azure firewall manager ddos protection waf nsg' },
    { title: 'Azure Regions, Geographies & Data Residency', path: '/3-networking/regions-geography.html', domain: 'Domain 3', type: 'cluster', keywords: 'regions geography data residency sovereignty latency zones pairs' },

    // Domain 4 — Identity & Security
    { title: 'Identity & Security', path: '/4-identity-security/', domain: 'Domain 4', type: 'domain' },
    { title: 'Identity & Authentication', path: '/4-identity-security/identity-authentication.html', domain: 'Domain 4', type: 'cluster', keywords: 'entra id users groups tenants b2b b2c external domain services azure active directory' },
    { title: 'Access Management', path: '/4-identity-security/access-management.html', domain: 'Domain 4', type: 'cluster', keywords: 'rbac pim conditional access mfa sso identity federation managed identities' },
    { title: 'Key Vault & Secrets Management', path: '/4-identity-security/key-vault.html', domain: 'Domain 4', type: 'cluster', keywords: 'key vault certificates secrets hsm disk encryption' },
    { title: 'Threat Protection (Defender)', path: '/4-identity-security/threat-protection.html', domain: 'Domain 4', type: 'cluster', keywords: 'microsoft defender cloud servers endpoint secure score' },
    { title: 'Information Protection (Purview)', path: '/4-identity-security/information-protection.html', domain: 'Domain 4', type: 'cluster', keywords: 'purview sensitivity labels dlp information barriers ediscovery' },
    { title: 'Compliance & Risk', path: '/4-identity-security/compliance-risk.html', domain: 'Domain 4', type: 'cluster', keywords: 'compliance manager iso soc gdpr audit logs regulatory' },

    // Domain 5 — Operations & Management
    { title: 'Operations & Management', path: '/5-operations/', domain: 'Domain 5', type: 'domain' },
    { title: 'Monitoring & Observability', path: '/5-operations/monitoring.html', domain: 'Domain 5', type: 'cluster', keywords: 'azure monitor log analytics application insights workbooks dashboards' },
    { title: 'Alerting & Diagnostics', path: '/5-operations/alerting-diagnostics.html', domain: 'Domain 5', type: 'cluster', keywords: 'alert rules action groups diagnostic settings activity log metrics' },
    { title: 'Governance & Policy', path: '/5-operations/governance-policy.html', domain: 'Domain 5', type: 'cluster', keywords: 'azure policy blueprints management groups subscriptions resource groups tagging' },
    { title: 'Cost Management', path: '/5-operations/cost-management.html', domain: 'Domain 5', type: 'cluster', keywords: 'azure cost management budgets advisor reservations spot vms' },
    { title: 'Patch & Asset Management', path: '/5-operations/patch-asset-management.html', domain: 'Domain 5', type: 'cluster', keywords: 'azure update manager defender recommendations cmdb' },

    // Domain 6 — IaC & DevOps
    { title: 'Infrastructure as Code & DevOps', path: '/6-iac-devops/', domain: 'Domain 6', type: 'domain' },
    { title: 'ARM Templates & Bicep', path: '/6-iac-devops/arm-bicep.html', domain: 'Domain 6', type: 'cluster', keywords: 'arm templates bicep declarative iac infrastructure code' },
    { title: 'Terraform on Azure', path: '/6-iac-devops/terraform.html', domain: 'Domain 6', type: 'cluster', keywords: 'terraform hcl providers state management modules terragrunt' },
    { title: 'Automation & Scripting', path: '/6-iac-devops/automation-scripting.html', domain: 'Domain 6', type: 'cluster', keywords: 'azure automation runbooks powershell azure cli python sdk' },
    { title: 'CI/CD Pipelines', path: '/6-iac-devops/cicd-pipelines.html', domain: 'Domain 6', type: 'cluster', keywords: 'azure devops pipelines github actions release strategies environments' },
    { title: 'Source Control & Artifacts', path: '/6-iac-devops/source-artifacts.html', domain: 'Domain 6', type: 'cluster', keywords: 'azure repos github integration artifacts package management' },

    // Domain 7 — Resilience & Continuity
    { title: 'Resilience & Continuity', path: '/7-resilience/', domain: 'Domain 7', type: 'domain' },
    { title: 'Azure Backup', path: '/7-resilience/backup.html', domain: 'Domain 7', type: 'cluster', keywords: 'azure backup recovery services vault policies mars agent' },
    { title: 'Disaster Recovery', path: '/7-resilience/disaster-recovery.html', domain: 'Domain 7', type: 'cluster', keywords: 'azure site recovery failover replication rto rpo dr drills' },
    { title: 'High Availability & Resilience', path: '/7-resilience/high-availability.html', domain: 'Domain 7', type: 'cluster', keywords: 'availability zones region pairs multi-region architecture sla' },
    { title: 'Business Continuity & BCDR Planning', path: '/7-resilience/bcdr-planning.html', domain: 'Domain 7', type: 'cluster', keywords: 'bia bcdr strategy rto rpo design continuity frameworks testing' },

    // Domain 8 — Hybrid, Endpoint & Workplace
    { title: 'Hybrid, Endpoint & Workplace', path: '/8-hybrid-workplace/', domain: 'Domain 8', type: 'domain' },
    { title: 'Windows Server on Azure', path: '/8-hybrid-workplace/windows-server.html', domain: 'Domain 8', type: 'cluster', keywords: 'windows server hybrid licensing ad ds azure vms wsus' },
    { title: 'Linux on Azure', path: '/8-hybrid-workplace/linux.html', domain: 'Domain 8', type: 'cluster', keywords: 'linux vm cloud-init ssh key management patching lamp' },
    { title: 'Hybrid Cloud', path: '/8-hybrid-workplace/hybrid-cloud.html', domain: 'Domain 8', type: 'cluster', keywords: 'azure arc stack hci hybrid networking on-premises integration' },
    { title: 'Endpoint Management (Intune)', path: '/8-hybrid-workplace/endpoint-management.html', domain: 'Domain 8', type: 'cluster', keywords: 'microsoft intune autopilot compliance policies app management co-management' },
    { title: 'Microsoft 365 Admin', path: '/8-hybrid-workplace/m365-admin.html', domain: 'Domain 8', type: 'cluster', keywords: 'm365 admin centre exchange online tenant management licensing' },
    { title: 'SharePoint & OneDrive', path: '/8-hybrid-workplace/sharepoint-onedrive.html', domain: 'Domain 8', type: 'cluster', keywords: 'sharepoint online onedrive document libraries permissions sync' },

    // Domain 9 — AI, Data & IoT
    { title: 'AI, Data & IoT', path: '/9-ai-iot/', domain: 'Domain 9', type: 'domain' },
    { title: 'Azure Machine Learning', path: '/9-ai-iot/azure-ml.html', domain: 'Domain 9', type: 'cluster', keywords: 'azure machine learning ml studio model training deployment' },
    { title: 'Azure OpenAI Service', path: '/9-ai-iot/azure-openai.html', domain: 'Domain 9', type: 'cluster', keywords: 'openai service gpt deployments prompt engineering azure' },
    { title: 'Azure AI Services (Cognitive)', path: '/9-ai-iot/cognitive-ai.html', domain: 'Domain 9', type: 'cluster', keywords: 'vision speech language translator form recognizer content safety cognitive' },
    { title: 'IoT', path: '/9-ai-iot/iot.html', domain: 'Domain 9', type: 'cluster', keywords: 'iot hub central digital twins stream analytics' },
  ];

  /* ─── FUZZY SEARCH ────────────────────────────────────────── */
  function fuzzyMatch(query, text) {
    query = query.toLowerCase();
    text = text.toLowerCase();
    if (text.includes(query)) return 2;
    let qi = 0;
    for (let ti = 0; ti < text.length && qi < query.length; ti++) {
      if (text[ti] === query[qi]) qi++;
    }
    return qi === query.length ? 1 : 0;
  }

  function search(query) {
    if (!query || query.length < 2) return [];
    const results = [];
    SEARCH_INDEX.forEach(function (item) {
      var combined = item.title + ' ' + (item.keywords || '') + ' ' + item.domain;
      var score = fuzzyMatch(query, combined);
      if (score > 0) {
        if (item.type === 'domain') score += 0.5;
        results.push({ item: item, score: score });
      }
    });
    results.sort(function (a, b) { return b.score - a.score; });
    return results.slice(0, 12);
  }

  /* ─── COMMAND PALETTE ─────────────────────────────────────── */
  var cmdOverlay = document.querySelector('.cmd-overlay');
  var cmdInput = document.querySelector('.cmd-input');
  var cmdResults = document.querySelector('.cmd-results');
  var selectedIndex = -1;

  function openPalette() {
    if (!cmdOverlay) return;
    cmdOverlay.classList.add('open');
    if (cmdInput) {
      cmdInput.value = '';
      cmdInput.focus();
    }
    renderResults([]);
    selectedIndex = -1;
    document.body.style.overflow = 'hidden';
  }

  function closePalette() {
    if (!cmdOverlay) return;
    cmdOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderResults(results) {
    if (!cmdResults) return;
    if (results.length === 0 && cmdInput && cmdInput.value.length > 0) {
      cmdResults.innerHTML = '<div class="cmd-empty">No results found</div>';
      return;
    }
    if (results.length === 0) {
      cmdResults.innerHTML = '<div class="cmd-empty">Type to search across 10 domains, 56 clusters, and 200+ topics</div>';
      return;
    }
    cmdResults.innerHTML = results.map(function (r, i) {
      var icon = r.item.type === 'domain' ? '◆' : '○';
      return '<div class="cmd-result' + (i === selectedIndex ? ' selected' : '') + '" data-index="' + i + '">' +
        '<div class="cmd-result-icon">' + icon + '</div>' +
        '<div class="cmd-result-text">' +
        '<div class="cmd-result-title">' + r.item.title + '</div>' +
        '<div class="cmd-result-path">' + r.item.domain + ' → ' + r.item.type + '</div>' +
        '</div></div>';
    }).join('');

    cmdResults.querySelectorAll('.cmd-result').forEach(function (el) {
      el.addEventListener('click', function () {
        var idx = parseInt(el.dataset.index);
        if (results[idx]) {
          window.location.href = results[idx].item.path;
        }
      });
    });
  }

  function navigateResults(dir, results) {
    var count = results.length;
    if (count === 0) return;
    selectedIndex = (selectedIndex + dir + count) % count;
    renderResults(results);
    var sel = cmdResults.querySelector('.cmd-result.selected');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  if (cmdInput) {
    var currentResults = [];
    cmdInput.addEventListener('input', function () {
      currentResults = search(cmdInput.value);
      selectedIndex = -1;
      renderResults(currentResults);
    });

    cmdInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); navigateResults(1, currentResults); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); navigateResults(-1, currentResults); }
      else if (e.key === 'Enter' && selectedIndex >= 0 && currentResults[selectedIndex]) {
        window.location.href = currentResults[selectedIndex].item.path;
      }
      else if (e.key === 'Escape') { closePalette(); }
    });
  }

  if (cmdOverlay) {
    cmdOverlay.addEventListener('click', function (e) {
      if (e.target === cmdOverlay) closePalette();
    });
  }

  /* Keyboard shortcut: Cmd+K / Ctrl+K */
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (cmdOverlay && cmdOverlay.classList.contains('open')) {
        closePalette();
      } else {
        openPalette();
      }
    }
    if (e.key === 'Escape' && cmdOverlay && cmdOverlay.classList.contains('open')) {
      closePalette();
    }
  });

  /* Nav search trigger */
  var navSearch = document.querySelector('.nav-search');
  if (navSearch) {
    navSearch.addEventListener('click', openPalette);
  }

  /* ─── NAV SCROLL STATE ────────────────────────────────────── */
  var nav = document.querySelector('.nav');
  if (nav) {
    var lastScroll = 0;
    window.addEventListener('scroll', function () {
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollY > 20) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
      lastScroll = scrollY;
    }, { passive: true });
  }

  /* ─── MOBILE MENU ─────────────────────────────────────────── */
  var mobileToggle = document.querySelector('.nav-mobile-toggle');
  var navLinks = document.querySelector('.nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
      var isOpen = navLinks.classList.contains('open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
      mobileToggle.innerHTML = isOpen ? '✕' : '☰';
    });
  }

  /* ─── SCROLL REVEAL ───────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ─── CURSOR GLOW ─────────────────────────────────────────── */
  var cursorGlow = document.querySelector('.cursor-glow');
  if (cursorGlow && window.matchMedia('(pointer: fine)').matches) {
    var glowRAF = null;
    document.addEventListener('mousemove', function (e) {
      if (glowRAF) cancelAnimationFrame(glowRAF);
      glowRAF = requestAnimationFrame(function () {
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
      });
    }, { passive: true });
  } else if (cursorGlow) {
    cursorGlow.style.display = 'none';
  }

  /* ─── RIGHT OUTLINE ACTIVE SECTION ────────────────────────── */
  var outlineLinks = document.querySelectorAll('.outline-link');
  if (outlineLinks.length > 0) {
    var headings = [];
    outlineLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        var target = document.getElementById(href.slice(1));
        if (target) headings.push({ el: target, link: link });
      }
    });

    if (headings.length > 0) {
      window.addEventListener('scroll', function () {
        var scrollY = window.pageYOffset + 120;
        var active = headings[0];
        headings.forEach(function (h) {
          if (h.el.offsetTop <= scrollY) active = h;
        });
        outlineLinks.forEach(function (l) { l.classList.remove('active'); });
        if (active) active.link.classList.add('active');
      }, { passive: true });
    }
  }

  /* ─── SMOOTH SCROLL FOR ANCHOR LINKS ──────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var targetId = a.getAttribute('href').slice(1);
      var target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', '#' + targetId);
      }
    });
  });

  /* ─── STAGGER REVEAL FOR CARD GRIDS ───────────────────────── */
  document.querySelectorAll('.domain-grid .domain-card, .cluster-grid .cluster-card').forEach(function (card, i) {
    card.style.transitionDelay = (i * 0.06) + 's';
  });

})();
