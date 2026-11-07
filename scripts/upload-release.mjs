import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function getToken() {
  const input = 'protocol=https\nhost=github.com\n\n';
  const out = execSync('git credential fill', { input }).toString();
  const match = out.match(/password=(.+)/);
  if (!match) throw new Error('No se pudo obtener el token de Git Credential Manager');
  return match[1].trim();
}

async function uploadRelease() {
  const token = getToken();
  const exePath = path.resolve('dist-exe/ElectromecanicaLince.exe');

  if (!fs.existsSync(exePath)) {
    throw new Error(`No se encontró el ejecutable en: ${exePath}`);
  }

  const fileStats = fs.statSync(exePath);
  console.log(`📦 Archivo encontrado: ${exePath} (${(fileStats.size / 1024 / 1024).toFixed(1)} MB)`);

  const repo = 'angelitoso-opp/electromecanica-lince';
  const tag = 'v1.0.6';

  // 1. Obtener o crear Release
  let releaseData = null;
  const getRes = await fetch(`https://api.github.com/repos/${repo}/releases/tags/${tag}`, {
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'ElectromecanicaLinceReleaseUploader',
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (getRes.status === 200) {
    releaseData = await getRes.json();
    console.log(`ℹ️ Release existente encontrado (ID: ${releaseData.id})`);
  } else {
    console.log(`🚀 Creando nuevo Release para el tag ${tag}...`);
    const createRes = await fetch(`https://api.github.com/repos/${repo}/releases`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'ElectromecanicaLinceReleaseUploader',
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tag_name: tag,
        name: 'Electromecánica Lince v1.0.6 - Portable',
        body: `### Electromecánica Lince v1.0.6 (Portable)\n\nVersión oficial optimizada para el taller de Don Timoteo.\n\n- Ejecutable único portable (no requiere instalar Node.js ni Git).\n- Correlatividad numérica segura (OT-10001, B-000001, F-000001).\n- Desglose de IGV 18% formal y RUC oficial SUNAT: 10082681537.\n- Blindaje contra cortes de energía y respaldos automáticos.\n\n**Descarga el archivo adjunto abajo:** \`ElectromecanicaLince.exe\``,
        draft: false,
        prerelease: false,
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Error al crear Release en GitHub (${createRes.status}): ${errText}`);
    }

    releaseData = await createRes.json();
    console.log(`✅ Release creado exitosamente (ID: ${releaseData.id})`);
  }

  // 2. Comprobar si ya existe un asset con ese nombre para eliminarlo antes de re-subir
  if (releaseData.assets && releaseData.assets.length > 0) {
    const existingAsset = releaseData.assets.find((a) => a.name === 'ElectromecanicaLince.exe');
    if (existingAsset) {
      console.log(`🗑️ Eliminando asset anterior (ID: ${existingAsset.id})...`);
      await fetch(`https://api.github.com/repos/${repo}/releases/assets/${existingAsset.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'ElectromecanicaLinceReleaseUploader',
        },
      });
    }
  }

  // 3. Subir el archivo .exe al Release
  const uploadUrl = releaseData.upload_url.split('{')[0] + '?name=ElectromecanicaLince.exe';
  console.log(`⬆️ Subiendo ElectromecanicaLince.exe (${(fileStats.size / 1024 / 1024).toFixed(1)} MB) a GitHub...`);

  const fileBuffer = fs.readFileSync(exePath);

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'ElectromecanicaLinceReleaseUploader',
      'Content-Type': 'application/vnd.microsoft.portable-executable',
      'Content-Length': String(fileStats.size),
    },
    body: fileBuffer,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Error al subir el ejecutable a GitHub (${uploadRes.status}): ${errText}`);
  }

  const uploadedAsset = await uploadRes.json();
  console.log(`🎉 ¡ÉXITO! Ejecutable subido correctamente.`);
  console.log(`🔗 URL de descarga directa: ${uploadedAsset.browser_download_url}`);
  console.log(`🌐 Página del Release: ${releaseData.html_url}`);
}

uploadRelease().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
