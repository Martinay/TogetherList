// TogetherList Infrastructure
// Main orchestration file for Azure Container Apps deployment with persistent NFS storage
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

@description('Custom domains for the Container App')
param customDomains array = []

@description('Enable certificate binding (false for initial deployment, true afterwards)')
param enableCertificateBinding bool = true

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
var vnetName = '${baseName}-vnet'
var storageAccountName = replace('${baseName}storage', '-', '')
var storageMountName = 'data-storage'

var corsAllowedOrigins = [for domain in customDomains: 'https://${domain}']

// ============================================================================
// Modules
// ============================================================================

module vnet 'modules/vnet.bicep' = {
  name: 'deploy-vnet'
  params: {
    name: vnetName
    location: location
    tags: tags
  }
}

module storageAccount 'modules/storage-account.bicep' = {
  name: 'deploy-storage-account'
  params: {
    name: storageAccountName
    location: location
    tags: tags
    privateEndpointSubnetId: vnet.outputs.privateEndpointSubnetId
    vnetId: vnet.outputs.id
  }
}

module containerAppEnv 'modules/container-app-env.bicep' = {
  name: 'deploy-container-app-env'
  params: {
    name: envName
    location: location
    tags: tags
    infrastructureSubnetId: vnet.outputs.containerAppsSubnetId
    storageMountName: storageMountName
    nfsServer: storageAccount.outputs.nfsServer
    nfsSharePath: storageAccount.outputs.nfsSharePath
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
    customDomains: customDomains
    enableCertificateBinding: enableCertificateBinding
    corsAllowedOrigins: corsAllowedOrigins
    tags: tags
    storageMountName: containerAppEnv.outputs.storageMountName
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

@description('Storage Account name')
output storageAccountName string = storageAccount.outputs.name

@description('VNet name')
output vnetName string = vnet.outputs.name
