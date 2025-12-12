export const validatePhone = (phone) => {
    if (!phone) return true
    const clean = phone.replace(/\D/g, '')
    // Ecuador: 5939... or 09... (10 digits starting with 09)
    if (/^5939\d{8}$/.test(clean)) return true
    if (/^09\d{8}$/.test(clean)) return true
    return false
}

export const validateId = (id) => {
    if (!id) return true
    const clean = id.replace(/\D/g, '')
    
    // Cédula (10) or RUC (13)
    if (clean.length !== 10 && clean.length !== 13) return false

    // Province Check (01-24, 30)
    const province = parseInt(clean.substring(0, 2), 10)
    if ((province < 1 || province > 24) && province !== 30) return false

    // Third Digit
    const thirdDigit = parseInt(clean.substring(2, 3), 10)

    // Natural Person (0-5)
    if (thirdDigit < 6) {
        let sum = 0
        const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2]
        for (let i = 0; i < 9; i++) {
            let val = parseInt(clean.charAt(i), 10) * coefficients[i]
            if (val >= 10) val -= 9
            sum += val
        }
        const checkDigit = parseInt(clean.charAt(9), 10)
        const result = sum % 10 === 0 ? 0 : 10 - (sum % 10)
        
        return result === checkDigit
    }
    
    // Public Society (6) or Private (9) - Simplified logic or trust length for now
    // Actually, let's keep it simple for now as per original code.
    return true
}
