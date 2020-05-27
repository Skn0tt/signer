[![Docker Pulls](https://img.shields.io/docker/pulls/skn0tt/signer.svg?style=flat-square)](https://hub.docker.com/r/skn0tt/signer/) [![Docker Build Status](https://img.shields.io/docker/build/skn0tt/signer.svg?style=flat-square)](https://hub.docker.com/r/skn0tt/signer/)

# signer

This package takes away the burden of dealing with JWT authentication.
You can sign a payload and get back a JWT token, which you can then be verified by `signer` again.
`signer` also supports blocking specific tokens.

The big advantage of JWTs is, that they can be verifed using a public key.
These keys can be obtained using `signer`s REST-API, so that the other services can use them, as well.

- [Getting Started](README.md#Getting-Started)
- [Configuration](README.md#Configuration)
- [API Documentation](OpenAPI.yml)

## @skn0tt/signer

```
yarn add @skn0tt/signer
```

```ts
import Signer from "@skn0tt/signer";

const redisClient = redis.createClient("...");
const signer = await Signer.fromRedis(
  redisClient,
  {
    mode: "asymmetric",
    secretLength: 96,
    tokenExpiry: 300,
    rotationInterval: 300,
    onRotate: () => console.log("Yay, I rotated!")
  }
);

const jwtRepo = signer.getJwtRepository();

const token = await jwtRepo.sign({ uid: "johndoe" });
const payload = await jwtRepo.verify(token);
...
```

## Docker Image

`signer` is available as a Docker image: [`skn0tt/signer`](https://hub.docker.com/r/skn0tt/signer).

To start a working server, use `docker-compose.yml` file in this repository.
Once it's running, you can use it like so:

Creating a token:

```bash
$ curl --data '{ "name": "Tom" }' localhost:3000/tokens/
eyJhbGciOiJSUzI1NiIsInR5 ...
```

Validating a token:

```bash
$ curl -v localhost:3000/tokens/eyJhbGciOiJSUzI1NiIsInR5...
{"iat":1532599135} # 200

$ curl -v localhost:3000/tokens/invalidToken
invalid signature # 401
```

Blocking a token:

```bash
$ curl -X DELETE localhost:3000/tokens/eyJhbGciOiJSUzI1NiIsInR5...

$ curl -v localhost:3000/tokens/eyJhbGciOiJSUzI1NiIsInR5...
Token Blocked # 401
```

Getting the secrets

```bash
$ curl localhost:3000/secrets
{ "old": "----BEGIN RSA...", "current": "----BEGIN RSA..." }

$ curl localhost:3000/secrets/current
----BEGIN RSA PUBLIC KEY----...

$ curl localhost:3000/secrets/old
----BEGIN RSA PUBLIC KEY----...
```

Forcing a rotate

```bash
curl -X POST localhost:3000/secrets
```

The whole API documentation can be found here: [OpenAPI Docs](OpenAPI.yml)

## Configuration

These are the available environment variables for configuration:

```yml
REDIS_HOSTNAME: redis # required
REDIS_PORT: 6379
ROTATION_INTERVAL: 3600 # in seconds
SECRETS_KEY: SECRETS # key that secrets are stored in
SECRET_LENGTH: 96
ROTATE_ON_STARTUP: false # triggers a single rotation on startup of the service
ASYMMETRIC_SIGNING: true # can be disabled to use symmetric signing
```
