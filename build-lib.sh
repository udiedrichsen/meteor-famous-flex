#!/bin/sh

version="0.3.1"
tempDir=".build"

rm -rf ${tempDir}
mkdir -p ${tempDir}
cd ${tempDir}
git clone https://github.com/IjzerenHein/famous-flex
cd famous-flex
npm install
npm run-script global-no-famous
cp ./dist/famous-flex-global.js ../../lib/flex-scrollview.js
cd -
cd -
