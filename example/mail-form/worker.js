'use strict';

importScripts('wasm_exec.js');

const init = async key => {
  try {
    const go = new Go();
    const wasm = await WebAssembly.instantiateStreaming(fetch("wasm-pgp.wasm"), go.importObject);
    go.run(wasm.instance);
    postMessage(['init']);
  } catch (err) {
    postMessage(['error', err]);
  }
};
init();

var output = '';
onmessage = e => {
  const event = e.data[0];
  const data = e.data[1];

  switch (event) {
    case 'keyload':
      loadArmoredKey(data);
      break;
    case 'encrypt':
      encryptMessage(data, 'output');
      const check = setInterval(() => {
        if (output.length > 0) {
          postMessage(['encrypt', output]);
          clearInterval(check);
        }
      }, 200);
      break;
    default:
      postMessage(['error', new Error('Unknown event received')]);
  }
};
