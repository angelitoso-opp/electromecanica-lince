import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const electronDistDir = path.join(rootDir, 'node_modules', 'electron', 'dist');
const electronInstallScript = path.join(rootDir, 'node_modules', 'electron', 'install.js');
const standaloneDir = path.join(rootDir, '.next', 'standalone');
const stagingBaseDir = path.join(rootDir, '.next', 'exe-staging');
const runtimeStagingDir = path.join(stagingBaseDir, 'runtime');
const outBaseDir = path.join(rootDir, 'dist-exe');
const finalSingleExePath = path.join(outBaseDir, 'ElectromecanicaLince.exe');

if (!fs.existsSync(electronDistDir) && fs.existsSync(electronInstallScript)) {
  console.log('⬇️ Descargando binario nativo de Electron para Windows x64...');
  execSync(`node "${electronInstallScript}"`, { cwd: rootDir, stdio: 'inherit' });
}

if (!fs.existsSync(electronDistDir)) {
  console.error('❌ No se encontró node_modules/electron/dist. Ejecuta "npm install" primero.');
  process.exit(1);
}

if (!fs.existsSync(standaloneDir)) {
  console.error('❌ No se encontró .next/standalone. Ejecuta "npm run build" primero.');
  process.exit(1);
}

console.log('📦 Construyendo paquete de runtime para Electromecánica Lince...');

// 1. Preparar directorio de staging limpio
if (fs.existsSync(stagingBaseDir)) {
  fs.rmSync(stagingBaseDir, { recursive: true, force: true });
}
fs.mkdirSync(runtimeStagingDir, { recursive: true });

// 2. Copiar runtime de Electron (incluyendo icudtl.dat, *.dll, *.pak)
fs.cpSync(electronDistDir, runtimeStagingDir, { recursive: true, force: true });

// 3. Optimizar tamaño eliminando idiomas no usados (conservando es, es-419, en-US) y licencias pesadas
const localesDir = path.join(runtimeStagingDir, 'locales');
if (fs.existsSync(localesDir)) {
  const keepLocales = new Set(['es.pak', 'es-419.pak', 'en-US.pak']);
  for (const file of fs.readdirSync(localesDir)) {
    if (!keepLocales.has(file)) {
      fs.rmSync(path.join(localesDir, file), { force: true });
    }
  }
}
const licenseHtml = path.join(runtimeStagingDir, 'LICENSES.chromium.html');
if (fs.existsSync(licenseHtml)) {
  fs.rmSync(licenseHtml, { force: true });
}

// 4. Eliminar default_app.asar para activar modo empaquetado
const defaultAppAsar = path.join(runtimeStagingDir, 'resources', 'default_app.asar');
if (fs.existsSync(defaultAppAsar)) {
  fs.rmSync(defaultAppAsar, { force: true });
}

// 5. Crear resources/app con el punto de entrada de Electron
const resourcesAppDir = path.join(runtimeStagingDir, 'resources', 'app');
fs.mkdirSync(path.join(resourcesAppDir, 'electron'), { recursive: true });

fs.copyFileSync(
  path.join(rootDir, 'electron', 'main.js'),
  path.join(resourcesAppDir, 'electron', 'main.js')
);

const appPkg = {
  name: 'electromecanica-lince',
  productName: 'Electromecánica Lince',
  version: '1.0.2',
  description: 'Sistema de Gestión Automotriz - Electromecánica Lince',
  main: 'electron/main.js',
  author: 'Electromecánica Lince (Jr. Soledad 330, Lince)',
};

fs.writeFileSync(
  path.join(resourcesAppDir, 'package.json'),
  JSON.stringify(appPkg, null, 2),
  'utf-8'
);

// 6. Copiar el servidor Next.js Standalone + SQLite limpio + Prisma a resources/standalone
const resourcesStandaloneDir = path.join(runtimeStagingDir, 'resources', 'standalone');
fs.cpSync(standaloneDir, resourcesStandaloneDir, { recursive: true, force: true });

// 7. Renombrar electron.exe interno -> ElectromecanicaLinceCore.exe
const srcExe = path.join(runtimeStagingDir, 'electron.exe');
const destCoreExe = path.join(runtimeStagingDir, 'ElectromecanicaLinceCore.exe');
if (fs.existsSync(srcExe)) {
  fs.renameSync(srcExe, destCoreExe);
}

// 8. Comprimir el runtime completo en payload.zip
const payloadZipPath = path.join(stagingBaseDir, 'payload.zip');
console.log('🗜️ Empaquetando todos los recursos (icudtl.dat, DLLs, servidor y SQLite) en contenedor único...');

const psZipCmd = `Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${runtimeStagingDir.replace(/'/g, "''")}', '${payloadZipPath.replace(/'/g, "''")}', [System.IO.Compression.CompressionLevel]::Fastest, $false)`;
execSync(`powershell -NoProfile -Command "${psZipCmd}"`, { stdio: 'inherit' });

// 9. Compilar el lanzador nativo de archivo único con csc.exe (.NET Framework integrado en Windows)
const csFilePath = path.join(stagingBaseDir, 'SingleFileStub.cs');
const stubExePath = path.join(stagingBaseDir, 'Stub.exe');

const csCode = `using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace ElectromecanicaLinceLauncher
{
    static class Program
    {
        private const string RUNTIME_VERSION = "v1.0.2";
        private const string MAGIC = "ELINCE01";

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string baseDir = Path.Combine(localAppData, "ElectromecanicaLince");
            string runtimeDir = Path.Combine(baseDir, "runtime-" + RUNTIME_VERSION);
            string coreExePath = Path.Combine(runtimeDir, "ElectromecanicaLinceCore.exe");
            string icuPath = Path.Combine(runtimeDir, "icudtl.dat");

            if (!File.Exists(coreExePath) || !File.Exists(icuPath))
            {
                if (!ExtractEmbeddedRuntime(baseDir, runtimeDir))
                {
                    return;
                }
            }

            try
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = coreExePath;
                psi.WorkingDirectory = runtimeDir;
                psi.UseShellExecute = false;
                Process.Start(psi);
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Error al iniciar Electromecánica Lince:\\n" + ex.Message,
                    "Electromecánica Lince",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }

        private static bool ExtractEmbeddedRuntime(string baseDir, string runtimeDir)
        {
            Form splash = new Form();
            splash.Text = "Electromecánica Lince";
            splash.FormBorderStyle = FormBorderStyle.FixedDialog;
            splash.StartPosition = FormStartPosition.CenterScreen;
            splash.ControlBox = false;
            splash.MaximizeBox = false;
            splash.MinimizeBox = false;
            splash.ClientSize = new Size(420, 135);
            splash.BackColor = Color.FromArgb(244, 246, 248);

            Label titleLabel = new Label();
            titleLabel.Text = "Electromecánica Lince · Sistema Automotriz";
            titleLabel.Font = new Font("Segoe UI", 10.5F, FontStyle.Bold);
            titleLabel.ForeColor = Color.FromArgb(19, 20, 22);
            titleLabel.AutoSize = false;
            titleLabel.Bounds = new Rectangle(24, 22, 372, 24);

            Label subLabel = new Label();
            subLabel.Text = "Preparando motor local y recursos (primera ejecución en esta PC)...";
            subLabel.Font = new Font("Segoe UI", 8.5F, FontStyle.Regular);
            subLabel.ForeColor = Color.FromArgb(91, 100, 112);
            subLabel.AutoSize = false;
            subLabel.Bounds = new Rectangle(24, 48, 372, 20);

            ProgressBar bar = new ProgressBar();
            bar.Style = ProgressBarStyle.Marquee;
            bar.MarqueeAnimationSpeed = 25;
            bar.Bounds = new Rectangle(24, 78, 372, 22);

            splash.Controls.Add(titleLabel);
            splash.Controls.Add(subLabel);
            splash.Controls.Add(bar);

            Exception extractError = null;
            bool done = false;

            Thread worker = new Thread(() =>
            {
                try
                {
                    string selfPath = Process.GetCurrentProcess().MainModule.FileName;
                    Directory.CreateDirectory(baseDir);
                    string tempZip = Path.Combine(baseDir, "runtime_temp_" + Guid.NewGuid().ToString("N") + ".zip");

                    using (FileStream fs = new FileStream(selfPath, FileMode.Open, FileAccess.Read, FileShare.Read))
                    {
                        if (fs.Length < 16)
                        {
                            throw new InvalidDataException("El archivo ejecutable está incompleto.");
                        }

                        fs.Seek(-16, SeekOrigin.End);
                        byte[] footer = new byte[16];
                        fs.Read(footer, 0, 16);

                        long zipLength = BitConverter.ToInt64(footer, 0);
                        string magic = Encoding.ASCII.GetString(footer, 8, 8);

                        if (magic != MAGIC || zipLength <= 0 || zipLength > fs.Length - 16)
                        {
                            throw new InvalidDataException("No se encontró el contenedor embebido del sistema.");
                        }

                        long zipOffset = fs.Length - 16 - zipLength;
                        fs.Seek(zipOffset, SeekOrigin.Begin);

                        using (FileStream outZip = new FileStream(tempZip, FileMode.Create, FileAccess.Write, FileShare.None))
                        {
                            byte[] buffer = new byte[1024 * 1024];
                            long remaining = zipLength;
                            while (remaining > 0)
                            {
                                int toRead = (int)Math.Min(buffer.Length, remaining);
                                int read = fs.Read(buffer, 0, toRead);
                                if (read <= 0) break;
                                outZip.Write(buffer, 0, read);
                                remaining -= read;
                            }
                        }
                    }

                    if (Directory.Exists(runtimeDir))
                    {
                        try { Directory.Delete(runtimeDir, true); } catch { }
                    }
                    Directory.CreateDirectory(runtimeDir);

                    ZipFile.ExtractToDirectory(tempZip, runtimeDir);

                    try { File.Delete(tempZip); } catch { }
                }
                catch (Exception ex)
                {
                    extractError = ex;
                }
                finally
                {
                    done = true;
                    try
                    {
                        splash.Invoke((MethodInvoker)delegate { splash.Close(); });
                    }
                    catch { }
                }
            });

            splash.Shown += (s, e) => worker.Start();
            splash.ShowDialog();

            while (!done)
            {
                Thread.Sleep(50);
            }

            if (extractError != null)
            {
                MessageBox.Show(
                    "No se pudo descomprimir el entorno local:\\n" + extractError.Message,
                    "Electromecánica Lince",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return false;
            }

            return true;
        }
    }
}
`;

fs.writeFileSync(csFilePath, csCode, 'utf-8');

const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
if (!fs.existsSync(cscPath)) {
  console.error('❌ No se encontró el compilador C# de Windows en:', cscPath);
  process.exit(1);
}

console.log('🔨 Compilando ejecutable portátil de archivo único (ElectromecanicaLince.exe)...');
execSync(
  `"${cscPath}" /nologo /target:winexe /optimize+ /out:"${stubExePath}" /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll "${csFilePath}"`,
  { stdio: 'inherit' }
);

// 10. Ensamblar el único archivo final: dist-exe/ElectromecanicaLince.exe
if (fs.existsSync(outBaseDir)) {
  fs.rmSync(outBaseDir, { recursive: true, force: true });
}
fs.mkdirSync(outBaseDir, { recursive: true });

const stubBuffer = fs.readFileSync(stubExePath);
const zipStat = fs.statSync(payloadZipPath);
const zipLength = BigInt(zipStat.size);

const footerBuffer = Buffer.alloc(16);
footerBuffer.writeBigInt64LE(zipLength, 0);
footerBuffer.write('ELINCE01', 8, 8, 'ascii');

const outStream = fs.createWriteStream(finalSingleExePath);
outStream.write(stubBuffer);

const zipStream = fs.createReadStream(payloadZipPath);
zipStream.pipe(outStream, { end: false });
zipStream.on('end', () => {
  outStream.write(footerBuffer);
  outStream.end();
});

outStream.on('finish', () => {
  try {
    fs.rmSync(stagingBaseDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
  const finalSizeMB = (fs.statSync(finalSingleExePath).size / (1024 * 1024)).toFixed(1);
  console.log(`✅ ¡Ejecutable de ARCHIVO ÚNICO generado con éxito! (${finalSizeMB} MB)`);
  console.log(`👉 Archivo único portable: ${finalSingleExePath}`);
});
