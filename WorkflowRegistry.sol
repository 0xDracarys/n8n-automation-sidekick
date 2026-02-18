// TON Smart Contract for Workflow Templates
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract WorkflowRegistry {
    struct WorkflowTemplate {
        address owner;
        string name;
        string description;
        string ipfsHash;
        string[] tags;
        bool isPublic;
        uint256 usageCount;
        uint256 ratingSum;
        uint256 ratingCount;
        uint256 priceTon;
        uint256 createdAt;
        uint256 updatedAt;
    }

    mapping(bytes32 => WorkflowTemplate) public templates;
    mapping(address => bytes32[]) public userTemplates;
    mapping(address => bool) public isCreator;
    bytes32[] public allTemplates;
    
    uint256 public templateCount;
    address public owner;
    
    event WorkflowCreated(
        bytes32 indexed templateId,
        address indexed owner,
        string name,
        string description,
        bool isPublic,
        uint256 priceTon
    );
    
    event WorkflowUsed(
        bytes32 indexed templateId,
        address indexed user,
        uint256 timestamp
    );
    
    event WorkflowRated(
        bytes32 indexed templateId,
        address indexed user,
        uint256 rating,
        uint256 timestamp
    );
    
    event WorkflowUpdated(
        bytes32 indexed templateId,
        address indexed owner,
        string name,
        uint256 timestamp
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyCreator(bytes32 templateId) {
        require(templates[templateId].owner == msg.sender, "Only template creator can call this function");
        _;
    }
    
    modifier onlyValidTemplate(bytes32 templateId) {
        require(templates[templateId].owner != address(0), "Template does not exist");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        templateCount = 0;
    }
    
    function createWorkflow(
        string memory _name,
        string memory _description,
        string memory _ipfsHash,
        string[] memory _tags,
        bool _isPublic,
        uint256 _priceTon
    ) external returns (bytes32 templateId) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        
        // Generate template ID
        templateId = keccak256(abi.encodePacked(
            msg.sender,
            _name,
            _description,
            _ipfsHash,
            block.timestamp
        ));
        
        // Check for duplicates
        require(templates[templateId].owner == address(0), "Template already exists");
        
        // Create template
        templates[templateId] = WorkflowTemplate({
            owner: msg.sender,
            name: _name,
            description: _description,
            ipfsHash: _ipfsHash,
            tags: _tags,
            isPublic: _isPublic,
            usageCount: 0,
            ratingSum: 0,
            ratingCount: 0,
            priceTon: _priceTon,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        // Add to user's templates
        userTemplates[msg.sender].push(templateId);
        
        // Add to all templates if public
        if (_isPublic) {
            allTemplates.push(templateId);
        }
        
        // Mark as creator
        isCreator[msg.sender] = true;
        
        // Update count
        templateCount++;
        
        emit WorkflowCreated(templateId, msg.sender, _name, _description, _isPublic, _priceTon);
        
        return templateId;
    }
    
    function updateWorkflow(
        bytes32 _templateId,
        string memory _name,
        string memory _description,
        string memory _ipfsHash,
        string[] memory _tags,
        bool _isPublic,
        uint256 _priceTon
    ) external onlyCreator(_templateId) {
        WorkflowTemplate storage template = templates[_templateId];
        
        template.name = _name;
        template.description = _description;
        template.ipfsHash = _ipfsHash;
        template.tags = _tags;
        template.isPublic = _isPublic;
        template.priceTon = _priceTon;
        template.updatedAt = block.timestamp;
        
        // Update all templates list
        if (_isPublic && !template.isPublic) {
            allTemplates.push(_templateId);
        } else if (!_isPublic && template.isPublic) {
            // Remove from public list
            for (uint256 i = 0; i < allTemplates.length; i++) {
                if (allTemplates[i] == _templateId) {
                    allTemplates[i] = allTemplates[allTemplates.length - 1];
                    allTemplates.pop();
                    break;
                }
            }
        }
        
        emit WorkflowUpdated(_templateId, msg.sender, _name, block.timestamp);
    }
    
    function getWorkflow(bytes32 _templateId) 
        external 
        view 
        onlyValidTemplate(_templateId) 
        returns (
            address owner,
            string memory name,
            string memory description,
            string memory ipfsHash,
            string[] memory tags,
            bool isPublic,
            uint256 usageCount,
            uint256 ratingSum,
            uint256 ratingCount,
            uint256 priceTon,
            uint256 createdAt,
            uint256 updatedAt
        ) 
    {
        WorkflowTemplate storage template = templates[_templateId];
        return (
            template.owner,
            template.name,
            template.description,
            template.ipfsHash,
            template.tags,
            template.isPublic,
            template.usageCount,
            template.ratingSum,
            template.ratingCount,
            template.priceTon,
            template.createdAt,
            template.updatedAt
        );
    }
    
    function getUserTemplates(address _user) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return userTemplates[_user];
    }
    
    function getAllTemplates() 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return allTemplates;
    }
    
    function getPublicTemplates() 
        external 
        view 
        returns (bytes32[] memory) 
    {
        bytes32[] memory publicTemplates = new bytes32[](allTemplates.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allTemplates.length; i++) {
            if (templates[allTemplates[i]].isPublic) {
                publicTemplates[count] = allTemplates[i];
                count++;
            }
        }
        
        // Resize array
        assembly {
            mstore(publicTemplates, count)
        }
        
        return publicTemplates;
    }
    
    function useWorkflow(bytes32 _templateId) 
        external 
        onlyValidTemplate(_templateId) 
    {
        templates[_templateId].usageCount++;
        emit WorkflowUsed(_templateId, msg.sender, block.timestamp);
    }
    
    function rateWorkflow(bytes32 _templateId, uint256 _rating) 
        external 
        onlyValidTemplate(_templateId) 
    {
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5");
        
        templates[_templateId].ratingSum += _rating;
        templates[_templateId].ratingCount++;
        
        emit WorkflowRated(_templateId, msg.sender, _rating, block.timestamp);
    }
    
    function getWorkflowRating(bytes32 _templateId) 
        external 
        view 
        onlyValidTemplate(_templateId) 
        returns (uint256) 
    {
        WorkflowTemplate storage template = templates[_templateId];
        if (template.ratingCount == 0) return 0;
        return template.ratingSum / template.ratingCount;
    }
    
    function searchTemplates(string memory _query) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        bytes32[] memory results = new bytes32[](allTemplates.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allTemplates.length; i++) {
            WorkflowTemplate storage template = templates[allTemplates[i]];
            
            // Simple search in name and description
            if (_contains(template.name, _query) || _contains(template.description, _query)) {
                results[count] = allTemplates[i];
                count++;
            }
        }
        
        // Resize array
        assembly {
            mstore(results, count)
        }
        
        return results;
    }
    
    function getTemplatesByTag(string memory _tag) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        bytes32[] memory results = new bytes32[](allTemplates.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allTemplates.length; i++) {
            WorkflowTemplate storage template = templates[allTemplates[i]];
            
            for (uint256 j = 0; j < template.tags.length; j++) {
                if (_equals(template.tags[j], _tag)) {
                    results[count] = allTemplates[i];
                    count++;
                    break;
                }
            }
        }
        
        // Resize array
        assembly {
            mstore(results, count)
        }
        
        return results;
    }
    
    function transferOwnership(bytes32 _templateId, address _newOwner) 
        external 
        onlyCreator(_templateId) 
    {
        templates[_templateId].owner = _newOwner;
    }
    
    function deleteWorkflow(bytes32 _templateId) 
        external 
        onlyCreator(_templateId) 
    {
        WorkflowTemplate storage template = templates[_templateId];
        
        // Remove from user's templates
        bytes32[] storage userTemplatesList = userTemplates[msg.sender];
        for (uint256 i = 0; i < userTemplatesList.length; i++) {
            if (userTemplatesList[i] == _templateId) {
                userTemplatesList[i] = userTemplatesList[userTemplatesList.length - 1];
                userTemplatesList.pop();
                break;
            }
        }
        
        // Remove from all templates
        for (uint256 i = 0; i < allTemplates.length; i++) {
            if (allTemplates[i] == _templateId) {
                allTemplates[i] = allTemplates[allTemplates.length - 1];
                allTemplates.pop();
                break;
            }
        }
        
        // Delete template
        delete templates[_templateId];
        templateCount--;
    }
    
    // Helper functions
    function _contains(string memory _str, string memory _query) 
        internal 
        pure 
        returns (bool) 
    {
        bytes memory strBytes = bytes(_str);
        bytes memory queryBytes = bytes(_query);
        
        uint256 strLen = strBytes.length;
        uint256 queryLen = queryBytes.length;
        
        if (queryLen > strLen) return false;
        
        for (uint256 i = 0; i <= strLen - queryLen; i++) {
            bool found = true;
            for (uint256 j = 0; j < queryLen; j++) {
                if (strBytes[i + j] != queryBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        
        return false;
    }
    
    function _equals(string memory _a, string memory _b) 
        internal 
        pure 
        returns (bool) 
    {
        return keccak256(bytes(_a)) == keccak256(bytes(_b));
    }
}
