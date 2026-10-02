pipeline {
    agent any

    parameters {
        string(name: 'IMAGE_TAG', defaultValue: 'latest',
               description: 'Tag can pull (latest, v0.1.1, ...)')
    }

    environment {
        // The image's own port is 5032 (see the Dockerfile EXPOSE). 3000 was
        // left over from before the port change and published the wrong port.
        REGISTRY    = 'ghcr.io'
        IMAGE       = 'ghcr.io/baobao0303/ag-proxy'
        COMPOSE_DIR = '/data/server'
        ENV_FILE    = '/data/server/ag-proxy.env'
        TOKEN_FILE  = '/data/server/.ghcr-token'
    }

    stages {
        stage('Deploy') {
            steps {
                sh '''
                    set -e
                    export DOCKER_HOST=unix:///var/run/docker.sock
                    export IMAGE_TAG="${IMAGE_TAG}"
                    bash scripts/deploy.sh
                '''
            }
        }
    }

    post {
        success { echo "Deployed ${IMAGE}:${params.IMAGE_TAG}" }
        failure { echo 'Deploy failed - see console.' }
    }
}
