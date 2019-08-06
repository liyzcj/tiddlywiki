#!/usr/bin/env bash

cd TiddlyWiki5

nohup ./bin/serve.sh ../notebook "liyzcj" "liYANzhe" "0.0.0.0" "8912" > ../output.log 2>&1 &
