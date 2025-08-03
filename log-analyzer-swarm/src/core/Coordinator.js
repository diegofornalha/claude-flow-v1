const EventEmitter = require('eventemitter3');
const pLimit = require('p-limit');
const { performance } = require('perf_hooks');
const logger = require('../utils/logger');

/**
 * Coordinator - Orquestra todos os agentes do sistema
 */
class Coordinator extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      maxAgents: config.maxAgents || 5,
      chunkSize: config.chunkSize || 1000,
      maxConcurrent: config.maxConcurrent || 10,
      ...config
    };
    
    this.agents = new Map();
    this.tasks = new Map();
    this.results = new Map();
    this.limiter = pLimit(this.config.maxConcurrent);
    this.startTime = null;
  }

  /**
   * Registra um agente no sistema
   */
  registerAgent(agent) {
    if (!agent.id || !agent.type) {
      throw new Error('Agent must have id and type');
    }
    
    this.agents.set(agent.id, agent);
    
    // Configura listeners para o agente
    agent.on('progress', (data) => this.handleAgentProgress(agent.id, data));
    agent.on('result', (data) => this.handleAgentResult(agent.id, data));
    agent.on('error', (error) => this.handleAgentError(agent.id, error));
    
    logger.info(`Agent registered: ${agent.type} (${agent.id})`);
    this.emit('agent:registered', { agentId: agent.id, type: agent.type });
  }

  /**
   * Inicia a análise de um arquivo de log
   */
  async analyze(filePath, options = {}) {
    this.startTime = performance.now();
    logger.info(`Starting analysis of: ${filePath}`);
    
    try {
      // Reset estado
      this.tasks.clear();
      this.results.clear();
      
      // Emite evento de início
      this.emit('analysis:start', { filePath, options });
      
      // 1. Parser divide o arquivo em chunks
      const parserAgent = this.getAgentByType('parser');
      const chunks = await parserAgent.parseFile(filePath, this.config.chunkSize);
      
      logger.info(`File divided into ${chunks.length} chunks`);
      this.emit('chunks:created', { count: chunks.length });
      
      // 2. Processa chunks em paralelo
      const chunkResults = await this.processChunksParallel(chunks);
      
      // 3. Agrega resultados
      const aggregatedResults = await this.aggregateResults(chunkResults);
      
      // 4. Gera relatório final
      const report = await this.generateReport(aggregatedResults);
      
      const endTime = performance.now();
      const duration = ((endTime - this.startTime) / 1000).toFixed(2);
      
      logger.info(`Analysis completed in ${duration}s`);
      this.emit('analysis:complete', { duration, report });
      
      return report;
      
    } catch (error) {
      logger.error('Analysis failed:', error);
      this.emit('analysis:error', error);
      throw error;
    }
  }

  /**
   * Processa chunks em paralelo usando os agentes
   */
  async processChunksParallel(chunks) {
    const chunkTasks = chunks.map((chunk, index) => 
      this.limiter(async () => {
        logger.debug(`Processing chunk ${index + 1}/${chunks.length}`);
        
        const chunkResult = {
          chunkId: chunk.id,
          patterns: null,
          errors: null,
          metrics: null
        };
        
        // Executa análises em paralelo para cada chunk
        const [patterns, errors, metrics] = await Promise.all([
          this.analyzePatterns(chunk),
          this.detectErrors(chunk),
          this.collectMetrics(chunk)
        ]);
        
        chunkResult.patterns = patterns;
        chunkResult.errors = errors;
        chunkResult.metrics = metrics;
        
        this.emit('chunk:processed', { 
          chunkId: chunk.id, 
          index: index + 1, 
          total: chunks.length 
        });
        
        return chunkResult;
      })
    );
    
    return Promise.all(chunkTasks);
  }

  /**
   * Analisa padrões em um chunk
   */
  async analyzePatterns(chunk) {
    const agent = this.getAgentByType('pattern-analyzer');
    return agent.analyze(chunk);
  }

  /**
   * Detecta erros em um chunk
   */
  async detectErrors(chunk) {
    const agent = this.getAgentByType('error-detector');
    return agent.detect(chunk);
  }

  /**
   * Coleta métricas de um chunk
   */
  async collectMetrics(chunk) {
    const agent = this.getAgentByType('metrics-collector');
    return agent.collect(chunk);
  }

  /**
   * Agrega resultados de todos os chunks
   */
  async aggregateResults(chunkResults) {
    logger.info('Aggregating results from all chunks...');
    
    const aggregated = {
      patterns: new Map(),
      errors: {
        total: 0,
        byCategory: new Map(),
        timeline: []
      },
      metrics: {
        totalLines: 0,
        avgResponseTime: 0,
        errorRate: 0,
        customMetrics: new Map()
      }
    };
    
    // Agrega cada tipo de resultado
    for (const result of chunkResults) {
      // Patterns
      if (result.patterns) {
        for (const [pattern, count] of result.patterns) {
          const current = aggregated.patterns.get(pattern) || 0;
          aggregated.patterns.set(pattern, current + count);
        }
      }
      
      // Errors
      if (result.errors) {
        aggregated.errors.total += result.errors.total;
        for (const [category, errors] of result.errors.byCategory) {
          const current = aggregated.errors.byCategory.get(category) || [];
          aggregated.errors.byCategory.set(category, [...current, ...errors]);
        }
        aggregated.errors.timeline.push(...result.errors.timeline);
      }
      
      // Metrics
      if (result.metrics) {
        aggregated.metrics.totalLines += result.metrics.lines;
        // Outras agregações de métricas...
      }
    }
    
    return aggregated;
  }

  /**
   * Gera relatório final
   */
  async generateReport(aggregatedResults) {
    const agent = this.getAgentByType('report-generator');
    return agent.generate(aggregatedResults, {
      startTime: this.startTime,
      config: this.config
    });
  }

  /**
   * Obtém agente por tipo
   */
  getAgentByType(type) {
    for (const [id, agent] of this.agents) {
      if (agent.type === type) {
        return agent;
      }
    }
    throw new Error(`No agent found for type: ${type}`);
  }

  /**
   * Handlers de eventos dos agentes
   */
  handleAgentProgress(agentId, data) {
    this.emit('agent:progress', { agentId, ...data });
  }

  handleAgentResult(agentId, data) {
    this.results.set(`${agentId}-${Date.now()}`, data);
    this.emit('agent:result', { agentId, ...data });
  }

  handleAgentError(agentId, error) {
    logger.error(`Agent ${agentId} error:`, error);
    this.emit('agent:error', { agentId, error });
  }

  /**
   * Para todos os agentes
   */
  shutdown() {
    logger.info('Shutting down coordinator...');
    for (const [id, agent] of this.agents) {
      if (agent.shutdown) {
        agent.shutdown();
      }
    }
    this.agents.clear();
    this.emit('shutdown');
  }
}

module.exports = Coordinator;