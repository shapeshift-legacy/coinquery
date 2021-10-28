FROM ubuntu:xenial
# USER root (default)

# create cqdev user
RUN useradd --create-home --shell /bin/bash cqdev 

# persistent storage of blockchain data in a docker volume on the host
ENV BITCOIN_BSV_DATA=/home/cqdev/.blockchain
RUN mkdir -p ${BITCOIN_BSV_DATA}
RUN chmod 700 /home/cqdev
RUN chown -R cqdev:cqdev /home/cqdev
VOLUME [${BITCOIN_BSV_DATA}]

############# Install Bitcoin SV ####################

# install utilities and dependencies for building bitcoin-sv
RUN apt-get update
RUN apt-get install -y software-properties-common
RUN add-apt-repository ppa:ubuntu-toolchain-r/test
RUN apt-get update
RUN apt-get install procps vim libtool pkg-config build-essential autoconf automake \
  bsdmainutils libboost-all-dev autotools-dev libssl-dev gcc-7 g++-7 libevent-dev curl \
  libzmq3-dev --assume-yes
RUN apt-get install -y unzip

# fetch bitcoin-sv
WORKDIR /opt
RUN curl -L https://github.com/bitcoin-sv/bitcoin-sv/releases/download/v0.1.0/bitcoin-sv-0.1.0-x86_64-linux-gnu.tar.gz > bitcoin-sv.tar.gz \
    && tar -xvf bitcoin-sv.tar.gz \
    && rm *.tar.gz

RUN cp /opt/bitcoin-sv-0.1.0/bin/bitcoind /usr/local/bin/
RUN cp /opt/bitcoin-sv-0.1.0/bin/bitcoin-cli /usr/local/bin/

############# Install Node.js ####################

WORKDIR /home/cqdev
RUN curl -SL https://deb.nodesource.com/setup_8.x | bash
RUN apt-get install -y nodejs

# remove build deps
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /opt/*

############# Install Insight ####################

USER cqdev
ENV NPM_CONFIG_PREFIX=/home/cqdev/.npm-global
ENV PATH=$PATH:/home/cqdev/.npm-global/bin
RUN npm install -g bitcore-node@3.1.3

WORKDIR /home/cqdev/
RUN bitcore-node create -d ${BITCOIN_BSV_DATA} /home/cqdev/mynode

WORKDIR /home/cqdev/mynode
RUN bitcore-node install insight-api
COPY bitcore-node.json /home/cqdev/mynode/

COPY bitcoin.conf /home/cqdev/mynode/

# insight, rpc ports
EXPOSE 3001 8332

ARG COMMIT
ENV COMMIT ${COMMIT:-undefined}

# always run on container start
COPY start.sh ./start.sh
CMD ["./start.sh"]
