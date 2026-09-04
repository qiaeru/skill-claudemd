CC = arm-none-eabi-gcc

all: gen
	$(CC) -o build/firmware.elf src/*.c

gen:
	./scripts/gen-config.sh config.in > build/config.yaml

test:
	$(MAKE) -C tests all

test-one:
	$(MAKE) -C tests one T=$(T)

.PHONY: all gen test test-one
