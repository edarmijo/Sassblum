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
                bat 'git log -1 --oneline'
            }
        }

        stage('Backend Tests') {
            steps {
                script {
                    def backendDir = null

                    if (fileExists('backend/requirements-dev.txt')) {
                        backendDir = 'backend'
                    } else if (fileExists('requirements-dev.txt')) {
                        backendDir = '.'
                    }

                    def managePyPath = backendDir == '.' ? 'manage.py' : 'backend/manage.py'

                    if (backendDir == null || !fileExists(managePyPath)) {
                        echo 'No se encontro una estructura de backend valida; se omite el stage.'
                        return
                    }

                    dir(backendDir) {
                        bat '''
                            echo === Generando .env de CI (valores dummy, los tests unitarios no usan BD) ===
                            (
                                echo DJANGO_SECRET_KEY=ci-only-secret-key-not-used-in-production
                                echo DJANGO_DEBUG=True
                                echo DATABASE_URL=postgresql://ci:ci@localhost:5432/ci
                                echo JWT_ACCESS_TOKEN_LIFETIME=3600
                                echo JWT_REFRESH_TOKEN_LIFETIME=604800
                            ) > .env

                            echo === Creando entorno virtual ===
                            python -m venv .venv-ci || exit /b 1
                            call .venv-ci\Scripts\activate.bat || exit /b 1

                            echo === Instalando dependencias ===
                            pip install -r requirements-dev.txt || exit /b 1

                            echo === Django system check ===
                            python manage.py check || exit /b 1

                            echo === Tests con pytest (solo unitarios; los django_db requieren BD) ===
                            pytest -v -m "not django_db" || exit /b 1

                            echo === Lint con flake8 (no bloqueante) ===
                            flake8 apps config core --max-line-length=120 --exclude=migrations
                            exit /b 0
                        '''
                    }
                }
            }
        }

        stage('Frontend Tests') {
            steps {
                script {
                    def frontendDir = null

                    if (fileExists('frontend/package.json')) {
                        frontendDir = 'frontend'
                    } else if (fileExists('package.json')) {
                        frontendDir = '.'
                    }

                    if (frontendDir == null) {
                        echo 'No se encontro un frontend valido; se omite el stage.'
                        return
                    }

                    dir(frontendDir) {
                        bat '''
                            echo === Instalando dependencias ===
                            call npm ci || exit /b 1

                            echo === TypeScript check ===
                            call npx tsc --noEmit || exit /b 1

                            echo === Tests con vitest (threads sin paralelismo: los forks no arrancan bajo la cuenta de servicio de Jenkins) ===
                            call npm run test -- --pool=threads --no-file-parallelism || exit /b 1

                            echo === Lint con ESLint (no bloqueante: 25 errores preexistentes pendientes de limpiar) ===
                            call npm run lint
                            exit /b 0
                        '''
                    }
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                script {
                    if (fileExists('backend/Dockerfile')) {
                        dir('backend') {
                            bat '''
                                echo === Build imagen backend ===
                                docker build -t %DOCKER_IMAGE_BACKEND%:%IMAGE_TAG% -t %DOCKER_IMAGE_BACKEND%:latest .
                            '''
                        }
                        env.BACKEND_IMAGE_BUILT = 'true'
                        return
                    }

                    if (fileExists('Dockerfile')) {
                        bat '''
                            echo === Build imagen backend ===
                            docker build -t %DOCKER_IMAGE_BACKEND%:%IMAGE_TAG% -t %DOCKER_IMAGE_BACKEND%:latest .
                        '''
                        env.BACKEND_IMAGE_BUILT = 'true'
                        return
                    }

                    env.BACKEND_IMAGE_BUILT = 'false'
                    echo 'No se encontro Dockerfile para backend; se omite el build.'
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                script {
                    if (fileExists('frontend/Dockerfile')) {
                        dir('frontend') {
                            bat '''
                                echo === Build imagen frontend ===
                                docker build -t %DOCKER_IMAGE_FRONTEND%:%IMAGE_TAG% -t %DOCKER_IMAGE_FRONTEND%:latest .
                            '''
                        }
                        env.FRONTEND_IMAGE_BUILT = 'true'
                        return
                    }

                    if (fileExists('Dockerfile')) {
                        bat '''
                            echo === Build imagen frontend ===
                            docker build -t %DOCKER_IMAGE_FRONTEND%:%IMAGE_TAG% -t %DOCKER_IMAGE_FRONTEND%:latest .
                        '''
                        env.FRONTEND_IMAGE_BUILT = 'true'
                        return
                    }

                    env.FRONTEND_IMAGE_BUILT = 'false'
                    echo 'No se encontro Dockerfile para frontend; se omite el build.'
                }
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-credentials',
                                 usernameVariable: 'DOCKER_USER',
                                 passwordVariable: 'DOCKER_PASS')]) {
                    script {
                        if (env.BACKEND_IMAGE_BUILT != 'true' && env.FRONTEND_IMAGE_BUILT != 'true') {
                            echo 'No hay imagenes construidas para publicar; se omite el push.'
                            return
                        }

                        bat '''
                            echo === Login Docker Hub ===
                            echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin || exit /b 1

                            if "%BACKEND_IMAGE_BUILT%"=="true" (
                                echo === Push backend ===
                                docker push %DOCKER_IMAGE_BACKEND%:%IMAGE_TAG% || exit /b 1
                                docker push %DOCKER_IMAGE_BACKEND%:latest || exit /b 1
                            )

                            if "%FRONTEND_IMAGE_BUILT%"=="true" (
                                echo === Push frontend ===
                                docker push %DOCKER_IMAGE_FRONTEND%:%IMAGE_TAG% || exit /b 1
                                docker push %DOCKER_IMAGE_FRONTEND%:latest || exit /b 1
                            )

                            docker logout
                        '''
                    }
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
                    bat '''
                        echo === Disparando deploy de backend en Render ===
                        curl -f -X POST "%RENDER_HOOK%"

                        echo === Disparando deploy de frontend en Vercel ===
                        curl -f -X POST "%VERCEL_HOOK%"
                    '''
                }
            }
        }

        stage('Smoke Tests') {
            steps {
                bat '''
                    echo === Esperando a que los deploys terminen (90s) ===
                    ping -n 90 127.0.0.1 > nul

                    echo === Backend vivo? ===
                    curl -f https://sassblum-backend.onrender.com/api/servicios/ || exit /b 1

                    echo === Frontend vivo? ===
                    curl -f https://sassblum.vercel.app/ || exit /b 1

                    echo Smoke tests OK
                '''
            }
        }
        */
    }

    post {
        always {
            bat '''
                if exist backend\.venv-ci rmdir /s /q backend\.venv-ci
                if exist .venv-ci rmdir /s /q .venv-ci
            '''
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
