#!/bin/sh
# Renders config.in as YAML.
sed "s/ = /: /" "$1"
