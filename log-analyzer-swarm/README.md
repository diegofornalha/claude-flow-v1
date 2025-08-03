# Log Analyzer Swarm 🐝

Sistema de análise de logs com múltiplos agentes para processar arquivos grandes de forma paralela.

## 🚀 Características

- **Processamento Paralelo**: Divide arquivos grandes em chunks para análise simultânea
- **Multi-Agente**: Diferentes agentes especializados em tarefas específicas
- **Escalável**: Processa logs de qualquer tamanho eficientemente
- **Análise Inteligente**: Detecta padrões, erros e gera métricas
- **Relatórios Detalhados**: Consolida resultados em formatos úteis

## 📁 Arquitetura

```
┌─────────────────┐
│   Coordinator   │  ← Orquestra todos os agentes
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┬─────────┐
    │         │          │          │         │
┌───▼───┐ ┌──▼────┐ ┌───▼───┐ ┌───▼───┐ ┌──▼────┐
│Parser │ │Pattern│ │ Error │ │Metrics│ │Report │
│Agent  │ │Analyzer│ │Detector│ │Collector│ │Generator│
└───────┘ └────────┘ └────────┘ └────────┘ └────────┘
```

## 🔧 Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd log-analyzer-swarm

# Instale as dependências
npm install
```

## 📊 Uso

### Análise Básica

```bash
npm run analyze -- --file logs/app.log
```

### Análise com Opções

```bash
npm run analyze -- \
  --file logs/app.log \
  --chunks 10 \
  --agents 5 \
  --output json
```

### Demonstração

```bash
npm run demo
```

## 🤖 Agentes

1. **Log Parser Agent**: Divide e prepara arquivos para processamento
2. **Pattern Analyzer Agent**: Detecta padrões e anomalias nos logs
3. **Error Detector Agent**: Identifica e categoriza erros
4. **Metrics Collector Agent**: Coleta estatísticas e métricas
5. **Report Generator Agent**: Consolida resultados em relatórios

## 📈 Métricas Coletadas

- Total de linhas processadas
- Erros por categoria
- Padrões mais frequentes
- Tempo de resposta médio
- Taxa de erro
- Distribuição temporal

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Modo watch
npm run test:watch
```

## 📝 Exemplos

```javascript
const { LogAnalyzerSwarm } = require('log-analyzer-swarm');

const swarm = new LogAnalyzerSwarm({
  maxAgents: 5,
  chunkSize: 1000
});

const results = await swarm.analyze('logs/app.log');
console.log(results);
```

## 🔍 Formato de Saída

```json
{
  "summary": {
    "totalLines": 50000,
    "totalErrors": 234,
    "processingTime": "2.3s"
  },
  "errors": {
    "categories": {...},
    "timeline": [...]
  },
  "patterns": [...],
  "metrics": {...}
}
```

## ⚡ Performance

- Processa 1GB de logs em ~10 segundos
- Escala linearmente com número de agentes
- Uso eficiente de memória com streaming

## 📄 Licença

MIT