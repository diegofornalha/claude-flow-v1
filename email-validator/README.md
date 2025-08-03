# Email Validator

Sistema completo de validação de email em JavaScript com múltiplas camadas de verificação.

## 🚀 Funcionalidades

- ✅ **Validação de formato básico** - Regex otimizada para emails
- ✅ **Verificação de domínio válido** - Valida estrutura do domínio
- ✅ **Verificação de TLD válido** - Lista de TLDs reconhecidos
- ✅ **Detecção de emails descartáveis** - Identifica provedores temporários
- ✅ **Validação de comprimento** - Respeita limites RFC 5321
- ✅ **Normalização automática** - Remove espaços e padroniza formato
- ✅ **Validação em lote** - Processa múltiplos emails
- ✅ **Estatísticas detalhadas** - Relatórios de validação

## 📦 Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd email-validator

# Instale as dependências
npm install
```

## 🔧 Uso Básico

```javascript
const EmailValidator = require('./validator');

const validator = new EmailValidator();

// Validação simples
const result = validator.validate('user@example.com');
console.log(result.isValid); // true
console.log(result.errors);  // []

// Validação com erro
const invalidResult = validator.validate('invalid..email@tempmail.org');
console.log(invalidResult.isValid); // false
console.log(invalidResult.errors);  // ['Invalid email format', 'Disposable email detected']
```

## 📚 API Completa

### `validate(email)`

Valida um email individual e retorna resultado detalhado.

```javascript
const result = validator.validate('test@gmail.com');
// {
//   isValid: true,
//   errors: [],
//   email: 'test@gmail.com'
// }
```

### `validateBatch(emails)`

Valida múltiplos emails de uma vez.

```javascript
const emails = ['valid@gmail.com', 'invalid@tempmail.org'];
const results = validator.validateBatch(emails);
console.log(results); // Array com resultado de cada email
```

### `getValidationStats(emails)`

Retorna estatísticas detalhadas de validação.

```javascript
const emails = ['user1@gmail.com', 'user2@tempmail.org', 'invalid-email'];
const stats = validator.getValidationStats(emails);
// {
//   total: 3,
//   valid: 1,
//   invalid: 2,
//   disposable: 1,
//   formatErrors: 1,
//   domainErrors: 0,
//   tldErrors: 0,
//   lengthErrors: 0
// }
```

### Métodos de Validação Específicos

```javascript
// Validação de formato
validator.isValidFormat('user@example.com'); // true

// Validação de domínio
validator.isValidDomain('example.com'); // true

// Validação de TLD
validator.isValidTld('com'); // true

// Detecção de email descartável
validator.isDisposableEmail('test@tempmail.org'); // true

// Validação de comprimento
validator.isValidLength('user@example.com'); // true
```

## 🧪 Testes

Execute os testes unitários com Jest:

```bash
# Executar todos os testes
npm test

# Executar com watch mode
npm run test:watch

# Executar com cobertura
npm run test:coverage
```

### Cobertura de Testes

O projeto mantém cobertura mínima de 90% em:
- Linhas de código
- Funções
- Branches
- Statements

## 📋 Exemplos de Uso

### Validação em Formulário Web

```javascript
const validator = new EmailValidator();

function validateEmailInput(email) {
    const result = validator.validate(email);
    
    if (!result.isValid) {
        displayErrors(result.errors);
        return false;
    }
    
    return true;
}

function displayErrors(errors) {
    errors.forEach(error => {
        console.log(`❌ ${error}`);
    });
}
```

### Processamento em Lote

```javascript
const validator = new EmailValidator();

// Lista de emails para validar
const emailList = [
    'user1@gmail.com',
    'user2@yahoo.com',
    'invalid@tempmail.org',
    'bad-format-email'
];

// Processar e obter estatísticas
const stats = validator.getValidationStats(emailList);
console.log(`✅ Válidos: ${stats.valid}/${stats.total}`);
console.log(`❌ Inválidos: ${stats.invalid}/${stats.total}`);
console.log(`🗑️ Descartáveis: ${stats.disposable}`);
```

### Integração com API

```javascript
const express = require('express');
const EmailValidator = require('./validator');

const app = express();
const validator = new EmailValidator();

app.post('/validate-email', (req, res) => {
    const { email } = req.body;
    const result = validator.validate(email);
    
    res.json({
        email: result.email,
        isValid: result.isValid,
        errors: result.errors
    });
});
```

## 🔍 Detalhes Técnicos

### Validações Implementadas

1. **Formato Básico**: Regex RFC-compliant
2. **Domínio**: Estrutura válida sem caracteres especiais inválidos
3. **TLD**: Lista curada de TLDs válidos + padrões genéricos
4. **Emails Descartáveis**: Base de dados de provedores temporários
5. **Comprimento**: Máximo 254 caracteres (RFC 5321)

### Normalização

- Remove espaços em branco
- Converte para minúsculo
- Preserva formato original na resposta

### Performance

- Validações otimizadas para execução rápida
- Uso de Set() para lookups O(1)
- Regex compilada uma única vez

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Add nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma [issue](https://github.com/seu-usuario/email-validator/issues)
- Consulte a documentação JSDoc no código
- Execute os testes para ver exemplos de uso

---

**Desenvolvido com ❤️ seguindo as melhores práticas de TDD e código limpo.**