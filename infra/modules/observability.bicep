param name string
param location string
param tags object

@description('Best-effort daily workspace ingestion cap in GB; not a hard spending limit')
param dailyQuotaGb int = 1

resource workspace 'Microsoft.OperationalInsights/workspaces@2025-02-01' = {
  name: '${name}-logs'
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    workspaceCapping: { dailyQuotaGb: dailyQuotaGb }
  }
}

resource insights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${name}-insights'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspace.id
    IngestionMode: 'ApplicationInsights'
    DisableIpMasking: false
    SamplingPercentage: 100
  }
}

@secure()
output connectionString string = insights.properties.ConnectionString
