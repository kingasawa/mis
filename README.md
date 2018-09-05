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

# INSTALL NVM
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
nvm install v8.11.3
nvm use v8.11.3

#INSTALL PM2
npm install pm2 -g

# INSTALL DOCKER
apt install docker.io

# DOCKER RUN REDIS
docker run --name redis \
  --net=host \
  --restart=always \
  -d \
  redis redis-server

# INSTALL POSTGRES
sudo apt-get install postgresql postgresql-contrib
sudo -i -u postgres
psql
CREATE USER nicecode with PASSWORD 'Tu)!Tr#H4ck';
CREATE DATABASE misdb;
GRANT ALL PRIVILEGES ON DATABASE misdb TO nicecode;

updatedb
locate postgresql.conf

FIX CONNECTION :
  https://blog.bigbinary.com/2016/01/23/configure-postgresql-to-allow-remote-connection.html
  -> sudo service postgresql restart


# PULL CODE

git clone
npm i
