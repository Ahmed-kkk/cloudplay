FROM nginx:alpine

RUN apk add --no-cache wget unzip curl

RUN mkdir -p /usr/share/nginx/html/roms \
    /usr/share/nginx/html/assets

RUN wget -q https://github.com/EmulatorJS/EmulatorJS/archive/refs/heads/main.zip \
    -O /tmp/ejs.zip && \
    unzip -q /tmp/ejs.zip -d /tmp/ && \
    cp -r /tmp/EmulatorJS-main/data /usr/share/nginx/html/emulatorjs && \
    rm -rf /tmp/ejs.zip /tmp/EmulatorJS-main

COPY html/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
