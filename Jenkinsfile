pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        PROJECT_NAME = 'sassblum'
        IMAGE_TAG = "${BUILD_NUMBER}"
        DOCKER_REGISTRY_USER = 'kimi2123'
        DOCKER_IMAGE_BACKEND = "${DOCKER_REGISTRY_USER}/${PROJECT_NAME}-backend"
        DOCKER_IMAGE_FRONTEND = "${DOCKER_REGISTRY_USER}/${PROJECT_NAME}-frontend"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log -1 --oneline'
            }
        }

        stage('Backend Tests') {
            steps {
                dir('backend') {
                    sh '''
                        echo "=== Generando .env de CI ==="
                        cat > .env << 'ENVEOF'
DJANGO_SECRET_KEY=ci-only-secret-key-not-used-in-production
DJANGO_DEBUG=True
DATABASE_URL=postgresql://ci:ci@localhost:5432/ci
JWT_ACCESS_TOKEN_LIFETIME=3600
JWT_REFRESH_TOKEN_LIFETIME=604800
ENVEOF

                        echo "=== Creando entorno virtual ==="
                        python3 -m venv .venv-ci || exit 1
                        . .venv-ci/bin/activate || exit 1

                        echo "=== Instalando dependencias ==="
                        pip install -r requirements-dev.txt || exit 1

                        echo "=== Django system check ==="
                        python manage.py check || exit 1

                        echo "=== Tests con pytest (solo unitarios) ==="
                        pytest -v -m "not django_db" || exit 1

                        echo "=== Lint con flake8 (no bloqueante) ==="
                        flake8 apps config core --max-line-length=120 --exclude=migrations || true
                    '''
                }
            }
        }

        stage('Frontend Tests') {
            steps {
                dir('frontend') {
                    sh '''
                        echo "=== Instalando dependencias ==="
                        npm ci || exit 1

                        echo "=== TypeScript check ==="
                        npx tsc --noEmit || exit 1

                        echo "=== Tests con vitest ==="
                        npm run test -- --pool=threads --no-file-parallelism || exit 1

                        echo "=== Lint con ESLint (no bloqueante) ==="
                        npm run lint || true
                    '''
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    sh """
                        echo "=== Build imagen backend ==="
                        docker build -t ${DOCKER_IMAGE_BACKEND}:${IMAGE_TAG} -t ${DOCKER_IMAGE_BACKEND}:latest .
                    """
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    sh """
                        echo "=== Build imagen frontend ==="
                        docker build -t ${DOCKER_IMAGE_FRONTEND}:${IMAGE_TAG} -t ${DOCKER_IMAGE_FRONTEND}:latest .
                    """
                }
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-credentials',
                                 usernameVariable: 'DOCKER_USER',
                                 passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "=== Login Docker Hub ==="
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin || exit 1

                        echo "=== Push backend ==="
                        docker push ${DOCKER_IMAGE_BACKEND}:${IMAGE_TAG} || exit 1
                        docker push ${DOCKER_IMAGE_BACKEND}:latest || exit 1

                        echo "=== Push frontend ==="
                        docker push ${DOCKER_IMAGE_FRONTEND}:${IMAGE_TAG} || exit 1
                        docker push ${DOCKER_IMAGE_FRONTEND}:latest || exit 1

                        docker logout
                    '''
                }
            }
        }

        // Se activa en ETAPA E: crear las credenciales 'render-deploy-hook' y
        // 'vercel-deploy-hook' (Secret text) en Jenkins y descomentar este stage.
        /*
        stage('Deploy (Render + Vercel)') {
            steps {
                withCredentials([
                    string(credentialsId: 'render-deploy-hook', variable: 'RENDER_HOOK'),
                    string(credentialsId: 'vercel-deploy-hook', variable: 'VERCEL_HOOK')
                ]) {
                    sh '''
                        echo "=== Disparando deploy de backend en Render ==="
                        curl -f -X POST "$RENDER_HOOK"

                        echo "=== Disparando deploy de frontend en Vercel ==="
                        curl -f -X POST "$VERCEL_HOOK"
                    '''
                }
            }
        }

        stage('Smoke Tests') {
            steps {
                sh '''
                    echo "=== Esperando a que los deploys terminen (90s) ==="
                    sleep 90

                    echo "=== Backend vivo? ==="
                    curl -f https://sassblum-backend.onrender.com/api/servicios/ || exit 1

                    echo "=== Frontend vivo? ==="
                    curl -f https://sassblum.vercel.app/ || exit 1

                    echo "Smoke tests OK"
                '''
            }
        }
        */
    }

    post {
        always {
            sh 'rm -rf backend/.venv-ci'
            echo "Build finished: ${currentBuild.currentResult}"
        }
        failure {
            echo 'Pipeline FALLO - revisar el log de consola arriba.'
        }
        success {
            echo "Pipeline OK - build #${BUILD_NUMBER}"
        }
    }
}
