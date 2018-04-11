#!/bin/bash

zip -r ../crostini$1.zip . -x *.git* -x build.sh
