/* ═══════════════════════════════════════════════════════════
   DIPAYAN BARUA · CLOUD LEARNING HUB
   Shared JavaScript — nav, search, 3D effects, interactions
   ═══════════════════════════════════════════════════════════ */

(function(){
'use strict';

/* ── SEARCH INDEX ──
   Add entries here when you create new topic pages.
   Format: { title, pillar, category, path, keywords }           */
const SEARCH_INDEX = [
  // Identity & Access
  {t:'What is Entra ID',p:'Entra ID',c:'Identity & Access',path:'/identity-access/entra-id.html#what-is-entra-id',k:'azure ad identity tenant directory'},
  {t:'Tenants and Directories',p:'Entra ID',c:'Identity & Access',path:'/identity-access/entra-id.html#tenants',k:'tenant directory organization multi-tenant'},
  {t:'Users, Groups and Licensing',p:'Entra ID',c:'Identity & Access',path:'/identity-access/entra-id.html#users-groups',k:'user group dynamic security license assign'},
  {t:'Conditional Access Policies',p:'Entra ID',c:'Identity & Access',path:'/identity-access/entra-id.html#conditional-access',k:'conditional access policy mfa block grant require'},
  {t:'Multi-Factor Authentication',p:'Entra ID',c:'Identity & Access',path:'/identity-access/entra-id.html#mfa',k:'mfa two-factor authenticator security defaults'},
  {t:'RBAC and Role Assignments',p:'Entra ID',c:'Identity & Access',path:'/identity-access/entra-id.html#rbac',k:'role based access control global admin reader'},
  {t:'App Registrations and SSO',p:'Entra ID',c:'Identity & Access',path:'/identity-access/entra-id.html#app-registrations',k:'app registration enterprise sso saml oauth single sign-on'},
  {t:'Access Reviews and Governance',p:'Entra ID',c:'Identity & Access',path:'/identity-access/entra-id.html#access-reviews',k:'access review governance lifecycle entitlement'},
  {t:'Entra ID Connect',p:'Entra ID',c:'Identity & Access',path:'/identity-access/entra-id.html#entra-connect',k:'azure ad connect sync hybrid password hash'},
  {t:'PowerShell for Entra ID',p:'Entra ID',c:'Identity & Access',path:'/identity-access/entra-id.html#powershell',k:'powershell graph module get-mguser connect-mggraph'},
  {t:'Active Directory',p:'Active Directory',c:'Identity & Access',path:'/identity-access/active-directory.html',k:'ad ds domain controller forest trust ou gpo'},
  {t:'Conditional Access',p:'Conditional Access',c:'Identity & Access',path:'/identity-access/conditional-access.html',k:'conditional access policy signal grant session'},
  // Endpoint Management
  {t:'Intune',p:'Intune',c:'Endpoint Management',path:'/endpoint/intune.html',k:'intune mdm mam compliance configuration profile'},
  {t:'Windows Autopilot',p:'Autopilot',c:'Endpoint Management',path:'/endpoint/autopilot.html',k:'autopilot zero-touch oobe provisioning deployment profile'},
  {t:'Group Policy',p:'Group Policy',c:'Endpoint Management',path:'/endpoint/group-policy.html',k:'gpo group policy object gpmc gpresult rsop'},
  // Cloud Infrastructure
  {t:'Azure',p:'Azure',c:'Cloud Infrastructure',path:'/cloud/azure.html',k:'azure portal subscription resource group vm vnet'},
  {t:'Windows Server',p:'Windows Server',c:'Cloud Infrastructure',path:'/cloud/windows-server.html',k:'windows server ad ds dns dhcp iis hyper-v'},
  {t:'Networking',p:'Networking',c:'Cloud Infrastructure',path:'/cloud/networking.html',k:'dns dhcp tcp ip vpn zscaler firewall vlan subnet'},
  // Productivity & Collaboration
  {t:'M365 Admin Center',p:'M365 Admin',c:'Productivity',path:'/productivity/m365-admin.html',k:'microsoft 365 admin center tenant settings'},
  {t:'Exchange Online',p:'Exchange Online',c:'Productivity',path:'/productivity/exchange-online.html',k:'exchange online mail flow transport rules mailbox'},
  {t:'SharePoint Online',p:'SharePoint',c:'Productivity',path:'/productivity/sharepoint.html',k:'sharepoint site collection document library permissions hub'},
  {t:'OneDrive',p:'OneDrive',c:'Productivity',path:'/productivity/onedrive.html',k:'onedrive sync known folder move sharing retention'},
  {t:'Teams',p:'Teams',c:'Productivity',path:'/productivity/teams.html',k:'microsoft teams channels meetings policies calling'},
  // Security
  {t:'Microsoft Defender',p:'Defender',c:'Security',path:'/security/defender.html',k:'defender endpoint identity email cloud apps xdr'},
  {t:'Microsoft Sentinel',p:'Sentinel',c:'Security',path:'/security/sentinel.html',k:'sentinel siem soar kql analytics rules incidents'},
  {t:'SentinelOne',p:'SentinelOne',c:'Security',path:'/security/sentinelone.html',k:'sentinelone edr xdr endpoint detection response'},
  // Automation & Tooling
  {t:'PowerShell',p:'PowerShell',c:'Automation',path:'/automation/powershell.html',k:'powershell script cmdlet module function pipeline'},
  {t:'ServiceNow',p:'ServiceNow',c:'Automation',path:'/automation/servicenow.html',k:'servicenow itsm incident change problem request'},
  {t:'Python',p:'Python',c:'Automation',path:'/automation/python.html',k:'python automation scripting api rest graph'},
];

/* ── NAV SCROLL ── */
const header = document.getElementById('header');
if(header){
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});
}

/* ── MOBILE MENU ── */
const mm = document.getElementById('mobileMenu');
const menuBtn = document.getElementById('menuToggle');
const menuClose = document.getElementById('mobileClose');
if(mm && menuBtn){
  menuBtn.addEventListener('click', () => mm.classList.add('open'));
  if(menuClose) menuClose.addEventListener('click', () => mm.classList.remove('open'));
  mm.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mm.classList.remove('open')));
}

/* ── MOBILE SIDEBAR ── */
const sidebar = document.querySelector('.sidebar');
const sbOverlay = document.querySelector('.sb-overlay');
const sbToggle = document.getElementById('sidebarToggle');
if(sidebar && sbToggle){
  sbToggle.addEventListener('click', () => { sidebar.classList.add('open'); if(sbOverlay) sbOverlay.classList.add('open'); });
  if(sbOverlay) sbOverlay.addEventListener('click', () => { sidebar.classList.remove('open'); sbOverlay.classList.remove('open'); });
}

/* ── CURSOR GLOW ── */
const glow = document.getElementById('cursor-glow');
if(glow && window.matchMedia('(pointer:fine)').matches){
  window.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  }, {passive:true});
} else if(glow){ glow.style.display = 'none'; }

/* ── SCROLL REVEAL ── */
const reveals = document.querySelectorAll('.reveal');
if(reveals.length){
  const ro = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if(en.isIntersecting){ en.target.classList.add('in'); ro.unobserve(en.target); }
    });
  }, {threshold:0.1});
  reveals.forEach(r => ro.observe(r));
}

/* ── PSEUDO-3D CARD TILT ── */
document.querySelectorAll('[data-tilt]').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x*6}deg) rotateX(${-y*6}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

/* ── SEARCH ── */
function initSearch(inputEl, resultsEl){
  if(!inputEl || !resultsEl) return;

  inputEl.addEventListener('input', () => {
    const q = inputEl.value.trim().toLowerCase();
    if(q.length < 2){ resultsEl.classList.remove('open'); resultsEl.innerHTML=''; return; }

    const matches = SEARCH_INDEX.filter(item => {
      return item.t.toLowerCase().includes(q) ||
             item.p.toLowerCase().includes(q) ||
             item.c.toLowerCase().includes(q) ||
             item.k.includes(q);
    }).slice(0, 8);

    if(matches.length === 0){
      resultsEl.innerHTML = '<div class="sr-empty">No results for "'+q+'"</div>';
    } else {
      resultsEl.innerHTML = matches.map(m =>
        '<a href="'+m.path+'" class="sr-item">' +
          '<span class="sr-pill">'+m.c+'</span>' +
          '<span class="sr-title">'+m.t+'</span>' +
          '<span class="sr-path">'+m.p+'</span>' +
        '</a>'
      ).join('');
    }
    resultsEl.classList.add('open');
  });

  inputEl.addEventListener('blur', () => {
    setTimeout(() => resultsEl.classList.remove('open'), 200);
  });

  inputEl.addEventListener('focus', () => {
    if(inputEl.value.trim().length >= 2) resultsEl.classList.add('open');
  });

  // Cmd/Ctrl+K to focus
  document.addEventListener('keydown', e => {
    if((e.metaKey || e.ctrlKey) && e.key === 'k'){
      e.preventDefault(); inputEl.focus();
    }
    if(e.key === 'Escape'){ resultsEl.classList.remove('open'); inputEl.blur(); }
  });
}

// home search
initSearch(document.getElementById('homeSearch'), document.getElementById('homeResults'));
// nav search
initSearch(document.getElementById('navSearch'), document.getElementById('navResults'));

/* ── RIGHT OUTLINE SCROLL SPY ── */
const outlineLinks = document.querySelectorAll('.outline a');
if(outlineLinks.length){
  const headings = [];
  outlineLinks.forEach(link => {
    const id = link.getAttribute('href');
    if(id && id.startsWith('#')){
      const el = document.querySelector(id);
      if(el) headings.push({el, link});
    }
  });

  if(headings.length){
    const spy = () => {
      const scrollY = window.scrollY + 120;
      let active = headings[0];
      headings.forEach(h => { if(h.el.offsetTop <= scrollY) active = h; });
      outlineLinks.forEach(l => l.classList.remove('active'));
      if(active) active.link.classList.add('active');
    };
    spy(); window.addEventListener('scroll', spy, {passive:true});
  }
}

/* ── COPY CODE BUTTON ── */
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const pre = btn.closest('pre');
    const code = pre.querySelector('code');
    if(code){
      navigator.clipboard.writeText(code.textContent).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 1500);
      });
    }
  });
});

})();
