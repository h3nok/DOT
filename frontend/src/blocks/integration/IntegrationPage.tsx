import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { 
  Link, 
  Settings, 
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useIntegrationForm } from '../../forms/hooks/useIntegrationForm';
import { type IntegrationFormData } from '../../forms/schemas/integration';
import { FormField, Form, FormSubmit, Select, Textarea } from '../../forms/components';

interface Integration {
  id: number;
  name: string;
  type: string;
  status: string;
  lastSync: string;
  dataPoints: number;
  description?: string;
  url?: string;
  apiKey?: string;
}

const IntegrationPage = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const integrationFormHook = useIntegrationForm({
    onSubmit: async (data: IntegrationFormData) => {
      const integration: Integration = {
        id: Date.now(),
        ...data,
        status: 'connecting',
        lastSync: 'Just now',
        dataPoints: 0
      };
      setIntegrations([...integrations, integration]);
      setShowAddForm(false);
    },
    onError: (error) => {
      console.error('Integration form error:', error);
      alert('There was an error adding the integration. Please try again.');
    }
  });

  const integrationTypes = [
    { id: 'openai', name: 'OpenAI API', icon: '🤖', description: 'Connect to GPT models for consciousness analysis' },
    { id: 'anthropic', name: 'Anthropic Claude', icon: '🧠', description: 'Advanced AI reasoning and consciousness research' },
    { id: 'notion', name: 'Notion Database', icon: '📝', description: 'Sync knowledge and research notes' },
    { id: 'obsidian', name: 'Obsidian Vault', icon: '💎', description: 'Connect to your knowledge graph' },
    { id: 'zotero', name: 'Zotero Library', icon: '📚', description: 'Academic research and citations' },
    { id: 'custom', name: 'Custom API', icon: '🔧', description: 'Connect to your own consciousness research tools' }
  ];

  const demoIntegrations: Integration[] = [
    {
      id: 1,
      name: 'OpenAI GPT-4',
      type: 'openai',
      status: 'connected',
      lastSync: '2 hours ago',
      dataPoints: 1247,
      description: 'Primary AI model for consciousness analysis and pattern recognition'
    },
    {
      id: 2,
      name: 'Notion Research Database',
      type: 'notion',
      status: 'connected',
      lastSync: '1 day ago',
      dataPoints: 892,
      description: 'Centralized knowledge management for consciousness research'
    },
    {
      id: 3,
      name: 'Obsidian Consciousness Vault',
      type: 'obsidian',
      status: 'error',
      lastSync: '3 days ago',
      dataPoints: 0,
      description: 'Personal knowledge graph for consciousness exploration'
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setIntegrations(demoIntegrations);
      setLoading(false);
    }, 1000);
  }, []);

  const handleRemoveIntegration = (id: number) => {
    setIntegrations(integrations.filter(integration => integration.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'connecting': return <Clock className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading integrations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="emergent-complexity">
          <div className="fractal-field"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="system-cluster"></div>
          <div className="system-cluster"></div>
          <div className="system-cluster"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-wave"></div>
          <div className="fractal-wave"></div>
          <div className="fractal-wave"></div>
          <div className="consciousness-particle-system">
            <div className="consciousness-particle seed"></div>
            <div className="consciousness-particle aligned"></div>
            <div className="consciousness-particle cohesive"></div>
            <div className="consciousness-particle emergent"></div>
            <div className="particle-trail"></div>
            <div className="particle-trail"></div>
            <div className="particle-trail"></div>
            <div className="emergent-structure swirl"></div>
            <div className="emergent-structure lattice"></div>
            <div className="emergent-structure vortex"></div>
          </div>
          <div className="flow-field"></div>
          <div className="neighborhood"></div>
          <div className="neighborhood"></div>
          <div className="neighborhood"></div>
          <div className="feedback-loop"></div>
          <div className="particle-swarm">
            <div className="swarm-state-seed"></div>
            <div className="swarm-state-motion"></div>
            <div className="swarm-state-rules"></div>
            <div className="swarm-state-feedback"></div>
            <div className="swarm-state-emergent"></div>
          </div>
          <div className="consciousness-field"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="reality-shift"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/20">
                <Link className="w-12 h-12 text-primary" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-6 gradient-text">
              Knowledge Integration
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Connect your consciousness research tools and knowledge bases. 
              Integrate AI models, databases, and research platforms to build a comprehensive understanding.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                Add Integration
              </Button>
              <Button variant="outline" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                Manage Connections
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Integrations */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-orbitron font-bold gradient-text">
              Active Integrations
            </h2>
            <Button variant="outline" className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              Sync All
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {integrations.map((integration) => (
              <Card key={integration.id} className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {integrationTypes.find(t => t.id === integration.type)?.icon || '🔗'}
                      </div>
                      <div>
                        <CardTitle className="font-orbitron">{integration.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{integration.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center space-x-1 ${getStatusColor(integration.status)}`}>
                        {getStatusIcon(integration.status)}
                        <span className="text-sm capitalize">{integration.status}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveIntegration(integration.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Last Sync</div>
                      <div>{integration.lastSync}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Data Points</div>
                      <div>{integration.dataPoints.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Button variant="outline" size="sm" className="flex items-center space-x-1">
                      <RefreshCw className="w-3 h-3" />
                      Sync Now
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center space-x-1">
                      <ExternalLink className="w-3 h-3" />
                      View Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Available Integrations */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-orbitron font-bold mb-8 gradient-text text-center">
            Available Integrations
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrationTypes.map((type) => (
              <Card key={type.id} className="card-hover bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-4">{type.icon}</div>
                    <h3 className="font-semibold mb-2">{type.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{type.description}</p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        integrationFormHook.setValue('type', type.id);
                        setShowAddForm(true);
                      }}
                    >
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Add Integration Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Add Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <Form 
                form={integrationFormHook.form} 
                onSubmit={async (data: IntegrationFormData) => {
                  const integration: Integration = {
                    id: Date.now(),
                    ...data,
                    status: 'connecting',
                    lastSync: 'Just now',
                    dataPoints: 0
                  };
                  setIntegrations([...integrations, integration]);
                  setShowAddForm(false);
                }}
              >
                <FormField name="name" label="Integration Name" required>
                  {(field) => (
                    <input
                      {...field}
                      placeholder="My OpenAI Integration"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    />
                  )}
                </FormField>
                
                <Select
                  name="type"
                  control={integrationFormHook.form.control}
                  label="Type"
                  options={integrationTypes.map(type => ({
                    value: type.id,
                    label: type.name
                  }))}
                  required
                />
                
                <FormField name="url" label="API URL (optional)">
                  {(field) => (
                    <input
                      {...field}
                      placeholder="https://api.example.com"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    />
                  )}
                </FormField>
                
                <FormField name="apiKey" label="API Key">
                  {(field) => (
                    <input
                      {...field}
                      type="password"
                      placeholder="Enter your API key"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    />
                  )}
                </FormField>
                
                <Textarea
                  name="description"
                  control={integrationFormHook.form.control}
                  label="Description"
                  placeholder="What is this integration for?"
                  rows={3}
                />
                
                <div className="flex space-x-2">
                  <FormSubmit className="flex-1">
                    Add Integration
                  </FormSubmit>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default IntegrationPage; 