#!/usr/bin/env sh

echo "copying image from Dockerfile.build container to host's shared_volume"

image_location=$(echo `readlink -f ./docker-image.tar.gz`)

cp ${image_location} ./shared_volume/docker-image.tar.gz