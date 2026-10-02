pipeline {
    agent any

    parameters {
        string(name: 'IMAGE_TAG', defaultValue: 'latest',
               description: 'Tag version Docker can pull (latest, v0.1.1, ...)')
    }

    environment {
        REGISTRY   = 'ghcr.io'
        IMAGE_NAME = 'ghcr.io/baobao0303/ag-proxy'
        // The image's own port is 5032 (Dockerfile EXPOSE). 3000 was left over
        // from before the port change and made the published port wrong.
        APP_PORT   = '5032'
        HOST_PORT  = '5032'
        COMPOSE_DIR = '/data/server'
        ENV_FILE   = '/data/server/ag-proxy.env'
    }

    stages {
        stage('Check') {
            steps {
                sh '''
                    set -e
                    test -f "$ENV_FILE" || { echo "MISSING: $ENV_FILE"; exit 1; }
                    # The app needs these; without them every request 500s.
                    for v in FLOCI_ENDPOINT AWS_REGION AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY JWT_SECRET; do
                        grep -q "^$v=" "$ENV_FILE" || { echo "MISSING $v in $ENV_FILE"; exit 1; }
                    done
                    echo "env ok"
                '''
            }
        }

        stage('Docker Login GHCR') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github-ghcr-creds',
                    usernameVariable: 'GH_USER',
                    passwordVariable: 'GH_TOKEN'
                )]) {
                    sh 'echo "$GH_TOKEN" | docker login "$REGISTRY" -u "$GH_USER" --password-stdin'
                }
            }
        }

        stage('Pull image') {
            steps {
                sh """
                    set -e
                    docker pull ${IMAGE_NAME}:${params.IMAGE_TAG}
                    # Record the digest so the health check below can prove the
                    # running container is this image and not a stale one.
                    docker inspect --format '{{{{.Id}}}}' ${IMAGE_NAME}:${params.IMAGE_TAG} > /tmp/ag-image-id
                    cat /tmp/ag-image-id
                """
            }
        }

        stage('Deploy') {
            steps {
                sh """
                    set -e
                    export DOCKER_HOST=unix:///var/run/docker.sock
                    export IMAGE_TAG=${params.IMAGE_TAG}
                    docker compose -f ${COMPOSE_DIR}/compose.yml up -d --no-build --force-recreate ag-proxy
                """
            }
        }

        stage('Health Check') {
            steps {
                // A running container is not proof: wait for a real HTTP 200 from
                // the app. Probed over the compose network because 127.0.0.1
                // inside the Jenkins container is the Jenkins container.
                script {
                    def ok = false
                    for (int i = 0; i < 40; i++) {
                        def code = sh(
                            script: 'curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://ag-proxy:5032/api/setup/status || true',
                            returnStdout: true).trim()
                        if (code == '200') { ok = true; break; }
                        sleep 3
                    }
                    if (!ok) {
                        sh 'docker compose -f /data/server/compose.yml logs --tail 60 ag-proxy || true'
                        error('ag-proxy did not return 200 on /api/setup/status within 120s')
                    }
                    echo 'READY: /api/setup/status 200'
                }
            }
        }

        stage('Verify running image') {
            steps {
                sh """
                    set -e
                    export DOCKER_HOST=unix:///var/run/docker.sock
                    running=\$(docker inspect ag-proxy --format '{{{{.Image}}}}')
                    expected=\$(cat /tmp/ag-image-id)
                    echo "running:  \$running"
                    echo "expected: \$expected"
                    if [ "\$running" != "\$expected" ]; then
                        echo 'MISMATCH: container is not running the pulled image'
                        exit 1
                    fi
                    echo 'image verified'
                """
            }
        }

        stage('Cleanup') {
            steps {
                sh 'docker image prune -f || true'
            }
        }
    }

    post {
        success { echo "Deployed ${IMAGE_NAME}:${params.IMAGE_TAG}" }
        failure { echo 'Deploy failed - see console.' }
    }
}
