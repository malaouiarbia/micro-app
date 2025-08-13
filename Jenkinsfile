pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = 'arbiamalaoui1'
        DOCKERHUB_REPO = 'micro-app'
        TRIVY_CACHE = '/var/lib/jenkins/.cache/trivy'
      //  SONARQUBE_ENV = 'sonarqube-server'
    }

    stages {
        stage('Checkout code') {
            steps {
                git 'https://github.com/malaouiarbia/micro-app.git'
            }
        }

    
//   stage('SonarQube Analysis for all projects') {
//     steps {
//         withCredentials([string(credentialsId: 'jenkins-sonarqube-token', variable: 'SONAR_TOKEN')]) {
//             script {
//                 def projects = ["auth", "client", "expiration", "orders", "payments", "tickets"]
//                 for (proj in projects) {
//                     sh """
//                         echo "Running sonar scanner for project ${proj}..."
//                         npx sonar-scanner -X \
//                             -Dsonar.projectKey=${proj} \
//                             -Dsonar.sources=. \
//                             -Dsonar.host.url=http://localhost:9000 \
//                             -Dsonar.login=${SONAR_TOKEN}
//                     """
//                 }
//             }
//         }
//     }
// }
        stage('Build, Scan & Push Microservices') {
            steps {
                script {
                    def services = ["auth", "client", "expiration", "orders", "payments", "tickets"]
                    
                    // Ensure Trivy cache exists
                    sh """
                        mkdir -p ${TRIVY_CACHE}
                        mkdir -p trivy-reports
                    """

                    for (service in services) {
                        def imageName = "${DOCKERHUB_USERNAME}/${DOCKERHUB_REPO}-${service}:latest"
                        def servicePath = "${service}"
                        echo "Building image for ${service}..."

                        // Build Docker image
                        sh "docker build -t ${imageName} ${servicePath}"

                        // Trivy Scan with optimizations
                        echo "Scanning image ${imageName} with Trivy..."
                        sh """
                            trivy image \
                                --severity HIGH,CRITICAL \
                                --no-progress \
                                --scanners vuln \
                                --timeout 10m \
                                --cache-dir ${TRIVY_CACHE} \
                                --format table \
                                --output trivy-reports/${service}_report.txt \
                                ${imageName}
                        """
                        sh "cat trivy-reports/${service}_report.txt"

                        // Push to DockerHub
                        withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                            sh """
                                echo \$DOCKER_PASSWORD | docker login -u \$DOCKER_USERNAME --password-stdin
                                docker push ${imageName}
                                docker logout
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'trivy-reports/*.txt', fingerprint: true
        }
    }
}
