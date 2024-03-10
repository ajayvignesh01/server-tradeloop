reload_nginx() {  
  docker exec nginx /usr/sbin/nginx -s reload  
}

zero_downtime_deploy() {
  service_name=web
  old_container_id=$(docker ps -f name=$service_name -q | tail -n1)

  # bring a new container online, running new code (nginx continues routing to the old container only)  
  docker compose up -d --no-deps --scale $service_name=2 --no-recreate $service_name --build

  # wait for new container to be available
  new_container_id=$(docker ps -f name=$service_name -q | head -n1)
  new_container_ip=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $new_container_id)
  curl --retry-connrefused --retry 10 --retry-delay 1 --fail $new_container_ip:9000/_internal/health || exit 1

  # update nginx.conf with the new container IP or hostname
  sed -i "s/web/$new_container_ip/g" nginx.conf

  # start routing requests to the new container
  reload_nginx

  # take the old container offline (handle SIGTERM or set -t according to your needs)
  docker stop $old_container_id
  docker rm $old_container_id
  docker compose up -d --no-deps --scale $service_name=1 --no-recreate $service_name

  # reset nginx config
  sed -i "s/$new_container_ip/web/g" nginx.conf

  # stop routing requests to the old container  
  reload_nginx
}

zero_downtime_deploy