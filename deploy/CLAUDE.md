# deploy/

Kubernetes manifests for Saffron Hive, deployed via ArgoCD.

## Structure

- Deployment with init container for database migrations (`saffron-hive migrate up`) followed by main container (`saffron-hive serve`)
- Service + Ingress exposing the dashboard at hive.saffronbun.com
- TLS via wildcard-saffronbun-tls secret
- SQLite data persisted via PersistentVolumeClaim

## Migration strategy

The same Go binary serves as both the migration runner and the application server. The init container runs `saffron-hive migrate up` which applies any pending golang-migrate migrations to the SQLite database. Only after successful migration does the main container start.
