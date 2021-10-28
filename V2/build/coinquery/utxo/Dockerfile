FROM golang:1.12-stretch

ENV DOCKERIZE_VERSION v0.6.1
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz

ARG COIN
ARG ENVIRONMENT
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY

ENV ENVIRONMENT $ENVIRONMENT
ENV AWS_ACCESS_KEY_ID $AWS_ACCESS_KEY_ID
ENV AWS_SECRET_ACCESS_KEY $AWS_SECRET_ACCESS_KEY

RUN go get github.com/cespare/reflex

COPY reflex.conf /

RUN sed -i "s/COIN/$COIN/g" /reflex.conf
RUN sed -i "s/CONFIG/config\/${ENVIRONMENT}.json/g" /reflex.conf

CMD ["dockerize", "-wait", "tcp://postgres:5432", "-timeout", "1m", "reflex", "-c", "/reflex.conf"]
