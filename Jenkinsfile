pipeline {
    agent any

    parameters {
        string(name: 'IMAGE_TAG', defaultValue: 'latest', description: 'Tag version Docker cần pull về chạy (ví dụ: latest, v0.1.1,...)')
    }

    environment {
        REGISTRY = 'ghcr.io'
        IMAGE_NAME = 'ghcr.io/baobao0303/ag-proxy'
        CONTAINER_NAME = 'ag-proxy'
        APP_PORT = '3000'
        HOST_PORT = '3000'
        ENV_FILE = '/app/ag-proxy/.env.local' // Đường dẫn tới file .env.local trên server Jenkins/Production
    }

    stages {
        stage('Docker Login GHCR') {
            steps {
                echo "Đăng nhập vào GitHub Container Registry..."
                // Yêu cầu cấu hình Jenkins Credential loại Username/Password với ID: github-ghcr-creds
                withCredentials([usernamePassword(
                    credentialsId: 'github-ghcr-creds',
                    usernameVariable: 'GH_USER',
                    passwordVariable: 'GH_TOKEN'
                )]) {
                    sh 'echo "$GH_TOKEN" | docker login "$REGISTRY" -u "$GH_USER" --password-stdin'
                }
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                echo "Triển khai bằng Docker Compose với IMAGE_TAG=${params.IMAGE_TAG}..."
                sh """
                    export IMAGE_TAG="${params.IMAGE_TAG}"
                    docker compose pull ag-proxy
                    docker compose up -d --remove-orphans ag-proxy
                """
            }
        }

        stage('Health Check') {
            steps {
                echo "Kiểm tra trạng thái container sau khi khởi động..."
                sleep 5
                sh "docker ps -f name=^/${CONTAINER_NAME}\$"
            }
        }

        stage('Cleanup Old Images') {
            steps {
                echo "Dọn dẹp các dangling image cũ để giải phóng ổ cứng..."
                sh 'docker image prune -f || true'
            }
        }
    }

    post {
        success {
            echo "Deploy thành công phiên bản: ${IMAGE_NAME}:${params.IMAGE_TAG}!"
        }
        failure {
            echo "Deploy thất bại! Vui lòng kiểm tra console log."
        }
    }
}
