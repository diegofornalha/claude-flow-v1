/**
 * Exemplo prático de uso do sistema de validação de email
 */

const EmailValidator = require('./validator');

// Criar instância do validador
const validator = new EmailValidator();

console.log('🔍 Sistema de Validação de Email - Exemplo Prático\n');

// Lista de emails para testar
const testEmails = [
  'usuario@gmail.com',           // Válido
  'test.email+tag@company.org',  // Válido com + e .
  'user@tempmail.org',           // Inválido - descartável
  'invalid..email@domain.com',   // Inválido - formato
  '@invalid.com',                // Inválido - sem local part
  'user@',                       // Inválido - sem domínio
  'muito' + 'a'.repeat(250) + '@example.com', // Inválido - muito longo
  'USER@EXAMPLE.COM',            // Válido - case insensitive
  'user@sub.domain.co.uk'        // Válido - subdomínio
];

console.log('📧 Validação Individual:\n');

testEmails.forEach((email, index) => {
  const result = validator.validate(email);
  const status = result.isValid ? '✅' : '❌';
  const errors = result.errors.length > 0 ? ` (${result.errors.join(', ')})` : '';
  
  console.log(`${index + 1}. ${status} ${email}${errors}`);
});

console.log('\n📊 Estatísticas Gerais:\n');

// Obter estatísticas completas
const stats = validator.getValidationStats(testEmails);

console.log(`Total de emails testados: ${stats.total}`);
console.log(`✅ Válidos: ${stats.valid} (${(stats.valid/stats.total*100).toFixed(1)}%)`);
console.log(`❌ Inválidos: ${stats.invalid} (${(stats.invalid/stats.total*100).toFixed(1)}%)`);

if (stats.disposable > 0) {
  console.log(`🗑️  Emails descartáveis detectados: ${stats.disposable}`);
}

if (stats.formatErrors > 0) {
  console.log(`📝 Erros de formato: ${stats.formatErrors}`);
}

if (stats.lengthErrors > 0) {
  console.log(`📏 Erros de comprimento: ${stats.lengthErrors}`);
}

console.log('\n🔬 Teste de Métodos Específicos:\n');

// Testar métodos específicos
console.log('Validação de formato:');
console.log(`- 'user@example.com': ${validator.isValidFormat('user@example.com') ? '✅' : '❌'}`);
console.log(`- 'invalid..email': ${validator.isValidFormat('invalid..email') ? '✅' : '❌'}`);

console.log('\nValidação de domínio:');
console.log(`- 'example.com': ${validator.isValidDomain('example.com') ? '✅' : '❌'}`);
console.log(`- '.invalid.com': ${validator.isValidDomain('.invalid.com') ? '✅' : '❌'}`);

console.log('\nDetecção de email descartável:');
console.log(`- 'user@tempmail.org': ${validator.isDisposableEmail('user@tempmail.org') ? '🗑️' : '✅'}`);
console.log(`- 'user@gmail.com': ${validator.isDisposableEmail('user@gmail.com') ? '🗑️' : '✅'}`);

console.log('\n🎯 Exemplo de Integração com Formulário:\n');

// Simular validação de formulário
function validateForm(email) {
  console.log(`Validando email: "${email}"`);
  
  const result = validator.validate(email);
  
  if (result.isValid) {
    console.log('✅ Email válido! Pode prosseguir.');
    return true;
  } else {
    console.log('❌ Erro na validação:');
    result.errors.forEach(error => {
      console.log(`   • ${error}`);
    });
    return false;
  }
}

// Testar formulário
console.log('--- Simulação de Formulário ---');
validateForm('user@example.com');
console.log('');
validateForm('invalid@tempmail.org');

console.log('\n✨ Demonstração concluída!');
console.log('Para usar em seu projeto: const EmailValidator = require("./validator");');