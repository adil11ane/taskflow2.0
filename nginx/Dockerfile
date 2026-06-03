FROM nginx:alpine 

RUN rm /etc/nginx/conf.d/default.conf

COPY conf/def.config /etc/nginx/conf.d/default.conf
EXPOSE 80 