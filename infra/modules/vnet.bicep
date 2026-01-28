// Virtual Network Module
// Provides VNet for Container Apps environment with NFS storage private endpoints

@description('Name of the Virtual Network')
param name string

@description('Azure region for deployment')
param location string

@description('Tags to apply to resources')
param tags object = {}

@description('Address space for the VNet')
param addressPrefix string = '10.0.0.0/16'

@description('Subnet prefix for Container Apps infrastructure')
param containerAppsSubnetPrefix string = '10.0.0.0/23'

@description('Subnet prefix for private endpoints')
param privateEndpointSubnetPrefix string = '10.0.2.0/24'

resource vnet 'Microsoft.Network/virtualNetworks@2023-11-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [addressPrefix]
    }
    subnets: [
      {
        name: 'container-apps'
        properties: {
          addressPrefix: containerAppsSubnetPrefix
          delegations: [
            {
              name: 'Microsoft.App.environments'
              properties: {
                serviceName: 'Microsoft.App/environments'
              }
            }
          ]
        }
      }
      {
        name: 'private-endpoints'
        properties: {
          addressPrefix: privateEndpointSubnetPrefix
        }
      }
    ]
  }
}

@description('Resource ID of the Virtual Network')
output id string = vnet.id

@description('Name of the Virtual Network')
output name string = vnet.name

@description('Resource ID of the Container Apps subnet')
output containerAppsSubnetId string = vnet.properties.subnets[0].id

@description('Resource ID of the private endpoints subnet')
output privateEndpointSubnetId string = vnet.properties.subnets[1].id
