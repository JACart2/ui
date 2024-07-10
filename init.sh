#!/bin/bash
IMAGE_NAME=ui
CONTAINER_NAME=ui

sudo docker build -t $IMAGE_NAME -f ./Dockerfile . 

XSOCK=/tmp/.X11-unix
sudo docker run --rm -it\
	-e DISPLAY=$DISPLAY \
	-v $XSOCK:$XSOCK \
	-v $HOME/.Xauthority:/root/.Xauthority \
	--privileged \
	--network=host \
	--name $CONTAINER_NAME \
	$IMAGE_NAME bash 
