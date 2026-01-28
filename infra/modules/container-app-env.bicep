// Container Apps Environment Module
// Provides hosting environment with VNet integration and NFS storage mounts

@description('Name of the Container Apps environment')
param name string

@description('Azure region for deployment')
param location string

@description('Tags to apply to resources')
param tags object = {}

@description('Resource ID of the infrastructure subnet for Container Apps')
param infrastructureSubnetId string

@description('Name for the storage mount')
param storageMountName string

@description('NFS server address')
param nfsServer string

@description('NFS share path')
param nfsSharePath string

resource containerAppEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    zoneRedundant: false
    vnetConfiguration: {
      infrastructureSubnetId: infrastructureSubnetId
      internal: false
    }
  }
}

resource storageMount 'Microsoft.App/managedEnvironments/storages@2024-10-02-preview' = {
  parent: containerAppEnv
  name: storageMountName
  properties: {
    nfsAzureFile: {
      server: nfsServer
      shareName: nfsSharePath
      accessMode: 'ReadWrite'
    }
  }
}

@description('Resource ID of the Container Apps environment')
output id string = containerAppEnv.id

@description('Name of the Container Apps environment')
output name string = containerAppEnv.name

@description('Name of the storage mount')
output storageMountName string = storageMount.name
