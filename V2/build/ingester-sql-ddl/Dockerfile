FROM python:3

ENV DOCKERIZE_VERSION v0.6.1
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz

RUN apt-get update && apt-get install sqitch --assume-yes
RUN pip install future

ARG COIN

COPY . V2/build/ingester-sql-ddl
WORKDIR V2/build/ingester-sql-ddl

RUN ./build.py

WORKDIR gen/$COIN

ENTRYPOINT ["dockerize", "-wait", "tcp://postgres:5432", "-timeout", "1m"]
