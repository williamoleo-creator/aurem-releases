const releaseStatus = document.querySelector('#releaseStatus');
const cards = [...document.querySelectorAll('.download-card')];

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return 'tamanho não informado';
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} GB`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} MB`;
  return `${Math.ceil(value / 1000)} KB`;
}

function safeArtifactUrl(value) {
  try {
    const url = new URL(String(value || ''), window.location.origin);
    if (url.origin === window.location.origin) return url.href;
    const githubRelease = url.protocol === 'https:'
      && url.hostname === 'github.com'
      && url.pathname.startsWith('/williamoleo-creator/aurem-releases/releases/download/');
    return githubRelease ? url.href : null;
  } catch {
    return null;
  }
}

function activateArtifact(card, artifact, release) {
  const url = safeArtifactUrl(artifact.url);
  if (!url || !/^sha256:[a-f0-9]{64}$/i.test(String(artifact.sha256 || ''))) return;
  const button = card.querySelector('button');
  const code = card.querySelector('code');
  button.disabled = false;
  button.classList.add('ready');
  button.textContent = `Baixar ${release.version}`;
  button.onclick = () => { window.location.href = url; };
  code.textContent = `${formatBytes(artifact.sizeBytes)} · ${artifact.sha256.slice(0, 22)}…`;
}
async function loadRelease() {
  try {
    const response = await fetch('./releases/latest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const release = payload.manifest || payload;
    if (release.status !== 'ready') {
      const version = release.version ? ` // ${release.version}` : '';
      releaseStatus.textContent = `Founder channel${version} // release candidate validado // publicação pública aguardando assinatura Windows`;
      return;
    }
    if (!payload.signature || !payload.keyId) {
      releaseStatus.textContent = 'Founder channel // release bloqueado: manifesto sem assinatura';
      return;
    }
    for (const card of cards) {
      const platform = card.dataset.platform;
      const artifacts = release.artifacts || [];
      const artifact = artifacts.find((item) => item.platform === platform && item.kind === 'setup-exe')
        || artifacts.find((item) => item.platform === platform);
      if (artifact) activateArtifact(card, artifact, release);
    }
    releaseStatus.textContent = `Founder channel // ${release.version} // assinatura presente // ${payload.keyId.slice(0, 28)}…`;
  } catch (error) {
    releaseStatus.textContent = `Founder channel // releases ainda não publicados (${error.message})`;
  }
}

loadRelease();
