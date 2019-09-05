FROM hemtt/hemtt

# Copy our entrypoint script.
COPY entrypoint.sh /entrypoint.sh

# Set the entrypoint script as our entrypoint.
ENTRYPOINT ["/entrypoint.sh"]
