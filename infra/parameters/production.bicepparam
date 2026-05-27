// Production environment parameters
// Secure values (registryPassword) are passed via CI/CD pipeline

using '../main.bicep'

param baseName = 'togetherlist'
param location = 'westeurope'
param environment = 'production'
param customDomain = 'togetherlist.eu'
// Certificate binding enabled for normal operation (see docs/ssl-setup.md for first-time setup)
param enableCertificateBinding = true

// These are overridden at deployment time via --parameters
param containerImage = 'ghcr.io/OWNER/shared-list:latest'
param registryUsername = 'GITHUB_USERNAME'
param registryPassword = '' // Passed securely via CI/CD

