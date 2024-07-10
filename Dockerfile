FROM ubuntu:22.04

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y wget
RUN wget -O /tmp/nodesource_setup.sh https://deb.nodesource.com/setup_22.x 
RUN bash /tmp/nodesource_setup.sh
RUN apt-get install -y nodejs

RUN apt-get install -y python3 build-essential tmux

COPY . /code
WORKDIR /code
RUN npm install
COPY entry.sh /entry.sh
RUN chmod +x /entry.sh
ENTRYPOINT ["/bin/bash","/entry.sh"]
