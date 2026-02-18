// Templates Gallery Page
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Filter, Download, Eye, Star, User, Clock, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { WorkflowStorage } from '../lib/workflow-storage.js';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('used_count');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, [searchQuery, selectedTags, sortBy]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const workflowStorage = new WorkflowStorage(supabase);
      let templates = await workflowStorage.getPublicTemplates(50);

      // Filter by search
      if (searchQuery) {
        templates = templates.filter(t => 
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Filter by tags
      if (selectedTags.length > 0) {
        templates = templates.filter(t => 
          selectedTags.some(tag => t.tags?.includes(tag))
        );
      }

      // Sort
      templates.sort((a, b) => {
        switch (sortBy) {
          case 'used_count':
            return b.used_count - a.used_count;
          case 'rating':
            return b.rating - a.rating;
          case 'created_at':
            return new Date(b.created_at) - new Date(a.created_at);
          case 'name':
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });

      setTemplates(templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(template.workflow_data, null, 2));
      toast.success('Template copied to clipboard! Paste into n8n to use.');
      
      // Increment usage count
      const workflowStorage = new WorkflowStorage(supabase);
      await workflowStorage.incrementUsage(template.id);
      
      // Update local count
      setTemplates(prev => prev.map(t => 
        t.id === template.id ? { ...t, used_count: t.used_count + 1 } : t
      ));
    } catch (error) {
      console.error('Failed to copy template:', error);
      toast.error('Failed to copy template');
    }
  };

  const handleRateTemplate = async (templateId, rating) => {
    try {
      const workflowStorage = new WorkflowStorage(supabase);
      await workflowStorage.rateWorkflow(templateId, rating);
      toast.success('Template rated successfully');
      loadTemplates(); // Refresh to show new rating
    } catch (error) {
      console.error('Failed to rate template:', error);
      toast.error('Failed to rate template');
    }
  };

  const getAllTags = () => {
    const tagSet = new Set();
    templates.forEach(t => t.tags?.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-text-secondary">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Workflow Templates</h1>
          <p className="text-text-secondary">Discover and use community-created workflows</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-light border border-border rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-primary"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-surface-light border border-border rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="used_count">Most Used</option>
              <option value="rating">Highest Rated</option>
              <option value="created_at">Newest</option>
              <option value="name">Name</option>
            </select>
          </div>

          {/* Tags filter */}
          <div className="flex flex-wrap gap-2">
            {getAllTags().map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTags(prev => 
                  prev.includes(tag) 
                    ? prev.filter(t => t !== tag)
                    : [...prev, tag]
                )}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-primary text-white'
                    : 'bg-surface-light text-text-secondary hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-surface-light rounded-xl border border-border p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
                  <p className="text-sm text-text-secondary line-clamp-2">{template.description}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-text-secondary">
                  <Star className="w-3 h-3 text-yellow-500" />
                  {template.rating.toFixed(1)}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4 text-xs text-text-secondary">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {template.author_name || template.author_email?.split('@')[0]}
                </div>
                <div className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {template.used_count}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(template.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags?.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {template.tags?.length > 3 && (
                  <span className="px-2 py-1 bg-surface-light text-text-secondary text-xs rounded-full">
                    +{template.tags.length - 3}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/80 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Use Template
                </button>
                <button
                  onClick={() => setPreviewTemplate(template)}
                  className="flex items-center justify-center px-3 py-2 bg-surface border border-border rounded-lg text-sm font-medium text-text-secondary hover:text-white transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {templates.length === 0 && !loading && (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 mx-auto mb-4 text-text-secondary" />
            <p className="text-text-secondary">No templates found matching your criteria.</p>
          </div>
        )}

        {/* Preview Modal */}
        {previewTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
               onClick={() => setPreviewTemplate(null)}>
            <div className="bg-surface rounded-xl border border-border max-w-4xl w-full max-h-[80vh] overflow-auto p-6"
                 onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">{previewTemplate.name}</h2>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="text-text-secondary hover:text-white"
                >
                  ×
                </button>
              </div>
              <pre className="bg-surface-light p-4 rounded-lg text-xs text-text-secondary overflow-auto max-h-96">
                {JSON.stringify(previewTemplate.workflow_data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;
