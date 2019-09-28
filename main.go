package main

import (
	"bytes"
	"errors"
	"fmt"
	"log"
	"syscall/js"

	"golang.org/x/crypto/openpgp"
	"golang.org/x/crypto/openpgp/armor"
)

var (
	version = "unknown"
	pgpInst *pgp
)

type pgp struct {
	Type   string
	Header map[string]string

	EntityList openpgp.EntityList
}

// AddArmoredKeyRing adds an armored PGP keyring into entity list
func (p *pgp) AddArmoredKeyRing(kr []byte) (err error) {
	el, err := openpgp.ReadArmoredKeyRing(bytes.NewReader(kr))
	if err != nil {
		return
	}
	pgpInst.EntityList = append(pgpInst.EntityList, el...)
	return
}

// Encrypt encrypts a plaintext into ASCII armored format
func (p *pgp) Encrypt(pt []byte) (b *bytes.Buffer, err error) {
	b = bytes.NewBuffer(nil)

	w, err := armor.Encode(b, p.Type, p.Header)
	if err != nil {
		return
	}

	t, err := openpgp.Encrypt(w, p.EntityList, nil, nil, nil)
	if err != nil {
		return
	}

	_, err = t.Write(pt)
	if err != nil {
		return
	}

	t.Close()
	w.Close()

	return
}

// Decrypt decrypts an ASCII armored cipertext
func (p *pgp) Decrypt(ct []byte) (md *openpgp.MessageDetails, err error) {
	b, err := armor.Decode(bytes.NewReader(ct))
	if err != nil {
		return
	}

	if b.Type != pgpInst.Type {
		err = errors.New("Invalid message type")
		return
	}

	md, err = openpgp.ReadMessage(b.Body, p.EntityList, nil, nil)

	return
}

func addArmoredKeyRing(i []js.Value) {
	err := pgpInst.AddArmoredKeyRing([]byte(i[0].String()))
	if err != nil {
		log.Println(err)
		return
	}

	log.Println("Armored keyring successfully added")
}

func removeKeys(_ []js.Value) {
	pgpInst.EntityList = openpgp.EntityList{}
	log.Println("All keys successfully removed")
}

func encryptMessage(i []js.Value) {
	msg, err := pgpInst.Encrypt([]byte(i[0].String()))
	if err != nil {
		log.Println(err)
		return
	}

	js.Global().Set(i[1].String(), msg.String())
	log.Println("Message successfully encrypted")
}

func decryptMessage(i []js.Value) {
	md, err := pgpInst.Decrypt([]byte(i[0].String()))
	if err != nil {
		log.Println(err)
		return
	}

	b := new(bytes.Buffer)
	b.ReadFrom(md.UnverifiedBody)

	js.Global().Set(i[1].String(), b.String())
	log.Println("Message successfully decrypted")
}

func registerFunctions() {
	js.Global().Set("addArmoredKeyRing", addArmoredKeyRing)
	js.Global().Set("encryptMessage", encryptMessage)
	js.Global().Set("decryptMessage", decryptMessage)
	js.Global().Set("removeKeys", removeKeys)
}

func main() {
	c := make(chan struct{}, 0)

	pgpInst = &pgp{
		Type: "PGP MESSAGE",
		Header: map[string]string{
			"Comment": fmt.Sprintf("Generated by morphy2k/wasm-pgp %s", version),
		},
	}

	registerFunctions()

	log.Println(fmt.Sprintf("WasmPGP %s initialized", version))

	<-c
}
