/**
 * Frontend Validation Utilities
 * Provides consistent validation rules across the application
 */

// ============================================
// VALIDATION RULES
// ============================================

export const ValidationRules = {
  // User fields
  name: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[\p{L}\s]+$/u,
    messages: {
      required: "Vui lòng nhập họ tên",
      minLength: "Họ tên phải có ít nhất 2 ký tự",
      maxLength: "Họ tên không được quá 100 ký tự",
      pattern: "Họ tên chỉ được chứa chữ cái và khoảng trắng",
    },
  },
  
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    messages: {
      required: "Vui lòng nhập email",
      pattern: "Email không hợp lệ",
    },
  },
  
  password: {
    minLength: 6,
    maxLength: 100,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    messages: {
      required: "Vui lòng nhập mật khẩu",
      minLength: "Mật khẩu phải có ít nhất 6 ký tự",
      maxLength: "Mật khẩu không được quá 100 ký tự",
      pattern: "Mật khẩu phải chứa chữ hoa, chữ thường và số",
    },
  },
  
  address: {
    minLength: 5,
    maxLength: 200,
    messages: {
      minLength: "Địa chỉ phải có ít nhất 5 ký tự",
      maxLength: "Địa chỉ không được quá 200 ký tự",
    },
  },
  
  phone: {
    pattern: /^(0|\+84)[3|5|7|8|9][0-9]{8}$/,
    messages: {
      pattern: "Số điện thoại không hợp lệ (VD: 0912345678)",
    },
  },

  // Product fields
  productTitle: {
    minLength: 10,
    maxLength: 255,
    pattern: /^[\p{L}\p{N}\s\-,.()]+$/u,
    messages: {
      required: "Vui lòng nhập tên sản phẩm",
      minLength: "Tên sản phẩm phải có ít nhất 10 ký tự",
      maxLength: "Tên sản phẩm không được quá 255 ký tự",
      pattern: "Tên sản phẩm chứa ký tự không hợp lệ",
    },
  },
  
  productDescription: {
    minLength: 50,
    maxLength: 5000,
    messages: {
      required: "Vui lòng nhập mô tả sản phẩm",
      minLength: "Mô tả phải có ít nhất 50 ký tự",
      maxLength: "Mô tả không được quá 5000 ký tự",
    },
  },
  
  price: {
    min: 1000,
    max: 1000000000000,
    messages: {
      required: "Vui lòng nhập giá",
      min: "Giá phải từ 1,000 VNĐ trở lên",
      max: "Giá không được vượt quá 1,000 tỷ VNĐ",
      invalid: "Giá không hợp lệ",
    },
  },

  // Question/Comment
  question: {
    minLength: 10,
    maxLength: 500,
    messages: {
      required: "Vui lòng nhập câu hỏi",
      minLength: "Câu hỏi phải có ít nhất 10 ký tự",
      maxLength: "Câu hỏi không được quá 500 ký tự",
    },
  },

  comment: {
    minLength: 10,
    maxLength: 1000,
    messages: {
      minLength: "Nhận xét phải có ít nhất 10 ký tự",
      maxLength: "Nhận xét không được quá 1000 ký tự",
    },
  },
};

// ============================================
// VALIDATION FUNCTIONS
// ============================================

export const Validators = {
  /**
   * Validate required field
   */
  required(value: any, message = "Trường này là bắt buộc"): string | null {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message;
    }
    return null;
  },

  /**
   * Validate minimum length
   */
  minLength(value: string, min: number, message?: string): string | null {
    if (value && value.trim().length < min) {
      return message || `Phải có ít nhất ${min} ký tự`;
    }
    return null;
  },

  /**
   * Validate maximum length
   */
  maxLength(value: string, max: number, message?: string): string | null {
    if (value && value.trim().length > max) {
      return message || `Không được quá ${max} ký tự`;
    }
    return null;
  },

  /**
   * Validate pattern
   */
  pattern(value: string, pattern: RegExp, message?: string): string | null {
    if (value && !pattern.test(value)) {
      return message || "Định dạng không hợp lệ";
    }
    return null;
  },

  /**
   * Validate email
   */
  email(value: string): string | null {
    if (!value) return null;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      return "Email không hợp lệ";
    }
    return null;
  },

  /**
   * Validate number range
   */
  numberRange(value: number, min?: number, max?: number): string | null {
    if (isNaN(value)) {
      return "Giá trị phải là số";
    }
    if (min !== undefined && value < min) {
      return `Giá trị phải từ ${min.toLocaleString('vi-VN')} trở lên`;
    }
    if (max !== undefined && value > max) {
      return `Giá trị không được vượt quá ${max.toLocaleString('vi-VN')}`;
    }
    return null;
  },

  /**
   * Validate date range
   */
  dateRange(date: Date, min?: Date, max?: Date): string | null {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return "Ngày không hợp lệ";
    }
    if (min && date < min) {
      return `Ngày phải sau ${min.toLocaleDateString('vi-VN')}`;
    }
    if (max && date > max) {
      return `Ngày phải trước ${max.toLocaleDateString('vi-VN')}`;
    }
    return null;
  },

  /**
   * Validate age (from date of birth)
   */
  age(dob: string | Date, minAge = 13, maxAge = 120): string | null {
    const birthDate = typeof dob === 'string' ? new Date(dob) : dob;
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ? age - 1
      : age;

    if (actualAge < minAge) {
      return `Bạn phải từ ${minAge} tuổi trở lên`;
    }
    if (actualAge > maxAge) {
      return "Ngày sinh không hợp lệ";
    }
    return null;
  },

  /**
   * Validate file
   */
  file(
    file: File,
    options: {
      maxSize?: number;
      allowedTypes?: string[];
      maxSizeMB?: number;
    } = {}
  ): string | null {
    const { maxSize, allowedTypes, maxSizeMB } = options;
    
    const actualMaxSize = maxSize || (maxSizeMB ? maxSizeMB * 1024 * 1024 : undefined);

    if (allowedTypes && !allowedTypes.includes(file.type)) {
      const types = allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');
      return `Chỉ chấp nhận file ${types}`;
    }

    if (actualMaxSize && file.size > actualMaxSize) {
      const sizeMB = (actualMaxSize / (1024 * 1024)).toFixed(0);
      return `Kích thước file không được vượt quá ${sizeMB}MB`;
    }

    return null;
  },

  /**
   * Validate image file
   */
  image(file: File, maxSizeMB = 10): string | null {
    return Validators.file(file, {
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      maxSizeMB,
    });
  },

  /**
   * Validate price comparison
   */
  priceComparison(
    price: number,
    comparePrice: number,
    comparison: 'greater' | 'less' | 'greaterOrEqual' | 'lessOrEqual',
    message?: string
  ): string | null {
    const comparisons = {
      greater: price > comparePrice,
      less: price < comparePrice,
      greaterOrEqual: price >= comparePrice,
      lessOrEqual: price <= comparePrice,
    };

    if (!comparisons[comparison]) {
      return message || "Giá không hợp lệ so với giá tham chiếu";
    }
    return null;
  },
};

// ============================================
// FORM VALIDATION HELPERS
// ============================================

export class FormValidator {
  private errors: Record<string, string> = {};

  /**
   * Add an error
   */
  addError(field: string, message: string) {
    this.errors[field] = message;
  }

  /**
   * Validate a field with multiple rules
   */
  validate(
    field: string,
    value: any,
    rules: Array<() => string | null>
  ) {
    for (const rule of rules) {
      const error = rule();
      if (error) {
        this.addError(field, error);
        break; // Stop at first error
      }
    }
  }

  /**
   * Get all errors
   */
  getErrors(): Record<string, string> {
    return this.errors;
  }

  /**
   * Check if form is valid
   */
  isValid(): boolean {
    return Object.keys(this.errors).length === 0;
  }

  /**
   * Clear all errors
   */
  clear() {
    this.errors = {};
  }

  /**
   * Clear specific field error
   */
  clearField(field: string) {
    delete this.errors[field];
  }
}

// ============================================
// COMMON VALIDATORS
// ============================================

export const CommonValidators = {
  /**
   * Validate product title
   */
  productTitle(title: string): string | null {
    const rules = ValidationRules.productTitle;
    
    if (!title || !title.trim()) {
      return rules.messages.required;
    }
    if (title.trim().length < rules.minLength) {
      return rules.messages.minLength;
    }
    if (title.trim().length > rules.maxLength) {
      return rules.messages.maxLength;
    }
    if (!rules.pattern.test(title.trim())) {
      return rules.messages.pattern;
    }
    return null;
  },

  /**
   * Validate product description (HTML)
   */
  productDescription(html: string): string | null {
    const rules = ValidationRules.productDescription;
    const plainText = html.replace(/<[^>]+>/g, '').trim();
    
    if (!plainText) {
      return rules.messages.required;
    }
    if (plainText.length < rules.minLength) {
      return rules.messages.minLength;
    }
    if (plainText.length > rules.maxLength) {
      return rules.messages.maxLength;
    }
    return null;
  },

  /**
   * Validate price
   */
  price(value: string | number): string | null {
    const rules = ValidationRules.price;
    const price = typeof value === 'string' ? parseFloat(value.replace(/[,.]/g, '')) : value;
    
    if (isNaN(price)) {
      return rules.messages.invalid;
    }
    if (price < rules.min) {
      return rules.messages.min;
    }
    if (price > rules.max) {
      return rules.messages.max;
    }
    return null;
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Parse number from formatted string
 */
export function parseNumber(value: string): string {
  return value.replace(/[^\d.-]/g, '');
}

/**
 * Format number to Vietnamese currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
}

/**
 * Get plain text from HTML
 */
export function getPlainText(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

/**
 * Debounce function for validation
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
