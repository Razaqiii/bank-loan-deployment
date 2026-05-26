# Bank Loan Application - OpenShift Deployment

This repository contains the Bank Loan Application frontend and its OpenShift deployment configuration using Source-to-Image (S2I) strategy.

## 📋 Overview

- **Application**: Bank Loan Frontend (Node.js)
- **Deployment Method**: S2I (Source-to-Image)
- **Platform**: Red Hat OpenShift Container Platform
- **Project/Namespace**: production
- **Replicas**: 3 pods
- **Security**: Non-root containers

## 🏗️ Architecture

```
GitHub Repository
    ↓
Jenkins Pipeline (Webhook Triggered)
    ↓
S2I Build (Node.js 18)
    ↓
OpenShift Deployment (3 replicas)
    ↓
Service (ClusterIP)
    ↓
Route (HTTPS)
```

## 📁 Repository Structure

```
.
├── bank-fe-fix/              # Application source code
│   ├── public/               # Static files
│   ├── package.json          # Node.js dependencies
│   └── ...
├── openshift/                # OpenShift configurations
│   ├── deployment.yaml       # Deployment with 3 replicas
│   ├── service.yaml          # Service configuration
│   └── route.yaml            # External route (HTTPS)
├── CICD_scripts/             # CI/CD automation scripts
│   ├── github.py             # GitHub repo creation
│   └── jenkins.py            # Jenkins job creation
├── Jenkinsfile               # Jenkins pipeline definition
└── README.md                 # This file
```

## 🚀 Deployment Process

### Automated Deployment (via Jenkins)

1. **Push to GitHub**: Any push to the `main` branch triggers the pipeline
2. **Jenkins Pipeline**: Automatically builds and deploys
3. **S2I Build**: Creates container image from source code
4. **Deploy**: Rolls out 3 replicas to OpenShift
5. **Expose**: Creates service and route for external access

### Manual Deployment

If you need to deploy manually:

```bash
# 1. Login to OpenShift
oc login --token=<your-token> --server=<your-server>

# 2. Switch to production project
oc project production

# 3. Create ImageStream
oc create imagestream bank-loan-app

# 4. Create S2I Build
oc new-build registry.access.redhat.com/ubi8/nodejs-18:latest~https://github.com/Razaqiii/bank-loan-deployment.git#main \
  --name=bank-loan-app \
  --context-dir=bank-fe-fix \
  --strategy=source

# 5. Wait for build to complete
oc logs -f bc/bank-loan-app

# 6. Deploy application
oc apply -f openshift/deployment.yaml
oc apply -f openshift/service.yaml
oc apply -f openshift/route.yaml

# 7. Check deployment status
oc get pods -l app=bank-loan-app
oc get route bank-loan-app
```

## 🔧 Configuration

### Application Settings

- **Port**: 3000
- **Node.js Version**: 18
- **Environment**: Production
- **Builder Image**: `registry.access.redhat.com/ubi8/nodejs-18:latest`

### Resource Limits

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "500m"
```

### Security Configuration

- **Non-root user**: Application runs as non-root
- **No privilege escalation**: Security hardened
- **Capabilities dropped**: All unnecessary capabilities removed
- **HTTPS**: TLS termination at route level

### Health Checks

**Liveness Probe**:
- Path: `/`
- Initial Delay: 30s
- Period: 10s

**Readiness Probe**:
- Path: `/`
- Initial Delay: 10s
- Period: 5s

## 🔐 CI/CD Setup

### Prerequisites

1. **GitHub Repository**: Created and configured
2. **Jenkins**: Running in OpenShift production namespace
3. **Webhook**: GitHub webhook pointing to Jenkins

### GitHub Repository Setup

```bash
cd CICD_scripts
python github.py
```

This creates:
- GitHub repository: `bank-loan-deployment`
- Webhook to Jenkins

### Jenkins Job Setup

```bash
cd CICD_scripts
python jenkins.py create bank-loan-deployment https://github.com/Razaqiii/bank-loan-deployment.git main
```

This creates:
- Jenkins pipeline job
- GitHub webhook trigger
- Automatic build on push

## 📊 Monitoring

### Check Deployment Status

```bash
# View all resources
oc get all -l app=bank-loan-app

# Check pod status
oc get pods -l app=bank-loan-app

# View pod logs
oc logs -l app=bank-loan-app --tail=100

# Check deployment rollout
oc rollout status deployment/bank-loan-app

# View events
oc get events --sort-by='.lastTimestamp'
```

### Access Application

```bash
# Get application URL
oc get route bank-loan-app -o jsonpath='{.spec.host}'

# Test application
curl https://$(oc get route bank-loan-app -o jsonpath='{.spec.host}')
```

## 🔄 Updates and Rollbacks

### Trigger New Build

```bash
# Start new build from latest code
oc start-build bank-loan-app --follow

# Or push to GitHub (automatic via webhook)
git push origin main
```

### Rollback Deployment

```bash
# View rollout history
oc rollout history deployment/bank-loan-app

# Rollback to previous version
oc rollout undo deployment/bank-loan-app

# Rollback to specific revision
oc rollout undo deployment/bank-loan-app --to-revision=2
```

### Scale Application

```bash
# Scale up
oc scale deployment/bank-loan-app --replicas=5

# Scale down
oc scale deployment/bank-loan-app --replicas=2

# Auto-scale (optional)
oc autoscale deployment/bank-loan-app --min=3 --max=10 --cpu-percent=80
```

## 🐛 Troubleshooting

### Build Fails

```bash
# Check build logs
oc logs -f bc/bank-loan-app

# Describe build
oc describe build bank-loan-app-1

# Check build config
oc describe bc/bank-loan-app
```

### Pods Not Starting

```bash
# Check pod status
oc get pods -l app=bank-loan-app

# Describe pod
oc describe pod <pod-name>

# View pod logs
oc logs <pod-name>

# Check events
oc get events --field-selector involvedObject.name=<pod-name>
```

### Application Not Accessible

```bash
# Check route
oc get route bank-loan-app

# Check service
oc get svc bank-loan-app

# Test service internally
oc run test-pod --image=curlimages/curl --rm -it -- curl http://bank-loan-app:3000
```

### Permission Issues

```bash
# Check security context constraints
oc get scc

# Verify pod security
oc describe pod <pod-name> | grep -A 10 "Security Context"
```

## 📝 Environment Variables

The application uses these environment variables:

- `NODE_ENV`: Set to `production`
- `PORT`: Set to `3000`

To add more environment variables, edit `openshift/deployment.yaml`:

```yaml
env:
- name: YOUR_VAR
  value: "your-value"
```

## 🔗 Useful Links

- **Jenkins**: https://jenkins-production.apps.itz-gkg33y.infra01-lb.tok04.techzone.ibm.com
- **GitHub**: https://github.com/Razaqiii/bank-loan-deployment
- **Application**: Check route after deployment

## 📞 Support

For issues or questions:
- Check Jenkins build logs
- Review OpenShift events
- Contact DevOps team

## 📄 License

ISC License

---

**Made with ❤️ by Bob - Your AI DevOps Assistant**