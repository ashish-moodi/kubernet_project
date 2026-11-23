# Kubernetes Platform

A local, GitOps-oriented platform project that deploys a React frontend and an
Express backend to a three-node Kind cluster. The target architecture includes
Argo CD, signed GHCR images, Keycloak, CloudNativePG, Gateway API, and an
observability stack.

## What is implemented

- Multi-stage frontend and backend container images.
- Health checks, Kubernetes Deployments, Services, Kustomize development overlay,
  and a three-node Kind configuration.
- GitHub Actions validation, Trivy filesystem scan, GHCR publishing, SBOM generation,
  and keyless Cosign image signing.
- Gateway API route definitions, OpenTelemetry Collector configuration, a Prometheus
  SLO alert rule, and a k6 health/load test.

## Local quick start

Prerequisites: Docker Desktop, `kind`, `kubectl`, and `k6` (only for load testing).

```bash
kind create cluster --name devops-platform --config infrastructure/kind/cluster.yaml
make build
make load
make deploy
make status
```

In separate terminals, use `make port-forward-backend` and
`make port-forward-frontend`. The backend health check is available at
`http://localhost:3000/health`; the frontend is available at
`http://localhost:8080`.

Run the load test while the backend port-forward is active:

```bash
make test-health
```

## GitOps setup

1. Push this repository to GitHub.
2. Replace `REPLACE_ME` in
   `infrastructure/argocd/platform-dev.application.yaml` with the GitHub owner.
3. Install Argo CD and apply the Application:

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm upgrade --install argocd argo/argo-cd --namespace argocd --create-namespace
kubectl apply -f infrastructure/argocd/platform-dev.application.yaml
```

The workflow publishes signed images to GHCR only after a push to `main`. Make
the packages readable by the cluster, then replace the development image names in
`k8s/overlays/dev/kustomization.yaml` with their GHCR image references and tags.

## Operator and observability prerequisites

These resources are intentionally not applied automatically: they require sizing,
storage, hostname, TLS, and secret decisions.

- Install CloudNativePG before applying a `Cluster` custom resource.
- Install the Keycloak Operator before applying Keycloak custom resources. Keep
  database credentials in a Kubernetes secret supplied outside Git.
- Install a Gateway API implementation and update `gatewayClassName: nginx` if its
  GatewayClass has a different name.
- Install kube-prometheus-stack before applying the PrometheusRule, and deploy an
  OpenTelemetry Collector using the provided ConfigMap.

Never commit database passwords, Keycloak bootstrap credentials, or registry tokens.

## Project layout

```text
app/                 Application source and Dockerfiles
k8s/                 Application manifests and environment overlays
infrastructure/      Kind, Argo CD, Gateway, database, Keycloak, observability assets
tests/k6/            Load tests and SLO validation
.github/workflows/   CI, scan, SBOM, signing, and publish workflow
```
