FROM ubuntu:xenial
MAINTAINER KeepKey <tech@keepkey.com>

ARG COMMIT
ENV COMMIT ${COMMIT:-undefined}
ARG GITLAB_USERNAME
ARG GITLAB_PASSWORD

# Update OS
RUN apt-get update && \
    apt-get install -y curl tar git python && \
    rm -rf /var/lib/apt/lists/* /tmp/*

RUN curl -SL https://deb.nodesource.com/setup_8.x | bash
RUN apt-get install -y nodejs

RUN npm install typescript -g
RUN npm install yarn -g

# Create user and data directories
RUN useradd --create-home --shell /bin/bash cqdev

# Minotaur install:
WORKDIR /home/cqdev
RUN git clone https://${GITLAB_USERNAME}:${GITLAB_PASSWORD}@gitlab.com/ideas-by-nature/labyrinth/minotaur.git

# checkout staging branch 7/27/2018
RUN cd /home/cqdev/minotaur && git checkout d217c206dc50c3efd54de686f65417050e4f1f44
COPY config.ts /home/cqdev/minotaur/modules/ethereum/config/config.ts
COPY tsconfig.json /home/cqdev/minotaur

RUN chmod 777 -R /home/cqdev/minotaur/
WORKDIR /home/cqdev/minotaur
RUN yarn
RUN tsc; exit 0

COPY start-minotaur.sh /home/cqdev/start-minotaur.sh
RUN chown -R cqdev:cqdev /home/cqdev

#FROM node:carbon
#COPY --from=builder /home/cqdev /home/cqdev

USER cqdev
WORKDIR /home/cqdev
CMD ["./start-minotaur.sh"]
