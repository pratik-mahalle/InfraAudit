pipeline {
  agent none

  options {
    disableConcurrentBuilds(abortPrevious: false)
    skipDefaultCheckout(true)
    timestamps()
    timeout(time: 90, unit: 'MINUTES')
  }

  stages {
    stage('Validate') {
      agent { label 'infraudit-validation' }
      steps {
        checkout scm
        sh './infra/jenkins/validate-frontend.sh'
      }
      post {
        always {
          cleanWs(deleteDirs: true, disableDeferredWipeout: true)
        }
      }
    }

    stage('Deploy production') {
      when {
        allOf {
          branch 'main'
          not { changeRequest() }
        }
      }
      agent { label 'infraudit-production' }
      environment {
        AWS_ACCOUNT_ID = '007761758041'
        AWS_REGION = 'us-east-1'
        ECR_REPOSITORY = 'infraudit-production-frontend'
        ECS_CLUSTER = 'infraudit-production'
        ECS_SERVICE = 'frontend'
        APPLICATION_HEALTH_URL = 'https://infraudit.com/'
        FRONTEND_BUILD_SECRET_ID = 'infraudit/production/frontend-build'
      }
      steps {
        script {
          def scmVars = checkout scm
          env.GIT_COMMIT = scmVars.GIT_COMMIT
        }
        withCredentials([usernamePassword(credentialsId: 'infraudit-github', usernameVariable: 'GITHUB_USERNAME', passwordVariable: 'GITHUB_TOKEN')]) {
          sh './infra/jenkins/release-frontend.sh'
        }
      }
      post {
        always {
          cleanWs(deleteDirs: true, disableDeferredWipeout: true)
        }
      }
    }
  }
}
