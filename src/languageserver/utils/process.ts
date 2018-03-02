import child_process = require('child_process');

const { spawn } = child_process;

namespace Process {
  export async function run(cmd: string, args: string[]) {
    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args);
      let result = '';
      let error = '';

      proc.stdout.on('data', (data) => void (result += data.toString()));

      proc.stderr.on('data', (data) => void (error += data.toString()));

      proc.on('close', (code, signal) => {
        if (code !== 0) {
          return reject({error, code});
        }
        return resolve({result, error, code});
      });
    });
  }
}

export default Process;
