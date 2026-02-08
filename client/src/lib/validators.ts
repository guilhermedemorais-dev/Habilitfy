/**
 * Validadores e máscaras para CPF e CNPJ
 * Usando cpf-cnpj-validator
 */
import { cpf, cnpj } from 'cpf-cnpj-validator';

// ============ CPF ============

/**
 * Formata um CPF para exibição (000.000.000-00)
 */
export const formatCPF = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

/**
 * Valida um CPF
 */
export const isValidCPF = (value: string): boolean => {
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 11) return false;
    return cpf.isValid(digits);
};

/**
 * Máscara de input para CPF
 */
export const maskCPF = (value: string): string => {
    return formatCPF(value);
};

// ============ CNPJ ============

/**
 * Formata um CNPJ para exibição (00.000.000/0000-00)
 */
export const formatCNPJ = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

/**
 * Valida um CNPJ
 */
export const isValidCNPJ = (value: string): boolean => {
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 14) return false;
    return cnpj.isValid(digits);
};

/**
 * Máscara de input para CNPJ
 */
export const maskCNPJ = (value: string): string => {
    return formatCNPJ(value);
};

// ============ Telefone ============

/**
 * Formata telefone (00) 00000-0000 ou (00) 0000-0000
 */
export const maskPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
        return digits
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
};

// ============ CEP ============

/**
 * Formata CEP (00000-000)
 */
export const maskCEP = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return digits.replace(/(\d{5})(\d)/, '$1-$2');
};

// ============ Estados ============

export const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];
