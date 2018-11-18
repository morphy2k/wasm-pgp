OUT := wasm-pgp.wasm
VERSION := $(shell git describe --always --long)

all: run

bin:
	GOOS=js GOARCH=wasm go build -v -o ${OUT} -ldflags="-X main.version=${VERSION}"

lint:
	revive -config revive.toml -formatter stylish ./...

fmt:
	go fmt ./...

run: bin
	./${OUT}

clean:
	-@rm ${OUT} ${OUT}-v*
