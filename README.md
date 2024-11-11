
Command to create a localhost https certificate:
    openssl req -x509 -newkey rsa:4096 -keyout localhost.key -out localhost.crt -sha256 -days 3650 -nodes -subj "/C=US/ST=NewYork/L=Brooklyn/O=Me/OU=Me/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
