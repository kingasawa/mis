# SETUP NGINX
sudo apt-get update
sudo apt-get install nginx

cd ../etc
rm -rf nginx
git clone https://github.com/kingasawa/nginx.git

# INSTALL SSL LET'S ENCRYPT
- Clone Let's Encrypt repository
git clone https://github.com/letsencrypt/letsencrypt /opt/letsencrypt

- Stop Nginx
service nginx stop

- Install Let's Encrypt
/opt/letsencrypt/certbot-auto certonly --standalone

- Auto renew
EDITOR=nano crontab -e

30 2 * * * /opt/letsencrypt/certbot-auto renew --pre-hook "service nginx stop" --post-hook "service nginx start" >> /var/log/le-renew.log

# PULL CODE
