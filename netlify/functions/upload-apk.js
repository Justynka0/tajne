const fs = require('fs');
const path = require('path');
const formidable = require('formidable');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const form = new formidable.IncomingForm();
    
    return new Promise((resolve) => {
      form.parse(event, async (err, fields, files) => {
        if (err) {
          resolve({ statusCode: 500, body: JSON.stringify({ error: err.message }) });
          return;
        }

        const apkFile = files.apk;
        const version = fields.version;
        
        // Ścieżka do głównego folderu projektu
        const projectRoot = path.join(__dirname, '../../');
        const apkPath = path.join(projectRoot, 'nextbus.apk');
        
        // Usuń stary APK (jeśli istnieje)
        if (fs.existsSync(apkPath)) {
          fs.unlinkSync(apkPath);
        }
        
        // Zapisz nowy APK
        fs.copyFileSync(apkFile.filepath, apkPath);
        
        // Zaktualizuj version.json
        const versionPath = path.join(projectRoot, 'version.json');
        const versionData = {
          latest_version: version,
          min_required_version: version,
          download_url: `${process.env.URL}/nextbus.apk`,
          last_updated: new Date().toISOString()
        };
        
        fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
        
        resolve({
          statusCode: 200,
          body: JSON.stringify({ success: true, message: 'APK uploaded successfully' })
        });
      });
    });
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
