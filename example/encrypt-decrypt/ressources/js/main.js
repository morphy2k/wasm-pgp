'use strict';

const openpgp = async () => {
  const worker = new Worker('/ressources/js/worker.js');

  const encryption = document.querySelector('form[name="encryption"]');
  const encryptInput = encryption.querySelector('textarea');
  const encryptBTN = encryption.querySelector('input[name="encrypt"]');

  const decryption = document.querySelector('form[name="decryption"]');
  const decryptInput = decryption.querySelector('textarea');
  const decryptBTN = decryption.querySelector('input[name="decrypt"]');

  let plaintext = '';
  let cipertext = '';

  const addKeyRing = async url => {
    const resp = await fetch(url);
    worker.postMessage(['addKey', await resp.text()]);
  };

  worker.onmessage = e => {
    const event = e.data[0];
    const data = e.data[1];

    switch (event) {
      case 'init':
        addKeyRing('/keys.asc')
          .then(() => {
            encryptBTN.disabled = false;
            decryptBTN.disabled = false;
          })
          .catch(err => console.error(err));
        break;
      case 'encrypt':
        encryptInput.value = data;
        encryptBTN.value = 'Revert';
        encryptBTN.title = 'Show unecrypted message';
        encryptBTN.disabled = false;
        break;
      case 'decrypt':
        decryptInput.value = data;
        decryptBTN.value = 'Clear';
        decryptBTN.title = 'Clear text box';
        decryptBTN.disabled = false;
        break;
      default:
        console.error(new Error('Unknown event received'));
    }
  };

  encryptBTN.addEventListener('click', () => {
    if (encryptInput.value.length === 0) return;

    if (encryptBTN.value === 'Revert') {
      encryptInput.value = plaintext;
      encryptInput.readOnly = false;
      encryptBTN.value = 'Encrypt';
      encryptBTN.title = 'Encrypt message with OpenPGP';
      return;
    }

    encryptInput.readOnly = true;
    plaintext = encryptInput.value;
    encryptBTN.disabled = true;

    worker.postMessage(['encrypt', plaintext]);
  });

  decryptBTN.addEventListener('click', () => {
    if (decryptInput.value.length === 0) return;

    if (decryptBTN.value === 'Clear') {
      decryptInput.value = '';
      decryptInput.readOnly = false;
      decryptBTN.value = 'Decrypt';
      decryptBTN.title = 'Decrypt message with OpenPGP';
      return;
    }

    decryptInput.readOnly = true;
    cipertext = decryptInput.value;
    decryptBTN.disabled = true;

    worker.postMessage(['decrypt', cipertext]);
  });
};
openpgp();
