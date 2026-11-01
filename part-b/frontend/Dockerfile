# Use official Nginx image
FROM nginx:alpine

# Copy frontend website
COPY index.html /usr/share/nginx/html/index.html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose Nginx port
EXPOSE 80