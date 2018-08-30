# GCE new persistance
docker run --name redis \
  --net=host \
  --restart=always \
  -v /app/service/redis:/data \
  -d \
  redis redis-server --appendonly yes

# Dont use
  docker run --name mongo \
  --net=app \
  --restart=always \
  -v /app/service/mongo/data/db:/data/db \
  -d \
  mongo

  -p 6379:6379 \

  docker run --name redis \
  --net=host \
  --restart=always \
  -d \
  redis redis-server


  -v /app/service/redis/data:/data \

  //// INSTALL POSTGRES BEGIN ///
  sudo apt-get update
  sudo apt-get install postgresql postgresql-contrib

  sudo -i -u postgres
  ALTER USER postgres PASSWORD 'Diablo321';

  CREATE USER nicecode with PASSWORD 'Tu)!Tr#H4ck';
   
  CREATE DATABASE misdb;
   
  GRANT ALL PRIVILEGES ON DATABASE misdb TO nicecode;

  /// END INSTALL POSTGRES ///



  FIX CONNECTION :
  https://blog.bigbinary.com/2016/01/23/configure-postgresql-to-allow-remote-connection.html
  -> sudo service postgresql restart
