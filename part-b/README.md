# Fortune Cookie Factory – Kubernetes (K3s)

## 1. Project Overview

Fortune Cookie Factory is a containerized web application deployed on a K3s Kubernetes cluster.

Users can click a button to receive a random fortune cookie message. Each API response includes:

- A random fortune message.
- The hostname of the API Pod that handled the request.
- The application version.

The project demonstrates Kubernetes Deployments, ReplicaSets, Services, Load Balancing, Self-Healing, Scaling, Rolling Updates, and Rollbacks.

## 2. Architecture

The application consists of two main components:

**Frontend**
- HTML website served by Nginx.
- Nginx acts as a Reverse Proxy.
- Two Frontend Pods.
- Exposed externally using a NodePort Service on port 30090.

**Backend – Fortune API**
- Node.js and Express.
- Three API Pods by default.
- ClusterIP Service on port 3000.
- Returns a random fortune, Pod hostname, and application version.

### Request Flow

```text
Browser
   |
   v
NodePort Service (30090)
   |
   v
Frontend Deployment (2 Nginx Pods)
   |
   v
Nginx Reverse Proxy
   |
   v
ClusterIP Service (fortune-api:3000)
   |
   v
Fortune API Deployment (3 Pods)
   |
   v
JSON Response
```

## 3. Project Structure

```text
part-b/
├── api/
│   ├── app.js
│   ├── package.json
│   ├── package-lock.json
│   └── Dockerfile
│
├── frontend/
│   ├── index.html
│   ├── nginx.conf
│   └── Dockerfile
│
├── k3s/
│   ├── fortune-api-deployment.yaml
│   ├── fortune-api-service.yaml
│   ├── fortune-web-deployment.yaml
│   └── fortune-web-service.yaml
│
├── screenshots/
└── README.md
```

## 4. Technologies

- Node.js
- Express
- HTML, CSS, JavaScript
- Nginx
- Docker
- K3s / Kubernetes
- containerd
- Git and GitHub

## 5. Deployment Instructions

### Requirements

- Ubuntu Linux
- Docker
- K3s
- kubectl
- Git

All commands below are executed on the Ubuntu server.

### Step 1 – Build the Docker Images

The initial API source and Deployment configuration must use version v1.

Build the API image:

```bash
cd ~/part-b

docker build -t fortune-api:v1 ./api
```

Build the Frontend image:

```bash
docker build -t fortune-web:v1 ./frontend
```

### Step 2 – Import Images into K3s

K3s uses containerd to run containers. The locally built images must be imported into its image store.

Export the images:

```bash
docker save fortune-api:v1 -o /tmp/fortune-api-v1.tar

docker save fortune-web:v1 -o /tmp/fortune-web-v1.tar
```

Import them into K3s:

```bash
sudo k3s ctr -n k8s.io images import /tmp/fortune-api-v1.tar

sudo k3s ctr -n k8s.io images import /tmp/fortune-web-v1.tar
```

Verify:

```bash
sudo k3s ctr -n k8s.io images ls | grep fortune
```

### Step 3 – Deploy Kubernetes Resources

Apply the API Deployment and Service:

```bash
kubectl apply -f k3s/fortune-api-deployment.yaml

kubectl apply -f k3s/fortune-api-service.yaml
```

Apply the Frontend Deployment and Service:

```bash
kubectl apply -f k3s/fortune-web-deployment.yaml

kubectl apply -f k3s/fortune-web-service.yaml
```

Check the resources:

```bash
kubectl get pods -o wide

kubectl get services
```

### Step 4 – Verify the API

Start a temporary BusyBox Pod:

```bash
kubectl run fortune-test --rm -it \
  --restart=Never \
  --image=busybox:1.36 -- sh
```

Send a request to the internal API Service:

```bash
wget -qO- http://fortune-api:3000/api/fortune
```

Expected response:

```json
{
  "fortune": "Small steps lead to big achievements.",
  "pod": "fortune-api-xxxxxxxxxx-xxxxx",
  "version": "v1"
}
```

Exit the temporary Pod:

```bash
exit
```

### Step 5 – Access the Frontend

Open the following address in a browser:

```text
http://<UBUNTU-NODE-IP>:30090
```

Replace `<UBUNTU-NODE-IP>` with the IP address of the Ubuntu server.

Click **Open Your Fortune Cookie** to receive a random fortune.

## 6. Experiments and Results

### Experiment 1 – Pod Deletion and Self-Healing

Deleted one API Pod while using the website:

```bash
kubectl delete pod <POD-NAME>
```

Observed the Pods:

```bash
kubectl get pods -l app=fortune-api -w
```

**Result:**

- The website continued working during the deletion.
- The remaining API Pods continued handling requests.
- The ReplicaSet automatically created a replacement Pod.
- The replacement became Ready approximately 6 seconds after its creation was observed.

This demonstrated Kubernetes Self-Healing.

### Experiment 2 – Scaling Up to Six Replicas

Increased the API Deployment to six replicas:

```bash
kubectl scale deployment fortune-api --replicas=6
```

Verified the Pods:

```bash
kubectl get pods -l app=fortune-api
```

Verified the Service endpoints:

```bash
kubectl get endpoints fortune-api
```

**Result:**

- Six API Pods reached Running and Ready.
- The Service had six endpoints.
- During 20 browser requests, only one distinct API Pod name was observed.

The existence of six endpoints confirmed that all six Pods were registered as Service backends. The test did not demonstrate responses from all six Pods.

### Experiment 3 – Scaling Down to One Replica

Reduced the Deployment to one replica:

```bash
kubectl scale deployment fortune-api --replicas=1
```

Verified:

```bash
kubectl get pods -l app=fortune-api

kubectl get endpoints fortune-api
```

**Result:**

- One API Pod remained Running.
- The Service had one endpoint.
- The remaining Pod handled the API traffic.

This demonstrated the effect of reducing application capacity to a single replica.

### Experiment 4 – Rolling Update (v1 to v2)

Changed the fortune messages by adding the `V2:` prefix.

Built the new image:

```bash
docker build -t fortune-api:v2 ./api
```

Imported it into K3s:

```bash
docker save fortune-api:v2 -o /tmp/fortune-api-v2.tar

sudo k3s ctr -n k8s.io images import /tmp/fortune-api-v2.tar
```

Updated the Deployment configuration:

- Image: `fortune-api:v2`
- APP_VERSION: `v2`
- Replicas: 3

The update used:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

Applied the update:

```bash
kubectl apply -f k3s/fortune-api-deployment.yaml
```

Checked the rollout:

```bash
kubectl rollout status deployment/fortune-api
```

**Result:**

- Kubernetes gradually replaced the old API Pods.
- Both v1 and v2 responses were observed during the rollout.
- The rollout completed successfully.
- Three v2 Pods were Running and Ready after completion.

### Experiment 5 – Rollback (v2 to v1)

Executed:

```bash
kubectl rollout undo deployment/fortune-api
```

Checked the result:

```bash
kubectl rollout status deployment/fortune-api

kubectl get pods -l app=fortune-api
```

Verified the Deployment image:

```bash
kubectl get pods -l app=fortune-api \
  -o custom-columns=NAME:.metadata.name,IMAGE:.spec.containers[0].image,READY:.status.containerStatuses[0].ready
```

**Result:**

- Kubernetes restored the previous v1 Deployment configuration.
- Three API Pods returned to version v1.
- All three Pods reached Ready status.
- The browser displayed API Version v1 again.

## 7. Key Kubernetes Concepts Demonstrated

| Concept | Purpose |
|---|---|
| Deployment | Manages application replicas |
| ReplicaSet | Maintains the desired number of Pods |
| Pod | Runs the application container |
| ClusterIP | Provides internal Service access |
| NodePort | Exposes the Frontend externally |
| Endpoints | Lists the Service backend addresses |
| Load Balancing | Distributes Service traffic among eligible Pods |
| Self-Healing | Replaces deleted or failed Pods |
| Scaling | Changes the desired number of replicas |
| Rolling Update | Gradually replaces application versions |
| Rollback | Restores a previous Deployment revision |

## 8. Screenshots

The `screenshots/` directory contains evidence of:

- Frontend application running.
- Responses from different API Pods.
- Kubernetes Deployments and Services.
- Pod deletion and automatic recovery.
- Scaling to six replicas.
- Scaling down to one replica.
- Rolling Update from v1 to v2.
- Rollback from v2 to v1.

## 9. Conclusion

This project demonstrated how to build, containerize, deploy, expose, scale, and update a web application using Docker and K3s.

It also demonstrated Kubernetes Self-Healing and Deployment Rollbacks, using a real application with a Frontend and multiple API Pods.

The project was developed and tested on an Ubuntu virtual machine running K3s.