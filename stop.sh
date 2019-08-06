#!/usr/bin/env bash 

pid=$(ps -ef | grep tiddlywiki.js | grep node | awk '{print $2}')

kill $pid
