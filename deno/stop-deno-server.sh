#!/bin/bash
# Script para parar o servidor Deno

echo "🦕 Parando servidor Deno..."

# Encontrar o processo do servidor Deno
PID=$(ps aux | grep -E "deno.*serve.*deno-server.ts" | grep -v grep | awk '{print $2}')

if [ -z "$PID" ]; then
    echo "❌ Servidor Deno não está rodando"
    exit 1
else
    echo "✅ Encontrado servidor Deno com PID: $PID"
    kill $PID
    
    # Aguardar processo terminar
    sleep 2
    
    # Verificar se foi parado
    if ps -p $PID > /dev/null 2>&1; then
        echo "⚠️  Processo ainda está rodando, forçando parada..."
        kill -9 $PID
    fi
    
    echo "✅ Servidor Deno parado com sucesso"
    
    # Limpar log se existir
    if [ -f "$(dirname "$0")/deno-server.log" ]; then
        echo "🧹 Limpando arquivo de log..."
        rm "$(dirname "$0")/deno-server.log"
    fi
fi