#!/bin/sh

tempDir=".build"

rm -rf ${tempDir}
mkdir -p ${tempDir}
cd ${tempDir}
git clone https://github.com/IjzerenHein/famous-flex
cd famous-flex
npm install
npm run-script global-no-famous
rm ../../lib/*
cp ./dist/* ../../lib/
cd -
cd -
