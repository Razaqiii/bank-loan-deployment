# Bank Loan Application - OpenShift Deployment

This repository contains the Bank Loan Application frontend and its OpenShift deployment configuration using ConfigMap-based deployment with nginx.

## 📋 Overview

- **Application**: Bank Loan Frontend (Static HTML/CSS/JavaScript)
- **Deployment Method**: ConfigMap + nginx
- **Platform**: Red Hat OpenShift Container Platform
- **Project/Namespace**: production
- **Replicas**: 3 pods
- **Security**: Non-root containers

## 🏗️ Architecture

```
GitHub Repository (bank-app-deployment)
    ↓
Jenkins Pipeline (Webhook Triggered)
    ↓
ConfigMaps Creation (nginx config + app files)
    ↓
OpenShift Deployment (nginx with 3 replicas)
    ↓
Service (ClusterIP)
    ↓
Route (HTTPS)
```

## 📁 Repository Structure

```
.
├── bank-fe-fix/              # Application source code
│   ├── public/               # Static files (HTML, CSS, JS)
│   │   ├── index.html        # Main application page
│   │   ├── css/              # Stylesheets
│   │   └── js/               # JavaScript modules
│   ├── openshift/            # OpenShift configurations
│   │   ├── configmap.yaml    # nginx configuration
│   │   ├── deployment.yaml   # Deployment with 3 replicas
│   │   ├── service.yaml      # Service configuration
│   │   └── route.yaml        # External route (HTTPS)
│   ├── package.json          # Node.js dependencies (dev only)
│   ├── Jenkinsfile           # Jenkins pipeline definition
│   └── README.md             # Application documentation
├── CICD_scripts/             # CI/CD automation scripts
│   ├── github.py             # GitHub repo creation
│   ├── jenkins.py            # Jenkins job creation
│   └── .env                  # Environment configuration
└── DEPLOYMENT.md             # This file
```

## 🚀 Deployment Process

### Automated Deployment (via Jenkins)

1. **Push to GitHub**: Any push to the `main` branch triggers the pipeline
2. **Jenkins Pipeline**: Automatically creates ConfigMaps and deploys
3. **ConfigMaps**: Creates nginx config and application files
4. **Deploy**: Rolls out 3 nginx replicas to OpenShift
5. **Expose**: Creates service and route for external access

### Manual Deployment

If you need to deploy manually:

```bash
# 1. Login to OpenShift
oc login --token=<your-token> --server=<your-server>

# 2. Switch to production project
oc project production

# 3. Create nginx configuration ConfigMap
oc apply -f openshift/configmap.yaml

# 4. Create application files ConfigMap
oc create configmap bank-loan-deployment-app \
  --from-file=index.html=public/index.html \
  --from-file=styles.css=public/css/styles.css \
  --from-file=app.js=public/js/app.js \
  --from-file=auth.js=public/js/auth.js \
  --from-file=calculator.js=public/js/calculator.js \
  --from-file=modals.js=public/js/modals.js \
  --from-file=state.js=public/js/state.js \
  --from-file=utils.js=public/js/utils.js \
  --dry-run=client -o yaml | oc apply -f -

# 5. Deploy application
oc apply -f openshift/deployment.yaml
oc apply -f openshift/service.yaml
oc apply -f openshift/route.yaml

# 6. Check deployment status
oc get pods -l app=bank-loan-deployment
oc get route bank-loan-deployment
```

## 🔧 Configuration

### Application Settings

- **Port**: 8080 (nginx)
- **Web Server**: nginx:alpine
- **Environment**: Production
- **Deployment Name**: bank-loan-deployment

### Resource Limits

```yaml
resources:
  requests:
    memory: "64Mi"
    cpu: "50m"
  limits:
    memory: "128Mi"
    cpu: "200m"
```

### Security Configuration

- **Non-root user**: nginx runs as non-root (UID 101)
- **No privilege escalation**: Security hardened
- **Read-only root filesystem**: Enhanced security
- **Capabilities dropped**: All unnecessary capabilities removed
- **HTTPS**: TLS termination at route level

### Health Checks

**Liveness Probe**:
- Path: `/`
- Initial Delay: 30s
- Period: 10s
- Timeout: 5s

**Readiness Probe**:
- Path: `/`
- Initial Delay: 10s
- Period: 5s
- Timeout: 3s

## 🔐 CI/CD Setup

### Prerequisites

1. **GitHub Repository**: bank-app-deployment
2. **Jenkins**: Running in OpenShift production namespace
3. **Webhook**: GitHub webhook pointing to Jenkins
4. **OpenShift CLI**: oc command configured

### GitHub Repository Setup

```bash
cd CICD_scripts

# Configure environment variables in .env file
# GITHUB_TOKEN=your-github-token
# GITHUB_USER=your-github-username
# JENKINS_URL=your-jenkins-url
# OCP_BEARER_TOKEN=your-openshift-token

# Create repository and webhook
python github.py
```

This creates:
- GitHub repository: `bank-app-deployment`
- Webhook to Jenkins: `https://jenkins-production.apps.itz-gkg33y.infra01-lb.tok04.techzone.ibm.com/github-webhook/`

### Jenkins Job Setup

```bash
cd CICD_scripts

# Create Jenkins pipeline job
python jenkins.py create bank-app-deployment https://github.com/Razaqiii/bank-app-deployment.git main
```

This creates:
- Jenkins pipeline job: `bank-app-deployment`
- GitHub webhook trigger enabled
- Automatic build on push to main branch

### Trigger Build Manually

```bash
cd CICD_scripts
python jenkins.py trigger bank-app-deployment
```

## 📊 Monitoring

### Check Deployment Status

```bash
# View all resources
oc get all -l app=bank-loan-deployment

# Check pod status
oc get pods -l app=bank-loan-deployment

# View pod logs
oc logs -l app=bank-loan-deployment --tail=100

# Check deployment rollout
oc rollout status deployment/bank-loan-deployment

# View events
oc get events --sort-by='.lastTimestamp'
```

### Access Application

```bash
# Get application URL
oc get route bank-loan-deployment -o jsonpath='{.spec.host}'

# Test application
curl https://$(oc get route bank-loan-deployment -o jsonpath='{.spec.host}')
```

## 🔄 Updates and Rollbacks

### Trigger New Deployment

```bash
# Push to GitHub (automatic via webhook)
git add .
git commit -m "Update application"
git push origin main

# Or trigger manually via Jenkins
cd CICD_scripts
python jenkins.py trigger bank-app-deployment
```

### Update ConfigMaps

```bash
# Update nginx configuration
oc apply -f openshift/configmap.yaml

# Update application files
oc create configmap bank-loan-deployment-app \
  --from-file=index.html=public/index.html \
  --from-file=styles.css=public/css/styles.css \
  --from-file=app.js=public/js/app.js \
  --from-file=auth.js=public/js/auth.js \
  --from-file=calculator.js=public/js/calculator.js \
  --from-file=modals.js=public/js/modals.js \
  --from-file=state.js=public/js/state.js \
  --from-file=utils.js=public/js/utils.js \
  --dry-run=client -o yaml | oc apply -f -

# Restart deployment to pick up changes
oc rollout restart deployment/bank-loan-deployment
```

### Rollback Deployment

```bash
# View rollout history
oc rollout history deployment/bank-loan-deployment

# Rollback to previous version
oc rollout undo deployment/bank-loan-deployment

# Rollback to specific revision
oc rollout undo deployment/bank-loan-deployment --to-revision=2
```

### Scale Application

```bash
# Scale up
oc scale deployment/bank-loan-deployment --replicas=5

# Scale down
oc scale deployment/bank-loan-deployment --replicas=2

# Auto-scale (optional)
oc autoscale deployment/bank-loan-deployment --min=3 --max=10 --cpu-percent=80
```

## 🐛 Troubleshooting

### Pods Not Starting

```bash
# Check pod status
oc get pods -l app=bank-loan-deployment

# Describe pod
oc describe pod <pod-name>

# View pod logs
oc logs <pod-name>

# Check events
oc get events --field-selector involvedObject.name=<pod-name>
```

### ConfigMap Issues

```bash
# List ConfigMaps
oc get configmap

# Describe ConfigMap
oc describe configmap bank-loan-deployment-nginx-config
oc describe configmap bank-loan-deployment-app

# Delete and recreate ConfigMap
oc delete configmap bank-loan-deployment-app
# Then recreate using the command above
```

### Application Not Accessible

```bash
# Check route
oc get route bank-loan-deployment

# Check service
oc get svc bank-loan-deployment

# Test service internally
oc run test-pod --image=curlimages/curl --rm -it -- curl http://bank-loan-deployment:8080

# Check nginx configuration
oc exec -it <pod-name> -- cat /etc/nginx/nginx.conf
```

### Permission Issues

```bash
# Check security context constraints
oc get scc

# Verify pod security
oc describe pod <pod-name> | grep -A 10 "Security Context"

# Check file permissions in pod
oc exec -it <pod-name> -- ls -la /usr/share/nginx/html
```

### Jenkins Pipeline Issues

```bash
# Check Jenkins job configuration
# Visit: https://jenkins-production.apps.itz-gkg33y.infra01-lb.tok04.techzone.ibm.com/job/bank-app-deployment/configure

# View build logs
# Visit: https://jenkins-production.apps.itz-gkg33y.infra01-lb.tok04.techzone.ibm.com/job/bank-app-deployment/lastBuild/console

# Verify webhook
# GitHub repo → Settings → Webhooks
# Should point to: https://jenkins-production.apps.itz-gkg33y.infra01-lb.tok04.techzone.ibm.com/github-webhook/
```

## 📝 Jenkins Pipeline Stages

The Jenkinsfile defines these stages:

1. **Initialize**: Display build information
2. **Verify Workspace**: Confirm source code is checked out
3. **Create ConfigMaps**: 
   - nginx configuration
   - Application files (preserving directory structure)
4. **Deploy to OpenShift**:
   - Apply deployment.yaml
   - Apply service.yaml
   - Apply route.yaml
5. **Wait for Rollout**: Monitor deployment progress
6. **Health Check**: Verify application is accessible
7. **Output Information**: Display deployment details and URL

## 🔗 Useful Links

- **Jenkins**: https://jenkins-production.apps.itz-gkg33y.infra01-lb.tok04.techzone.ibm.com
- **Jenkins Job**: https://jenkins-production.apps.itz-gkg33y.infra01-lb.tok04.techzone.ibm.com/job/bank-app-deployment
- **GitHub Repository**: https://github.com/Razaqiii/bank-app-deployment
- **Application**: Check route after deployment with `oc get route bank-loan-deployment`

## 📞 Support

For issues or questions:
- Check Jenkins build logs at the Jenkins job URL
- Review OpenShift events: `oc get events --sort-by='.lastTimestamp'`
- Check pod logs: `oc logs -l app=bank-loan-deployment`
- Contact DevOps team

## 🎯 Quick Reference

### Common Commands

```bash
# Deploy
git push origin main  # Triggers automatic deployment

# Check status
oc get pods -l app=bank-loan-deployment
oc get route bank-loan-deployment

# View logs
oc logs -l app=bank-loan-deployment --tail=50 -f

# Restart
oc rollout restart deployment/bank-loan-deployment

# Rollback
oc rollout undo deployment/bank-loan-deployment

# Scale
oc scale deployment/bank-loan-deployment --replicas=5
```

## 📄 License

ISC License

---

**Made with ❤️ by Bob - Your AI DevOps Assistant**