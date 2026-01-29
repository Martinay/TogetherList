// Storage Account Module
// Premium FileStorage with NFS Azure Files and RBAC-only authentication

@description('Name of the storage account')
param name string

@description('Azure region for deployment')
param location string

@description('Tags to apply to resources')
param tags object = {}

@description('Name of the file share')
param fileShareName string = 'togetherlist-data'

@description('File share quota in GB')
param fileShareQuotaGB int = 100

@description('Resource ID of the subnet for private endpoint')
param privateEndpointSubnetId string

@description('Resource ID of the VNet')
param vnetId string

var storageFileSuffix = environment().suffixes.storage
var privateDnsZoneName = 'privatelink.file.${storageFileSuffix}'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: name
  location: location
  tags: tags
  kind: 'FileStorage'
  sku: {
    name: 'Premium_LRS'
  }
  properties: {
    allowSharedKeyAccess: false
    supportsHttpsTrafficOnly: false // NFS requires this
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Disabled'
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'None'
    }
  }
}

resource fileService 'Microsoft.Storage/storageAccounts/fileServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    protocolSettings: {
      smb: {
        multichannel: {
          enabled: false
        }
      }
    }
  }
}

resource fileShare 'Microsoft.Storage/storageAccounts/fileServices/shares@2023-05-01' = {
  parent: fileService
  name: fileShareName
  properties: {
    shareQuota: fileShareQuotaGB
    enabledProtocols: 'NFS'
    rootSquash: 'RootSquash'
  }
}

resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: privateDnsZoneName
  location: 'global'
  tags: tags
}

resource privateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZone
  name: '${name}-vnet-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnetId
    }
  }
}

resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-11-01' = {
  name: '${name}-pe'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: privateEndpointSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${name}-file-connection'
        properties: {
          privateLinkServiceId: storageAccount.id
          groupIds: ['file']
        }
      }
    ]
  }
}

resource privateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-11-01' = {
  parent: privateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'file'
        properties: {
          privateDnsZoneId: privateDnsZone.id
        }
      }
    ]
  }
}

resource storageAccountLock 'Microsoft.Authorization/locks@2020-05-01' = {
  name: '${name}-lock'
  scope: storageAccount
  properties: {
    level: 'CanNotDelete'
    notes: 'Prevents accidental deletion of storage account containing persistent data'
  }
}

@description('Resource ID of the storage account')
output id string = storageAccount.id

@description('Name of the storage account')
output name string = storageAccount.name

@description('Name of the file share')
output fileShareName string = fileShare.name

@description('NFS server address')
output nfsServer string = '${storageAccount.name}.file.${storageFileSuffix}'

@description('NFS share path')
output nfsSharePath string = '/${storageAccount.name}/${fileShareName}'
