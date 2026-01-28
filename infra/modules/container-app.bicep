// Container App Module
// Deploys the TogetherList application container
// Uses Consumption tier (free tier) with pay-per-use pricing
//
// For custom domains with managed certificates, this module uses a 3-step deployment:
// 1. Deploy container app with custom domain (no certificate)
// 2. Create managed certificate with HTTP validation
// 3. Update container app to bind the certificate

@description('Name of the Container App')
param name string

@description('Azure region for deployment')
param location string

@description('Resource ID of the Container Apps environment')
param environmentId string

@description('Name of the Container Apps environment (for certificate resource)')
param environmentName string

@description('Container image to deploy (e.g., ghcr.io/owner/repo:tag)')
param containerImage string

@description('GitHub Container Registry server')
param registryServer string = 'ghcr.io'

@description('GitHub username for GHCR authentication')
param registryUsername string

@description('GitHub PAT for GHCR authentication')
@secure()
param registryPassword string

@description('Custom domain for the app (leave empty to disable)')
param customDomain string = ''

@description('Allowed origins for CORS (empty array disables CORS)')
param corsAllowedOrigins array = []

@description('Tags to apply to resources')
param tags object = {}

// ============================================================================
// Shared Configuration (define once, use in both container app resources)
// ============================================================================

var registriesConfig = [
  {
    server: registryServer
    username: registryUsername
    passwordSecretRef: 'registry-password'
  }
]

var secretsConfig = [
  {
    name: 'registry-password'
    value: registryPassword
  }
]

var corsPolicyConfig = !empty(corsAllowedOrigins) ? {
  allowedOrigins: corsAllowedOrigins
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  allowedHeaders: ['*']
  allowCredentials: true
  maxAge: 86400
} : null

var containerConfig = [
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

var scaleConfig = {
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

// ============================================================================
// Step 1: Deploy container app with custom domain (no certificate binding yet)
// ============================================================================

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
        customDomains: !empty(customDomain) ? [
          {
            name: customDomain
            bindingType: 'Disabled'
          }
        ] : []
        corsPolicy: corsPolicyConfig
      }
      registries: registriesConfig
      secrets: secretsConfig
    }
    template: {
      containers: containerConfig
      scale: scaleConfig
    }
  }
}

// ============================================================================
// Step 2: Create managed certificate (requires custom domain on app first)
// ============================================================================

resource managedCertificate 'Microsoft.App/managedEnvironments/managedCertificates@2024-03-01' = if (!empty(customDomain)) {
  name: '${environmentName}/${name}-cert'
  location: location
  tags: tags
  properties: {
    subjectName: customDomain
    domainControlValidation: 'HTTP'
  }
  dependsOn: [
    containerApp
  ]
}

// ============================================================================
// Step 3: Update container app to bind the certificate
// ============================================================================

resource containerAppWithCert 'Microsoft.App/containerApps@2024-03-01' = if (!empty(customDomain)) {
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
        customDomains: [
          {
            name: customDomain
            certificateId: managedCertificate.id
            bindingType: 'SniEnabled'
          }
        ]
        corsPolicy: corsPolicyConfig
      }
      registries: registriesConfig
      secrets: secretsConfig
    }
    template: {
      containers: containerConfig
      scale: scaleConfig
    }
  }
  dependsOn: [
    managedCertificate
  ]
}

// ============================================================================
// Outputs
// ============================================================================

@description('FQDN of the Container App')
output fqdn string = containerApp.properties.configuration.ingress.fqdn

@description('URL of the Container App')
output url string = 'https://${containerApp.properties.configuration.ingress.fqdn}'

@description('Custom domain URL (if configured)')
output customDomainUrl string = !empty(customDomain) ? 'https://${customDomain}' : ''
