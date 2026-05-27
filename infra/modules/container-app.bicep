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

@description('Custom domains for the app')
param customDomains array = []

@description('Enable certificate binding (false for initial deployment, true afterwards)')
param enableCertificateBinding bool = true

@description('Allowed origins for CORS')
param corsAllowedOrigins array = []

@description('Tags to apply to resources')
param tags object = {}

@description('Name of the storage mount in the environment')
param storageMountName string

// Two-phase deployment: hostnames must be registered before certificates can be created
resource managedCertificates 'Microsoft.App/managedEnvironments/managedCertificates@2024-03-01' = [for domain in customDomains: if (enableCertificateBinding) {
  name: '${environmentName}/cert-${replace(domain, '.', '-')}'
  location: location
  tags: tags
  properties: {
    subjectName: domain
    domainControlValidation: 'CNAME'
  }
}]

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
        customDomains: [for (domain, i) in customDomains: enableCertificateBinding ? {
          name: domain
          certificateId: managedCertificates[i].id
          bindingType: 'SniEnabled'
        } : {
          name: domain
          bindingType: 'Disabled'
        }]
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
        minReplicas: 1
        maxReplicas: 1
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
