// Container App Module
// Deploys the TogetherList application container
// Uses Consumption tier (free tier) with pay-per-use pricing

@description('Name of the Container App')
param name string

@description('Azure region for deployment')
param location string

@description('Resource ID of the Container Apps environment')
param environmentId string

@description('Container image to deploy (e.g., ghcr.io/owner/repo:tag)')
param containerImage string

@description('GitHub Container Registry server')
param registryServer string = 'ghcr.io'

@description('GitHub username for GHCR authentication')
param registryUsername string

@description('GitHub PAT for GHCR authentication')
@secure()
param registryPassword string

@description('Tags to apply to resources')
param tags object = {}

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
