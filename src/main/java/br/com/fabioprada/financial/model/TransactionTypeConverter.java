package br.com.fabioprada.financial.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class TransactionTypeConverter implements AttributeConverter<TransactionType, String> {

    @Override
    public String convertToDatabaseColumn(TransactionType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name();
    }

    @Override
    public TransactionType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }
        String val = dbData.trim().toUpperCase();
        switch (val) {
            case "ENTRADA":
            case "INCOME":
                return TransactionType.INCOME;
            case "SAIDA":
            case "EXPENSE":
            case "CARTAO_CREDITO":
                return TransactionType.EXPENSE;
            case "TRANSFERENCIA":
            case "TRANSFER":
                return TransactionType.TRANSFER;
            default:
                try {
                    return TransactionType.valueOf(val);
                } catch (IllegalArgumentException e) {
                    return TransactionType.EXPENSE;
                }
        }
    }
}
