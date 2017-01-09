#!/usr/bin/env bash

MODE=test

#set pwd
cd /opt/app/current

#echo out environment variables we care about
echo APPLICATION_VARIABLES
echo NODE_ENV=$NODE_ENV

#check for port on pg box
waitOnResources()
{
    while ! nc -z pgbox 5432; do
		sleep 1
		echo WAITING FOR pgbox:5432
	done

	#check for yellow status when es cluster consist of only a single box
	while [[ "yellow" != $(curl -s "esbox:9200/_cat/health?h=status" | tr -d '[:space:]') ]] ; do
		sleep 2
		echo WAITING FOR esbox:9200
	done
}

#execution based on argument
waitOnResources
echo RUNNING TEST
make test
