// secrets-loader.js
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const secretsConfig = require('./secrets-config');

class SecretsLoader {
  constructor() {
    this.client = new SecretsManagerClient({ region: secretsConfig.region });
    this.cache = {};
    this.loaded = false;
  }

  async loadSecrets() {
    if (this.loaded) return this.cache;
    console.log('Loading secrets from AWS Secrets Manager...');
    for (const secretName of secretsConfig.secrets) {
      try {
        const response = await this.client.send(
          new GetSecretValueCommand({ SecretId: secretName, VersionStage: 'AWSCURRENT' })
        );
        this.cache[secretName] = JSON.parse(response.SecretString);
        console.log(`✅ Loaded secret: ${secretName}`);
      } catch (error) {
        console.error(`❌ Failed to load secret ${secretName}:`, error.message);
        throw error;
      }
    }
    this.loaded = true;
    console.log('✅ All secrets loaded successfully');
    return this.cache;
  }

  getEnvVar(envVarName) {
    const mapping = secretsConfig.envVarMapping[envVarName];
    if (!mapping) return process.env[envVarName] || null;
    const { secretName, key } = mapping;
    const secret = this.cache[secretName];
    if (!secret) {
      console.warn(`⚠️  Secret ${secretName} not loaded for ${envVarName}`);
      return null;
    }
    return secret[key] || null;
  }

  getAllEnvVars() {
    const result = { ...process.env };
    for (const [envVarName, mapping] of Object.entries(secretsConfig.envVarMapping)) {
      const value = this.getEnvVar(envVarName);
      if (value !== null) result[envVarName] = value;
    }
    return result;
  }
}

let loaderInstance = null;

function getSecretsLoader() {
  if (!loaderInstance) loaderInstance = new SecretsLoader();
  return loaderInstance;
}

async function initializeSecrets() {
  await getSecretsLoader().loadSecrets();
}

function getEnv(name) {
  return getSecretsLoader().getEnvVar(name);
}

module.exports = { SecretsLoader, getSecretsLoader, initializeSecrets, getEnv };
