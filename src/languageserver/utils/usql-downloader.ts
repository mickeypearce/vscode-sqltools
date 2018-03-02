import path = require('path');
import fs = require('fs');
import util = require('util');
import yauzl = require('yauzl');
import axios from 'axios';
import Logger from './logger';
import Process from './process';

const perArchCfg = {
  'darwin-x64': 'usql-0.6.0-darwin-amd64.tar.bz2',
  'linux-x64': 'usql-0.6.0-linux-amd64.tar.bz2',
  'win32-x64': 'usql-0.6.0-windows-amd64.zip',
};

namespace USQLDowloader {
  const platform = process.platform;
  const arch = process.arch;
  const binRelativePath = platform === 'win32' ? 'usql.exe' : 'usql';
  const usqlVersion = 'v0.6.0';
  const baseUrl = `https://github.com/xo/usql/releases/download/${usqlVersion}/`;
  let extPath = null;
  let installed = false;

  export async function checkAndDownload(languageServerPath: string) {
    extPath = path.join(languageServerPath, 'bin');
    try { fs.mkdirSync(extPath); } catch (e) { /**/ }
    if (usqlInstalled() && await usqlUpdated()) {
      return void 0;
    }
    download()
      .then(extract)
      .catch((e) => Logger.error('Error', e));
    return void 0;
  }

  export function getBinPath() {
    return path.join(extPath, binRelativePath);
  }

  function getDownloadPath() {
    return path.join(extPath, `${perArchCfg[`${platform}-${arch}`]}`);
  }

  function usqlInstalled() {
    if (installed) return true;
    installed = fs.existsSync(getBinPath());
    return installed;
  }

  async function usqlUpdated() {
    return true;
  }

  async function download() {
    if (!perArchCfg[`${platform}-${arch}`]) throw new Error(`Platform not supported! ${`${platform}-${arch}`}`);
    const url = `${baseUrl}${perArchCfg[`${platform}-${arch}`]}`;
    return axios.request({
      responseType: 'stream',
      url,
      method: 'get',
    }).then((response) => {
      return new Promise((resolve, reject) => {
        const stream = response.data.pipe(fs.createWriteStream(getDownloadPath()));
        stream.on('error', reject);
        stream.on('finish', () => {
          Logger.log('Downloaded!');
          resolve();
        });
      });
    }).catch((e) => {
      Logger.error('Error during download', e);
      fs.unlinkSync(getDownloadPath());
      return Promise.reject(e);
    });
  }

  async function extract() {
    const downloadPath = getDownloadPath();
    let promise = null;
    if (path.extname(downloadPath) === '.bz2') { // darwin and unix
      promise = Process.run('tar', ['-xvjf', downloadPath, '-C', path.dirname(downloadPath)]);
    } else {
      promise = new Promise((resolve, reject) => {
        yauzl.open(downloadPath, { lazyEntries: true }, (err, zipfile) => {
          if (err) return reject({error: err.toString()});
          zipfile.readEntry();
          zipfile.on('entry', (entry) => {
            if (/\/$/.test(entry.fileName)) {
              zipfile.readEntry();
              return void 0;
            }
            zipfile.openReadStream(entry, (e, readStream) => {
              if (e) return reject({error: e.toString()});
              readStream.on('end', () => {
                zipfile.readEntry();
              });
              const output = path.join(path.dirname(downloadPath), path.basename(entry.fileName));
              readStream.pipe(fs.createWriteStream(output));
            });
          });

          zipfile.on('end', () => resolve({code: 0 }));
        });
      });
    }
    return promise
      .then(({ code, signal }) => {
        fs.unlink(downloadPath, () => void 0);
        return Promise.resolve(true);
      })
      .catch(({ code, signal, error }) => {
        fs.unlink(downloadPath, () => void 0);
        return Promise.reject(error);
      });
  }
}

export default USQLDowloader;
