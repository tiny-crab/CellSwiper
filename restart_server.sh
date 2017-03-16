#!/usr/bin/env bash

# Get IP address
IPADDR=`/sbin/ifconfig eth0 | grep 'inet addr:' | cut -d: -f2 | awk '{ print $1}'`

# If this is the server, specify home directory
#   Otherwise, get CLI arg
if [ "$IPADDR" == "138.68.15.82" ]; then
    SERVERDIR=/home/cellswiper/
else
    SERVERDIR=$1
fi

# Go to server directory
cd $SERVERDIR

# Stop process (should always be process 0)
echo `forever stop 0`

# Pull master branch
echo `git checkout master`
echo `git pull`

# Restart server
#   TODO standardize name
echo `forever start test.js`

echo -e "\e[1;34mServer restart attempted\e[0m"