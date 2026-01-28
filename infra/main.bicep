// TogetherList Infrastructure
// Main orchestration file for Azure Container Apps deployment
// 
// Usage:
//   az deployment group create \
//     --resource-group togetherlist-rg \
//     --template-file infra/main.bicep \
//     --parameters infra/parameters/production.bicepparam

targetScope = 'resourceGroup'

// ============================================================================
// Parameters
// ============================================================================

@description('Base name for all resources')
param baseName string = 'togetherlist'

@description('Azure region for deployment')
param location string = resourceGroup().location

@description('Container image to deploy')
param containerImage string

@description('GitHub Container Registry username')
param registryUsername string

@description('GitHub PAT for GHCR authentication')
@secure()
param registryPassword string

@description('Environment tag (e.g., production, staging)')
param environment string = 'production'

@description('Custom domain for the Container App (leave empty to disable)')
param customDomain string = ''

// ============================================================================
// Variables
// ============================================================================

var tags = {
  application: 'togetherlist'
  environment: environment
  managedBy: 'bicep'
}

var envName = '${baseName}-env'
var appName = baseName

// CORS allowed origins (derived from custom domain)
var corsAllowedOrigins = !empty(customDomain) ? [
  'https://${customDomain}'
] : []

// ============================================================================
// Modules
// ============================================================================

module containerAppEnv 'modules/container-app-env.bicep' = {
  name: 'deploy-container-app-env'
  params: {
    name: envName
    location: location
    tags: tags
  }
}

module containerApp 'modules/container-app.bicep' = {
  name: 'deploy-container-app'
  params: {
    name: appName
    location: location
    environmentId: containerAppEnv.outputs.id
    environmentName: containerAppEnv.outputs.name
    containerImage: containerImage
    registryUsername: registryUsername
    registryPassword: registryPassword
    customDomain: customDomain
    corsAllowedOrigins: corsAllowedOrigins
    tags: tags
  }
}

// ============================================================================
// Outputs
// ============================================================================

@description('Resource Group name')
output resourceGroup string = az.resourceGroup().name

@description('Container App URL')
output appUrl string = containerApp.outputs.url

@description('Container App FQDN')
output appFqdn string = containerApp.outputs.fqdn

@description('Container Apps Environment name')
output environmentName string = containerAppEnv.outputs.name
