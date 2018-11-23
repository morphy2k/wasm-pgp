'use strict';

importScripts('wasm_exec.js');

const init = async () => {
  try {
    const go = new Go();
    const wasm = await WebAssembly.instantiateStreaming(fetch("../wasm/wasm-pgp.wasm"), go.importObject);
    go.run(wasm.instance);
    postMessage(['init']);
  } catch (err) {
    console.error(err);
  }
};
init();

const targetVar = 'output';
onmessage = e => {
  const event = e.data[0];
  const data = e.data[1];

  switch (event) {
    case 'addKey':
      addArmoredKeyRing(data);
      break;
    case 'encrypt':
      encryptMessage(data, targetVar);
      getOutput()
        .then(out => postMessage(['encrypt', out]))
        .catch(err => console.error(err));
      break;
    case 'decrypt':
      decryptMessage(data, targetVar);
      getOutput()
        .then(out => postMessage(['decrypt', out]))
        .catch(err => console.error(err));
      break;
    default:
      console.error(new Error('Unknown event received'));
  }

  output = null;
};

var output;
const getOutput = () => new Promise((resolve, reject) => {
  const count = 20;
  const time = 100;
  let i = 0;
  const check = setInterval(() => {
    i++;
    if (output && output.length > 0) {
      clearInterval(check);
      resolve(output);
    }
    if (i === count) {
      clearInterval(check);
      reject(new Error('No output within given time'));
    }
  }, time);
});
