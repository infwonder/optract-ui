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

COPY --from=builder /optract/public/*.html /usr/share/nginx/html/
COPY --from=builder /optract/public/*.css /usr/share/nginx/html/
COPY --from=builder /optract/public/*.js /usr/share/nginx/html/
COPY --from=builder /optract/public/assets /usr/share/nginx/html/assets

EXPOSE 80

ENTRYPOINT ["/usr/sbin/nginx"]
CMD ["-g", "daemon off;"]
