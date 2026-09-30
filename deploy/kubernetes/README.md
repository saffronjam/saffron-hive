# Kubernetes

Use `deploy/kubernetes/base` as a Kustomize resource from an immutable commit.
An environment overlay supplies its namespace, routing, storage class or existing
volume binding, and resource overrides. Set both the server and migration image
through the `ghcr.io/saffronjam/saffron-hive` entry in Kustomize `images`.

The base runs one instance with a writable `/data` claim and a migration init
container. It exposes port 8080 through a Service and probes `/health`. Data must
be on storage suitable for SQLite. Host networking and backup jobs are
environment decisions.

Render without deploying:

```sh
kubectl kustomize deploy/kubernetes/base
```
