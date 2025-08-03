/**
 * Testes unitários para o sistema de validação de email
 * Seguindo práticas de TDD com cobertura completa
 */

const EmailValidator = require('./validator');

describe('EmailValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new EmailValidator();
  });

  describe('Validação de formato básico', () => {
    test('deve validar emails com formato correto', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'valid_email@sub.domain.com'
      ];

      validEmails.forEach(email => {
        expect(validator.isValidFormat(email)).toBe(true);
      });
    });

    test('deve rejeitar emails com formato inválido', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..double.dot@example.com',
        'user@domain.',
        '.user@domain.com',
        'user@.domain.com',
        'user@domain@domain.com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(validator.isValidFormat(email)).toBe(false);
      });
    });
  });

  describe('Validação de domínio', () => {
    test('deve validar domínios corretos', () => {
      const validDomains = [
        'example.com',
        'test-domain.org',
        'sub.domain.co.uk',
        'domain123.net'
      ];

      validDomains.forEach(domain => {
        expect(validator.isValidDomain(domain)).toBe(true);
      });
    });

    test('deve rejeitar domínios inválidos', () => {
      const invalidDomains = [
        '',
        '.',
        'domain.',
        '.domain',
        'domain..com',
        'domain-.com',
        '-domain.com'
      ];

      invalidDomains.forEach(domain => {
        expect(validator.isValidDomain(domain)).toBe(false);
      });
    });
  });

  describe('Validação de TLD', () => {
    test('deve validar TLDs válidos', () => {
      const validTlds = [
        'com',
        'org',
        'net',
        'edu',
        'gov',
        'co.uk',
        'com.br'
      ];

      validTlds.forEach(tld => {
        expect(validator.isValidTld(tld)).toBe(true);
      });
    });

    test('deve rejeitar TLDs inválidos', () => {
      const invalidTlds = [
        'xyz123',
        'toolong',
        '123',
        ''
      ];

      invalidTlds.forEach(tld => {
        expect(validator.isValidTld(tld)).toBe(false);
      });
    });
  });

  describe('Detecção de emails descartáveis', () => {
    test('deve detectar emails descartáveis conhecidos', () => {
      const disposableEmails = [
        'test@tempmail.org',
        'user@10minutemail.com',
        'fake@guerrillamail.com',
        'spam@mailinator.com'
      ];

      disposableEmails.forEach(email => {
        expect(validator.isDisposableEmail(email)).toBe(true);
      });
    });

    test('deve aceitar emails de provedores legítimos', () => {
      const legitimateEmails = [
        'user@gmail.com',
        'test@yahoo.com',
        'contact@company.com',
        'info@organization.org'
      ];

      legitimateEmails.forEach(email => {
        expect(validator.isDisposableEmail(email)).toBe(false);
      });
    });
  });

  describe('Validação de comprimento', () => {
    test('deve aceitar emails com comprimento válido', () => {
      const email = 'user@example.com'; // 16 caracteres
      expect(validator.isValidLength(email)).toBe(true);
    });

    test('deve rejeitar emails muito longos', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'; // > 254 caracteres
      expect(validator.isValidLength(longEmail)).toBe(false);
    });

    test('deve rejeitar emails vazios', () => {
      expect(validator.isValidLength('')).toBe(false);
    });
  });

  describe('Validação completa', () => {
    test('deve validar emails completamente válidos', () => {
      const validEmails = [
        'user@gmail.com',
        'test.email@company.org',
        'contact+info@example.net'
      ];

      validEmails.forEach(email => {
        const result = validator.validate(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('deve rejeitar emails com múltiplos problemas', () => {
      const invalidEmail = 'invalid..email@tempmail.org';
      const result = validator.validate(invalidEmail);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Invalid email format');
      expect(result.errors).toContain('Disposable email detected');
    });

    test('deve retornar detalhes da validação', () => {
      const email = 'user@example.com';
      const result = validator.validate(email);
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('email');
      expect(result.email).toBe(email);
    });
  });

  describe('Validação em lote', () => {
    test('deve validar múltiplos emails', () => {
      const emails = [
        'valid@example.com',
        'invalid@tempmail.org',
        'bad-format'
      ];
      
      const results = validator.validateBatch(emails);
      expect(results).toHaveLength(3);
      
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
      expect(results[2].isValid).toBe(false);
    });

    test('deve lançar erro com entrada não-array', () => {
      expect(() => validator.validateBatch('not-array')).toThrow('Input must be an array of emails');
    });
  });

  describe('Estatísticas de validação', () => {
    test('deve retornar estatísticas corretas', () => {
      const emails = [
        'valid@gmail.com',
        'invalid@tempmail.org',
        'bad..format@example.com',
        'toolong' + 'a'.repeat(250) + '@example.com',
        'user@invalid-domain'
      ];
      
      const stats = validator.getValidationStats(emails);
      
      expect(stats.total).toBe(5);
      expect(stats.valid).toBe(1);
      expect(stats.invalid).toBe(4);
      expect(stats.disposable).toBeGreaterThan(0);
      expect(stats.formatErrors).toBeGreaterThan(0);
    });
  });

  describe('Métodos auxiliares', () => {
    test('deve extrair TLD corretamente', () => {
      expect(validator.extractTld('user@example.com')).toBe('com');
      expect(validator.extractTld('user@sub.domain.co.uk')).toBe('co.uk');
      expect(validator.extractTld('invalid')).toBe('');
    });

    test('deve validar single character parts', () => {
      expect(validator.isValidDomain('a.b')).toBe(true);
      expect(validator.isValidTld('ai')).toBe(true);
    });

    test('deve rejeitar domínios com partes muito curtas', () => {
      expect(validator.isValidDomain('.')).toBe(false);
      expect(validator.isValidDomain('')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    test('deve lidar com null e undefined', () => {
      expect(validator.validate(null).isValid).toBe(false);
      expect(validator.validate(undefined).isValid).toBe(false);
    });

    test('deve lidar com tipos não-string', () => {
      expect(validator.validate(123).isValid).toBe(false);
      expect(validator.validate({}).isValid).toBe(false);
      expect(validator.validate([]).isValid).toBe(false);
    });

    test('deve normalizar espaços em branco', () => {
      const emailWithSpaces = '  user@example.com  ';
      const result = validator.validate(emailWithSpaces);
      expect(result.email).toBe('user@example.com');
    });

    test('deve ser case-insensitive para domínios', () => {
      const upperCaseEmail = 'USER@EXAMPLE.COM';
      const result = validator.validate(upperCaseEmail);
      expect(result.isValid).toBe(true);
    });

    test('deve lidar com emails sem @', () => {
      const result = validator.validate('invalid-email-no-at');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    test('deve validar array vazio', () => {
      const stats = validator.getValidationStats([]);
      expect(stats.total).toBe(0);
      expect(stats.valid).toBe(0);
      expect(stats.invalid).toBe(0);
    });

    test('deve lidar com domínio de uma parte apenas', () => {
      expect(validator.isValidDomain('localhost')).toBe(false);
    });

    test('deve lidar com email sem domínio após @', () => {
      expect(validator.isDisposableEmail('user@')).toBe(false);
      expect(validator.isDisposableEmail('nodomain')).toBe(false);
    });

    test('deve validar emails com domínios únicos', () => {
      const result = validator.validate('user@uniquedomain.com');
      expect(result.isValid).toBe(true);
    });

    test('deve validar TLD com case insensitive', () => {
      expect(validator.isValidTld('COM')).toBe(true);
      expect(validator.isValidTld('Co.Uk')).toBe(true);
    });

    test('deve validar domínios com números', () => {
      expect(validator.isValidDomain('test123.com')).toBe(true);
      expect(validator.isValidDomain('123test.org')).toBe(true);
    });
  });
});