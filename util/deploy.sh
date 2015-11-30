#!/usr/bin/env bash

function main() {
  declare -r server=$(docker-machine active)

  if [ "${server}" != "do01.hw.docken.xyz" ]; then
    echo "Can not deploy to machine: ${server}"
    exit 1
  fi

  docker-compose -f docker-compose-prod.yml build --pull || exit 1
  docker-compose -f docker-compose-prod.yml up -d || exit 1
  docker-compose -f docker-compose-prod.yml logs www
}

main
