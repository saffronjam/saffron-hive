# Kubernetes deployment

`base/` is a portable Kustomize build root. It owns the Deployment, Service,
application ConfigMap and data claim. The migration init container and server
must use the same image version. Keep probes, commands, ports and mount paths
consistent with the application contract.

Environment overlays own namespaces, selected image versions, resource sizing,
storage class/bindings, routes, Secrets, backup destinations and host-network
selection. Do not embed home LAN addresses, domains or NAS paths in this base.
The base uses ordinary pod networking; an environment can enable host networking
when LAN discovery requires it.

Render with `kubectl kustomize deploy/kubernetes/base`. Verify environment
overlays render matching Service selectors, ConfigMap references and data claims.
