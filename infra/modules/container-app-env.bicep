// Container Apps Environment Module
// Provides the hosting environment for Container Apps

@description('Name of the Container Apps environment')
param name string

@description('Azure region for deployment')
param location string

@description('Tags to apply to resources')
param tags object = {}

resource containerAppEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    zoneRedundant: false
  }
}

@description('Resource ID of the Container Apps environment')
output id string = containerAppEnv.id

@description('Name of the Container Apps environment')
output name string = containerAppEnv.name
