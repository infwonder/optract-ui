FROM infwonder/ubuntu-builder as builder
MAINTAINER jasonlin@11be.org

USER root
RUN mkdir -p /optract
WORKDIR /optract

COPY package.json /optract
COPY package-lock.json /optract
RUN npm install

COPY src /optract/src
COPY public /optract/public
COPY webpack.config.js /optract

RUN npm run build

FROM nginx

COPY --from=builder /optract/public/* /usr/share/nginx/html/

EXPOSE 80

ENTRYPOINT ["/usr/sbin/nginx"]
CMD ["-g", "daemon off;"]
