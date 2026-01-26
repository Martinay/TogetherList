// TogetherList Infrastructure
// Main orchestration file for Azure Container Apps deployment
// 
// Usage:
//   az deployment sub create \
//     --location westeurope \
//     --template-file infra/main.bicep \
//     --parameters infra/parameters/production.bicepparam

targetScope = 'subscription'

// ============================================================================
// Parameters
// ============================================================================

@description('Name of the resource group')
param resourceGroupName string = 'togetherlist-rg'

@description('Base name for all resources')
param baseName string = 'togetherlist'

@description('Azure region for deployment')
param location string = 'westeurope'

@description('Container image to deploy')
param containerImage string

@description('GitHub Container Registry username')
param registryUsername string

@description('GitHub PAT for GHCR authentication')
@secure()
param registryPassword string

@description('Environment tag (e.g., production, staging)')
param environment string = 'production'

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

// ============================================================================
// Resource Group
// ============================================================================

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

// ============================================================================
// Modules
// ============================================================================

module containerAppEnv 'modules/container-app-env.bicep' = {
  name: 'deploy-container-app-env'
  scope: rg
  params: {
    name: envName
    location: location
    tags: tags
  }
}

module containerApp 'modules/container-app.bicep' = {
  name: 'deploy-container-app'
  scope: rg
  params: {
    name: appName
    location: location
    environmentId: containerAppEnv.outputs.id
    containerImage: containerImage
    registryUsername: registryUsername
    registryPassword: registryPassword
    tags: tags
  }
}

// ============================================================================
// Outputs
// ============================================================================

@description('Resource Group name')
output resourceGroup string = rg.name

@description('Container App URL')
output appUrl string = containerApp.outputs.url

@description('Container App FQDN')
output appFqdn string = containerApp.outputs.fqdn

@description('Container Apps Environment name')
output environmentName string = containerAppEnv.outputs.name

