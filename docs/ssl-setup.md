# SSL Certificate Setup for Custom Domains

This document explains how to configure a free managed SSL certificate for custom domains on Azure Container Apps.

## Overview

Azure Container Apps provides free managed SSL certificates. However, there's a "chicken-egg" problem during initial setup:

1. To create a managed certificate, the custom domain must already be added to the container app
2. To bind a certificate to a custom domain, the certificate must already exist

The solution is a **two-phase deployment** for the initial setup only.

## Prerequisites

Before setting up SSL, ensure your DNS is configured correctly:

1. **CNAME Record**: Point your custom domain to the Container App's default FQDN
   ```
   togetherlist.eu CNAME togetherlist.westeurope.azurecontainerapps.io
   ```

2. **ASUID (domain verification)** TXT record:
   ```
   asuid.togetherlist.eu TXT <container-app-custom-domain-verification-id>
   ```

   Get the verification ID:
   ```bash
   az containerapp show \
     --name togetherlist \
     --resource-group togetherlist-rg \
     --query "properties.customDomainVerificationId" \
     -o tsv
   ```

## First-Time SSL Setup

When deploying for the first time with a custom domain, you must run two deployments:

### Phase 1: Create Certificate (binding disabled)

```bash
az deployment group create \
  --name "ssl-phase1" \
  --resource-group togetherlist-rg \
  --template-file infra/main.bicep \
  --parameters infra/parameters/production.bicepparam \
  --parameters \
    containerImage=ghcr.io/martinay/shared-list:latest \
    registryUsername=<github-username> \
    registryPassword=<github-pat> \
    enableCertificateBinding=false
```

This deployment:
- Creates the Container App with the custom domain registered (binding disabled)
- Does NOT create the certificate yet (Azure requires the hostname to be registered first)

### Phase 2: Create Certificate and Enable Binding

```bash
az deployment group create \
  --name "ssl-phase2" \
  --resource-group togetherlist-rg \
  --template-file infra/main.bicep \
  --parameters infra/parameters/production.bicepparam \
  --parameters \
    containerImage=ghcr.io/martinay/shared-list:latest \
    registryUsername=<github-username> \
    registryPassword=<github-pat> \
    enableCertificateBinding=true
```

This deployment:
- Creates the managed certificate for the domain (now possible because the hostname exists)
- Updates the Container App to bind the certificate with SNI
- Enables SSL for the custom domain

## Subsequent Deployments

After the initial setup, the CI/CD pipeline always runs with `enableCertificateBinding=true`. This preserves the SSL binding and simply updates the container image.

No additional manual steps are required for future deployments.

## Troubleshooting

### Certificate creation fails

**Error**: "The managed certificate could not be created"

**Solution**: Verify DNS configuration:
1. Ensure CNAME record points to the Container App FQDN
2. Ensure ASUID TXT record exists with correct verification ID
3. Wait for DNS propagation (up to 48 hours for some registrars)

### Verify certificate status

```bash
az containerapp env certificate list \
  --resource-group togetherlist-rg \
  --name togetherlist-env \
  --query "[?properties.subjectName=='togetherlist.eu']"
```

## References

- [Azure Container Apps - Custom domains with managed certificates](https://learn.microsoft.com/en-us/azure/container-apps/custom-domains-managed-certificates)
- [Microsoft Bicep templates for managed certificates](https://github.com/microsoft/azure-container-apps/tree/main/templates/bicep/managedCertificates)
