.PHONY: build load deploy status port-forward-backend port-forward-frontend test-health

build:
	docker build -t platform-frontend:dev ./app/frontend
	docker build -t platform-backend:dev ./app/backend

load:
	kind load docker-image platform-frontend:dev platform-backend:dev --name devops-platform

deploy:
	kubectl apply -k k8s/overlays/dev

status:
	kubectl get pods,services -n platform

port-forward-backend:
	kubectl port-forward -n platform service/backend 3000:3000

port-forward-frontend:
	kubectl port-forward -n platform service/frontend 8080:80

test-health:
	k6 run tests/k6/health.js
