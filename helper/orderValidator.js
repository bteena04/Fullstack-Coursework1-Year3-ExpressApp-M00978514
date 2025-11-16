// orderValidator.js -> Validator for order data.
import Joi from 'joi';

// Define the schema for order validation.
export const orderSchema = Joi.object({
    name: Joi.string()
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
        'string.pattern.base': 'Name can only contain alphabetic characters and spaces.',
        'string.empty': 'Name is required.'
    }),

    phoneNumber: Joi.string()
    .pattern(/^\+?[0-9\s\-()]+$/)
    .required()
    .messages({
        'string.pattern.base': 'Phone number can only contain digits, spaces, dashes, parentheses and may start with +.',
        'string.empty': 'Phone number is required.'
    })  
});