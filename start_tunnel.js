const localtunnel = require('/root/.nvm/versions/node/v24.1.0/lib/node_modules/localtunnel');
const fs = require('fs');

const outStream = fs.createWriteStream('/workspace/tunnel_url.txt', { flags: 'w' });

try {
  localtunnel({ port: 8080 }, (err, tunnel) => {
    if (err) {
      outStream.write('ERR:' + err.message + '\n');
      outStream.end();
      return;
    }
    outStream.write('URL:' + tunnel.url + '\n');
    outStream.write('PORT:' + tunnel.port + '\n');
    outStream.end();
    console.log('TUNNEL_URL=' + tunnel.url);
    
    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });
  });
} catch(e) {
  outStream.write('EXCEPTION:' + e.message + '\n');
  outStream.end();
}
