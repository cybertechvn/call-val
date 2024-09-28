
echo "
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=STATIC:10m inactive=7d use_temp_path=off;

upstream nextjs_upstream {
  server nextjs:3000;
}

server { 
  listen 80 default_server;

  server_name _;

  server_tokens off;

  gzip on;
  gzip_proxied any;
  gzip_comp_level 4;
  gzip_types text/css application/javascript image/svg+xml;

  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection 'upgrade';
  proxy_set_header Host $host;
  proxy_cache_bypass $http_upgrade;

  location /assets/common/ {
    proxy_pass $3;
  }

  location /assets/public/ {
    proxy_pass $4;
  }

  location /assets/ {
    proxy_pass $2;
  }

  location /cdn/common/ {
    proxy_pass $3;
  }

  location /cdn/public/ {
    proxy_pass $4;
  }

  location /cdn/ {
    proxy_pass $2;
  }

  location ~ ^/(api|account|payment|report|common)/ {
    proxy_set_header EL-Real-IP \$http_cf_connecting_ip;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-NginX-Proxy true;
    proxy_pass http://$1\$request_uri;
  }
  
  location /_next/static {
    proxy_cache STATIC;
    proxy_pass http://nextjs_upstream;
  }

  location /static {
    proxy_cache STATIC;
    proxy_ignore_headers Cache-Control;
    proxy_cache_valid 60m;
    proxy_pass http://nextjs_upstream;
  }

  location / {
    proxy_pass http://nextjs_upstream;
  }
}
"
