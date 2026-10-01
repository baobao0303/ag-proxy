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

        stage('Pull Docker Image') {
            steps {
                echo "Đang kéo Docker Image: ${IMAGE_NAME}:${params.IMAGE_TAG}..."
                sh "docker pull ${IMAGE_NAME}:${params.IMAGE_TAG}"
            }
        }

        stage('Deploy Container') {
            steps {
                echo "Triển khai container mới..."
                sh """
                    # Dừng và xóa container cũ nếu đang chạy
                    if [ \$(docker ps -a -q -f name=^/${CONTAINER_NAME}\$) ]; then
                        echo "Dừng container cũ ${CONTAINER_NAME}..."
                        docker stop ${CONTAINER_NAME} || true
                        docker rm ${CONTAINER_NAME} || true
                    fi

                    # Kiểm tra file env nếu có
                    ENV_OPTS=""
                    if [ -f "${ENV_FILE}" ]; then
                        ENV_OPTS="--env-file ${ENV_FILE}"
                    fi

                    # Khởi chạy container mới
                    docker run -d \\
                        --name ${CONTAINER_NAME} \\
                        --restart always \\
                        -p ${HOST_PORT}:${APP_PORT} \\
                        \$ENV_OPTS \\
                        ${IMAGE_NAME}:${params.IMAGE_TAG}
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
