#!/bin/bash

COMMIT_MSG=$1
INSTALL_DIR=crostini
LATEST=$(gdrive list | grep crostini | head -1 | awk '{print $1}')
VERSION=$(cat manifest.json | grep \"version\" | awk -F: '{print $2}' | sed 's/"//g' | tr -d '[:space:]')

gdrive download $LATEST
mv *.zip /tmp/crostini.zip
unzip /tmp/crostini.zip -d ../
rm -rf *
mv ../$INSTALL_DIR/* ./
test -d ../$INSTALL_DIR && rm -r ../$INSTALL_DIR
git checkout build.sh

zip -r ../crostini_$VERSION.zip . -x *.git* -x build.sh

if (test -n "$COMMIT_MSG"); then
	git add .
	git commit -am "$COMMIT_MSG"
	git push
	gdrive upload ../crostini_$VERSION.zip
fi
