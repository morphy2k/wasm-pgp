'use strict';

const openpgp = async (sel, url) => {
  const form = document.querySelector(sel);
  if (form === null) return;

  const worker = new Worker('/ressources/js/worker.js');

  const text = form.querySelector('textarea');
  const encrypt = form.querySelector('input[name="encrypt"]');
  const submit = form.querySelector('input[type="submit"]');

  let message = '';
  let ciphertext = '';

  const loadKey = async () => {
    const resp = await fetch(url);
    worker.postMessage(['keyload', await resp.text()]);
  };

  worker.onmessage = e => {
    const event = e.data[0];
    const data = e.data[1];

    switch (event) {
      case 'init':
        loadKey()
          .then(() => encrypt.disabled = false)
          .catch(err => console.error(err));
        break;
      case 'encrypt':
        ciphertext = data;
        text.value = ciphertext;
        submit.disabled = false;
        encrypt.value = 'Plaintext';
        encrypt.title = 'Show unecrypted message'
        encrypt.disabled = false;
        break;
      default:
        console.error(new Error('Unknown event received'));
    }
  };

  encrypt.addEventListener('click', () => {
    if (text.value.length === 0) return;

    if (text.value === ciphertext) {
      text.value = message;
      text.readOnly = false;
      encrypt.value = 'Encrypt';
      encrypt.title = 'Encrypt message with OpenPGP';
      return;
    }

    text.readOnly = true;
    message = text.value;
    encrypt.disabled = true;
    submit.disabled = true;

    worker.postMessage(['encrypt', message]);
  });
};
openpgp('form', '/pub.asc');
