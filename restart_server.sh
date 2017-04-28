#!/usr/bin/env bash

# Get IP address
IPADDR=`/sbin/ifconfig eth0 | grep 'inet addr:' | cut -d: -f2 | awk '{ print $1}'`

# If this is the server, specify home directory
#   Otherwise, get the execution directory of the server
if [ "$IPADDR" == "138.68.15.82" ]; then
    ISSERVER=true
    SERVERDIR=/home/cellswiper/
else
    ISSERVER=false
    SERVERDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
fi

# Go to server directory
cd $SERVERDIR

# Stop process (should always be process 0)
# TODO: make this more robust so multiple versions can be running
echo `forever stop 0`

# Update the current branch
echo `git pull`
# Pull master branch only if on server
#if $ISSERVER ; then
#    echo `git checkout master`
#    echo `git pull`
#fi

# Update npm dependencies
echo `npm install`

# Restart server
#   and suppress vips warnings
echo `VIPS_WARNING=0 forever start app.js`

echo -e "\e[1;34mServer restart attempted\e[0m"
