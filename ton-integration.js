// TON Blockchain Integration for Workflow Templates
// This provides cost-effective decentralized storage for n8n workflows

class TONWorkflowRegistry {
  constructor(contractAddress, provider) {
    this.contractAddress = contractAddress;
    this.provider = provider;
    this.contract = null;
  }

  async initialize() {
    // Initialize TON contract
    const { ethers } = await import('ethers');
    
    // TON contract ABI (simplified)
    const abi = [
      "function createWorkflow(string name, string description, string ipfsHash, string[] tags, bool isPublic, uint256 priceTon) returns (bytes32)",
      "function getWorkflow(bytes32 templateId) returns (tuple(address owner, string name, string description, string ipfsHash, string[] tags, bool isPublic, uint256 usageCount, uint256 ratingSum, uint256 ratingCount, uint256 priceTon, uint256 createdAt))",
      "function getUserTemplates(address user) returns (bytes32[])",
      "function getAllTemplates() returns (bytes32[])",
      "function useWorkflow(bytes32 templateId)",
      "function rateWorkflow(bytes32 templateId, uint256 rating)",
      "event WorkflowCreated(bytes32 indexed templateId, address indexed owner, string name)",
      "event WorkflowUsed(bytes32 indexed templateId, address indexed user)",
      "event WorkflowRated(bytes32 indexed templateId, uint256 rating)"
    ];

    this.contract = new ethers.Contract(this.contractAddress, abi, this.provider);
  }

  async createWorkflow(metadata, ipfsHash, isPublic = false, priceTon = 0) {
    try {
      const tx = await this.contract.createWorkflow(
        metadata.name,
        metadata.description,
        ipfsHash,
        metadata.tags || [],
        isPublic,
        priceTon
      );
      
      const receipt = await tx.wait();
      const templateId = receipt.events[0].args.templateId;
      
      console.log('✅ Workflow created on TON:', templateId);
      return templateId;
    } catch (error) {
      console.error('❌ Failed to create workflow on TON:', error);
      throw error;
    }
  }

  async getWorkflow(templateId) {
    try {
      const template = await this.contract.getWorkflow(templateId);
      return {
        owner: template.owner,
        name: template.name,
        description: template.description,
        ipfsHash: template.ipfsHash,
        tags: template.tags,
        isPublic: template.isPublic,
        usageCount: template.usageCount.toNumber(),
        ratingSum: template.ratingSum.toNumber(),
        ratingCount: template.ratingCount.toNumber(),
        priceTon: template.priceTon.toNumber(),
        createdAt: new Date(template.createdAt.toNumber() * 1000)
      };
    } catch (error) {
      console.error('❌ Failed to get workflow from TON:', error);
      throw error;
    }
  }

  async getUserTemplates(userAddress) {
    try {
      const templateIds = await this.contract.getUserTemplates(userAddress);
      return templateIds;
    } catch (error) {
      console.error('❌ Failed to get user workflows from TON:', error);
      throw error;
    }
  }

  async getAllTemplates() {
    try {
      const templateIds = await this.contract.getAllTemplates();
      return templateIds;
    } catch (error) {
      console.error('❌ Failed to get all templates from TON:', error);
      throw error;
    }
  }

  async useWorkflow(templateId) {
    try {
      const tx = await this.contract.useWorkflow(templateId);
      await tx.wait();
      console.log('✅ Workflow usage recorded on TON:', templateId);
      return true;
    } catch (error) {
      console.error('❌ Failed to record workflow usage on TON:', error);
      throw error;
    }
  }

  async rateWorkflow(templateId, rating) {
    try {
      const tx = await this.contract.rateWorkflow(templateId, rating);
      await tx.wait();
      console.log('✅ Workflow rating recorded on TON:', templateId, rating);
      return true;
    } catch (error) {
      console.error('❌ Failed to rate workflow on TON:', error);
      throw error;
    }
  }
}

// IPFS Storage for Full Workflow Data
class IPFSWorkflowStorage {
  constructor(pinataApiKey) {
    this.pinataApiKey = pinataApiKey;
    this.pinataGateway = 'https://gateway.pinata.cloud';
  }

  async storeWorkflow(workflowData) {
    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.pinataApiKey}`
        },
        body: JSON.stringify({
          pinataContent: JSON.stringify(workflowData),
          pinataOptions: {
            cid_version: 1
          }
        })
      });

      if (!response.ok) {
        throw new Error(`IPFS upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Workflow stored on IPFS:', result.IpfsHash);
      return result.IpfsHash;
    } catch (error) {
      console.error('❌ Failed to store workflow on IPFS:', error);
      throw error;
    }
  }

  async getWorkflow(ipfsHash) {
    try {
      const response = await fetch(`${this.pinataGateway}/ipfs/${ipfsHash}`);
      
      if (!response.ok) {
        throw new Error(`IPFS retrieval failed: ${response.statusText}`);
      }

      const workflowData = await response.json();
      console.log('✅ Workflow retrieved from IPFS:', ipfsHash);
      return workflowData;
    } catch (error) {
      console.error('❌ Failed to retrieve workflow from IPFS:', error);
      throw error;
    }
  }
}

// Hybrid Storage Service (TON + IPFS + Supabase Cache)
class HybridWorkflowStorage {
  constructor(supabaseClient, tonRegistry, ipfsStorage) {
    this.supabase = supabaseClient;
    this.tonRegistry = tonRegistry;
    this.ipfsStorage = ipfsStorage;
  }

  async saveWorkflow(workflowData, metadata, isPublic = false, priceTon = 0) {
    try {
      console.log('🔄 Saving workflow with hybrid storage...');
      
      // 1. Store full workflow on IPFS
      const ipfsHash = await this.ipfsStorage.storeWorkflow(workflowData);
      
      // 2. Store metadata on TON blockchain
      const templateId = await this.tonRegistry.createWorkflow(metadata, ipfsHash, isPublic, priceTon);
      
      // 3. Cache in Supabase for fast access
      const cacheData = {
        template_id: templateId,
        ipfs_hash: ipfsHash,
        user_id: metadata.user_id,
        name: metadata.name,
        description: metadata.description,
        tags: metadata.tags,
        visibility: isPublic ? 'public' : 'private',
        price_ton: priceTon,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await this.supabase.from('workflow_templates').insert(cacheData);
      
      console.log('✅ Workflow saved successfully:', { templateId, ipfsHash });
      return { templateId, ipfsHash };
    } catch (error) {
      console.error('❌ Failed to save workflow:', error);
      throw error;
    }
  }

  async getWorkflow(templateId) {
    try {
      console.log('🔍 Retrieving workflow:', templateId);
      
      // 1. Try cache first
      const cached = await this.supabase
        .from('workflow_templates')
        .select('*')
        .eq('template_id', templateId)
        .single();
      
      if (cached) {
        console.log('📦 Found workflow in cache');
        const workflowData = await this.ipfsStorage.getWorkflow(cached.ipfs_hash);
        return {
          ...cached,
          workflow_data: workflowData
        };
      }
      
      // 2. Fallback to blockchain
      console.log('⛓️ Retrieving from blockchain');
      const template = await this.tonRegistry.getWorkflow(templateId);
      const workflowData = await this.ipfsStorage.getWorkflow(template.ipfsHash);
      
      return {
        template_id: templateId,
        ...template,
        workflow_data: workflowData
      };
    } catch (error) {
      console.error('❌ Failed to retrieve workflow:', error);
      throw error;
    }
  }

  async getUserWorkflows(userAddress) {
    try {
      console.log('👤 Getting user workflows:', userAddress);
      
      // Get template IDs from TON
      const templateIds = await this.tonRegistry.getUserTemplates(userAddress);
      
      // Get full workflow data
      const workflows = [];
      for (const templateId of templateIds) {
        try {
          const workflow = await this.getWorkflow(templateId);
          workflows.push(workflow);
        } catch (error) {
          console.warn(`⚠️ Failed to get workflow ${templateId}:`, error);
        }
      }
      
      return workflows;
    } catch (error) {
      console.error('❌ Failed to get user workflows:', error);
      throw error;
    }
  }

  async getPublicTemplates() {
    try {
      console.log('🌍 Getting public templates...');
      
      // Get all template IDs from TON
      const templateIds = await this.tonRegistry.getAllTemplates();
      
      // Filter public workflows
      const publicWorkflows = [];
      for (const templateId of templateIds) {
        try {
          const template = await this.tonRegistry.getWorkflow(templateId);
          if (template.isPublic) {
            const workflowData = await this.ipfsStorage.getWorkflow(template.ipfsHash);
            publicWorkflows.push({
              template_id: templateId,
              ...template,
              workflow_data: workflowData
            });
          }
        } catch (error) {
          console.warn(`⚠️ Failed to get template ${templateId}:`, error);
        }
      }
      
      return publicWorkflows;
    } catch (error) {
      console.error('❌ Failed to get public templates:', error);
      throw error;
    }
  }

  async useWorkflow(templateId, userAddress) {
    try {
      console.log('📊 Recording workflow usage:', templateId);
      
      // Record usage on TON
      await this.tonRegistry.useWorkflow(templateId);
      
      // Update cache
      await this.supabase
        .from('workflow_templates')
        .update({ used_count: this.supabase.raw('used_count') + 1 })
        .eq('template_id', templateId);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to record workflow usage:', error);
      throw error;
    }
  }

  async rateWorkflow(templateId, rating) {
    try {
      console.log('⭐ Rating workflow:', templateId, rating);
      
      // Record rating on TON
      await this.tonRegistry.rateWorkflow(templateId, rating);
      
      // Update cache
      const template = await this.tonRegistry.getWorkflow(templateId);
      const newRating = template.ratingSum / template.ratingCount;
      
      await this.supabase
        .from('workflow_templates')
        .update({ 
          rating: newRating,
          rating_count: template.ratingCount
        })
        .eq('template_id', templateId);
      
      return newRating;
    } catch (error) {
      console.error('❌ Failed to rate workflow:', error);
      throw error;
    }
  }
}

// Export for use in application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TONWorkflowRegistry, IPFSWorkflowStorage, HybridWorkflowStorage };
} else if (typeof window !== 'undefined') {
  window.TONWorkflowRegistry = TONWorkflowRegistry;
  window.IPFSWorkflowStorage = IPFSWorkflowStorage;
  window.HybridWorkflowStorage = HybridWorkflowStorage;
}
