#!/usr/bin/env groovy

/**
 * Jenkins Pipeline for Bank FE Fix Deployment to OpenShift
 * 
 * This pipeline implements a complete CI/CD workflow:
 * 1. Checkout source code from Git
 * 2. Deploy to OpenShift production namespace
 * 3. Verify deployment health
 * 4. Rollback on failure
 */

pipeline {
    agent any
    
    // Environment variables
    environment {
        // OpenShift configuration
        OPENSHIFT_PROJECT = 'production'
        
        // Application configuration
        APP_NAME = 'bank-loan-deployment'
        APP_VERSION = "${env.BUILD_NUMBER}"
        
        // Deployment configuration
        REPLICAS = '3'
        HEALTH_CHECK_TIMEOUT = '300'
        
        // Rollback flag
        DEPLOYMENT_SUCCESSFUL = 'false'
    }
    
    // Pipeline options
    options {
        // Keep only last 10 builds
        buildDiscarder(logRotator(numToKeepStr: '10'))
        
        // Timeout for entire pipeline
        timeout(time: 30, unit: 'MINUTES')
        
        // Disable concurrent builds
        disableConcurrentBuilds()
    }
    
    // Pipeline stages
    stages {
        
        stage('Initialize') {
            steps {
                script {
                    echo "=========================================="
                    echo "Pipeline Initialization"
                    echo "=========================================="
                    echo "Build Number: ${env.BUILD_NUMBER}"
                    echo "Build ID: ${env.BUILD_ID}"
                    echo "Job Name: ${env.JOB_NAME}"
                    echo "Workspace: ${env.WORKSPACE}"
                    echo "OpenShift Project: ${OPENSHIFT_PROJECT}"
                    echo "Application: ${APP_NAME}"
                    echo "=========================================="
                }
            }
        }
        
        stage('Verify Workspace') {
            steps {
                script {
                    echo "=========================================="
                    echo "Stage 1: Verify Workspace"
                    echo "=========================================="
                    
                    // Jenkins already checked out the code from the configured repo
                    // Just verify the files are present
                    echo "[+] Source code already checked out by Jenkins SCM"
                    
                    // List files
                    sh 'ls -la'
                }
            }
        }
        
        stage('Create ConfigMaps') {
            steps {
                script {
                    echo "=========================================="
                    echo "Stage 2: Create ConfigMaps"
                    echo "=========================================="
                    
                    // Switch to production namespace
                    sh """
                        oc project ${OPENSHIFT_PROJECT}
                        echo "[+] Switched to project: ${OPENSHIFT_PROJECT}"
                    """
                    
                    // Apply nginx config ConfigMap
                    echo "[*] Creating nginx configuration ConfigMap..."
                    sh """
                        oc apply -f openshift/configmap.yaml -n ${OPENSHIFT_PROJECT}
                    """
                    
                    // Create application files ConfigMap preserving directory structure
                    echo "[*] Creating application files ConfigMap with directory structure..."
                    sh """
                        # Create ConfigMap with individual files preserving paths
                            oc create configmap bank-loan-deployment-app \
                            --from-file=index.html=public/index.html \
                            --from-file=styles.css=public/css/styles.css \
                            --from-file=app.js=public/js/app.js \
                            --from-file=auth.js=public/js/auth.js \
                            --from-file=calculator.js=public/js/calculator.js \
                            --from-file=modals.js=public/js/modals.js \
                            --from-file=state.js=public/js/state.js \
                            --from-file=utils.js=public/js/utils.js \
                            --dry-run=client \
                            -o yaml \
                            -n ${OPENSHIFT_PROJECT} | oc apply -f -
                    """
                    
                    echo "[+] ConfigMaps created successfully"
                }
            }
        }
        
        stage('Deploy to OpenShift') {
            steps {
                script {
                    echo "=========================================="
                    echo "Stage 3: Deploy to OpenShift"
                    echo "=========================================="
                    
                    echo "[*] Deploying application..."
                    sh """
                        oc apply -f openshift/deployment.yaml -n ${OPENSHIFT_PROJECT}
                    """
                    
                    echo "[*] Applying Service..."
                    sh """
                        oc apply -f openshift/service.yaml -n ${OPENSHIFT_PROJECT}
                    """
                    
                    echo "[*] Applying Route..."
                    sh """
                        oc apply -f openshift/route.yaml -n ${OPENSHIFT_PROJECT}
                    """
                    
                    echo "[+] Deployment configuration applied"
                }
            }
        }
        
        stage('Wait for Rollout') {
            steps {
                script {
                    echo "=========================================="
                    echo "Stage 3: Wait for Deployment Rollout"
                    echo "=========================================="
                    
                    // Wait for rollout to complete
                    timeout(time: 10, unit: 'MINUTES') {
                        sh """
                            oc rollout status deployment/${APP_NAME} \
                                -n ${OPENSHIFT_PROJECT} \
                                --timeout=10m
                        """
                    }
                    
                    echo "[+] Rollout completed successfully"
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    echo "=========================================="
                    echo "Stage 4: Verify Deployment Health"
                    echo "=========================================="
                    
                    // Get pod status
                    sh """
                        echo "=== Pod Status ==="
                        oc get pods -l app=${APP_NAME} -n ${OPENSHIFT_PROJECT}
                    """
                    
                    // Get deployment status
                    sh """
                        echo "=== Deployment Status ==="
                        oc get deployment ${APP_NAME} -n ${OPENSHIFT_PROJECT}
                    """
                    
                    // Get service
                    sh """
                        echo "=== Service ==="
                        oc get svc ${APP_NAME} -n ${OPENSHIFT_PROJECT}
                    """
                    
                    // Get route URL
                    def routeUrl = sh(
                        script: "oc get route ${APP_NAME} -n ${OPENSHIFT_PROJECT} -o jsonpath='{.spec.host}'",
                        returnStdout: true
                    ).trim()
                    
                    echo "=== Route URL ==="
                    echo "Application URL: https://${routeUrl}"
                    
                    // Wait for pods to be ready
                    sleep(time: 15, unit: 'SECONDS')
                    
                    // Health check
                    echo "=== Health Check ==="
                    def healthCheckPassed = false
                    def maxRetries = 10
                    def retryCount = 0
                    
                    while (!healthCheckPassed && retryCount < maxRetries) {
                        try {
                            sh """
                                curl -f -k https://${routeUrl}/
                            """
                            healthCheckPassed = true
                            echo "[+] Health check passed"
                        } catch (Exception e) {
                            retryCount++
                            echo "[*] Health check attempt ${retryCount}/${maxRetries} failed, retrying..."
                            sleep(time: 10, unit: 'SECONDS')
                        }
                    }
                    
                    if (!healthCheckPassed) {
                        error("Health check failed after ${maxRetries} attempts")
                    }
                    
                    // Mark deployment as successful
                    env.DEPLOYMENT_SUCCESSFUL = 'true'
                    
                    echo "[+] All health checks passed"
                }
            }
        }
        
        stage('Output Information') {
            steps {
                script {
                    echo "=========================================="
                    echo "Stage 5: Deployment Information"
                    echo "=========================================="
                    
                    def routeUrl = sh(
                        script: "oc get route ${APP_NAME} -n ${OPENSHIFT_PROJECT} -o jsonpath='{.spec.host}'",
                        returnStdout: true
                    ).trim()
                    
                    echo """
                    ╔════════════════════════════════════════════════════════════╗
                    ║           DEPLOYMENT COMPLETED SUCCESSFULLY                ║
                    ╠════════════════════════════════════════════════════════════╣
                    ║ Application:     ${APP_NAME}
                    ║ Version:         Build ${APP_VERSION}
                    ║ Namespace:       ${OPENSHIFT_PROJECT}
                    ║ Replicas:        ${REPLICAS}
                    ║
                    ║ Application URL: https://${routeUrl}
                    ║ Health Check:    https://${routeUrl}/health
                    ║                                                            
                    ║ Build Number:    ${env.BUILD_NUMBER}                       
                    ║ Build Time:      ${new Date()}                             
                    ╚════════════════════════════════════════════════════════════╝
                    """
                }
            }
        }
    }
    
    // Post-build actions
    post {
        success {
            script {
                echo "=========================================="
                echo "Pipeline Completed Successfully!"
                echo "=========================================="
            }
        }
        
        failure {
            script {
                echo "=========================================="
                echo "Pipeline Failed!"
                echo "=========================================="
                
                // Rollback if deployment was started but failed
                if (env.DEPLOYMENT_SUCCESSFUL != 'true') {
                    echo "[*] Attempting rollback..."
                    
                    try {
                        sh """
                            oc rollout undo deployment/${APP_NAME} -n ${OPENSHIFT_PROJECT}
                            oc rollout status deployment/${APP_NAME} -n ${OPENSHIFT_PROJECT}
                        """
                        echo "[+] Rollback completed"
                    } catch (Exception e) {
                        echo "[-] Rollback failed: ${e.message}"
                    }
                }
                
                // Get logs for debugging
                sh """
                    echo "=== Recent Pod Logs ==="
                    oc logs -l app=${APP_NAME} --tail=50 -n ${OPENSHIFT_PROJECT} || true
                """
            }
        }
        
        always {
            script {
                echo "=========================================="
                echo "Pipeline Cleanup"
                echo "=========================================="
            }
        }
    }
}

// Made with Bob
