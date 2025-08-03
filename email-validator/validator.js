/**
 * Sistema completo de validação de email
 * Implementa validação de formato, domínio, TLD, detecção de emails descartáveis
 * e validação de comprimento máximo
 */

class EmailValidator {
  constructor() {
    // Regex para validação básica de formato de email
    this.emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._+-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
    
    // Lista de TLDs válidos (principais)
    this.validTlds = new Set([
      'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
      'co.uk', 'com.br', 'org.br', 'net.br', 'gov.br',
      'ac.uk', 'io', 'ai', 'app', 'dev', 'tech', 'info',
      'biz', 'name', 'pro', 'mobi', 'travel', 'museum'
    ]);

    // Lista de provedores de email descartáveis conhecidos
    this.disposableDomains = new Set([
      'tempmail.org', '10minutemail.com', 'guerrillamail.com',
      'mailinator.com', 'throwaway.email', 'temp-mail.org',
      'getnada.com', 'maildrop.cc', 'sharklasers.com',
      'yopmail.com', 'fakeinbox.com', 'temporaryforwarding.com'
    ]);

    // Comprimento máximo permitido para email (RFC 5321)
    this.maxLength = 254;
  }

  /**
   * Valida o formato básico do email usando regex
   * @param {string} email - Email para validar
   * @returns {boolean} - True se o formato é válido
   */
  isValidFormat(email) {
    if (typeof email !== 'string' || !email.trim()) {
      return false;
    }

    const trimmedEmail = email.trim();
    
    // Verificações básicas
    if (!trimmedEmail.includes('@') || 
        trimmedEmail.startsWith('@') || 
        trimmedEmail.endsWith('@') ||
        trimmedEmail.includes('..') ||
        trimmedEmail.startsWith('.') ||
        trimmedEmail.endsWith('.') ||
        (trimmedEmail.match(/@/g) || []).length !== 1) {
      return false;
    }

    return this.emailRegex.test(trimmedEmail);
  }

  /**
   * Valida se o domínio tem formato correto
   * @param {string} domain - Domínio para validar
   * @returns {boolean} - True se o domínio é válido
   */
  isValidDomain(domain) {
    if (typeof domain !== 'string' || !domain.trim()) {
      return false;
    }

    const trimmedDomain = domain.trim();
    
    // Não deve começar ou terminar com ponto ou hífen
    if (trimmedDomain.startsWith('.') || trimmedDomain.endsWith('.') || 
        trimmedDomain.startsWith('-') || trimmedDomain.endsWith('-')) {
      return false;
    }

    // Não deve ter pontos consecutivos
    if (trimmedDomain.includes('..')) {
      return false;
    }

    // Split por pontos e valida cada parte
    const parts = trimmedDomain.split('.');
    if (parts.length < 2) {
      return false;
    }

    // Cada parte deve ser válida
    const partRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
    return parts.every(part => {
      if (part.length === 0) return false;
      if (part.startsWith('-') || part.endsWith('-')) return false;
      return partRegex.test(part);
    });
  }

  /**
   * Valida se o TLD é reconhecido
   * @param {string} tld - TLD para validar
   * @returns {boolean} - True se o TLD é válido
   */
  isValidTld(tld) {
    if (typeof tld !== 'string' || !tld.trim()) {
      return false;
    }

    const normalizedTld = tld.toLowerCase().trim();
    
    // Verifica se está na lista de TLDs válidos
    if (this.validTlds.has(normalizedTld)) {
      return true;
    }

    // Verifica padrões genéricos para TLDs não listados
    const tldRegex = /^[a-z]{2,4}(\.[a-z]{2,3})?$/;
    return tldRegex.test(normalizedTld);
  }

  /**
   * Detecta se o email é de um provedor descartável
   * @param {string} email - Email para verificar
   * @returns {boolean} - True se é email descartável
   */
  isDisposableEmail(email) {
    if (typeof email !== 'string' || !email.includes('@')) {
      return false;
    }

    const domain = email.split('@')[1].toLowerCase();
    return this.disposableDomains.has(domain);
  }

  /**
   * Valida se o comprimento do email está dentro do limite
   * @param {string} email - Email para validar
   * @returns {boolean} - True se o comprimento é válido
   */
  isValidLength(email) {
    if (typeof email !== 'string') {
      return false;
    }

    const trimmedEmail = email.trim();
    return trimmedEmail.length > 0 && trimmedEmail.length <= this.maxLength;
  }

  /**
   * Extrai o TLD do email
   * @param {string} email - Email para extrair TLD
   * @returns {string} - TLD extraído
   */
  extractTld(email) {
    if (typeof email !== 'string' || !email.includes('@')) {
      return '';
    }

    const domain = email.split('@')[1];
    const parts = domain.split('.');
    
    if (parts.length >= 3 && parts[parts.length - 2].length <= 3) {
      // Casos como co.uk, com.br
      return parts.slice(-2).join('.');
    }
    
    return parts[parts.length - 1];
  }

  /**
   * Valida completamente um email
   * @param {string} email - Email para validar
   * @returns {Object} - Resultado da validação com detalhes
   */
  validate(email) {
    const result = {
      isValid: true,
      errors: [],
      email: null
    };

    // Verifica se é string
    if (typeof email !== 'string') {
      result.isValid = false;
      result.errors.push('Email must be a string');
      return result;
    }

    // Normaliza o email (remove espaços e converte para minúsculo)
    const normalizedEmail = email.trim().toLowerCase();
    result.email = normalizedEmail;

    // Validação de comprimento
    if (!this.isValidLength(normalizedEmail)) {
      result.isValid = false;
      result.errors.push('Invalid email length');
    }

    // Validação de formato básico
    const isValidFormat = this.isValidFormat(normalizedEmail);
    if (!isValidFormat) {
      result.isValid = false;
      result.errors.push('Invalid email format');
    }

    // Continua outras validações mesmo se formato for inválido
    // mas somente se há um @ no email
    if (normalizedEmail.includes('@')) {
      const domain = normalizedEmail.split('@')[1];
      
      // Validação de domínio (só se formato básico passou)
      if (isValidFormat && !this.isValidDomain(domain)) {
        result.isValid = false;
        result.errors.push('Invalid domain format');
      }

      // Validação de TLD (só se formato básico passou)
      if (isValidFormat) {
        const tld = this.extractTld(normalizedEmail);
        if (!this.isValidTld(tld)) {
          result.isValid = false;
          result.errors.push('Invalid or unrecognized TLD');
        }
      }

      // Detecção de email descartável (sempre verifica se há @)
      if (this.isDisposableEmail(normalizedEmail)) {
        result.isValid = false;
        result.errors.push('Disposable email detected');
      }
    }

    return result;
  }

  /**
   * Valida múltiplos emails de uma vez
   * @param {string[]} emails - Array de emails para validar
   * @returns {Object[]} - Array com resultados de validação
   */
  validateBatch(emails) {
    if (!Array.isArray(emails)) {
      throw new Error('Input must be an array of emails');
    }

    return emails.map(email => this.validate(email));
  }

  /**
   * Retorna estatísticas de validação para um lote de emails
   * @param {string[]} emails - Array de emails para analisar
   * @returns {Object} - Estatísticas de validação
   */
  getValidationStats(emails) {
    const results = this.validateBatch(emails);
    
    const stats = {
      total: results.length,
      valid: 0,
      invalid: 0,
      disposable: 0,
      formatErrors: 0,
      domainErrors: 0,
      tldErrors: 0,
      lengthErrors: 0
    };

    results.forEach(result => {
      if (result.isValid) {
        stats.valid++;
      } else {
        stats.invalid++;
        
        result.errors.forEach(error => {
          if (error.includes('Disposable')) stats.disposable++;
          if (error.includes('format')) stats.formatErrors++;
          if (error.includes('domain')) stats.domainErrors++;
          if (error.includes('TLD')) stats.tldErrors++;
          if (error.includes('length')) stats.lengthErrors++;
        });
      }
    });

    return stats;
  }
}

module.exports = EmailValidator;