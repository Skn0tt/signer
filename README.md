[![Docker Pulls](https://img.shields.io/docker/pulls/skn0tt/signer.svg?style=flat-square)](https://hub.docker.com/r/skn0tt/signer/) [![Docker Build Status](https://img.shields.io/docker/build/skn0tt/signer.svg?style=flat-square)](https://hub.docker.com/r/skn0tt/signer/)

# signer

This Docker image takes away the burden of dealing with JWT authentication.
You can sign a payload and get back a JWT token, which you can then be verified by `signer` again.
`signer` also supports blocking specific tokens.

The big advantage of JWTs is, that they can be verifed using a public key.
These keys can be obtained over `signer`s REST-API, so that the other services can use them, as well.

- [Getting Started](README.md#Getting-Started)
- [Configuration](README.md#Configuration)
- [API Documentation](OpenAPI.yml)

## Getting Started

To start a working server, use the [docker-app](https://github.com/docker/app) files: [signer.dockerapp](signer.dockerapp).

Creating a token:

```bash
$ curl --data '{ "name": "Tom" }' localhost/tokens/
eyJhbGciOiJSUzI1NiIsInR5 ...
```

Validating a token:

```bash
$ curl -v localhost/tokens/eyJhbGciOiJSUzI1NiIsInR5...
{"iat":1532599135} # 200

$ curl -v localhost/tokens/invalidToken
invalid signature # 401
```

Blocking a token:

```bash
$ curl -X DELETE localhost/tokens/eyJhbGciOiJSUzI1NiIsInR5...

$ curl -v localhost/tokens/eyJhbGciOiJSUzI1NiIsInR5...
Token Blocked # 401
```

Getting the secrets

```bash
$ curl localhost/secrets
{ "old": "----BEGIN RSA...", "current": "----BEGIN RSA..." }

$ curl localhost/secrets/current
----BEGIN RSA PUBLIC KEY----...

$ curl localhost/secrets/old
----BEGIN RSA PUBLIC KEY----...
```

Forcing a rotate

```bash
curl -X POST localhost/secrets
```

The whole API documentation can be found here: [OpenAPI Docs](OpenAPI.yml)

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
  ROTATE_ON_STARTUP: false # triggers a single rotation on startup of the service
  ASYMMETRIC_SIGNING: true # can be disable to use symmetric signing
```
