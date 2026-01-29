// Container App Module
// Deploys TogetherList container with NFS volume mount

@description('Name of the Container App')
param name string

@description('Azure region for deployment')
param location string

@description('Resource ID of the Container Apps environment')
param environmentId string

@description('Name of the Container Apps environment')
param environmentName string

@description('Container image to deploy')
param containerImage string

@description('GitHub Container Registry server')
param registryServer string = 'ghcr.io'

@description('GitHub username for GHCR authentication')
param registryUsername string

@description('GitHub PAT for GHCR authentication')
@secure()
param registryPassword string

@description('Custom domain for the app')
param customDomain string = ''

@description('Enable certificate binding (false for initial deployment, true afterwards)')
param enableCertificateBinding bool = true

@description('Allowed origins for CORS')
param corsAllowedOrigins array = []

@description('Tags to apply to resources')
param tags object = {}

@description('Name of the storage mount in the environment')
param storageMountName string

// Two-phase deployment: hostname must be registered before certificate can be created
resource managedCertificate 'Microsoft.App/managedEnvironments/managedCertificates@2024-03-01' = if (!empty(customDomain) && enableCertificateBinding) {
  name: '${environmentName}/${name}-cert'
  location: location
  tags: tags
  properties: {
    subjectName: customDomain
    domainControlValidation: 'CNAME'
  }
}

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
        transport: 'auto'
        allowInsecure: false
        customDomains: !empty(customDomain) ? (enableCertificateBinding ? [
          {
            name: customDomain
            certificateId: managedCertificate.id
            bindingType: 'SniEnabled'
          }
        ] : [
          {
            name: customDomain
            bindingType: 'Disabled'
          }
        ]) : []
        corsPolicy: !empty(corsAllowedOrigins) ? {
          allowedOrigins: corsAllowedOrigins
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
          allowedHeaders: ['*']
          allowCredentials: true
          maxAge: 86400
        } : null
      }
      registries: [
        {
          server: registryServer
          username: registryUsername
          passwordSecretRef: 'registry-password'
        }
      ]
      secrets: [
        {
          name: 'registry-password'
          value: registryPassword
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'togetherlist'
          image: containerImage
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'PORT'
              value: '8080'
            }
            {
              name: 'STATIC_DIR'
              value: '/app/static'
            }
            {
              name: 'DATA_DIR'
              value: '/data'
            }
          ]
          volumeMounts: [
            {
              volumeName: 'data-volume'
              mountPath: '/data'
            }
          ]
        }
      ]
      volumes: [
        {
          name: 'data-volume'
          storageType: 'NfsAzureFile'
          storageName: storageMountName
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 2
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '100'
              }
            }
          }
        ]
      }
    }
  }
}

@description('FQDN of the Container App')
output fqdn string = containerApp.properties.configuration.ingress.fqdn

@description('URL of the Container App')
output url string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
