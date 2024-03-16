import bcrypt from "bcrypt";

interface ValidationResult {
  rule: string;
  isValid: boolean;
  message: string;
}

export interface Input {
  value: string;
  fieldName: string;
  maxLength?: number;
  minLength?: number;
  isRequired?: boolean;
  isEmail?: boolean;
  isDate?: boolean;
  isNumbersAndLetters?: boolean;
  isOnlyLetters?: boolean;
  isOnlyNumbers?: boolean;
  isUnique?: boolean;
  model?: any;
}

export class ValidationRules {

  static isRequired(value: string, fieldName: string) {
    return {
      rule: "isRequired",
      isValid: value !== undefined && value.trim() !== "",
      message: `${fieldName} is required`,
    };
  }

  static isMaxLength(value: string, maxLength: number, fieldName: string) {
    return {
      rule: "isMaxLength",
      isValid: value && value.length <= maxLength,
      message: `${fieldName} should be at most ${maxLength} characters long`,
    };
  }

  static isMinLength(value: string, minLength: number, fieldName: string) {
    return {
      rule: "isMinLength",
      isValid: value && value.length >= minLength,
      message: `${fieldName} should be at least ${minLength} characters long`,
    };
  }

  static isValidEmail(value: string, fieldName: string) {
    // Regular expression for basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return {
      rule: "isValidEmail",
      isValid: emailRegex.test(value),
      message: `Please enter a valid email address`,
    };
  }

  static isOnlyNumbers(value: string, fieldName: string) {
    // Regular expression for validating if the value contains only numbers
    const numbersOnlyRegex = /^[0-9]+$/;

    return {
      rule: "isOnlyNumbers",
      isValid: numbersOnlyRegex.test(value),
      message: `${fieldName} should contain only numbers`,
    };
  }

  static isOnlyLetters(value: string, fieldName: string) {
    // Regular expression for validating if the value contains only letters
    const lettersOnlyRegex = /^[a-zA-Z]+$/;

    return {
      rule: "isOnlyLetters",
      isValid: lettersOnlyRegex.test(value),
      message: `${fieldName} should contain only letters`,
    };
  }

  static isNumbersAndLetters(value: string, fieldName: string) {
    // Regular expression for validating if the value contains only numbers and letters
    const numbersAndLettersRegex = /^[0-9a-zA-Z]+$/;

    return {
      rule: "isNumbersAndLetters",
      isValid: numbersAndLettersRegex.test(value),
      message: `${fieldName} should contain only numbers and letters`,
    };
  }

  static isValidDate(value: string, fieldName: string) {
    // Regular expression for validating a date in the format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    // Check if the value matches the date format
    if (!dateRegex.test(value)) {
      return {
        rule: "isValidDate",
        isValid: false,
        message: `${fieldName} should be a valid date in the format YYYY-MM-DD`,
      };
    }

    // Check if the date is valid (e.g., 2022-02-30 is invalid)
    const parsedDate = new Date(value);
    if (isNaN(parsedDate.getTime())) {
      return {
        rule: "isValidDate",
        isValid: false,
        message: `${fieldName} contains an invalid date`,
      };
    }

    return {
      rule: "isValidDate",
      isValid: true,
      message: `${fieldName} is a valid date`,
    };
  }

  static async isUnique(value: string, model: any, fieldName: string) {
    try {
      const existingRecord = await model.findOne({ [fieldName]: value });
      return {
        rule: "isFieldValueUnique",
        isValid: !existingRecord,
        message: `${fieldName} already exists`,
      };
    } catch (error: any) {
      console.error(error);

      return {
        rule: "isFieldValueUnique",
        isValid: false,
        message: `Error checking field value uniqueness: ${error.message}`,
      };
    }
  }

  static async isPasswordMatch({ inputPassword, userPassword }: { inputPassword: string, userPassword: string | undefined }) {
   return userPassword && await bcrypt.compare(inputPassword, userPassword);
  }

  static async validate(inputs: Input[]): Promise<string[]> {
    const errorMessages: string[] = [];

    for (const { value, fieldName, maxLength, minLength, isRequired, isEmail, model, isDate, isNumbersAndLetters, isOnlyLetters, isOnlyNumbers, isUnique } of inputs) {
      if (minLength) {
        const isMinLength = ValidationRules.isMinLength(value, minLength, fieldName);
        if (!isMinLength.isValid) {
          errorMessages.push(isMinLength.message);
        }
      }

      if (maxLength) {
        const isMaxLength = ValidationRules.isMaxLength(value, maxLength, fieldName);
        if (!isMaxLength.isValid) {
          errorMessages.push(isMaxLength.message);
        }
      }

      if (isRequired) {
        const isRequiredResult = ValidationRules.isRequired(value, fieldName);
        if (!isRequiredResult.isValid) {
          errorMessages.push(isRequiredResult.message);
        }
      }

      if (isDate) {
        const isValidDateResult = ValidationRules.isValidDate(value, fieldName);
        if (!isValidDateResult.isValid) {
          errorMessages.push(isValidDateResult.message);
        }
      }

      if (isEmail) {
        const isEmailResult = ValidationRules.isValidEmail(value, fieldName);
        if (!isEmailResult.isValid) {
          errorMessages.push(isEmailResult.message);
        }
      }

      const isOnlyNumbersResult = ValidationRules.isOnlyNumbers(value, fieldName);
      if (isOnlyNumbers && !isOnlyNumbersResult.isValid) {
        errorMessages.push(isOnlyNumbersResult.message);
      }

      const isOnlyLettersResult = ValidationRules.isOnlyLetters(value, fieldName);
      if (isOnlyLetters && !isOnlyLettersResult.isValid) {
        errorMessages.push(isOnlyLettersResult.message);
      }

      const isNumbersAndLettersResult = ValidationRules.isNumbersAndLetters(value, fieldName);
      if (isNumbersAndLetters && !isNumbersAndLettersResult.isValid) {
        errorMessages.push(isNumbersAndLettersResult.message);
      }

      if (isUnique && model) {
        const isUniqueFieldResult = await ValidationRules.isUnique(value, model, fieldName);
        if (!isUniqueFieldResult.isValid) {
          errorMessages.push(isUniqueFieldResult.message);
        }
      }
    }

    return errorMessages;
  }
}