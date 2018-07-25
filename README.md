[![Docker Pulls](https://img.shields.io/docker/pulls/skn0tt/signer.svg?style=flat-square)](https://hub.docker.com/r/skn0tt/signer/) [![Docker Build Status](https://img.shields.io/docker/build/skn0tt/signer.svg?style=flat-square)](https://hub.docker.com/r/skn0tt/signer/)

# signer

This Docker image supplies a Redis instance with new *random secrets* in a given interval.
Secrets can be obtained either through a REST API or by direct access to Redis.
They are stored in a JSON consisting of two keys named "old" and "current".

- [Getting Started](README.md#Getting-Started)
- [Configuration](README.md#Configuration)
- [API Documentation](SwaggerDoc.yml)

## Getting Started

```yml
version: "3"

services:
  redis:
    image: redis

  rotator:
    image: skn0tt/signer
    environment:
      REDIS_HOSTNAME: redis
      ROTATION_PERIOD: 20
    ports:
      - 80:80
```

## Configuration

These are the default values:

```yml
environment:
  REDIS_HOSTNAME: redis # required
  REDIS_PORT: 6379
  ROTATION_INTERVAL: 3600 # in seconds
  SECRETS_KEY: SECRETS # key that secrets are stored in
  SECRET_LENGTH: 96
  DISABLE_ROTATING: false # can disable the rotation cron job on this instance (to make it swarm-eable)
```
